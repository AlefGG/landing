import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Seo from "./Seo";

function renderAt(path: string, props: Parameters<typeof Seo>[0] = {}) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Seo {...props} />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("Seo noindex + canonicalOverride", () => {
  beforeEach(() => {
    document.head.querySelectorAll("meta,link").forEach((n) => n.remove());
  });

  it("emits robots noindex meta when noindex prop is true", async () => {
    renderAt("/missing", { noindex: true });
    await waitFor(() => {
      const robots = document.head.querySelector('meta[name="robots"]');
      expect(robots?.getAttribute("content")).toContain("noindex");
    });
  });

  it("does not emit canonical link when noindex is true", async () => {
    renderAt("/missing", { noindex: true });
    await waitFor(() => {
      expect(document.head.querySelector("meta[name=robots]")).toBeTruthy();
    });
    expect(document.head.querySelector("link[rel=canonical]")).toBeNull();
  });

  it("emits canonical from canonicalOverride when provided", async () => {
    renderAt("/sanitation", { canonicalOverride: "/service" });
    await waitFor(() => {
      const canonical = document.head.querySelector("link[rel=canonical]");
      expect(canonical?.getAttribute("href")).toContain("/service");
      expect(canonical?.getAttribute("href")).not.toContain("/sanitation");
    });
  });
});
