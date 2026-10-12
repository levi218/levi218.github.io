/**
 * GitHub — only used for the `gh-pages` push.
 *
 * When `GITHUB_TOKEN` is set the push runs under an inline credential helper.
 * The helper *script* appears in argv; the token itself is read from the child's
 * env, so it never shows up in `ps`. Unset, git uses the normal credential
 * helper (the macOS keychain), which is the better default on a personal
 * machine — the variable exists for when you would rather not depend on it.
 */

import { getCredential } from "../credentials.mjs";
import { run } from "../exec.mjs";

export const SERVICE = "github";

const HELPER =
  '!f() { echo username=x-access-token; echo "password=$GITHUB_TOKEN"; }; f';

/**
 * Extra `git` arguments and env for an authenticated push.
 * @returns {{args: string[], env: Record<string,string>}}
 */
export function gitAuth() {
  const { value } = getCredential("GITHUB_TOKEN");
  if (!value) return { args: [], env: {} };
  return { args: ["-c", `credential.helper=${HELPER}`], env: { GITHUB_TOKEN: value } };
}

/** Run a git command with push credentials attached when one is configured. */
export function git(args, options = {}) {
  const auth = gitAuth();
  return run("git", [...auth.args, ...args], {
    ...options,
    env: { ...auth.env, ...options.env },
  });
}

export async function status() {
  const credential = getCredential("GITHUB_TOKEN");
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

  if (credential.value) {
    let response;
    try {
      response = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${credential.value}`, "User-Agent": "home-page-admin" },
      });
    } catch (error) {
      return { ...base, detail: `could not reach api.github.com: ${error.message}` };
    }
    if (!response.ok) {
      return { ...base, valid: false, detail: `GitHub returned ${response.status}` };
    }
    const body = await response.json().catch(() => ({}));
    const scopes = response.headers.get("x-oauth-scopes");
    return {
      ...base,
      valid: true,
      identity: body.login ?? null,
      detail: scopes ? `scopes: ${scopes}` : null,
    };
  }

  const helper = await run("git", ["config", "--get", "credential.helper"], { allowFailure: true });
  if (helper.code === 0 && helper.stdout) {
    return { ...base, present: true, source: "native", detail: `using git credential.helper=${helper.stdout}` };
  }
  return { ...base, detail: "no GITHUB_TOKEN and no git credential helper — the push may prompt" };
}
