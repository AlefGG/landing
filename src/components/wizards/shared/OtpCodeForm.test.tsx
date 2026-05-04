// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import OtpCodeForm from "./OtpCodeForm";
import { InvalidOtpError } from "../../../services/authService";
import type * as AuthContextModule from "../../../contexts/AuthContext";

const mockLogin = vi.fn();
const mockSendOtp = vi.fn();

vi.mock("../../../contexts/AuthContext", async () => {
  const actual = await vi.importActual<typeof AuthContextModule>(
    "../../../contexts/AuthContext",
  );
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      status: "anonymous" as const,
      sendOtp: mockSendOtp,
      login: mockLogin,
      logout: vi.fn(),
      updateProfile: vi.fn(),
    }),
  };
});

function renderForm(props: Partial<React.ComponentProps<typeof OtpCodeForm>> = {}) {
  const onSuccess = props.onSuccess ?? vi.fn();
  const utils = render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <OtpCodeForm phone="+77001234567" onSuccess={onSuccess} {...props} />
      </I18nextProvider>
    </MemoryRouter>,
  );
  return { onSuccess, ...utils };
}

describe("OtpCodeForm", () => {
  beforeEach(() => {
    cleanup();
    mockLogin.mockReset();
    mockSendOtp.mockReset();
    mockSendOtp.mockResolvedValue({ expiresIn: 60 });
  });

  it("calls login with phone+code after 6 digits typed", async () => {
    mockLogin.mockResolvedValue(undefined);
    const { onSuccess } = renderForm();
    for (let i = 0; i < 6; i += 1) {
      fireEvent.change(screen.getByTestId(`otp-input-${i}`), {
        target: { value: String(i + 1) },
      });
    }
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith("+77001234567", "123456"),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("shows InvalidOtp message when login throws InvalidOtpError (default 'invalid')", async () => {
    mockLogin.mockRejectedValue(new InvalidOtpError());
    renderForm();
    for (let i = 0; i < 6; i += 1) {
      fireEvent.change(screen.getByTestId(`otp-input-${i}`), {
        target: { value: "1" },
      });
    }
    await waitFor(() => {
      const el = screen.getByTestId("verify-error");
      expect(el.getAttribute("data-error-kind")).toBe("invalid");
      expect(el.textContent).toMatch(/Неверный код/);
    });
  });

  it("F-006: shows 'expired' message + 'request new' hint when reason='expired'", async () => {
    mockLogin.mockRejectedValue(new InvalidOtpError("expired"));
    renderForm();
    for (let i = 0; i < 6; i += 1) {
      fireEvent.change(screen.getByTestId(`otp-input-${i}`), {
        target: { value: "1" },
      });
    }
    await waitFor(() => {
      const el = screen.getByTestId("verify-error");
      expect(el.getAttribute("data-error-kind")).toBe("expired");
      expect(el.textContent).toMatch(/истёк/);
    });
  });

  it("F-006: shows 'too_many_attempts' message when reason='too_many_attempts'", async () => {
    mockLogin.mockRejectedValue(new InvalidOtpError("too_many_attempts"));
    renderForm();
    for (let i = 0; i < 6; i += 1) {
      fireEvent.change(screen.getByTestId(`otp-input-${i}`), {
        target: { value: "1" },
      });
    }
    await waitFor(() => {
      const el = screen.getByTestId("verify-error");
      expect(el.getAttribute("data-error-kind")).toBe("too_many_attempts");
      expect(el.textContent).toMatch(/Слишком много/);
    });
  });

  it("renders 'change phone' button only when onChangePhone provided", () => {
    const { unmount } = renderForm();
    expect(screen.queryByTestId("otp-change-phone")).toBeNull();
    unmount();

    const onChange = vi.fn();
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <OtpCodeForm phone="+77001234567" onSuccess={vi.fn()} onChangePhone={onChange} />
        </I18nextProvider>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByTestId("otp-change-phone"));
    expect(onChange).toHaveBeenCalled();
  });
});
