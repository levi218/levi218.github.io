#!/usr/bin/env node
/**
 * `npm run discover` — scan the sibling folders and refresh `.cache/discovery.json`.
 *
 * The scan lives in `lib/registry/discovery.ts` so the dev-only admin route and
 * the tests share exactly this behaviour; this file is the CLI around it.
 *
 * The cache is disposable and gitignored. Nothing here decides what ships — a
 * folder that turns up in discovery is `draft` until a person says otherwise.
 */

import path from "node:path";

import { refreshDiscovery } from "../lib/registry/discovery.ts";
import { DISCOVERY_FILE, ROOT, readRegistry, writeJsonCache } from "../lib/registry/load.ts";

const discovery = refreshDiscovery(ROOT);
writeJsonCache(DISCOVERY_FILE, discovery);

// Matched by directory, not by slug: `goo` is in the registry as `amalgam`, and
// a rename would otherwise resurface an adopted project as new.
const known = new Set(
  readRegistry().projects.map((project) => path.resolve(ROOT, project.source.dir)),
);
const isKnown = (project) => known.has(path.resolve(ROOT, project.dir));
const fresh = discovery.projects.filter((project) => !isKnown(project));

console.log(`\n  Scanned ${discovery.parent} — ${discovery.projects.length} project(s)\n`);
for (const project of discovery.projects) {
  const flags = [
    project.framework,
    project.canStaticExport ? "static-export" : null,
    project.supportsBasePath ? `base-path:${project.basePathEnv}` : "no-base-path",
    project.git.present ? `git:${project.git.branch ?? "detached"}${project.git.dirty ? "*" : ""}` : "no-git",
    isKnown(project) ? null : "NEW",
  ].filter(Boolean);
  console.log(`  ${project.slug.padEnd(14)}${flags.join("  ")}`);
}
console.log(
  fresh.length
    ? `\n  ${fresh.length} not in the registry — adopt them at /admin/discover.\n`
    : "\n  Everything found is already in the registry.\n",
);
