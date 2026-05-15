/**
 * Landing CTA lead submission.
 *
 * Posts to POST /api/public/leads/ (unauthenticated). The backend forwards
 * the lead to the landing-tenant manager via WhatsApp and records a
 * NotificationLog row. 202 Accepted = lead persisted, async delivery to manager.
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

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";
}

export async function createLead(payload: LeadPayload): Promise<{ id: string | null }> {
  const baseUrl = getApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/public/leads/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new LeadSubmissionError("Network error", err);
  }

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // ignore parse failure — body stays null
    }
    throw new LeadSubmissionError(
      `Lead submission failed (HTTP ${response.status})`,
      body,
    );
  }

  const data = (await response.json()) as { id: string | number | null };
  return { id: data.id == null ? null : String(data.id) };
}
