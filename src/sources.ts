export type AlphaSourceTier = "primary-lab" | "researcher" | "builder" | "infra" | "investor" | "aggregator" | "unknown";

export type AlphaSource = {
  handle: string;
  name?: string;
  tier: AlphaSourceTier;
  weight: number;
  notes?: string;
};

export type XPost = {
  id: string;
  authorHandle: string;
  authorName?: string;
  text: string;
  createdAt?: string;
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
  quoteCount?: number;
  viewCount?: number;
  url?: string;
};

export type ScoredAlpha = {
  post: XPost;
  score: number;
  category: "breaking" | "research" | "product" | "infra" | "funding" | "opinion";
  urgency: "tweet-now" | "draft-today" | "watch";
  reasons: string[];
  risks: string[];
  tweetAngles: TweetDraft[];
};

export type TweetDraft = {
  format: "single" | "thread-hook" | "quote-tweet";
  text: string;
};

export const defaultSources: AlphaSource[] = [
  { handle: "sama", name: "Sam Altman", tier: "primary-lab", weight: 9, notes: "OpenAI direction / hints" },
  { handle: "OpenAI", tier: "primary-lab", weight: 10, notes: "model/product launches" },
  { handle: "AnthropicAI", tier: "primary-lab", weight: 10, notes: "Claude launches/research" },
  { handle: "GoogleDeepMind", tier: "primary-lab", weight: 9, notes: "frontier research" },
  { handle: "MetaAI", tier: "primary-lab", weight: 8, notes: "open model releases" },
  { handle: "karpathy", name: "Andrej Karpathy", tier: "researcher", weight: 9, notes: "AI education / dev signal" },
  { handle: "ylecun", name: "Yann LeCun", tier: "researcher", weight: 7 },
  { handle: "swyx", tier: "aggregator", weight: 7, notes: "AI engineering radar" },
  { handle: "nearcyan", tier: "researcher", weight: 7 },
  { handle: "huggingface", tier: "infra", weight: 8, notes: "open-source model ecosystem" },
  { handle: "vllm_project", tier: "infra", weight: 7 },
  { handle: "perplexity_ai", tier: "builder", weight: 8 },
  { handle: "cursor_ai", tier: "builder", weight: 8 },
  { handle: "vercel", tier: "infra", weight: 6, notes: "AI app deployment / SDKs" },
  { handle: "a16z", tier: "investor", weight: 5, notes: "AI funding/thesis" },
];

export function sourceMap(sources = defaultSources) {
  return new Map(sources.map((source) => [source.handle.toLowerCase(), source]));
}
