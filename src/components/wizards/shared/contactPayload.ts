import type { ContactsValue } from "./ContactsSection";

/** BE-6 — the contact block sent on order create (and preview). Mirrors the
 *  optional fields accepted by RentalOrderSerializer / ConstructionOrderSerializer
 *  / ServiceOrderSerializer on the backend. NOT sent for sale. */
export type ContactPayload = {
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  site_contact_name?: string;
  site_contact_phone?: string;
  install_note?: string;
};

/** Map the wizard's ContactsValue to the snake_case fields the backend
 *  accepts. The orderer block (name/phone/email) is always sent — the BASE
 *  FIX, since these were historically dropped. The on-site contact + install
 *  note are optional: empty/whitespace values are omitted entirely so the
 *  backend stores '' (its default) instead of a blank key round-trip. */
export function contactPayload(contacts: ContactsValue): ContactPayload {
  const payload: ContactPayload = {
    contact_name: contacts.name,
    contact_phone: contacts.phone,
    contact_email: contacts.email,
  };
  const siteName = (contacts.siteContactName ?? "").trim();
  const sitePhone = (contacts.siteContactPhone ?? "").trim();
  const note = (contacts.installNote ?? "").trim();
  if (siteName) payload.site_contact_name = siteName;
  if (sitePhone) payload.site_contact_phone = sitePhone;
  if (note) payload.install_note = note;
  return payload;
}
