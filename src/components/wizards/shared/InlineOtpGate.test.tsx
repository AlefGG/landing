// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../../i18n";
import InlineOtpGate from "./InlineOtpGate";
import { OtpSendError } from "../../../services/authService";
import type * as AuthContextModule from "../../../contexts/AuthContext";

const mockSendOtp = vi.fn();
const mockLogin = vi.fn();

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

function renderGate(props: Partial<React.ComponentProps<typeof InlineOtpGate>> = {}) {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <InlineOtpGate
          phone="+77001234567"
          onSuccess={props.onSuccess ?? vi.fn()}
          onChangePhone={props.onChangePhone ?? vi.fn()}
        />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe("InlineOtpGate", () => {
  beforeEach(() => {
    cleanup();
    mockSendOtp.mockReset();
    mockLogin.mockReset();
  });

  it("calls sendOtp on mount", async () => {
    mockSendOtp.mockResolvedValue({ expiresIn: 60 });
    renderGate();
    await waitFor(() => expect(mockSendOtp).toHaveBeenCalledWith("+77001234567"));
  });

  it("shows retry button when sendOtp fails on mount", async () => {
    mockSendOtp.mockRejectedValueOnce(new OtpSendError());
    renderGate();
    await waitFor(() =>
      expect(screen.getByTestId("inline-otp-retry-send")).toBeTruthy(),
    );
  });

  it("does not render OtpCodeForm until sendOtp succeeds", async () => {
    mockSendOtp.mockRejectedValueOnce(new OtpSendError());
    renderGate();
    await waitFor(() =>
      expect(screen.getByTestId("inline-otp-retry-send")).toBeTruthy(),
    );
    expect(screen.queryByTestId("otp-inputs")).toBeNull();
  });

  it("change-phone button calls onChangePhone", async () => {
    mockSendOtp.mockResolvedValue({ expiresIn: 60 });
    const onChange = vi.fn();
    renderGate({ onChangePhone: onChange });
    await waitFor(() => expect(screen.getByTestId("otp-change-phone")).toBeTruthy());
    fireEvent.click(screen.getByTestId("otp-change-phone"));
    expect(onChange).toHaveBeenCalled();
  });
});
