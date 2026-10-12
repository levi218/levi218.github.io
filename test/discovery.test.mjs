/**
 * Discovery inference and adoption.
 *
 * The fixtures under `test/fixtures/` are two ends of the range: one project
 * that can be hosted here and one that cannot, so the rule that decides which
 * is which is exercised rather than described.
 */

import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  findBasePathEnv,
  inferFramework,
  readmeSummary,
  scanProject,
} from "../lib/registry/discovery.ts";
import { adopt, repoUrl, suggestedTags, unadopted, uniqueSlug } from "../lib/registry/adopt.ts";
import { parseRegistry } from "../lib/registry/schema.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, "fixtures");
const ROOT = path.resolve(HERE, "..");

const empty = parseRegistry({ version: 1, projects: [] });

test("the framework is inferred from dependencies, not file layout", () => {
  assert.equal(inferFramework({ dependencies: { next: "16" } }), "next");
  assert.equal(inferFramework({ devDependencies: { vite: "5" } }), "vite");
  assert.equal(inferFramework({ dependencies: { astro: "4" } }), "astro");
  assert.equal(inferFramework({ dependencies: { lodash: "4" } }), "node");
  assert.equal(inferFramework({}), "unknown");
});

test("a README's heading and first paragraph become the default title and blurb", () => {
  const { title, blurb } = readmeSummary(
    "# Capable\n\n![badge](x.png)\n\nA **static** app.\n\nMore detail.\n",
  );
  assert.equal(title, "Capable");
  assert.equal(blurb, "A static app.", "markdown emphasis is not shown to visitors");
});

test("an empty README yields nothing rather than a guess", () => {
  assert.deepEqual(readmeSummary(""), { title: null, blurb: null });
});

test("the base-path variable is found in the project's own source", () => {
  assert.equal(findBasePathEnv(path.join(FIXTURES, "capable"), null), "NEXT_PUBLIC_BASE_PATH");
  assert.equal(findBasePathEnv(path.join(FIXTURES, "plain"), null), null);
});

test("a project's own homepage.json overrides what was inferred", () => {
  assert.equal(findBasePathEnv(path.join(FIXTURES, "plain"), { basePathEnv: "BASE" }), "BASE");
});

test("scanning records the two capabilities that decide hostability", () => {
  const capable = scanProject(path.join(FIXTURES, "capable"), ROOT);
  assert.equal(capable.framework, "next");
  assert.equal(capable.canStaticExport, true);
  assert.equal(capable.supportsBasePath, true);
  assert.equal(capable.version, "1.2.3");
  assert.equal(capable.readme.title, "Capable");
  assert.equal(capable.git.present, false);

  const plain = scanProject(path.join(FIXTURES, "plain"), ROOT);
  assert.equal(plain.canStaticExport, false);
  assert.equal(plain.supportsBasePath, false);
  assert.deepEqual(plain.hints.tags, ["library"]);
});

test("a folder with no package.json is not a project", () => {
  assert.equal(scanProject(FIXTURES, ROOT), null);
});

test("adoption produces a draft, hostable only when it really is", () => {
  const capable = adopt(scanProject(path.join(FIXTURES, "capable"), ROOT), empty);
  assert.equal(capable.status, "draft", "nothing is ever published by accident");
  assert.equal(capable.deploy.mode, "subpath");
  assert.equal(capable.deploy.path, "apps/capable");
  assert.equal(capable.deploy.basePathEnv, "NEXT_PUBLIC_BASE_PATH");
  assert.equal(capable.deploy.outDir, "out");
  assert.equal(capable.title, "Capable");

  const plain = adopt(scanProject(path.join(FIXTURES, "plain"), ROOT), empty);
  assert.equal(plain.deploy.mode, "none", "cannot be hosted, so it is not pretended otherwise");
  assert.deepEqual(plain.tags, ["library"]);
  assert.equal(plain.release.npm.package, "@example/plain");

  // And whatever adoption produces has to survive the schema.
  assert.ok(parseRegistry({ version: 1, projects: [capable, plain] }));
});

test("adoption never collides with an existing or reserved slug", () => {
  assert.equal(uniqueSlug("admin", empty), "admin-2");
  const taken = parseRegistry({
    version: 1,
    projects: [
      { slug: "capable", title: "x", blurb: "y", source: { dir: "../a" }, deploy: { mode: "none" } },
    ],
  });
  assert.equal(uniqueSlug("capable", taken), "capable-2");
  assert.equal(uniqueSlug("Some Thing!", empty), "some-thing");
});

test("a git remote becomes a browsable URL", () => {
  assert.equal(repoUrl("git@github.com:me/thing.git"), "https://github.com/me/thing");
  assert.equal(repoUrl("https://github.com/me/thing.git"), "https://github.com/me/thing");
  assert.equal(repoUrl(null), null);
});

test("already-adopted projects are matched by directory, not slug", () => {
  const found = [scanProject(path.join(FIXTURES, "capable"), ROOT)];
  const registry = parseRegistry({
    version: 1,
    projects: [
      {
        // Renamed on adoption — it must not resurface as new.
        slug: "renamed",
        title: "x",
        blurb: "y",
        source: { dir: found[0].dir },
        deploy: { mode: "none" },
      },
    ],
  });
  assert.deepEqual(unadopted(found, registry), []);
  assert.equal(unadopted(found, empty).length, 1);
});

test("tags come from the project's hints when it offers them", () => {
  const plain = scanProject(path.join(FIXTURES, "plain"), ROOT);
  assert.deepEqual(suggestedTags(plain), ["library"]);
});
