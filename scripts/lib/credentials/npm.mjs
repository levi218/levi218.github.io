/**
 * npm.
 *
 * `~/.npmrc` is never read or written. When `NPM_TOKEN` is set the commands run
 * against a throwaway userconfig in the OS temp dir, mode 0600, removed in a
 * `finally` so a crash mid-publish cannot leave a token on disk. Unset, npm
 * reads `~/.npmrc` exactly as it always did.
 */

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getCredential } from "../credentials.mjs";
import { run } from "../exec.mjs";

export const SERVICE = "npm";
export const REGISTRY = "registry.npmjs.org";

/**
 * Run `fn` with an env that authenticates npm, cleaning up afterwards.
 * @param {(env: Record<string,string>) => Promise<T>} fn
 */
export async function withNpmAuth(fn) {
  const { value } = getCredential("NPM_TOKEN");
  if (!value) return fn({});

  const dir = await mkdtemp(path.join(os.tmpdir(), "homepage-npm-"));
  const file = path.join(dir, ".npmrc");
  try {
    await writeFile(file, `//${REGISTRY}/:_authToken=${value}\n`, { mode: 0o600 });
    return await fn({ npm_config_userconfig: file });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Run an npm command authenticated as above. */
export function npm(args, options = {}) {
  return withNpmAuth((env) => run("npm", args, { ...options, env: { ...env, ...options.env } }));
}

export async function status() {
  const credential = getCredential("NPM_TOKEN");
  const base = {
    service: SERVICE,
    label: credential.label,
    present: Boolean(credential.value),
    source: credential.source,
    fingerprint: credential.fingerprint,
    identity: null,
    valid: null,
    detail: null,
    checkedAt: new Date().toISOString(),
  };

  const result = await npm(["whoami", "--registry", `https://${REGISTRY}/`], { allowFailure: true });

  if (result.code === 0) {
    return {
      ...base,
      present: true,
      source: credential.value ? "env" : "native",
      valid: true,
      identity: result.stdout,
      detail: credential.value ? null : `using ${credential.native}`,
    };
  }

  const detail = credential.value
    ? "npm rejected NPM_TOKEN"
    : `no NPM_TOKEN and ${credential.native} is not authenticated`;
  // npm's stderr is several lines of log-file advice; the first line is the reason.
  const reason = result.stderr.split("\n").find((line) => line.includes("npm error"))?.trim();
  return { ...base, valid: false, detail: [detail, reason].filter(Boolean).join(" — ") };
}
