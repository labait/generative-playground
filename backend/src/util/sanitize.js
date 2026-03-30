export function sanitizePrompt(text, maxLen = 2000) {
  if (typeof text !== "string") return "";
  const stripped = text.replace(/<[^>]*>/g, "").trim();
  return stripped.slice(0, maxLen);
}
