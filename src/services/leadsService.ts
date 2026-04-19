/**
 * Landing contact-form lead submission (mock).
 *
 * Wizards no longer use this — they go through orderService for real orders.
 * This file only serves the landing CTA modal (ContactForm), which is not
 * in-scope for backend integration. Replace with a real POST /leads/ endpoint
 * when the CRM side is ready.
 */

export type ServiceKind = "rental" | "sanitation" | "sale";
export type ContactTypeKind = "individual" | "legal";

export type LeadPayload = {
  name: string;
  phone: string;
  service: ServiceKind;
  locale: string;
  source?: string;
  email?: string;
};

export class LeadSubmissionError extends Error {
  override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LeadSubmissionError";
    this.cause = cause;
  }
}

const MOCK_DELAY_MS = 500;

export async function createLead(payload: LeadPayload): Promise<{ id: string }> {
  if (import.meta.env.DEV) {
    console.info("[leadsService:mock] createLead", payload);
  }
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return { id: `mock-${Date.now()}` };
}
