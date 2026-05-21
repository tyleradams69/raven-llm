# ravenLLM

Hermes-powered X intelligence funnel for Tyler's @RavenLLM AI account.

ravenLLM watches X for early AI alpha, ranks what matters, and turns the best signals into tweet-ready angles for `https://x.com/RavenLLM`. The live account positioning is: "ASI 2028 | Most valuable insider AI information on X first | AI investigative journalism and AI history archivist."

Important: the account has older posts from a previous niche, including giveaway / good-morning / engagement-style posts. Those are explicitly not the target style for future ravenLLM output.

This is not an auto-poster. It is a discovery and drafting system. You review before tweeting.

## What it does

- Searches recent X posts from a curated AI source list.
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
npm run scan     # run one funnel scan
npm test         # tests
npm run build    # TypeScript check
npm run lint     # ESLint
```

## Env tuning

```text
AI_ALPHA_SCAN_LIMIT=25
AI_ALPHA_MIN_SCORE=60
AI_ALPHA_OUTPUT_DIR=.data/runs
AI_ALPHA_SEED_HANDLES=Chrisgpt,sama,karpathy,OpenAI,AnthropicAI,GoogleDeepMind,MetaAI,perplexity_ai,huggingface,cursor_ai,swyx
TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
TELEGRAM_MIN_SCORE=70
TELEGRAM_MAX_ITEMS=5
```

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
```

Then run:

```bash
npm run scan
```

If high-score signals are found, Telegram receives a compact digest with source link, reasons, risk flags, and a tweet draft.


## Source strategy

The current default list prioritizes:

- AI insider/reporter format: Chrisgpt
- primary labs: OpenAI, Anthropic, Google DeepMind, Meta AI
- researchers/operators: Karpathy, LeCun, swyx, nearcyan
- AI builders/infra: Hugging Face, vLLM, Perplexity, Cursor, Vercel
- investor/market thesis: a16z

Add more sources in `src/sources.ts` as you discover accounts that consistently break useful AI news early.

## Next obvious upgrades

- Add a scheduled Hermes cron job to run this every 30-60 minutes.
- Add a second pass that watches who credible AI accounts reply to/quote.
- Add RSS/arXiv/GitHub source modules so X is one signal layer, not the whole funnel.
- Add a manual approval queue that can post with `xurl post` only after confirmation.
