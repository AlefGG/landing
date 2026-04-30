import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SuccessScreen from "../SuccessScreen";
import i18n from "../../i18n";

const authMock = vi.hoisted(() => ({
  status: "anonymous" as "anonymous" | "authenticated" | "loading",
  user: null as { id: number } | null,
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => authMock,
}));

describe("SuccessScreen", () => {
  beforeEach(() => {
    authMock.status = "anonymous";
    authMock.user = null;
  });

  it("redirects to / when order param is missing (anonymous user)", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/success"]}>
          <Routes>
            <Route path="/success" element={<SuccessScreen />} />
            <Route path="/" element={<div data-testid="home" />} />
            <Route path="/account/orders" element={<div data-testid="orders" />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );
    expect(screen.queryByText(/#XXXXXX/)).not.toBeInTheDocument();
    expect(screen.getByTestId("home")).toBeInTheDocument();
  });

  it("redirects authenticated users to /account/orders when order param is missing", () => {
    authMock.status = "authenticated";
    authMock.user = { id: 1 };
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/success"]}>
          <Routes>
            <Route path="/success" element={<SuccessScreen />} />
            <Route path="/" element={<div data-testid="home" />} />
            <Route path="/account/orders" element={<div data-testid="orders" />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );
    expect(screen.queryByText(/#XXXXXX/)).not.toBeInTheDocument();
    expect(screen.getByTestId("orders")).toBeInTheDocument();
  });

  it("renders order number when ?order is present", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/success?order=ORD-1234"]}>
          <SuccessScreen />
        </MemoryRouter>
      </I18nextProvider>,
    );
    expect(screen.getByText(/#ORD-1234/)).toBeInTheDocument();
  });
});
