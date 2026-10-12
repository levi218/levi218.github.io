#!/usr/bin/env node
/**
 * `npm run og` — render the social card to `public/og.png`.
 *
 * Not Next's `opengraph-image.tsx` convention, deliberately: that emits an
 * *extensionless* file, and GitHub Pages types unknown extensions as
 * `application/octet-stream`, which the social scrapers reject. A real `.png`
 * in `public/` is served as an image by every host.
 *
 * `build-site.mjs` runs this before the shell build, so the card cannot drift
 * from the name and tagline in `content/profile.json`.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";

import { ROOT } from "../lib/registry/load.ts";

const OUT = path.join(ROOT, "public", "og.png");
export const SIZE = { width: 1200, height: 630 };

const profile = JSON.parse(await readFile(path.join(ROOT, "content", "profile.json"), "utf8"));

// Typographic on purpose: no asset to keep in sync, and it stays correct when
// the profile changes. Colours mirror the light palette in app/globals.css.
const card = h(
  "div",
  {
    style: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      background: "#fcfbf9",
      color: "#171614",
      padding: 80,
    },
  },
  h("div", { style: { display: "flex", fontSize: 76, fontWeight: 600, letterSpacing: -1 } }, profile.name),
  h("div", { style: { display: "flex", fontSize: 38, color: "#6b6660", lineHeight: 1.35 } }, profile.tagline),
  h("div", { style: { display: "flex", height: 10, width: 180, background: "#b0442d" } }),
);

const response = new ImageResponse(card, SIZE);
await writeFile(OUT, Buffer.from(await response.arrayBuffer()));
console.log(`  og: ${path.relative(ROOT, OUT)} (${SIZE.width}×${SIZE.height})`);
