# X AI Alpha Funnel

Hermes-friendly funnel for Tyler's X account: scan X for early AI alpha, rank what matters, and produce tweet-ready angles before the AI/news timeline gets crowded.

This is not an auto-poster. It is a discovery and drafting system. You review before tweeting.

## What it does

- Searches X recent posts from a curated AI source list.
- Scores each post for:
  - source quality
  - freshness
  - engagement acceleration
  - AI-native keywords
  - launch/research/product signals
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

## Quick start

```bash
npm install
cp .env.example .env.local
npm run scan
```

If X auth is not configured, the scan falls back to sample posts so the funnel still works locally.

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
AI_ALPHA_SEED_HANDLES=sama,karpathy,OpenAI,AnthropicAI,GoogleDeepMind,MetaAI,perplexity_ai,huggingface
```

## Output

Each scan creates:

```text
.data/runs/<timestamp>.json
.data/runs/<timestamp>.md
```

The Markdown report is the operator-friendly view. Open the latest `.md` and pick the best draft/angle.

## Source strategy

The current default list prioritizes:

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
