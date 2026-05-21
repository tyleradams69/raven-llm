import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvFiles } from "./env.js";
import { renderVoiceBrief } from "./profile.js";
import { rankAlpha } from "./scoring.js";
import { defaultSources, type ScoredAlpha, type XPost } from "./sources.js";
import { buildTelegramDigest, sendTelegramMessage } from "./telegram.js";
import { BearerSearchClient, buildAiAlphaQueryPlan, XurlClient, type XSearchClient } from "./x-client.js";

function env(name: string, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

function seedHandles() {
  const configured = env("AI_ALPHA_SEED_HANDLES");
  if (configured) return configured.split(",").map((handle) => handle.trim().replace(/^@/, "")).filter(Boolean);
  return defaultSources.map((source) => source.handle);
}

function extraBroadQueries() {
  return env("AI_ALPHA_EXTRA_BROAD_QUERIES")
    .split("\n")
    .flatMap((line) => line.split("||"))
    .map((query) => query.trim())
    .filter(Boolean);
}

function uniquePosts(posts: XPost[]) {
  const seen = new Set<string>();
  return posts.filter((post) => {
    const key = post.id || `${post.authorHandle}:${post.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchMany(client: XSearchClient, queries: string[], limit: number) {
  const batches = await Promise.all(queries.map((query) => client.search(query, limit)));
  return uniquePosts(batches.flat());
}

function makeClient(): XSearchClient {
  const token = env("X_BEARER_TOKEN");
  if (token) return new BearerSearchClient(token);
  return new XurlClient();
}

function fallbackPosts(): XPost[] {
  const now = new Date();
  return [
    {
      id: "sample-0",
      authorHandle: "ai_builder_lab",
      authorName: "AI Builder Lab",
      text: "Quietly launched: a small open-source agent framework that turns GitHub issues into tested PRs with eval logs attached. Early users are reporting paid bounty completions.",
      createdAt: new Date(now.getTime() - 30 * 60_000).toISOString(),
      likeCount: 579,
      repostCount: 84,
      replyCount: 35,
      quoteCount: 20,
      viewCount: 89_050,
      url: "https://x.com/ai_builder_lab/status/sample-0",
    },
    {
      id: "sample-1",
      authorHandle: "OpenAI",
      authorName: "OpenAI",
      text: "Introducing a new reasoning model with stronger coding, agentic tool use, and multimodal understanding. Available in the API today.",
      createdAt: new Date(now.getTime() - 45 * 60_000).toISOString(),
      likeCount: 5200,
      repostCount: 1300,
      replyCount: 600,
      quoteCount: 420,
      viewCount: 1_200_000,
      url: "https://x.com/OpenAI/status/sample-1",
    },
    {
      id: "sample-2",
      authorHandle: "karpathy",
      authorName: "Andrej Karpathy",
      text: "New post: practical notes on building agents that actually work. The main unlock is evals + narrow tool loops, not vague autonomy.",
      createdAt: new Date(now.getTime() - 3 * 3_600_000).toISOString(),
      likeCount: 2800,
      repostCount: 410,
      replyCount: 120,
      quoteCount: 90,
      viewCount: 420_000,
      url: "https://x.com/karpathy/status/sample-2",
    },
  ];
}

export function renderReport(items: ScoredAlpha[]) {
  const top = items.slice(0, 10);
  return [
    `# ravenLLM Intelligence Run`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `## Account voice brief`,
    renderVoiceBrief(),
    ``,
    `## Top signals`,
    ...top.flatMap((item, index) => [
      ``,
      `### ${index + 1}. @${item.post.authorHandle} — ${item.score}/100 — ${item.urgency}`,
      `Category: ${item.category}`,
      `URL: ${item.post.url ?? "n/a"}`,
      `Reasons: ${item.reasons.join("; ") || "n/a"}`,
      item.risks.length ? `Risks: ${item.risks.join("; ")}` : `Risks: none flagged`,
      ``,
      `Original: ${item.post.text}`,
      ``,
      `Drafts:`,
      ...item.tweetAngles.map((draft) => `- ${draft.format}: ${draft.text.replace(/\n/g, " / ")}`),
    ]),
    ``,
  ].join("\n");
}

export async function runScan(client?: XSearchClient) {
  loadEnvFiles();
  const limit = Number(env("AI_ALPHA_SCAN_LIMIT", "25"));
  const minScore = Number(env("AI_ALPHA_MIN_SCORE", "60"));
  const handles = seedHandles();
  const queryPlan = buildAiAlphaQueryPlan(handles, extraBroadQueries());
  const query = queryPlan.combinedForReport;
  const queries = [queryPlan.sourceQuery, ...queryPlan.broadQueries];
  const searchClient = client ?? makeClient();
  let posts: XPost[];
  let mode = "live";

  try {
    posts = await searchMany(searchClient, queries, limit);
  } catch (error) {
    mode = "sample-fallback";
    posts = fallbackPosts();
    console.error(`Live X search failed; using sample fallback: ${error instanceof Error ? error.message : String(error)}`);
  }

  const ranked = rankAlpha(posts, { minScore });
  const qualified = ranked.filter((item) => item.score >= minScore);
  const outputDir = env("AI_ALPHA_OUTPUT_DIR", ".data/runs");
  await mkdir(outputDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(outputDir, `${stamp}.json`);
  const mdPath = join(outputDir, `${stamp}.md`);
  await writeFile(jsonPath, JSON.stringify({ mode, query, queries, scanned: posts.length, qualified, ranked }, null, 2));
  await writeFile(mdPath, renderReport(qualified.length ? qualified : ranked.slice(0, 10)));

  const telegramMinScore = Number(env("TELEGRAM_MIN_SCORE", String(minScore)));
  const telegramMaxItems = Number(env("TELEGRAM_MAX_ITEMS", "5"));
  const telegramDigest = buildTelegramDigest(ranked, {
    minScore: telegramMinScore,
    maxItems: telegramMaxItems,
  });
  const allowSampleFallbackTelegram = env("TELEGRAM_SEND_SAMPLE_FALLBACK", "false").toLowerCase() === "true";
  const telegramEnabled = env("TELEGRAM_ENABLED", "false").toLowerCase() === "true" && (mode === "live" || allowSampleFallbackTelegram);
  const telegram = await sendTelegramMessage({
    enabled: telegramEnabled,
    botToken: env("TELEGRAM_BOT_TOKEN"),
    chatId: env("TELEGRAM_CHAT_ID"),
    minScore: telegramMinScore,
    maxItems: telegramMaxItems,
  }, telegramDigest);
  const telegramResult = mode === "live" || allowSampleFallbackTelegram
    ? telegram
    : { ...telegram, reason: "sample-fallback-not-sent" };

  return { mode, query, queries, scanned: posts.length, qualified: qualified.length, top: ranked[0], jsonPath, mdPath, telegram: telegramResult };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runScan();
  console.log(JSON.stringify(result, null, 2));
}
