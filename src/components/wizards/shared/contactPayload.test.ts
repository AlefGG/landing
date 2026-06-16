import { describe, it, expect } from "vitest";
import { contactPayload } from "./contactPayload";
import type { ContactsValue } from "./ContactsSection";

const base: ContactsValue = {
  contactType: "individual",
  name: "Айдос Заказчиков",
  phone: "+7 701 111-22-33",
  email: "aidos@example.com",
};

describe("contactPayload (BE-6 ContactsValue → API fields)", () => {
  it("maps the orderer block to snake_case API fields", () => {
    expect(contactPayload(base)).toEqual({
      contact_name: "Айдос Заказчиков",
      contact_phone: "+7 701 111-22-33",
      contact_email: "aidos@example.com",
    });
  });

  it("includes the on-site contact + install note when present", () => {
    const v: ContactsValue = {
      ...base,
      siteContactName: "Арман Встречающий",
      siteContactPhone: "+7 701 999-88-77",
      installNote: "вход со двора, спросить Армана",
    };
    expect(contactPayload(v)).toEqual({
      contact_name: "Айдос Заказчиков",
      contact_phone: "+7 701 111-22-33",
      contact_email: "aidos@example.com",
      site_contact_name: "Арман Встречающий",
      site_contact_phone: "+7 701 999-88-77",
      install_note: "вход со двора, спросить Армана",
    });
  });

  it("omits empty optional site fields entirely (no empty-string keys)", () => {
    const v: ContactsValue = {
      ...base,
      siteContactName: "",
      siteContactPhone: "  ",
      installNote: "",
    };
    const out = contactPayload(v);
    expect(out).not.toHaveProperty("site_contact_name");
    expect(out).not.toHaveProperty("site_contact_phone");
    expect(out).not.toHaveProperty("install_note");
  });

  it("trims whitespace on the site block + install note", () => {
    const v: ContactsValue = {
      ...base,
      siteContactName: "  Арман  ",
      installNote: "  у ворот  ",
    };
    const out = contactPayload(v);
    expect(out.site_contact_name).toBe("Арман");
    expect(out.install_note).toBe("у ворот");
  });
});
