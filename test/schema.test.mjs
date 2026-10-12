/**
 * The registry schema — the rules that keep a broken project from being
 * published, and the derivation that keeps the AI-assisted badge honest.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AI_ASSISTED_THRESHOLD,
  effectiveTags,
  parseRegistry,
} from "../lib/registry/schema.ts";

const project = (overrides = {}) => ({
  slug: "thing",
  title: "Thing",
  blurb: "A thing.",
  source: { dir: "../thing" },
  deploy: { mode: "none" },
  ...overrides,
});

const registry = (...projects) => ({ version: 1, projects });

test("fills defaults so a minimal entry is still a complete one", () => {
  const parsed = parseRegistry(registry(project()));
  const [entry] = parsed.projects;
  assert.equal(entry.status, "draft", "nothing is published by accident");
  assert.equal(entry.order, 100);
  assert.deepEqual(entry.tags, []);
  assert.equal(entry.source.ref, "main");
});

test("rejects a slug that would collide with a route this app owns", () => {
  for (const slug of ["admin", "projects", "apps", "_next"]) {
    assert.throws(() => parseRegistry(registry(project({ slug }))), /reserved route name/);
  }
});

test("rejects a slug that is not kebab-case", () => {
  assert.throws(() => parseRegistry(registry(project({ slug: "Not Kebab" }))), /kebab-case/);
});

test("rejects duplicate slugs", () => {
  assert.throws(() => parseRegistry(registry(project(), project())), /duplicate slug/);
});

test("an external project must actually link somewhere", () => {
  assert.throws(
    () => parseRegistry(registry(project({ deploy: { mode: "external" } }))),
    /at least one link/,
  );
  assert.ok(
    parseRegistry(
      registry(
        project({ deploy: { mode: "external" }, links: { itch: "https://example.itch.io/x" } }),
      ),
    ),
  );
});

test("a sub-path project is pinned to apps/<slug>", () => {
  const deploy = {
    mode: "subpath",
    path: "apps/other",
    buildCommand: "npm run build",
    outDir: "out",
    basePathEnv: "NEXT_PUBLIC_BASE_PATH",
  };
  assert.throws(() => parseRegistry(registry(project({ deploy }))), /must be "apps\/thing"/);
  assert.ok(parseRegistry(registry(project({ deploy: { ...deploy, path: "apps/thing" } }))));
});

test("a sub-path outside apps/ is refused outright", () => {
  assert.throws(
    () =>
      parseRegistry(
        registry(
          project({
            deploy: { mode: "subpath", path: "elsewhere", buildCommand: "x", outDir: "out" },
          }),
        ),
      ),
    /apps\/<slug>/,
  );
});

test("the ai-assisted tag is derived from the share, in both directions", () => {
  const above = { ...project(), tags: ["app"], aiAssisted: { share: AI_ASSISTED_THRESHOLD } };
  assert.ok(effectiveTags(above).includes("ai-assisted"));

  // Curated by hand but below the threshold: the number wins, so the badge and
  // the rule stated on /tags can never disagree.
  const below = { ...project(), tags: ["app", "ai-assisted"], aiAssisted: { share: 0.2 } };
  assert.deepEqual(effectiveTags(below), ["app"]);

  const unset = { ...project(), tags: ["app"], aiAssisted: null };
  assert.deepEqual(effectiveTags(unset), ["app"]);
});

test("the shipped registry is valid", async () => {
  const { readRegistry } = await import("../lib/registry/load.ts");
  assert.ok(readRegistry().projects.length > 0);
});
