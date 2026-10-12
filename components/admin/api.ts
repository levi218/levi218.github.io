/**
 * The admin panel's one data path.
 *
 * Everything the panel knows comes from `/api/admin/*`, which reads the same
 * registry and calls the same resolver the build does. The panel never
 * re-derives "will this be built" for itself — that divergence is how a
 * dashboard starts lying.
 */

import type { Registry } from "@/lib/registry/schema.ts";
import type { Verdict } from "@/lib/registry/resolve.ts";
import type { Discovery } from "@/lib/registry/discovery-types.ts";

export type PlannedSummary = {
  slug: string;
  url: string;
  argv: string[];
  env: Record<string, string>;
  dir: string;
};

export type BuildReport = {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  shell: { durationMs: number };
  apps: {
    slug: string;
    status: string;
    url: string;
    rev: string | null;
    reason?: string;
    durationMs: number;
    files: number;
    bytes: number;
  }[];
};

export type AdminState = {
  siteUrl: string;
  basePath: string;
  registry: Registry;
  discovery: Discovery | null;
  discoveryFile: string;
  verdicts: Verdict[];
  problems: string[];
  apps: PlannedSummary[];
  lastBuild: BuildReport | null;
};

/**
 * Every URL here ends in a slash. `trailingSlash: true` makes the unslashed
 * form a 308 to the slashed one, and a redirected POST is one wasted round trip
 * per click at best.
 */
async function unwrap<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `${response.status} ${response.statusText}`);
  return body as T;
}

export const getState = () => fetch("/api/admin/registry/").then(unwrap<AdminState>);

export const putRegistry = (registry: Registry) =>
  fetch("/api/admin/registry/", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(registry),
  }).then(unwrap<AdminState>);

export const rescan = () =>
  fetch("/api/admin/discover/", { method: "POST" }).then(unwrap<Discovery>);

export const credentials = () =>
  fetch("/api/admin/credentials/").then(unwrap<{ credentials: CredentialRecord[] }>);

export type CredentialRecord = {
  service: "itch" | "npm" | "github";
  label: string;
  present: boolean;
  source: "env" | "native" | "none";
  fingerprint: string | null;
  identity: string | null;
  valid: boolean | null;
  detail: string | null;
};

export const releaseStatus = (kind: "itch" | "npm", slug: string) =>
  fetch(`/api/admin/${kind}/${slug}/`).then(unwrap<Record<string, unknown>>);

export const release = (kind: "itch" | "npm", slug: string, body: Record<string, unknown>) =>
  fetch(`/api/admin/${kind}/${slug}/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then(unwrap<{ status: Record<string, unknown>; log: string[] }>);

/**
 * Stream a build. Not `EventSource`, which can only issue a GET — the build
 * takes options, so it is a POST and the SSE frames are parsed by hand.
 */
export async function streamBuild(
  options: Record<string, unknown>,
  handlers: { onLine: (line: string) => void; onDone: (code: number) => void },
): Promise<void> {
  const response = await fetch("/api/admin/build/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok || !response.body) {
    throw new Error((await response.json().catch(() => ({}))).error ?? "the build could not start");
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    // SSE frames are separated by a blank line; a partial frame stays buffered.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const event = frame.match(/^event: (.+)$/m)?.[1];
      const data = frame.match(/^data: (.*)$/m)?.[1];
      if (!event || data === undefined) continue;
      const payload = JSON.parse(data);
      if (event === "log") handlers.onLine(payload);
      else if (event === "start") handlers.onLine(`$ node ${payload.argv.join(" ")}`);
      else if (event === "error") handlers.onLine(`✗ ${payload.message}`);
      else if (event === "done") handlers.onDone(payload.code);
    }
  }
}
