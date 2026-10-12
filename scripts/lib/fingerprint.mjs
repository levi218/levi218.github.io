/**
 * "Has this project changed since we last built it?"
 *
 * Content hashing a whole source tree is accurate and slow; `size + mtime` per
 * file is neither, but it is the same trade every bundler's watch mode makes and
 * it turns a repeat deploy from minutes into seconds. `--force` is the escape
 * hatch for the day it lies.
 *
 * ponytail: size+mtime fingerprint, switch to content hashing if a stale build
 * is ever shipped from a touched-but-unchanged tree.
 */

import { createHash } from "node:crypto";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

/** Never walked: build output, dependencies, and git's own storage. */
const SKIP = new Set(["node_modules", ".next", ".git", ".cache", ".turbo", "out", "dist", "build"]);

/**
 * Files a build writes into the source tree. Counting them means every build
 * changes the fingerprint, which means the cache never hits — the bug this
 * pattern exists to avoid.
 */
const IGNORE = /(\.tsbuildinfo|\.log|\.DS_Store)$/;

function walk(dir, base, hash) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  // Sorted, so the hash does not depend on the order the filesystem hands them back.
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, base, hash);
    } else if (entry.isFile()) {
      if (IGNORE.test(entry.name)) continue;
      const stats = statSync(full, { throwIfNoEntry: false });
      if (!stats) continue;
      hash.update(`${path.relative(base, full)}:${stats.size}:${Math.floor(stats.mtimeMs)}\n`);
    }
  }
}

/** A stable digest of a project's source tree. */
export function fingerprintSource(dir) {
  const hash = createHash("sha256");
  walk(dir, dir, hash);
  return hash.digest("hex").slice(0, 16);
}

/** Files and bytes under a directory — the numbers the build report shows. */
export function measure(dir) {
  let files = 0;
  let bytes = 0;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) {
        files += 1;
        bytes += statSync(full, { throwIfNoEntry: false })?.size ?? 0;
      }
    }
  }
  return { files, bytes };
}

export function humanBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}
