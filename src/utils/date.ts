export function formatRelativeDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const now = Date.now();
  const diffSec = Math.round((now - date.getTime()) / 1000);

  if (diffSec < 60) {
    return locale.startsWith("kk") ? "дәл қазір" : "только что";
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffSec < 3600) {
    return rtf.format(-Math.round(diffSec / 60), "minute");
  }
  if (diffSec < 86400) {
    return rtf.format(-Math.round(diffSec / 3600), "hour");
  }
  if (diffSec < 7 * 86400) {
    return rtf.format(-Math.round(diffSec / 86400), "day");
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatAbsoluteDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
