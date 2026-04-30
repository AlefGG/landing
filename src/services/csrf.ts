/** Read csrftoken cookie (set by Django middleware). Returns "" if absent. */
export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  if (!match || match[1] === undefined) return "";
  return decodeURIComponent(match[1]);
}
