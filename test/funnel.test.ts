import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderVoiceBrief } from "../src/profile.js";
import { loadEnvFiles } from "../src/env.js";
import { rankAlpha, scoreAlphaPost } from "../src/scoring.js";
import { buildAiAlphaQueryPlan, buildBroadAiAlphaQueries, buildRecentAiAlphaQuery, parseXurlSearch } from "../src/x-client.js";
import { renderReport } from "../src/scan.js";
import { buildTelegramDigest, sendTelegramMessage } from "../src/telegram.js";

const now = new Date("2026-05-21T12:00:00.000Z");

describe("env loading", () => {
  it("loads .env.local before scan reads Telegram settings", async () => {
    const dir = await mkdtemp(join(tmpdir(), "raven-env-"));
    const previous = process.env.TELEGRAM_ENABLED;
    delete process.env.TELEGRAM_ENABLED;
    try {
      await writeFile(join(dir, ".env.local"), "TELEGRAM_ENABLED=true\n");
      const loaded = loadEnvFiles(dir);
      expect(loaded).toContain(".env.local");
      expect(process.env.TELEGRAM_ENABLED).toBe("true");
    } finally {
      if (previous === undefined) delete process.env.TELEGRAM_ENABLED;
      else process.env.TELEGRAM_ENABLED = previous;
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("AI alpha scoring", () => {
  it("promotes fresh primary-lab launch posts to tweet-now", () => {
    const scored = scoreAlphaPost({
      id: "1",
      authorHandle: "OpenAI",
      text: "Introducing a new AI reasoning model available in the API today with stronger coding agents and multimodal evals.",
      createdAt: "2026-05-21T11:30:00.000Z",
      likeCount: 4000,
      repostCount: 900,
      replyCount: 250,
      quoteCount: 100,
      viewCount: 800_000,
    }, { now });

    expect(scored.score).toBeGreaterThanOrEqual(78);
    expect(scored.urgency).toBe("tweet-now");
    expect(scored.reasons).toContain("primary-lab source @OpenAI");
    expect(scored.tweetAngles).toHaveLength(3);
  });

  it("penalizes rumor language", () => {
    const scored = scoreAlphaPost({
      id: "2",
      authorHandle: "unknown_ai_leaks",
      text: "Unconfirmed rumor maybe OpenAI leak soon",
      createdAt: "2026-05-21T11:30:00.000Z",
      likeCount: 20,
    }, { now });

    expect(scored.score).toBeLessThan(60);
    expect(scored.risks.join(" ")).toContain("rumor");
  });

  it("ranks stronger signals first", () => {
    const ranked = rankAlpha([
      { id: "weak", authorHandle: "random", text: "AI is cool", createdAt: "2026-05-20T11:00:00.000Z" },
      { id: "strong", authorHandle: "AnthropicAI", text: "Announcing a new Claude model with better coding, tool use, and reasoning benchmarks.", createdAt: "2026-05-21T11:45:00.000Z", likeCount: 2000, repostCount: 300 },
    ], { now });

    expect(ranked[0].post.id).toBe("strong");
  });
});

describe("X client helpers", () => {
  it("builds a recent-search query from source handles", () => {
    const query = buildRecentAiAlphaQuery(["OpenAI", "@karpathy"]);
    expect(query).toContain("from:OpenAI");
    expect(query).toContain("from:karpathy");
    expect(query).toContain("-is:retweet");
  });

  it("builds broad search-page style discovery queries", () => {
    const broad = buildBroadAiAlphaQueries(["\"AI agent\" \"quietly launched\" -is:retweet lang:en"]);
    expect(broad.length).toBeGreaterThan(3);
    expect(broad.join(" ")).toContain("open weights");
    expect(broad.at(-1)).toContain("quietly launched");

    const plan = buildAiAlphaQueryPlan(["OpenAI"], broad.slice(0, 1));
    expect(plan.sourceQuery).toContain("from:OpenAI");
    expect(plan.broadQueries.length).toBeGreaterThan(0);
    expect(plan.combinedForReport).toContain("---");
  });

  it("parses xurl recent-search JSON", () => {
    const posts = parseXurlSearch(JSON.stringify({
      data: [{
        id: "123",
        author_id: "u1",
        text: "New AI model launch",
        created_at: "2026-05-21T11:00:00.000Z",
        public_metrics: { like_count: 10, retweet_count: 2, reply_count: 1, quote_count: 0, impression_count: 500 },
      }],
      includes: { users: [{ id: "u1", username: "OpenAI", name: "OpenAI" }] },
    }));

    expect(posts[0]).toMatchObject({ authorHandle: "OpenAI", url: "https://x.com/OpenAI/status/123" });
  });
});

describe("report rendering", () => {
  it("renders draft angles for the operator", () => {
    const scored = scoreAlphaPost({ id: "1", authorHandle: "OpenAI", text: "Announcing new AI API", createdAt: now.toISOString() }, { now });
    const report = renderReport([scored]);
    expect(report).toContain("Top signals");
    expect(report).toContain("Account voice brief");
    expect(report).toContain("Ignore old content");
    expect(report).toContain("Drafts:");
  });

  it("renders the RavenLLM account brief and excludes old niche style", () => {
    const brief = renderVoiceBrief();
    expect(brief).toContain("@RavenLLM");
    expect(brief).toContain("AI investigative journalist");
    expect(brief).toContain("good morning");
    expect(brief).toContain("giveaway");
  });
});

describe("Telegram digest", () => {
  it("renders high-score Raven signals with draft text", () => {
    const scored = scoreAlphaPost({
      id: "tg-1",
      authorHandle: "OpenAI",
      text: "Introducing a new AI reasoning API for agents and coding workflows.",
      createdAt: now.toISOString(),
      likeCount: 1000,
      repostCount: 200,
      url: "https://x.com/OpenAI/status/tg-1",
    }, { now });

    const digest = buildTelegramDigest([scored], { minScore: 70 });
    expect(digest).toContain("ravenLLM AI signal digest");
    expect(digest).toContain("@OpenAI");
    expect(digest).toContain("Draft:");
  });

  it("does not send Telegram messages when disabled", async () => {
    const result = await sendTelegramMessage({ enabled: false }, "hello");
    expect(result).toMatchObject({ sent: false, reason: "disabled-or-empty" });
  });
});
