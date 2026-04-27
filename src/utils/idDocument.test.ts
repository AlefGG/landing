import { describe, expect, it } from "vitest";
import {
  ALLOWED_ID_DOCUMENT_MIMES,
  MAX_ID_DOCUMENT_SIZE,
  validateIdDocument,
} from "./idDocument";

function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe("validateIdDocument", () => {
  it("accepts a small jpeg", () => {
    expect(validateIdDocument(makeFile("id.jpg", "image/jpeg", 1024))).toEqual({
      ok: true,
    });
  });

  it("accepts a small png", () => {
    expect(validateIdDocument(makeFile("id.png", "image/png", 2048))).toEqual({
      ok: true,
    });
  });

  it("accepts a small pdf", () => {
    expect(validateIdDocument(makeFile("id.pdf", "application/pdf", 4096))).toEqual({
      ok: true,
    });
  });

  it("rejects files over 5 MB", () => {
    const oversize = makeFile("big.jpg", "image/jpeg", MAX_ID_DOCUMENT_SIZE + 1);
    expect(validateIdDocument(oversize)).toEqual({ ok: false, reason: "too_large" });
  });

  it("accepts a file at exactly 5 MB (inclusive cap)", () => {
    expect(validateIdDocument(makeFile("at.jpg", "image/jpeg", MAX_ID_DOCUMENT_SIZE))).toEqual(
      { ok: true },
    );
  });

  it("rejects non-listed mime types", () => {
    expect(
      validateIdDocument(makeFile("doc.docx", "application/msword", 1024)),
    ).toEqual({ ok: false, reason: "bad_mime" });
  });

  it("rejects empty mime", () => {
    expect(validateIdDocument(makeFile("x.bin", "", 1024))).toEqual({
      ok: false,
      reason: "bad_mime",
    });
  });

  it("exports the expected mime allowlist", () => {
    expect(ALLOWED_ID_DOCUMENT_MIMES).toEqual(
      new Set(["image/jpeg", "image/png", "application/pdf"]),
    );
  });
});
