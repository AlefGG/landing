import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import ResponsiveImage from "../ResponsiveImage";

function withHelmet(node: React.ReactNode) {
  return <HelmetProvider>{node}</HelmetProvider>;
}

describe("ResponsiveImage", () => {
  beforeEach(() => {
    // Reset the priority-counter window flag between tests.
    (
      window as unknown as { __responsiveImagePriorityCount?: number }
    ).__responsiveImagePriorityCount = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders picture/source[avif]/source[webp]/img for a PNG src", () => {
    const { container } = render(
      withHelmet(
        <ResponsiveImage
          src="/assets/images/cabin-hero.png"
          alt="cabin"
          sizes="100vw"
        />,
      ),
    );
    const picture = container.querySelector("picture");
    expect(picture).not.toBeNull();
    const sources = picture!.querySelectorAll("source");
    expect(sources).toHaveLength(2);
    expect(sources[0]!.getAttribute("type")).toBe("image/avif");
    expect(sources[1]!.getAttribute("type")).toBe("image/webp");
    expect(picture!.querySelector("img")).not.toBeNull();
  });

  it("srcSet on each source includes 480w / 800w / 1280w", () => {
    const { container } = render(
      withHelmet(
        <ResponsiveImage
          src="/assets/images/cabin-hero.png"
          alt=""
          sizes="100vw"
        />,
      ),
    );
    const sources = container.querySelectorAll("source");
    for (const s of sources) {
      const ss = s.getAttribute("srcset") ?? "";
      expect(ss).toMatch(/480w/);
      expect(ss).toMatch(/800w/);
      expect(ss).toMatch(/1280w/);
    }
  });

  it("forwards sizes prop to both <source> elements", () => {
    const sizes = "(max-width:768px) 100vw, 50vw";
    const { container } = render(
      withHelmet(
        <ResponsiveImage
          src="/assets/images/cabin-hero.png"
          alt=""
          sizes={sizes}
        />,
      ),
    );
    const sources = container.querySelectorAll("source");
    for (const s of sources) {
      expect(s.getAttribute("sizes")).toBe(sizes);
    }
  });

  it("priority sets fetchpriority=high, decoding=async, loading=eager on the <img>", () => {
    const { container } = render(
      withHelmet(
        <ResponsiveImage
          src="/assets/images/cabin-hero.png"
          alt=""
          sizes="100vw"
          priority
        />,
      ),
    );
    const img = container.querySelector("img")!;
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(img.getAttribute("decoding")).toBe("async");
    expect(img.getAttribute("loading")).toBe("eager");
  });

  it("non-priority renders loading=lazy and no fetchpriority", () => {
    const { container } = render(
      withHelmet(
        <ResponsiveImage
          src="/assets/images/about-bg.jpg"
          alt=""
          sizes="100vw"
        />,
      ),
    );
    const img = container.querySelector("img")!;
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("fetchpriority")).toBeNull();
  });

  it("priority emits two preload <link> via Helmet (avif + webp)", async () => {
    render(
      withHelmet(
        <ResponsiveImage
          src="/assets/images/cabin-hero.png"
          alt=""
          sizes="100vw"
          priority
        />,
      ),
    );
    // react-helmet-async (React 19 mode) renders <link> elements inline;
    // React 19's runtime hoists them to <head> when running in a real
    // browser, but jsdom does not implement that. Query anywhere in the
    // document — assertion is that the elements exist with the right
    // shape, regardless of placement.
    await waitFor(
      () => {
        const links = Array.from(
          document.querySelectorAll('link[rel="preload"][as="image"]'),
        );
        const types = links.map((l) => l.getAttribute("type"));
        expect(types).toEqual(expect.arrayContaining(["image/avif", "image/webp"]));
      },
      { timeout: 1000, interval: 25 },
    );
  });

  it("onError swaps img.src to the original src", async () => {
    const { container } = render(
      withHelmet(
        <ResponsiveImage
          src="/assets/images/cabin-hero.png"
          alt=""
          sizes="100vw"
        />,
      ),
    );
    const img = container.querySelector("img")!;
    expect(img.getAttribute("src")).toBe(
      "/assets/images-optimized/cabin-hero@1280w.png",
    );
    fireEvent.error(img);
    await waitFor(() => {
      expect(img.getAttribute("src")).toBe("/assets/images/cabin-hero.png");
    });
  });

  it("dev-mode warns once when two priority instances mount", () => {
    // import.meta.env.DEV is true under vitest by default.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      withHelmet(
        <>
          <ResponsiveImage
            src="/assets/images/cabin-hero.png"
            alt=""
            sizes="100vw"
            priority
          />
          <ResponsiveImage
            src="/assets/images/about-bg.jpg"
            alt=""
            sizes="100vw"
            priority
          />
        </>,
      ),
    );
    const calls = warn.mock.calls.flat().join(" ");
    expect(calls).toMatch(/more than one priority/);
  });

  it("data-uri / unmatched src renders plain <img>, no <picture>", () => {
    const { container } = render(
      withHelmet(
        <ResponsiveImage
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          alt=""
          sizes="100vw"
        />,
      ),
    );
    expect(container.querySelector("picture")).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("forwards className / width / height to the <img>", () => {
    const { container } = render(
      withHelmet(
        <ResponsiveImage
          src="/assets/images/cabin-hero.png"
          alt=""
          sizes="100vw"
          className="rounded"
          width={800}
          height={600}
        />,
      ),
    );
    const img = container.querySelector("img")!;
    expect(img.className).toBe("rounded");
    expect(img.getAttribute("width")).toBe("800");
    expect(img.getAttribute("height")).toBe("600");
  });

  it("alt prop is forwarded to <img>", () => {
    render(
      withHelmet(
        <ResponsiveImage
          src="/assets/images/cabin-hero.png"
          alt="cabin hero"
          sizes="100vw"
        />,
      ),
    );
    expect(screen.getByAltText("cabin hero")).not.toBeNull();
  });
});
