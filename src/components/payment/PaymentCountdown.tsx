import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

// F-014 — renders a live countdown until pending_payment auto-cancel.
// Hidden when `expiresAt` is null (order is past pending_payment or
// the backend did not expose the field for some reason). Once the
// timer hits zero we surface the cancellation explicitly and ping
// the parent so it can refetch the order — the backend
// `expire_pending_payments` command runs on its own schedule, so the
// status flip may lag the on-screen expiry by a few seconds.

type Props = {
  expiresAt: string | null;
  onExpired?: () => void;
};

function formatRemainingSeconds(totalSeconds: number): { mm: string; ss: string } {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return {
    mm: String(minutes).padStart(2, "0"),
    ss: String(seconds).padStart(2, "0"),
  };
}

export default function PaymentCountdown({ expiresAt, onExpired }: Props) {
  const { t } = useTranslation();
  const expiryMs = useMemo(
    () => (expiresAt ? new Date(expiresAt).getTime() : null),
    [expiresAt],
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (expiryMs === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiryMs]);

  // Tell the parent once we cross the boundary so it can refetch and
  // pick up the backend-driven `cancelled` status. The check is cheap
  // (one timestamp compare per render); the `triggered` ref is not
  // needed because expiryMs only flips once per order.
  const expired = expiryMs !== null && now >= expiryMs;
  useEffect(() => {
    if (!expired || !onExpired) return;
    onExpired();
  }, [expired, onExpired]);

  if (expiryMs === null) return null;

  if (expired) {
    return (
      <div
        role="alert"
        data-testid="payment-countdown-expired"
        className="mb-4 rounded-[8px] border border-red-200 bg-red-50 p-4"
      >
        <p className="font-heading text-base lg:text-lg font-extrabold text-red-700">
          {t("payment.countdown.expiredTitle")}
        </p>
        <p className="mt-1 font-body text-sm leading-5 text-red-600">
          {t("payment.countdown.expiredBody")}
        </p>
        <Link
          to="/sale"
          className="mt-3 inline-block font-body text-sm text-cta-main underline"
        >
          {t("payment.countdown.expiredCta")}
        </Link>
      </div>
    );
  }

  const remainingSeconds = Math.max(0, Math.floor((expiryMs - now) / 1000));
  const { mm, ss } = formatRemainingSeconds(remainingSeconds);

  return (
    <div
      data-testid="payment-countdown"
      className="mb-4 rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 font-body text-sm lg:text-base leading-5 text-amber-900"
    >
      <span>{t("payment.countdown.label")} </span>
      <strong
        className="font-heading tabular-nums text-amber-900"
        data-testid="payment-countdown-value"
        aria-live="polite"
      >
        {t("payment.countdown.value", { minutes: mm, seconds: ss })}
      </strong>
      <span> — {t("payment.countdown.suffix")}</span>
    </div>
  );
}
