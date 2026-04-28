import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import IdDocumentUpload from "../wizards/shared/IdDocumentUpload";
import { uploadIdDocuments } from "../../services/idDocumentService";
import { validateIdDocument } from "../../utils/idDocument";

export type IdDocumentBlockProps = {
  orderId: string;
  hasFront: boolean;
  hasBack: boolean;
  onFrontUploadedChange: (uploaded: boolean) => void;
};

type SlotStatus = "idle" | "uploading" | "uploaded" | "error";

type SlotState = {
  status: SlotStatus;
  error: string | null;
  fileName: string | null;
};

function initialSlot(hasFile: boolean): SlotState {
  return {
    status: hasFile ? "uploaded" : "idle",
    error: null,
    fileName: null,
  };
}

export default function IdDocumentBlock({
  orderId,
  hasFront,
  hasBack,
  onFrontUploadedChange,
}: IdDocumentBlockProps) {
  const { t } = useTranslation();
  const [front, setFront] = useState<SlotState>(() => initialSlot(hasFront));
  const [back, setBack] = useState<SlotState>(() => initialSlot(hasBack));

  useEffect(() => {
    onFrontUploadedChange(front.status === "uploaded");
  }, [front.status, onFrontUploadedChange]);

  const upload = useCallback(
    async (file: File, slot: "front" | "back") => {
      const setter = slot === "front" ? setFront : setBack;
      const v = validateIdDocument(file);
      if (!v.ok) {
        setter({
          status: "error",
          error: t(
            v.reason === "too_large"
              ? "payment.kaspi.idDocument.validationTooLarge"
              : "payment.kaspi.idDocument.validationBadMime",
          ),
          fileName: file.name,
        });
        return;
      }
      setter({ status: "uploading", error: null, fileName: file.name });
      try {
        await uploadIdDocuments(orderId, { [slot]: file });
        setter({ status: "uploaded", error: null, fileName: file.name });
      } catch {
        setter({
          status: "error",
          error: t("payment.kaspi.idDocument.uploadFailed"),
          fileName: file.name,
        });
      }
    },
    [orderId, t],
  );

  const onFrontPick = useCallback(
    (f: File | null) => {
      if (f) void upload(f, "front");
    },
    [upload],
  );
  const onBackPick = useCallback(
    (f: File | null) => {
      if (f) void upload(f, "back");
    },
    [upload],
  );

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
      data-testid="payment-id-document-block"
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-body font-semibold text-base leading-6 text-neutral-900">
          {t("payment.kaspi.idDocument.title")}
        </h3>
        <p className="font-body text-sm leading-5 text-neutral-600">
          {t("payment.kaspi.idDocument.subtitle")}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Slot
          state={front}
          slot="front"
          label={t("payment.kaspi.idDocument.frontLabel")}
          onPick={onFrontPick}
          onReplace={() => setFront({ status: "idle", error: null, fileName: front.fileName })}
        />
        <Slot
          state={back}
          slot="back"
          label={t("payment.kaspi.idDocument.backLabel")}
          onPick={onBackPick}
          onReplace={() => setBack({ status: "idle", error: null, fileName: back.fileName })}
        />
      </div>
    </div>
  );
}

function Slot({
  state,
  slot,
  label,
  onPick,
  onReplace,
}: {
  state: SlotState;
  slot: "front" | "back";
  label: string;
  onPick: (f: File | null) => void;
  onReplace: () => void;
}) {
  const { t } = useTranslation();
  if (state.status === "uploaded") {
    return (
      <div
        className="flex items-center justify-between gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2"
        data-testid={`payment-id-doc-${slot}-uploaded`}
      >
        <div className="flex flex-col min-w-0">
          <span className="font-body text-sm leading-4 text-neutral-900 truncate">
            {label}
          </span>
          <span className="font-body text-xs leading-4 text-neutral-600">
            ✓ {t("payment.kaspi.idDocument.uploadedLabel")}
            {state.fileName ? ` · ${state.fileName}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={onReplace}
          className="font-body text-sm leading-4 text-cta-main hover:underline shrink-0"
          data-testid={`payment-id-doc-${slot}-replace`}
        >
          {t("payment.kaspi.idDocument.replace")}
        </button>
      </div>
    );
  }
  if (state.status === "uploading") {
    return (
      <div
        className="rounded-lg border border-neutral-300 bg-white px-3 py-3"
        data-testid={`payment-id-doc-${slot}-uploading`}
      >
        <span className="font-body text-sm leading-4 text-neutral-700">
          {label} · {t("payment.kaspi.idDocument.uploading")}
        </span>
      </div>
    );
  }
  return (
    <IdDocumentUpload
      value={null}
      onChange={onPick}
      label={label}
      error={state.error ?? undefined}
    />
  );
}
