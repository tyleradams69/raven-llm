import { ravenVoiceProfile } from "./profile.js";

export type TweetIdeaMode = "evergreen" | "topic";

type CommandName = "ideas" | "idea" | "tweets" | "tweetideas" | "thread" | "hook" | "quote" | "rewrite" | "score" | "calendar";

function cleanAfterCommand(input: string | undefined, commands: CommandName[]) {
  const commandPattern = commands.join("|");
  return input?.replace(new RegExp(`^\\/(${commandPattern})(@\\w+)?`, "i"), "").trim().replace(/\s+/g, " ") ?? "";
}

function cleanTopic(input?: string) {
  return cleanAfterCommand(input, ["ideas", "idea", "tweets", "tweetideas"]);
}

function topicOrDefault(input?: string) {
  const topic = cleanTopic(input);
  return topic || "AI becoming the new operator leverage layer";
}

function textOrFallback(input: string | undefined, commands: CommandName[], fallback: string) {
  return cleanAfterCommand(input, commands) || fallback;
}

function truncate(input: string, limit = 260) {
  if (input.length <= limit) return input;
  return `${input.slice(0, limit - 1).trim()}…`;
}

function scoreNumber(draft: string) {
  let score = 55;
  if (draft.length >= 80 && draft.length <= 240) score += 12;
  if (/\b(ai|agent|agents|model|workflow|operator|leverage|open source|inference|codex|agi)\b/i.test(draft)) score += 10;
  if (/[?]/.test(draft)) score += 6;
  if (/\b(why|how|what|before|because|not|but|edge|signal)\b/i.test(draft)) score += 8;
  if (draft.length > 260) score -= 14;
  if (/\b(amazing|insane|crazy|must read|gm|giveaway|retweet)\b/i.test(draft)) score -= 10;
  return Math.max(0, Math.min(100, score));
}

export function buildTweetIdeas(input?: string, options: { maxIdeas?: number } = {}) {
  const topic = topicOrDefault(input);
  const explicitTopic = Boolean(cleanTopic(input));
  const maxIdeas = options.maxIdeas ?? 8;
  const ideas = [
    {
      label: "Contrarian observation",
      text: `${topic} is not being underhyped. It is being misunderstood.\n\nThe real edge is not “AI does more tasks.”\n\nThe real edge is knowing which human workflows stop needing a human in the loop first.`,
    },
    {
      label: "Operator lesson",
      text: `The accounts that win the next AI cycle will not just report what launched.\n\nThey will explain:\n1. what changed\n2. who gets leverage from it\n3. what becomes obsolete\n4. what to try today\n\nThat is the lane I care about.`,
    },
    {
      label: "Founder/builder angle",
      text: `Most people are still asking “what can this AI tool do?”\n\nBetter question:\n\nWhat boring workflow became 10x cheaper this week?\n\nThat is usually where the startup ideas are hiding.`,
    },
    {
      label: "Timeline bait, but credible",
      text: `The AI takes that age well are rarely the loudest ones on launch day.\n\nThey are the ones that make you quietly change your workflow 3 days later.`,
    },
    {
      label: "Archive/history post",
      text: `We are going to look back at this AI era and realize the important screenshots were not just model launches.\n\nThey were the first moments normal people started outsourcing judgment, research, coding, design, and coordination to agents.`,
    },
    {
      label: "Question post",
      text: `What is one AI workflow you use now that would have sounded fake 12 months ago?\n\nNot a tool. A workflow.`,
    },
    {
      label: "Sharp one-liner",
      text: `AI alpha is not “new model dropped.”\n\nAI alpha is knowing what the new model makes possible before everyone else updates their mental model.`,
    },
    {
      label: "Personal positioning",
      text: `I do not want this page to be a pure AI news feed.\n\nI want it to become a map of where AI leverage is actually showing up: labs, agents, tools, workflows, money, history, and the strange edge cases people miss.`,
    },
    {
      label: "Topic-specific hook",
      text: `${topic}: the interesting question is not whether it is impressive.\n\nThe interesting question is who changes behavior because of it.\n\nIf no workflow changes, it is a demo.\nIf workflows change, it is a signal.`,
    },
    {
      label: "Engagement prompt",
      text: `Give me your most unpopular AI take right now.\n\nNot the safe one. The one you think will look obvious in 18 months.`,
    },
  ];

  const selected = ideas.slice(0, maxIdeas);
  const header = explicitTopic
    ? `🦅 ${ravenVoiceProfile.displayName} tweet ideas for: ${topic}`
    : `🦅 ${ravenVoiceProfile.displayName} evergreen tweet ideas`;

  return [
    header,
    "Not pure alpha — designed for engagement, positioning, and account texture.",
    "",
    ...selected.flatMap((idea, index) => [
      `${index + 1}. ${idea.label}`,
      truncate(idea.text),
      "",
    ]),
    "Commands: /ideas, /thread, /hook, /quote, /rewrite, /score, /calendar, /help",
  ].join("\n").trim();
}

export function buildThreadIdea(input?: string) {
  const topic = textOrFallback(input, ["thread"], "AI agents changing operator workflows");
  return [
    `🧵 Thread: ${topic}`,
    "",
    `1/ The important part of ${topic} is not the demo. It is the workflow change hiding behind the demo.`,
    "",
    "2/ Most people judge AI by screenshots. Operators judge it by whether it removes a recurring task, compresses a decision, or creates a new loop.",
    "",
    `3/ My read: ${topic} matters if it changes who can build, research, sell, code, or coordinate with a smaller team.`,
    "",
    "4/ Watch the second-order effects: what gets cheaper, what gets faster, and which roles become more leveraged instead of more crowded.",
    "",
    "5/ The edge is catching the behavior change before the timeline turns it into a consensus take.",
  ].join("\n");
}

export function buildHookIdeas(input?: string) {
  const topic = textOrFallback(input, ["hook"], "AI workflows");
  const hooks = [
    `${topic} is not interesting because it is impressive. It is interesting because it changes who gets leverage.`,
    `The fastest way to understand ${topic}: ask what workflow gets deleted, not what demo gets applause.`,
    `Most people are watching ${topic} like news. I think it is better to watch it like a map of future work.`,
    `Hot take: ${topic} will matter less for the people who try it once and more for the people who rebuild their day around it.`,
    `The underrated signal in ${topic}: whether normal operators change behavior within 72 hours.`,
  ];
  return [`🪝 Hooks for: ${topic}`, "", ...hooks.map((hook, index) => `${index + 1}. ${hook}`)].join("\n");
}

export function buildQuoteTake(input?: string) {
  const source = textOrFallback(input, ["quote"], "this AI signal");
  return [
    "💬 Quote take",
    "",
    `Source/context: ${source}`,
    "",
    "Option 1:",
    "This is the kind of AI signal that looks small until you ask what workflow it changes.",
    "",
    "Option 2:",
    "The headline is the launch. The alpha is figuring out who gets leverage from it first.",
    "",
    "Option 3:",
    "Worth watching. Not because every demo matters, but because behavior changes usually start as weird edge cases.",
  ].join("\n");
}

export function rewriteDraft(input?: string) {
  const draft = textOrFallback(input, ["rewrite"], "AI is moving fast and people should pay attention.");
  return [
    "✍️ Rewrite options",
    "",
    "Original:",
    draft,
    "",
    "1. Sharper:",
    truncate(`${draft}\n\nThe real question is what this makes possible before everyone else notices.`),
    "",
    "2. More Raven:",
    truncate(`The signal here is not just “${draft}”\n\nThe signal is what changes in the operator stack because of it.`),
    "",
    "3. Engagement-first:",
    truncate(`${draft}\n\nWhat is the first workflow this changes for you?`),
  ].join("\n");
}

export function scoreDraft(input?: string) {
  const draft = textOrFallback(input, ["score"], "AI is moving fast.");
  const score = scoreNumber(draft);
  const notes = [
    draft.length > 260 ? "too long for a clean single tweet" : "good single-tweet length",
    /[?]/.test(draft) ? "has a reply prompt" : "could add a question for replies",
    /\b(ai|agent|model|workflow|operator|leverage)\b/i.test(draft) ? "fits Raven AI/operator lane" : "could use a clearer AI/operator angle",
    /\b(edge|signal|before|because|changes?)\b/i.test(draft) ? "has a useful information-edge frame" : "could sharpen the information edge",
  ];
  return [
    `📊 Tweet score: ${score}/100`,
    "",
    `Draft: ${draft}`,
    "",
    "Notes:",
    ...notes.map((note) => `- ${note}`),
    "",
    "Suggested upgrade:",
    truncate(`${draft}\n\nThe part I care about: what this changes for builders/operators before it becomes obvious.`),
  ].join("\n");
}

export function buildContentCalendar() {
  const days = [
    ["Day 1", "Alpha signal", "Post the strongest live scan signal + a practical why-it-matters take."],
    ["Day 2", "Operator lesson", "Explain one AI workflow that saves time, money, or headcount."],
    ["Day 3", "Question post", "Ask what AI workflow people use now that sounded fake 12 months ago."],
    ["Day 4", "AI history/archive", "Connect a current AI shift to a future ‘we should have noticed this’ moment."],
    ["Day 5", "Contrarian take", "Challenge a consensus AI narrative with a credible operator angle."],
    ["Day 6", "Tool/workflow breakdown", "Show how a model/tool changes a real builder workflow."],
    ["Day 7", "Community prompt", "Ask followers for unpopular AI takes or workflows worth testing."],
  ];
  return [
    "📅 7-day Raven content calendar",
    "Mix alpha with account texture so the page does not feel like a pure news feed.",
    "",
    ...days.map(([day, format, prompt]) => `${day} — ${format}\n${prompt}\n`),
  ].join("\n").trim();
}
