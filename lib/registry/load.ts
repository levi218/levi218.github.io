/**
 * Reading and writing the registry.
 *
 * Node-only, and deliberately filesystem-based rather than a JSON `import`:
 * the dev-only admin panel writes this file while the dev server is running,
 * and a bundled import would serve a stale copy until a restart.
 *
 * Paths are resolved against `process.cwd()`, which is the repo root for
 * `next build`, `next dev` and every `npm run` script. Nothing here ever
 * changes the working directory — child processes get an explicit `cwd`.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { Discovery } from "./discovery.ts";
import type { Registry } from "./schema.ts";
import { parseRegistry } from "./schema.ts";

export const ROOT = process.cwd();
export const REGISTRY_FILE = path.join(ROOT, "content", "registry.json");
export const DISCOVERY_FILE = path.join(ROOT, ".cache", "discovery.json");
export const LAST_BUILD_FILE = path.join(ROOT, ".build", "last-build.json");

export function readRegistry(): Registry {
  return parseRegistry(JSON.parse(readFileSync(REGISTRY_FILE, "utf8")));
}

/**
 * Validate, then write through a temporary file in the same directory.
 *
 * The order matters: a rejected payload must leave the file untouched, and
 * `rename` within a directory is atomic, so a crash mid-write cannot leave a
 * half-written registry behind. Two spaces and a trailing newline keep the diff
 * reviewable, which is the whole reason this file is git-tracked.
 */
export function writeRegistry(data: unknown): Registry {
  const registry = parseRegistry(data);
  const tmp = `${REGISTRY_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
  renameSync(tmp, REGISTRY_FILE);
  return registry;
}

/** The discovery cache, or `null` when `npm run discover` has never been run. */
export function readDiscovery(): Discovery | null {
  if (!existsSync(DISCOVERY_FILE)) return null;
  try {
    return JSON.parse(readFileSync(DISCOVERY_FILE, "utf8")) as Discovery;
  } catch {
    // A corrupt cache is a disposable cache. Rebuild it, do not fail.
    return null;
  }
}

export function writeJsonCache(file: string, data: unknown): void {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
