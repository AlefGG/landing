/**
 * Lead submission service.
 *
 * Mock implementation: logs to console and resolves after a short delay.
 * Replace the body of `createLead` with a real `fetch` to the Django backend
 * (e.g. `${import.meta.env.VITE_API_URL}/leads/`) once the endpoint is ready.
 */

export type LeadPayload = {
  name: string;
  phone: string;
  service: "rental" | "sanitation" | "sale";
  locale: string;
  source?: string;
};

export type LeadResponse = {
  id: string;
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

export async function createLead(payload: LeadPayload): Promise<LeadResponse> {
  if (import.meta.env.DEV) {
    console.info("[leadsService:mock] createLead", payload);
  }

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  return { id: `mock-${Date.now()}` };
}
