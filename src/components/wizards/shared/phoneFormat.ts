export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const d = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
  if (d.length === 0) return "";
  if (d.length <= 1) return `+${d}`;
  if (d.length <= 4) return `+${d.slice(0, 1)} ${d.slice(1)}`;
  if (d.length <= 7) return `+${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4)}`;
  if (d.length <= 9) return `+${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7)}`;
  return `+${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}
