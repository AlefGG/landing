import { afterEach, describe, expect, it } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import Calendar from "./Calendar";
import i18n from "../../../i18n";

afterEach(() => {
  cleanup();
});

describe("Calendar — C-6 localized month + weekday labels", () => {
  it("renders RU month and weekday labels when i18n.language='ru'", async () => {
    await i18n.changeLanguage("ru");
    render(
      <I18nextProvider i18n={i18n}>
        <Calendar
          mode="single"
          value={new Date(2026, 4, 15)} // May 2026
          onChange={() => {}}
        />
      </I18nextProvider>,
    );
    expect(screen.getByText(/Май\s+2026/)).toBeInTheDocument();
    expect(screen.getByText("Пн")).toBeInTheDocument();
    expect(screen.getByText("Вс")).toBeInTheDocument();
  });

  it("renders KZ month label when i18n.language='kk'", async () => {
    await i18n.changeLanguage("kk");
    render(
      <I18nextProvider i18n={i18n}>
        <Calendar
          mode="single"
          value={new Date(2026, 4, 15)}
          onChange={() => {}}
        />
      </I18nextProvider>,
    );
    // kk-KZ month names use "мамыр" for May
    const header = screen.getByText(/2026/);
    expect(header.textContent?.toLowerCase()).toMatch(/мамыр/);
    await i18n.changeLanguage("ru");
  });
});
