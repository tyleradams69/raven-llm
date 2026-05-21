import { describe, expect, it } from "vitest";
import { rankAlpha, scoreAlphaPost } from "../src/scoring.js";
import { buildRecentAiAlphaQuery, parseXurlSearch } from "../src/x-client.js";
import { renderReport } from "../src/scan.js";

const now = new Date("2026-05-21T12:00:00.000Z");

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
    expect(report).toContain("Drafts:");
  });
});
