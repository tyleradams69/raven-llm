import { ravenVoiceProfile } from "./profile.js";

export type TweetIdeaMode = "evergreen" | "topic";

function cleanTopic(input?: string) {
  return input?.replace(/^\/(ideas|idea|tweets|tweetideas)(@\w+)?/i, "").trim().replace(/\s+/g, " ") ?? "";
}

function topicOrDefault(input?: string) {
  const topic = cleanTopic(input);
  return topic || "AI becoming the new operator leverage layer";
}

function truncate(input: string, limit = 260) {
  if (input.length <= limit) return input;
  return `${input.slice(0, limit - 1).trim()}…`;
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
    "Commands: /ideas, /ideas agents, /ideas open source models, /help",
  ].join("\n").trim();
}
