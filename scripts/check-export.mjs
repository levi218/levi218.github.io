#!/usr/bin/env node
/**
 * Post-build assertion: nothing private is in the thing we are about to publish.
 *
 * Two independent guards, because they fail in different ways:
 *
 *   - Route exclusion. Admin pages and handlers are named `*.dev.tsx` /
 *     `*.dev.ts` and are outside `pageExtensions` in a production build, so
 *     Next never compiles them. This checks the mechanism actually held.
 *
 *   - Secret scan. The router exclusion cannot catch a `process.env.NPM_TOKEN`
 *     written into a *client* component — Next would happily inline it. So
 *     every emitted file is searched for each loaded secret's literal value and
 *     for the variable names themselves.
 *
 * `deploy.mjs` runs this before it pushes anything. A failure here means do not
 * publish; it is not advisory.
 */

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { ROOT, SECRETS, loadEnv, secretValues } from "./lib/credentials.mjs";

const OUT = path.join(ROOT, process.argv[2] ?? "out");

/** Paths that must never exist in an export, and why. */
const FORBIDDEN = [
  ["admin", "the admin panel must not be published"],
  ["api", "route handlers must not be published"],
];

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile()) yield full;
  }
}

const failures = [];
const rel = (file) => path.relative(ROOT, file);

async function checkForbiddenPaths() {
  for (const [name, why] of FORBIDDEN) {
    const target = path.join(OUT, name);
    const found = await stat(target).then(() => true, () => false);
    if (found) failures.push(`${rel(target)} exists — ${why}`);
  }
}

async function checkSecrets() {
  loadEnv();

  // Values are matched as bytes so a token embedded in a sourcemap or a binary
  // asset is caught too. Names are matched only in text, where an inlined
  // `process.env.X` would land.
  const values = secretValues();
  const names = Object.keys(SECRETS);
  const TEXT = /\.(html?|css|m?js|json|map|txt|svg|xml|webmanifest)$/i;

  for await (const file of walk(OUT)) {
    if (path.basename(file).includes(".dev.")) {
      failures.push(`${rel(file)} — a dev-only file reached the export`);
    }

    const bytes = await readFile(file);
    for (const value of values) {
      if (bytes.includes(value)) failures.push(`${rel(file)} — contains a secret value`);
    }
    if (!TEXT.test(file)) continue;
    const text = bytes.toString("utf8");
    for (const name of names) {
      if (text.includes(name)) failures.push(`${rel(file)} — mentions ${name}`);
    }
  }
}

const exists = await stat(OUT).then(() => true, () => false);
if (!exists) {
  console.error(`check-export: ${rel(OUT)} does not exist — build first.`);
  process.exit(1);
}

await checkForbiddenPaths();
await checkSecrets();

if (failures.length) {
  console.error(`\ncheck-export: ${failures.length} problem(s) in ${rel(OUT)}\n`);
  for (const failure of new Set(failures)) console.error(`  ✗ ${failure}`);
  console.error("\nRefusing to publish.\n");
  process.exit(1);
}

console.log(`check-export: ${rel(OUT)} is clean.`);
