# ravenLLM

Hermes-powered X intelligence funnel for Tyler's @RavenLLM AI account.

ravenLLM watches X for early AI alpha, ranks what matters, and turns the best signals into tweet-ready angles for `https://x.com/RavenLLM`. The live account positioning is: "ASI 2028 | Most valuable insider AI information on X first | AI investigative journalism and AI history archivist."

Important: the account has older posts from a previous niche, including giveaway / good-morning / engagement-style posts. Those are explicitly not the target style for future ravenLLM output.

This is not an auto-poster. It is a discovery and drafting system. You review before tweeting.

## What it does

- Searches recent X posts from a curated AI source list.
- Searches broad X discovery queries for early AI-alpha beyond known accounts.
- Scores each post for:
  - source quality
  - freshness
  - engagement acceleration
  - AI-native keywords
  - launch/research/product/operator signals
  - rumor/leak risk
- Classifies signals as:
  - `tweet-now`
  - `draft-today`
  - `watch`
- Generates three tweet angles per signal:
  - single tweet
  - thread hook
  - quote-tweet take
- Writes Markdown and JSON reports to `.data/runs/`.
- Optionally sends a Telegram digest with live news + draft angles when high-score signals appear.

## Voice / content lane

Target account: `https://x.com/RavenLLM`

Current bio:

> ASI 2028 | Most valuable insider AI information on X first | AI investigative journalism and AI history archivist.

ravenLLM should bias toward posts that can become:

- "AI insider/reporter" summaries
- practical operator takes, especially agent/Codex workflows
- "this tool paid for itself" or "this changed my workflow" narratives
- early lab/model/product launches
- research that has an obvious builder or business implication
- AI app-stack changes before everyone else packages them

Avoid copying another creator's wording. Use the lane as inspiration: fast, credible, practical, and useful.

Do not train the voice on the account's old non-AI niche posts. Specifically ignore old GM posts, giveaway posts, shill/follow/repost mechanics, and generic engagement-farming content.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run scan
```

If X auth is not configured, the scan falls back to sample posts so the funnel still works locally.

`npm run scan` automatically loads `.env.local` first, then `.env`. Keep real credentials in `.env.local`, which is ignored by git.

## Preferred X auth

Use `xurl`, authenticated outside Hermes/agent chat.

```bash
xurl auth status
xurl whoami
```

If not authenticated, set up xurl manually using the X developer portal. Do not paste secrets into chat.

Alternative read-only mode:

```text
X_BEARER_TOKEN=your-read-token
```

## Commands

```bash
npm run scan          # run one funnel scan
npm run telegram:bot  # answer pending Telegram /ideas commands once
npm test              # tests
npm run build         # TypeScript check
npm run lint          # ESLint
```

## Env tuning

```text
AI_ALPHA_SCAN_LIMIT=25
AI_ALPHA_MIN_SCORE=60
AI_ALPHA_MAX_AGE_HOURS=24
AI_ALPHA_OUTPUT_DIR=.data/runs
AI_ALPHA_SEED_HANDLES=sama,karpathy,OpenAI,AnthropicAI,GoogleDeepMind,MetaAI,perplexity_ai,huggingface,cursor_ai,swyx
AI_ALPHA_EXTRA_BROAD_QUERIES="new AI model" "early access" -is:retweet lang:en||"open weights" "just shipped" AI -is:retweet lang:en
TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
TELEGRAM_MIN_SCORE=70
TELEGRAM_MAX_ITEMS=5
TELEGRAM_SEND_SAMPLE_FALLBACK=false
TELEGRAM_OFFSET_PATH=.data/runs/telegram-offset.json
TELEGRAM_POLL_TIMEOUT=0
```

`AI_ALPHA_MAX_AGE_HOURS=24` keeps Telegram focused on recent signals. Set it to `8` for stricter breaking-news mode, or `0` to disable age filtering.

## Output

Each scan creates:

```text
.data/runs/<timestamp>.json
.data/runs/<timestamp>.md
```

The Markdown report is the operator-friendly view. Open the latest `.md` and pick the best draft/angle.

## Telegram alerts

Yes — ravenLLM is designed to be useful as a Telegram alert feed. Enable this only after you have a real X read path (`xurl` or `X_BEARER_TOKEN`) so Telegram receives live signals rather than sample fallback data.

Recommended flow:

1. Create a Telegram bot with `@BotFather`.
2. Send one message to the bot from your Telegram account.
3. Get your chat ID using Telegram's `getUpdates` endpoint or a trusted chat-id helper bot.
4. Put secrets in `.env.local`, not in chat and not in git:

```text
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
TELEGRAM_MIN_SCORE=70
TELEGRAM_MAX_ITEMS=5
TELEGRAM_SEND_SAMPLE_FALLBACK=false
TELEGRAM_OFFSET_PATH=.data/runs/telegram-offset.json
TELEGRAM_POLL_TIMEOUT=0
```

Then run:

```bash
npm run scan
```

If high-score signals are found, Telegram receives a compact digest with source link, reasons, risk flags, and a tweet draft.

By default, Telegram only sends live X results. If X API search fails and ravenLLM uses sample fallback data, Telegram stays quiet unless you explicitly set `TELEGRAM_SEND_SAMPLE_FALLBACK=true`.

## Telegram idea bot

The same Telegram bot can also generate on-demand tweet ideas so the account is not only a pure alpha feed.

Send the bot:

```text
/ideas
/ideas AI agents
/ideas open source models
/help
```

Then run this locally to answer pending commands:

```bash
npm run telegram:bot
```

The command uses Telegram `getUpdates`, replies only to your configured `TELEGRAM_CHAT_ID`, and stores the processed offset at `TELEGRAM_OFFSET_PATH` so it does not answer the same message twice. Schedule `npm run telegram:bot` every minute if you want it to feel automatic.

## Source strategy

The current default list prioritizes:

- primary labs: OpenAI, Anthropic, Google DeepMind, Meta AI
- researchers/operators: Karpathy, LeCun, swyx, nearcyan
- AI builders/infra: Hugging Face, vLLM, Perplexity, Cursor, Vercel
- investor/market thesis: a16z
- broad X search-page style discovery queries for unknown early accounts

Chrisgpt is not scanned as a source by default. His page is only a format/style reference for fast, useful AI-insider packaging.

Add more sources in `src/sources.ts` as you discover accounts that consistently break useful AI news early. Add broad search terms with `AI_ALPHA_EXTRA_BROAD_QUERIES`, separated by `||`.

## Next obvious upgrades

- Add a scheduled Hermes cron job to run this every 30-60 minutes.
- Add a second pass that watches who credible AI accounts reply to/quote.
- Add RSS/arXiv/GitHub source modules so X is one signal layer, not the whole funnel.
- Add a manual approval queue that can post with `xurl post` only after confirmation.
