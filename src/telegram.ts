import type { ScoredAlpha } from "./sources.js";

export type TelegramConfig = {
  botToken?: string;
  chatId?: string;
  enabled?: boolean;
  minScore?: number;
  maxItems?: number;
};

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function truncate(input: string, limit: number) {
  if (input.length <= limit) return input;
  return `${input.slice(0, limit - 1).trim()}…`;
}

export function buildTelegramDigest(items: ScoredAlpha[], options: { minScore?: number; maxItems?: number } = {}) {
  const minScore = options.minScore ?? 70;
  const maxItems = options.maxItems ?? 5;
  const filtered = items.filter((item) => item.score >= minScore).slice(0, maxItems);

  if (!filtered.length) return "";

  const lines = [
    "🦅 <b>ravenLLM AI signal digest</b>",
    `Top ${filtered.length} signal${filtered.length === 1 ? "" : "s"} above ${minScore}/100`,
    "",
  ];

  filtered.forEach((item, index) => {
    const draft = item.tweetAngles[0]?.text ?? "No draft generated.";
    lines.push(
      `<b>${index + 1}. @${escapeHtml(item.post.authorHandle)} — ${item.score}/100 — ${escapeHtml(item.urgency)}</b>`,
      `Category: ${escapeHtml(item.category)}`,
      `Why: ${escapeHtml(item.reasons.slice(0, 3).join("; ") || "n/a")}`,
      item.risks.length ? `Risk: ${escapeHtml(item.risks.join("; "))}` : "Risk: none flagged",
      item.post.url ? `Source: ${escapeHtml(item.post.url)}` : "Source: n/a",
      `Draft: ${escapeHtml(truncate(draft.replace(/\s+/g, " "), 650))}`,
      "",
    );
  });

  return lines.join("\n").trim();
}

export async function sendTelegramMessage(config: TelegramConfig, text: string, fetcher: typeof fetch = fetch) {
  if (!config.enabled || !text) return { sent: false, reason: "disabled-or-empty" } as const;
  if (!config.botToken || !config.chatId) return { sent: false, reason: "missing-telegram-env" } as const;

  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
  const response = await fetcher(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram send failed: ${response.status} ${await response.text()}`);
  }

  return { sent: true } as const;
}
