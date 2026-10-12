/**
 * The single home for release credentials.
 *
 * Every secret this repo touches lives in `.env.local` at the repo root, and
 * every consumer — the release scripts and the dev-only admin routes — reads it
 * through here. Each credential falls back to its tool's own store when the
 * variable is unset, so a half-filled `.env.local` degrades instead of breaking.
 *
 * `next dev` loads `.env.local` into the app process by itself, so the admin
 * route handlers get these for free; only the standalone `scripts/*.mjs` need
 * the explicit `loadEnv()` call, which is why it is idempotent.
 *
 * Two rules hold everywhere downstream:
 *   - a secret reaches a child process through its `env`, never through argv,
 *     because argv is readable by any process on the machine via `ps`;
 *   - anything on its way to a log or an HTTP response goes through `redact()`.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repo root — this file is `<root>/scripts/lib/credentials.mjs`. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * The closed set of secrets. `service` ties a variable to the adapter that
 * knows how to use and verify it; `native` describes the fallback in words,
 * because that string is what the admin panel shows when a variable is unset.
 */
export const SECRETS = {
  ITCH_API_KEY: {
    service: "itch",
    label: "itch.io",
    native: "butler's own `butler login` store",
    help: "https://itch.io/user/settings/api-keys",
  },
  NPM_TOKEN: {
    service: "npm",
    label: "npm",
    native: "~/.npmrc",
    help: "https://www.npmjs.com/settings/~/tokens",
  },
  GITHUB_TOKEN: {
    service: "github",
    label: "GitHub",
    native: "git's credential helper (macOS keychain)",
    help: "https://github.com/settings/tokens",
  },
};

/** Values shorter than this are not worth scanning for — too many false hits. */
const MIN_SCANNABLE = 8;

let loaded = false;

/**
 * Load `.env.local` into `process.env`. Node 24 does this natively, so there is
 * no `dotenv` dependency. A missing file is a normal state, not an error.
 */
export function loadEnv({ force = false } = {}) {
  if (loaded && !force) return;
  for (const file of [".env.local", ".env"]) {
    const full = path.join(ROOT, file);
    if (!existsSync(full)) continue;
    try {
      process.loadEnvFile(full);
    } catch (error) {
      throw new Error(`Could not parse ${file}: ${error.message}`);
    }
  }
  loaded = true;
  assertNoPublicSecrets();
}

/**
 * Fail loudly if a secret has been given a `NEXT_PUBLIC_` name, in the table
 * above or in the environment. Next inlines every `NEXT_PUBLIC_*` variable into
 * the client bundle, so that one typo is the shortest path from "secret in a
 * local file" to "secret on a public website".
 */
export function assertNoPublicSecrets() {
  const bad = [];

  for (const name of Object.keys(SECRETS)) {
    if (name.startsWith("NEXT_PUBLIC_")) bad.push(`${name} is declared as a secret`);
  }

  const secretValues = new Set(
    Object.keys(SECRETS)
      .map((name) => process.env[name])
      .filter((value) => value && value.length >= MIN_SCANNABLE),
  );
  for (const [name, value] of Object.entries(process.env)) {
    if (!name.startsWith("NEXT_PUBLIC_")) continue;
    if (value && secretValues.has(value)) bad.push(`${name} holds a secret value`);
  }

  if (bad.length) {
    throw new Error(
      `NEXT_PUBLIC_* variables are compiled into the public site.\n  ${bad.join("\n  ")}\n` +
        "Rename it, or move the value into the SECRET block of .env.local.",
    );
  }
}

/** A stable, non-reversible handle for a token, so the UI can tell two apart. */
export function fingerprint(value) {
  if (!value) return null;
  return `${createHash("sha256").update(value).digest("hex").slice(0, 8)}…${value.slice(-4)}`;
}

/**
 * Look one credential up. `source` is "env" when `.env.local` supplied it and
 * "none" when nothing did — "native" is decided by the adapter, which is the
 * only thing that can tell whether the underlying tool is actually logged in.
 */
export function getCredential(name) {
  if (!SECRETS[name]) throw new Error(`Unknown credential: ${name}`);
  loadEnv();
  const value = process.env[name]?.trim() || null;
  return {
    name,
    ...SECRETS[name],
    value,
    source: value ? "env" : "none",
    fingerprint: fingerprint(value),
  };
}

/** Every secret value currently loaded and long enough to scan for. */
export function secretValues() {
  loadEnv();
  return Object.keys(SECRETS)
    .map((name) => process.env[name]?.trim())
    .filter((value) => value && value.length >= MIN_SCANNABLE);
}

/**
 * Replace every loaded secret in `text` with a mask. Longest first, so a token
 * that contains another is not left half-revealed.
 */
export function redact(text) {
  if (text == null) return text;
  let out = String(text);
  for (const value of secretValues().sort((a, b) => b.length - a.length)) {
    out = out.split(value).join("••••••");
  }
  return out;
}

/**
 * Hand a credential to a child process. `fn` receives the credential and must
 * return whatever it needs; the point of routing every use through here is that
 * "who reads this secret" is one grep away.
 */
export async function withCredential(name, fn) {
  return fn(getCredential(name));
}
