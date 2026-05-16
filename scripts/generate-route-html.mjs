#!/usr/bin/env node
// F-026..F-029 — emit per-route index.html with SSR-visible meta tags.
//
// Vite outputs a single dist/index.html with a fixed <title> and no
// description / OG / canonical. SPA crawlers fetch this file and see
// the same head on every route, so the site indexes as one duplicate
// page. To fix without a real SSR pipeline we post-process the build:
//
//   1. Read dist/index.html.
//   2. For each known route, replace <title> and inject description /
//      OG / canonical / hreflang tags using the existing i18n meta keys
//      (the same ones <Seo /> reads at runtime).
//   3. Write dist/<route>/index.html so nginx try_files serves it.
//
// Routes are listed explicitly so the script stays deterministic — any
// new public-facing route needs an entry here. /sale/<id> URLs use the
// generic sale meta (per-product copy lives in the admin panel and is
// not in i18n).
//
// Translations are pinned to RU (the primary market language). The
// rendered page may flip to KZ after hydration; hreflang exposes the
// alternate version to crawlers.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const ruPath = join(ROOT, "src/i18n/locales/ru.json");
const ru = JSON.parse(readFileSync(ruPath, "utf8"));

const ORIGIN = "https://biotualeti.com";
const OG_IMAGE = `${ORIGIN}/assets/og-image.png`;

const routes = [
  { path: "/", metaKey: null },
  { path: "/sale", metaKey: "sale" },
  { path: "/sale/4", metaKey: "sale" },
  { path: "/sale/5", metaKey: "sale" },
  { path: "/sale/6", metaKey: "sale" },
  { path: "/service", metaKey: "service" },
  { path: "/rental", metaKey: "rental" },
];

function metaFor(metaKey) {
  if (!metaKey) return { title: ru.meta.title, description: ru.meta.description };
  const node = ru.meta[metaKey];
  if (!node) return { title: ru.meta.title, description: ru.meta.description };
  return {
    title: node.title || ru.meta.title,
    description: node.description || ru.meta.description,
  };
}

function injectMeta(html, route, meta) {
  const canonical = `${ORIGIN}${route === "/" ? "/" : route}`;
  const headInjection = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="alternate" hreflang="ru" href="${canonical}" />`,
    `<link rel="alternate" hreflang="kk" href="${canonical}" />`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}" />`,
  ].join("\n    ");
  // Replace the original <title>...</title> with the new block. The
  // original line is preserved as a fallback only when no route matches
  // (default dist/index.html still serves /404 / future routes).
  return html.replace(/<title>[^<]*<\/title>/, headInjection);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const indexPath = join(DIST, "index.html");
const baseHtml = readFileSync(indexPath, "utf8");

for (const route of routes) {
  const meta = metaFor(route.metaKey);
  const html = injectMeta(baseHtml, route.path, meta);
  let target;
  if (route.path === "/") {
    target = indexPath;
  } else {
    const dir = join(DIST, route.path.replace(/^\//, ""));
    mkdirSync(dir, { recursive: true });
    target = join(dir, "index.html");
  }
  writeFileSync(target, html, "utf8");
  console.log(`[seo] ${route.path.padEnd(12)} → ${target.replace(DIST, "dist")}  «${meta.title}»`);
}

console.log(`[seo] generated ${routes.length} per-route index.html files`);
