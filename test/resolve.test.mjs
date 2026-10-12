/**
 * The resolver — the one place that decides what ships.
 *
 * `exists` and `scriptsOf` are injected so these tests describe the rules
 * rather than the contents of the machine they run on.
 */

import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import { parseRegistry } from "../lib/registry/schema.ts";
import { interpolate, listedProjects, openUrl, resolvePlan, resolveSourceDir } from "../lib/registry/resolve.ts";

const ROOT = "/home/me/projects/home-page";

const subpath = (overrides = {}) => ({
  slug: "app",
  status: "published",
  order: 10,
  title: "App",
  blurb: "An app.",
  source: { dir: "../app" },
  deploy: {
    mode: "subpath",
    path: "apps/app",
    buildCommand: "npm run build",
    outDir: "out",
    basePathEnv: "NEXT_PUBLIC_BASE_PATH",
    env: { NEXT_PUBLIC_SITE_URL: "{{siteUrl}}/apps/app" },
  },
  ...overrides,
});

const plan = (projects, options = {}) =>
  resolvePlan({
    registry: parseRegistry({ version: 1, projects }),
    root: ROOT,
    siteUrl: "https://me.github.io",
    exists: () => true,
    scriptsOf: () => ({ build: "next build" }),
    ...options,
  });

test("a healthy published project is built, with a derived environment", () => {
  const result = plan([subpath()]);
  assert.equal(result.problems.length, 0);
  assert.equal(result.apps.length, 1);

  const [app] = result.apps;
  assert.deepEqual(app.argv, ["npm", "run", "build"]);
  assert.equal(app.dir, path.resolve(ROOT, "../app"));
  assert.equal(app.target, path.join(ROOT, "out", "apps/app"));
  assert.equal(app.url, "/apps/app/");
  assert.deepEqual(app.env, {
    NEXT_PUBLIC_BASE_PATH: "/apps/app",
    NEXT_PUBLIC_SITE_URL: "https://me.github.io/apps/app",
  });
});

test("a base path prefixes both the URL and the injected variable", () => {
  const [app] = plan([subpath()], { basePath: "/home-page" }).apps;
  assert.equal(app.url, "/home-page/apps/app/");
  assert.equal(app.env.NEXT_PUBLIC_BASE_PATH, "/home-page/apps/app");
});

test("a missing source directory is fatal only when the project is published", () => {
  const missing = plan([subpath()], { exists: () => false });
  assert.equal(missing.apps.length, 0);
  assert.match(missing.problems[0], /source directory .* is missing/);

  const draft = plan([subpath({ status: "draft" })], { exists: () => false });
  assert.deepEqual(draft.problems, []);
  assert.equal(draft.verdicts[0].fatal, null);
  assert.equal(draft.verdicts[0].reason, "draft");
});

test("a project that cannot read a base path is refused, not published broken", () => {
  const deploy = { ...subpath().deploy, basePathEnv: null };
  const result = plan([subpath({ deploy })]);
  assert.equal(result.apps.length, 0);
  assert.match(result.problems[0], /base path/);
});

test("a missing build script is caught before the build starts", () => {
  const result = plan([subpath()], { scriptsOf: () => ({}) });
  assert.match(result.problems[0], /no "build" script/);
});

test("hidden and external projects are skipped with a readable reason", () => {
  const hidden = plan([subpath({ status: "hidden" })]).verdicts[0];
  assert.equal(hidden.listed, false);
  assert.equal(hidden.reason, "hidden");

  const external = plan([
    {
      slug: "game",
      status: "published",
      title: "Game",
      blurb: "A game.",
      source: { dir: "../game" },
      deploy: { mode: "external" },
      links: { itch: "https://me.itch.io/game" },
    },
  ]).verdicts[0];
  assert.equal(external.listed, true, "still on the projects page");
  assert.equal(external.built, false);
  assert.equal(external.reason, "hosted externally");
});

test("--only and --skip-apps skip rather than fail", () => {
  const only = plan([subpath()], { only: ["other"] });
  assert.equal(only.apps.length, 0);
  assert.equal(only.problems.length, 0);
  assert.match(only.verdicts[0].reason, /--only/);

  const skipped = plan([subpath()], { skipApps: true });
  assert.equal(skipped.apps.length, 0);
  assert.match(skipped.verdicts[0].reason, /--skip-apps/);
});

test("source.dir may not escape the parent folder or point at this repo", () => {
  assert.equal(resolveSourceDir(ROOT, "../app").error, null);
  assert.match(resolveSourceDir(ROOT, "../../elsewhere").error, /escapes/);
  assert.match(resolveSourceDir(ROOT, "/etc").error, /escapes/);
  assert.match(resolveSourceDir(ROOT, ".").error, /this repo/);
});

test("placeholders are filled from the site, never typed by hand", () => {
  assert.equal(
    interpolate("{{siteUrl}}{{basePath}}/apps/{{slug}}", {
      siteUrl: "https://me.github.io",
      basePath: "/x",
      slug: "app",
    }),
    "https://me.github.io/x/apps/app",
  );
});

test("the public list is published-only, in registry order", () => {
  const registry = parseRegistry({
    version: 1,
    projects: [
      subpath({ slug: "b", order: 20, deploy: { mode: "none" } }),
      subpath({ slug: "a", order: 10, deploy: { mode: "none" } }),
      subpath({ slug: "c", order: 5, status: "draft", deploy: { mode: "none" } }),
    ],
  });
  assert.deepEqual(
    listedProjects(registry).map((project) => project.slug),
    ["a", "b"],
  );
});

test("openUrl points at the sub-app, or the best external link", () => {
  assert.equal(openUrl(parseRegistry({ version: 1, projects: [subpath()] }).projects[0]), "/apps/app/");
  const external = parseRegistry({
    version: 1,
    projects: [
      {
        slug: "game",
        title: "Game",
        blurb: "A game.",
        source: { dir: "../game" },
        deploy: { mode: "external" },
        links: { itch: "https://me.itch.io/game" },
      },
    ],
  }).projects[0];
  assert.equal(openUrl(external), "https://me.itch.io/game");
});
