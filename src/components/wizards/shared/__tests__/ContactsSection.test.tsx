import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import ContactsSection, { type ContactsValue } from "../ContactsSection";
import i18n from "../../../../i18n";

const authMock = vi.hoisted(() => ({
  status: "authenticated" as "authenticated" | "anonymous" | "loading",
  user: {
    id: 1,
    first_name: "Иван",
    phone: "+77001112233",
    email: "i@x.kz",
    role: "client",
    language: "ru",
    company: null,
  } as {
    id: number;
    first_name: string;
    phone: string;
    email: string;
    role: string;
    language: string;
    company: number | null;
  } | null,
}));

vi.mock("../../../../contexts/AuthContext", () => ({
  useAuth: () => authMock,
}));

function renderWithValue(initial: ContactsValue) {
  let value = initial;
  const handleChange = vi.fn((next: ContactsValue) => {
    value = next;
  });
  const utils = render(
    <I18nextProvider i18n={i18n}>
      <ContactsSection value={value} onChange={handleChange} />
    </I18nextProvider>,
  );
  const rerender = () =>
    utils.rerender(
      <I18nextProvider i18n={i18n}>
        <ContactsSection value={value} onChange={handleChange} />
      </I18nextProvider>,
    );
  return {
    ...utils,
    handleChange,
    getValue: () => value,
    rerender,
  };
}

describe("ContactsSection (controlled, no snap-back)", () => {
  beforeEach(() => {
    authMock.status = "authenticated";
    authMock.user = {
      id: 1,
      first_name: "Иван",
      phone: "+77001112233",
      email: "i@x.kz",
      role: "client",
      language: "ru",
      company: null,
    };
  });
  afterEach(() => cleanup());

  it("preserves typed character when useProfile=true (no snap-back)", () => {
    const initial: ContactsValue = {
      contactType: "individual",
      name: "Иван",
      phone: "+7 700 111-22-33",
      email: "i@x.kz",
      useProfile: true,
    };
    const { handleChange, getValue, rerender } = renderWithValue(initial);

    const nameInput = screen.getByDisplayValue("Иван");
    fireEvent.change(nameInput, { target: { value: "Иванов" } });
    rerender();

    // After typing once: useProfile flipped off AND the typed value persisted.
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(getValue().useProfile).toBe(false);
    expect(getValue().name).toBe("Иванов");
  });

  it("toggling useProfile ON populates name/phone/email from profile", () => {
    const initial: ContactsValue = {
      contactType: "individual",
      name: "",
      phone: "",
      email: "",
      useProfile: false,
    };
    const { handleChange, getValue } = renderWithValue(initial);

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(getValue().useProfile).toBe(true);
    expect(getValue().name).toBe("Иван");
    expect(getValue().phone).toBe("+7 700 111-22-33");
    expect(getValue().email).toBe("i@x.kz");
  });
});

describe("ContactsSection programmatic label association (FE-A11Y-002)", () => {
  beforeEach(() => {
    authMock.status = "anonymous";
    authMock.user = null;
  });
  afterEach(() => cleanup());

  it("name input is reachable via getByLabelText", () => {
    renderWithValue({
      contactType: "individual",
      name: "",
      phone: "",
      email: "",
      useProfile: false,
    });
    const input = screen.getByLabelText(/Ф\.И\.О\.|ФИО|Т\.А\.Ә\.|Имя/i);
    expect(input.tagName).toBe("INPUT");
  });

  it("phone input is reachable via getByLabelText", () => {
    renderWithValue({
      contactType: "individual",
      name: "",
      phone: "",
      email: "",
      useProfile: false,
    });
    const input = screen.getByLabelText(/Телефон/i);
    expect(input.tagName).toBe("INPUT");
    expect(input.getAttribute("type")).toBe("tel");
  });

  it("email input is reachable via getByLabelText", () => {
    renderWithValue({
      contactType: "individual",
      name: "",
      phone: "",
      email: "",
      useProfile: false,
    });
    const input = screen.getByLabelText(/e-mail|email|пошта/i);
    expect(input.tagName).toBe("INPUT");
  });
});
