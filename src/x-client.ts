import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import type { XPost } from "./sources.js";

const execFileAsync = promisify(execFile);

export type XSearchClient = {
  search(query: string, limit: number): Promise<XPost[]>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function num(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

export function parseXurlSearch(jsonText: string): XPost[] {
  const parsed = JSON.parse(jsonText) as unknown;
  const root = asRecord(parsed);
  const data = Array.isArray(root.data) ? root.data : [];
  const includes = asRecord(root.includes);
  const users = Array.isArray(includes.users) ? includes.users.map(asRecord) : [];
  const userById = new Map(users.map((user) => [text(user.id), user]));

  return data.map((item) => {
    const tweet = asRecord(item);
    const metrics = asRecord(tweet.public_metrics);
    const author = userById.get(text(tweet.author_id)) ?? {};
    const authorHandle = text(author.username) ?? text(tweet.author_handle) ?? "unknown";
    const id = text(tweet.id) ?? randomUUID();
    return {
      id,
      authorHandle,
      authorName: text(author.name),
      text: text(tweet.text) ?? "",
      createdAt: text(tweet.created_at),
      likeCount: num(metrics.like_count),
      repostCount: num(metrics.retweet_count),
      replyCount: num(metrics.reply_count),
      quoteCount: num(metrics.quote_count),
      viewCount: num(metrics.impression_count),
      url: authorHandle === "unknown" ? undefined : `https://x.com/${authorHandle}/status/${id}`,
    } satisfies XPost;
  });
}

export class XurlClient implements XSearchClient {
  async search(query: string, limit: number): Promise<XPost[]> {
    const endpoint = `/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${Math.min(100, Math.max(10, limit))}&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username,name,verified,verified_type`;
    const { stdout } = await execFileAsync("xurl", [endpoint], { maxBuffer: 1024 * 1024 * 4 });
    return parseXurlSearch(stdout);
  }
}

export class BearerSearchClient implements XSearchClient {
  constructor(private readonly bearerToken: string, private readonly fetcher: typeof fetch = fetch) {}

  async search(query: string, limit: number): Promise<XPost[]> {
    const url = new URL("https://api.x.com/2/tweets/search/recent");
    url.searchParams.set("query", query);
    url.searchParams.set("max_results", String(Math.min(100, Math.max(10, limit))));
    url.searchParams.set("tweet.fields", "created_at,public_metrics,author_id");
    url.searchParams.set("expansions", "author_id");
    url.searchParams.set("user.fields", "username,name,verified,verified_type");
    const response = await this.fetcher(url, { headers: { Authorization: `Bearer ${this.bearerToken}` } });
    if (!response.ok) throw new Error(`X search failed: ${response.status} ${await response.text()}`);
    return parseXurlSearch(await response.text());
  }
}

export function buildRecentAiAlphaQuery(handles: string[]) {
  const sourceQuery = handles.length ? `(${handles.map((handle) => `from:${handle.replace(/^@/, "")}`).join(" OR ")})` : "";
  const aiTerms = "(AI OR AGI OR LLM OR model OR agents OR inference OR OpenAI OR Anthropic OR DeepMind OR Claude OR GPT OR llama OR multimodal OR reasoning OR Codex OR Cursor)";
  const signalTerms = "(launch OR released OR announcing OR paper OR benchmark OR open-source OR API OR new OR insider OR reporter OR paid OR money OR revenue)";
  return [sourceQuery, aiTerms, signalTerms, "-is:retweet", "lang:en"].filter(Boolean).join(" ");
}
