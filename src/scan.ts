import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderVoiceBrief } from "./profile.js";
import { rankAlpha } from "./scoring.js";
import { defaultSources, type ScoredAlpha, type XPost } from "./sources.js";
import { BearerSearchClient, buildRecentAiAlphaQuery, XurlClient, type XSearchClient } from "./x-client.js";

function env(name: string, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

function seedHandles() {
  const configured = env("AI_ALPHA_SEED_HANDLES");
  if (configured) return configured.split(",").map((handle) => handle.trim().replace(/^@/, "")).filter(Boolean);
  return defaultSources.map((source) => source.handle);
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
      authorHandle: "Chrisgpt",
      authorName: "Chris",
      text: "Codex has officially paid for itself on the $100 plan. Asked it to find paid open-source tasks, pick the real ones, write code, open PRs, and handle maintainer feedback.",
      createdAt: new Date(now.getTime() - 30 * 60_000).toISOString(),
      likeCount: 2579,
      repostCount: 154,
      replyCount: 135,
      quoteCount: 80,
      viewCount: 439_050,
      url: "https://x.com/Chrisgpt/status/sample-0",
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

export async function runScan(client = makeClient()) {
  const limit = Number(env("AI_ALPHA_SCAN_LIMIT", "25"));
  const minScore = Number(env("AI_ALPHA_MIN_SCORE", "60"));
  const handles = seedHandles();
  const query = buildRecentAiAlphaQuery(handles);
  let posts: XPost[];
  let mode = "live";

  try {
    posts = await client.search(query, limit);
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
  await writeFile(jsonPath, JSON.stringify({ mode, query, scanned: posts.length, qualified, ranked }, null, 2));
  await writeFile(mdPath, renderReport(qualified.length ? qualified : ranked.slice(0, 10)));

  return { mode, query, scanned: posts.length, qualified: qualified.length, top: ranked[0], jsonPath, mdPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runScan();
  console.log(JSON.stringify(result, null, 2));
}
