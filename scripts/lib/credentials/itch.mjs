/**
 * itch.io — butler.
 *
 * itch.io has no public write API for uploads; butler is the supported tool.
 * `ITCH_API_KEY` is handed to it as `BUTLER_API_KEY`, which is the variable
 * butler itself documents for unattended use. Unset, butler falls back to the
 * credentials `butler login` stored, and we report that rather than failing.
 */

import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { getCredential } from "../credentials.mjs";
import { run, which } from "../exec.mjs";

export const SERVICE = "itch";

/** Where `butler login` keeps its credentials, per platform. */
function nativeCredsPath() {
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "itch", "butler_creds");
  }
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? "", "itch", "butler_creds");
  }
  return path.join(os.homedir(), ".config", "itch", "butler_creds");
}

/**
 * The environment butler should run under. Empty when no key is configured, so
 * butler consults its own store — that is the fallback, expressed as data.
 */
export function butlerEnv() {
  const { value } = getCredential("ITCH_API_KEY");
  return value ? { BUTLER_API_KEY: value } : {};
}

/** Run butler with the credential injected. Never puts the key in argv. */
export function butler(args, options = {}) {
  return run("butler", args, { ...options, env: { ...butlerEnv(), ...options.env } });
}

/**
 * Verify the key against the API rather than against butler, so the check is
 * cheap and yields the account name. `/me` is the identity endpoint; older keys
 * answer only `/my-games`, which still proves the key is live.
 */
async function verify(key) {
  for (const [endpoint, pick] of [
    ["me", (body) => body?.user?.username],
    ["my-games", (body) => body?.games?.[0]?.user?.username],
  ]) {
    let response;
    try {
      response = await fetch(`https://itch.io/api/1/${key}/${endpoint}`);
    } catch (error) {
      return { valid: null, detail: `could not reach itch.io: ${error.message}` };
    }
    if (response.status === 404) continue;
    if (!response.ok) return { valid: false, detail: `itch.io returned ${response.status}` };

    const body = await response.json().catch(() => null);
    if (body?.errors?.length) return { valid: false, detail: body.errors.join("; ") };
    return { valid: true, identity: pick(body) ?? null };
  }
  return { valid: false, detail: "itch.io rejected the key" };
}

export async function status() {
  const credential = getCredential("ITCH_API_KEY");
  const installed = await which("butler");
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
    const result = { ...base, ...(await verify(credential.value)) };
    if (!installed) {
      result.detail = [result.detail, "butler is not installed — `brew install butler`"]
        .filter(Boolean)
        .join("; ");
    }
    return result;
  }

  if (!installed) {
    return { ...base, valid: false, detail: "no ITCH_API_KEY and butler is not installed" };
  }
  if (existsSync(nativeCredsPath())) {
    // butler's own store has no non-interactive "am I logged in" check that
    // does not need a game target, so validity here is genuinely unknown.
    return { ...base, present: true, source: "native", detail: `using ${credential.native}` };
  }
  return { ...base, valid: false, detail: "no ITCH_API_KEY and butler is not logged in" };
}
