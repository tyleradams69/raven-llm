import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { loadEnvFiles } from "./env.js";
import { buildTweetIdeas } from "./tweet-ideas.js";
import { sendTelegramMessage } from "./telegram.js";

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat?: { id: number | string };
    text?: string;
  };
};

type TelegramUpdatesResponse = {
  ok: boolean;
  result?: TelegramUpdate[];
  description?: string;
};

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

function offsetPath() {
  return env("TELEGRAM_OFFSET_PATH", join(env("AI_ALPHA_OUTPUT_DIR", ".data/runs"), "telegram-offset.json"));
}

async function readOffset(path = offsetPath()) {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as { offset?: number };
    return parsed.offset ?? 0;
  } catch {
    return 0;
  }
}

async function writeOffset(offset: number, path = offsetPath()) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify({ offset }, null, 2));
}

function helpText() {
  return [
    "🦅 ravenLLM bot commands",
    "",
    "/ideas — get evergreen Raven tweet ideas",
    "/ideas agents — get ideas around a topic",
    "/ideas open source models — topic-specific angles",
    "/help — show commands",
    "",
    "These are for engagement + positioning, not only breaking alpha.",
  ].join("\n");
}

export function buildBotReply(text: string) {
  const normalized = text.trim();
  if (/^\/help/i.test(normalized) || /^\/start/i.test(normalized)) return helpText();
  if (/^\/(ideas|idea|tweets|tweetideas)(@\w+)?(\s|$)/i.test(normalized)) return buildTweetIdeas(normalized);
  return "Send /ideas or /ideas <topic>. Example: /ideas AI agents";
}

export async function pollTelegramOnce(fetcher: typeof fetch = fetch) {
  loadEnvFiles();
  const botToken = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID");
  if (!botToken || !chatId) throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");

  const offset = await readOffset();
  const url = new URL(`https://api.telegram.org/bot${botToken}/getUpdates`);
  if (offset) url.searchParams.set("offset", String(offset));
  url.searchParams.set("timeout", env("TELEGRAM_POLL_TIMEOUT", "0"));
  url.searchParams.set("allowed_updates", JSON.stringify(["message"]));

  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Telegram getUpdates failed: ${response.status} ${await response.text()}`);
  const payload = await response.json() as TelegramUpdatesResponse;
  if (!payload.ok) throw new Error(`Telegram getUpdates failed: ${payload.description ?? "unknown error"}`);

  const updates = payload.result ?? [];
  let handled = 0;
  let nextOffset = offset;

  for (const update of updates) {
    nextOffset = Math.max(nextOffset, update.update_id + 1);
    const messageChatId = update.message?.chat?.id;
    const text = update.message?.text;
    if (!text || String(messageChatId) !== String(chatId)) continue;

    const reply = buildBotReply(text);
    await sendTelegramMessage({ enabled: true, botToken, chatId: String(chatId) }, reply, fetcher);
    handled += 1;
  }

  if (nextOffset !== offset) await writeOffset(nextOffset);
  return { updates: updates.length, handled, offset: nextOffset };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  pollTelegramOnce()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
