export type AccountVoiceProfile = {
  accountUrl: string;
  handle: string;
  displayName: string;
  currentBio: string;
  targetPositioning: string;
  ignoreHistoricalContent: string[];
  voiceRules: string[];
  contentPillars: string[];
  avoid: string[];
};

export const ravenVoiceProfile: AccountVoiceProfile = {
  accountUrl: "https://x.com/RavenLLM",
  handle: "RavenLLM",
  displayName: "Raven",
  currentBio: "ASI 2028 | Most valuable insider AI information on X first | AI investigative journalism and AI history archivist.",
  targetPositioning: "AI insider / investigative reporter / archive account that surfaces valuable AI information early and explains why it matters before the broader timeline catches up.",
  ignoreHistoricalContent: [
    "old giveaway/farming posts",
    "good morning / engagement-bait posts",
    "old non-AI niche posts",
    "shill-and-chill style community posts",
  ],
  voiceRules: [
    "lead with the information edge, not generic hype",
    "sound like an AI investigative journalist with operator instincts",
    "make the first sentence feel urgent, specific, and useful",
    "explain why the signal matters for builders, labs, investors, or AI power users",
    "keep drafts credible enough for a 42K+ follower account",
    "prefer concise, high-signal posts over engagement bait",
  ],
  contentPillars: [
    "frontier lab moves and model launches",
    "AI agents and Codex-style operator workflows",
    "practical AI monetization/use-case proof",
    "AI infrastructure, inference, open-source models, and developer tools",
    "research papers with obvious real-world implications",
    "AI history/archive context that makes current events easier to understand",
  ],
  avoid: [
    "GM posts",
    "giveaway framing",
    "shill/follow/repost mechanics",
    "unsupported claims presented as fact",
    "copying another creator's wording",
  ],
};

export function renderVoiceBrief(profile = ravenVoiceProfile) {
  return [
    `${profile.displayName} (@${profile.handle})`,
    profile.targetPositioning,
    `Bio: ${profile.currentBio}`,
    `Ignore old content: ${profile.ignoreHistoricalContent.join(", ")}.`,
    `Voice rules: ${profile.voiceRules.join("; ")}.`,
    `Avoid: ${profile.avoid.join("; ")}.`,
  ].join("\n");
}
