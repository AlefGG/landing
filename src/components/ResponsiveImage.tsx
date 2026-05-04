import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /**
   * FE-PF-006: viewport guard for the `<link rel="preload">` emitted when
   * `priority` is true. Browsers honour the `media` attribute on preload
   * links — when set, the preload only fetches on matching viewports.
   * Use this when the same logical hero image renders in two layouts
   * (one for desktop, one for mobile) and only one is visible at a time.
   * Example: `priorityMedia="(min-width: 1024px)"` on the desktop variant
   * means mobile devices skip the desktop preload entirely.
   */
  priorityMedia?: string;
  className?: string;
  width?: number;
  height?: number;
};

const WIDTHS = [480, 800, 1280] as const;
type Format = "avif" | "webp";

type Variants = {
  srcSets: Record<Format, string>;
  fallback: string;
  originalSrc: string;
};

function deriveVariants(src: string): Variants | null {
  // F-003: optimized variants only exist for build-time assets that the
  // Vite pipeline pre-generates under /assets/images-optimized/. Runtime
  // uploads (Equipment.photo → /media/equipment/...) and absolute remote
  // URLs have no companion .avif/.webp on disk, so requesting them just
  // floods the console with 404s. Gate variant generation on the
  // /assets/images/ prefix.
  if (!src.startsWith("/assets/images/")) return null;
  // /assets/images/cabin-hero.png -> dir "/assets/images", basename "cabin-hero", ext "png"
  // Match png/jpg/jpeg only; svg/webp/data-uri etc fall through to plain <img>.
  const match = src.match(/^(.*)\/([^/]+)\.(png|jpe?g)$/i);
  if (!match) return null;
  const basename = match[2]!;
  const ext = match[3]!;
  const optimizedBase = `/assets/images-optimized/${basename}`;
  const srcSets = {
    avif: WIDTHS.map((w) => `${optimizedBase}@${w}w.avif ${w}w`).join(", "),
    webp: WIDTHS.map((w) => `${optimizedBase}@${w}w.webp ${w}w`).join(", "),
  };
  const fallback = `${optimizedBase}@1280w.${ext.toLowerCase()}`;
  return { srcSets, fallback, originalSrc: src };
}

export default function ResponsiveImage({
  src,
  alt,
  sizes,
  priority,
  priorityMedia,
  className,
  width,
  height,
}: Props) {
  const variants = deriveVariants(src);
  const [imgSrc, setImgSrc] = useState(variants?.fallback ?? src);

  useEffect(() => {
    if (!priority) return;
    // FE-PF-006: priority+priorityMedia is the legitimate "two variants
    // for two viewports, only one preload fires per device" pattern;
    // it must not trip the single-LCP warning. Counted only when
    // priorityMedia is absent (the global-preload case).
    if (priorityMedia) return;
    if (typeof window === "undefined") return;
    const w = window as unknown as { __responsiveImagePriorityCount?: number };
    w.__responsiveImagePriorityCount = (w.__responsiveImagePriorityCount ?? 0) + 1;
    if (import.meta.env.DEV && w.__responsiveImagePriorityCount > 1) {
      console.warn(
        "[ResponsiveImage] more than one priority={true} mounted — only one LCP per route (use priorityMedia to viewport-gate)",
      );
    }
    return () => {
      w.__responsiveImagePriorityCount =
        (w.__responsiveImagePriorityCount ?? 1) - 1;
    };
  }, [priority, priorityMedia]);

  if (!variants) {
    // src didn't match expected pattern → render plain img.
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
      />
    );
  }

  return (
    <>
      {priority && (
        <Helmet>
          <link
            rel="preload"
            as="image"
            imageSrcSet={variants.srcSets.avif}
            imageSizes={sizes}
            type="image/avif"
            {...(priorityMedia ? { media: priorityMedia } : {})}
          />
          <link
            rel="preload"
            as="image"
            imageSrcSet={variants.srcSets.webp}
            imageSizes={sizes}
            type="image/webp"
            {...(priorityMedia ? { media: priorityMedia } : {})}
          />
        </Helmet>
      )}
      <picture>
        <source type="image/avif" srcSet={variants.srcSets.avif} sizes={sizes} />
        <source type="image/webp" srcSet={variants.srcSets.webp} sizes={sizes} />
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          onError={() => {
            if (imgSrc !== variants.originalSrc) setImgSrc(variants.originalSrc);
          }}
        />
      </picture>
    </>
  );
}
