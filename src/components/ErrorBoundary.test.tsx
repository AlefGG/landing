import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";

const { captureExceptionMock, initMock } = vi.hoisted(() => ({
  captureExceptionMock: vi.fn(),
  initMock: vi.fn(),
}));

vi.mock("@sentry/react", () => ({
  captureException: captureExceptionMock,
  init: initMock,
}));

import i18n from "../i18n";
import ErrorBoundary from "./ErrorBoundary";

function Boom(): never {
  throw new Error("boom");
}

const originalError = console.error;

beforeEach(() => {
  console.error = vi.fn();
  captureExceptionMock.mockClear();
});

afterEach(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <p>safe content</p>
        </ErrorBoundary>
      </I18nextProvider>,
    );
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  it("renders fallback UI with i18n strings when child throws", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </I18nextProvider>,
    );
    expect(
      screen.getByRole("heading", { name: /что-то пошло не так|қате/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /перезагрузить|қайта жүктеу/i }),
    ).toBeInTheDocument();
  });

  it("calls Sentry.captureException when child throws", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      </I18nextProvider>,
    );
    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
  });
});
