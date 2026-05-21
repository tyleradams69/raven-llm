import type { ScoredAlpha, TweetDraft, XPost } from "./sources.js";
import { defaultSources, sourceMap } from "./sources.js";

const breakingTerms = ["launch", "released", "announcing", "introducing", "new model", "available", "open weights", "api", "benchmark", "sota", "frontier", "agent", "agents", "agi", "codex", "reasoning", "multimodal", "voice", "video", "robotics", "insider", "reporter"];
const researchTerms = ["paper", "arxiv", "research", "eval", "benchmark", "scaling", "training", "inference", "post-training", "rl", "distillation"];
const productTerms = ["users", "shipping", "app", "feature", "beta", "waitlist", "developer", "sdk", "pricing", "enterprise", "codex", "cursor", "agent", "agents", "workflow"];
const riskTerms = ["unconfirmed", "leak", "maybe", "heard", "giveaway", "airdrop"];

function includesAny(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function engagementScore(post: XPost) {
  const likes = post.likeCount ?? 0;
  const reposts = post.repostCount ?? 0;
  const replies = post.replyCount ?? 0;
  const quotes = post.quoteCount ?? 0;
  const views = post.viewCount ?? 0;
  return Math.min(25, Math.log10(1 + likes + reposts * 3 + replies * 2 + quotes * 3 + views / 250) * 8);
}

function recencyScore(post: XPost, now = new Date()) {
  if (!post.createdAt) return 8;
  const ageHours = Math.max(0, (now.getTime() - new Date(post.createdAt).getTime()) / 3_600_000);
  if (ageHours <= 1) return 20;
  if (ageHours <= 3) return 17;
  if (ageHours <= 8) return 13;
  if (ageHours <= 24) return 8;
  return 2;
}

function classify(post: XPost): ScoredAlpha["category"] {
  const text = post.text.toLowerCase();
  if (includesAny(text, researchTerms)) return "research";
  if (includesAny(text, productTerms)) return "product";
  if (text.includes("funding") || text.includes("raised") || text.includes("series ")) return "funding";
  if (text.includes("gpu") || text.includes("inference") || text.includes("cuda") || text.includes("vllm")) return "infra";
  if (includesAny(text, breakingTerms)) return "breaking";
  return "opinion";
}

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function truncate(text: string, limit = 260) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trim()}…`;
}

export function buildTweetDrafts(post: XPost, category: ScoredAlpha["category"], reasons: string[]): TweetDraft[] {
  const subject = post.authorHandle ? `@${post.authorHandle}` : "this AI signal";
  const quote = clean(post.text).replace(/https?:\/\/\S+/g, "").trim();
  const why = reasons[0] ?? "early signal from a credible AI source";
  const url = post.url ? `\n\n${post.url}` : "";

  return [
    {
      format: "single",
      text: truncate(`ravenLLM signal: ${subject} just posted ${category === "research" ? "a research signal" : category === "product" ? "a practical AI/operator signal" : "a notable AI signal"}.\n\nWhy it matters: ${why}.\n\nMy read: this is the kind of AI alpha worth catching before it becomes the obvious timeline narrative.${url}`),
    },
    {
      format: "thread-hook",
      text: truncate(`This could be one of the more important AI updates today.\n\nSignal: ${quote}\n\nWhat I’m watching next:\n1. does this make agents more useful?\n2. can builders turn it into revenue/workflow leverage?\n3. who copies it first?${url}`),
    },
    {
      format: "quote-tweet",
      text: truncate(`Important AI signal here.\n\nThe edge is not only the announcement — it’s spotting the practical operator angle before everyone else packages it.`),
    },
  ];
}

export function scoreAlphaPost(post: XPost, options: { now?: Date; minScore?: number } = {}): ScoredAlpha {
  const sources = sourceMap(defaultSources);
  const source = sources.get(post.authorHandle.toLowerCase());
  const reasons: string[] = [];
  const risks: string[] = [];
  const category = classify(post);
  let score = 0;

  if (source) {
    score += source.weight * 5;
    reasons.push(`${source.tier} source @${source.handle}`);
  } else {
    score += 12;
    reasons.push("non-seeded source; verify before posting");
  }

  const recency = recencyScore(post, options.now);
  score += recency;
  if (recency >= 17) reasons.push("fresh post window");

  const engagement = engagementScore(post);
  score += engagement;
  if (engagement >= 12) reasons.push("early engagement acceleration");

  if (includesAny(post.text, breakingTerms)) {
    score += 14;
    reasons.push("launch/breaking-news language");
  }
  if (category === "research") {
    score += 10;
    reasons.push("research/benchmark signal");
  }
  if (category === "product") {
    score += 8;
    reasons.push("product/dev adoption angle");
  }
  if (/\b(ai|agi|llm|agent|agents|codex|model|inference|open source|open-weight|multimodal|reasoning)\b/i.test(post.text)) {
    score += 8;
    reasons.push("AI-native keyword match");
  }
  if (includesAny(post.text, riskTerms)) {
    score -= 18;
    risks.push("rumor/leak language; verify before tweeting");
  }
  if (post.text.length < 35) {
    score -= 8;
    risks.push("low-context post");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const urgency: ScoredAlpha["urgency"] = score >= 78 ? "tweet-now" : score >= (options.minScore ?? 60) ? "draft-today" : "watch";

  return {
    post,
    score,
    category,
    urgency,
    reasons,
    risks,
    tweetAngles: buildTweetDrafts(post, category, reasons),
  };
}

export function rankAlpha(posts: XPost[], options: { now?: Date; minScore?: number } = {}) {
  return posts.map((post) => scoreAlphaPost(post, options)).sort((a, b) => b.score - a.score);
}
