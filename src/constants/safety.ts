export const SAFETY_TIPS = [
  "Meet in a busy public place in daylight, never at home - or hand items over at a police station or the Zentrales Fundbüro.",
  "Never pay anything upfront. Requests for finder's fees or shipping costs are a common scam.",
  "Finders: ask the owner to describe something not visible in the photo before handing anything over.",
  "Don't share your home address, bank details or ID documents.",
  "Links and email addresses can't be sent in chat, to protect you from phishing.",
];

export const CHAT_INPUT_PLACEHOLDER = "Message (no links or emails)";

// Keep in sync with the patterns in supabase/007_chat_safety.sql, which enforces
// the same rules server-side.
const BLOCKED_CONTENT: { pattern: RegExp; reason: string }[] = [
  // Emails first: their domain part would otherwise match as a link.
  {
    pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
    reason: "Email addresses aren't allowed in chat. Keep the conversation in the app.",
  },
  {
    // Any domain-like word ("discord.gg", "x.ru") or IP address, not just
    // known TLDs. Costs some false positives ("Hi.How are you") by design.
    pattern: /(https?:\/\/|www\.|\b[a-z0-9-]+\.[a-z]{2,}\b|\b\d{1,3}(\.\d{1,3}){3}\b)/i,
    reason: "Links aren't allowed in chat, to protect you from phishing.",
  },
];

export const blockedContentReason = (text: string) =>
  BLOCKED_CONTENT.find(({ pattern }) => pattern.test(text))?.reason ?? null;
