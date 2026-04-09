import { useEffect, useId, useRef, cloneElement, isValidElement } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

let bodyLockCount = 0;

function lockBodyScroll() {
  bodyLockCount += 1;
  if (bodyLockCount === 1) {
    document.body.dataset.prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
}

function unlockBodyScroll() {
  if (bodyLockCount === 0) return;
  bodyLockCount -= 1;
  if (bodyLockCount === 0) {
    document.body.style.overflow = document.body.dataset.prevOverflow ?? "";
    delete document.body.dataset.prevOverflow;
  }
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  // Inject `titleId` into the single child so that `aria-labelledby` points to a real heading.
  const childWithTitleId = isValidElement<{ titleId?: string }>(children)
    ? cloneElement(children, { titleId })
    : children;

  const fadeTransition = prefersReducedMotion ? { duration: 0 } : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fadeTransition}
        >
          {/* Decorative backdrop; Escape and close button handle keyboard a11y. */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative bg-white rounded-3xl p-8 w-full max-w-md z-10 outline-none"
            initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.95, opacity: 0 }}
            transition={fadeTransition}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-800 transition-colors"
              aria-label={t("a11y.closeModal")}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            {childWithTitleId}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
