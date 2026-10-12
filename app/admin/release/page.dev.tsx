"use client";

/**
 * Releases — itch.io and npm, side by side with the local version.
 *
 * Both actions are irreversible in practice (itch serves a new build at once;
 * npm forbids unpublishing after 72 hours), so both are behind a confirmation
 * string that the server re-derives and compares. A stale tab cannot publish a
 * version nobody looked at.
 *
 * The credential strip disables a button *with its reason inline* rather than
 * letting the click fail four seconds later.
 */

import { useCallback, useEffect, useState } from "react";

import { Button, Log, Problem, Shell, inputClass } from "@/components/admin/Shell";
import {
  credentials,
  getState,
  release,
  releaseStatus,
  type AdminState,
  type CredentialRecord,
} from "@/components/admin/api";

type Status = Record<string, unknown> | null;

export default function Release() {
  const [state, setState] = useState<AdminState | null>(null);
  const [creds, setCreds] = useState<CredentialRecord[]>([]);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    try {
      const [next, cred] = await Promise.all([getState(), credentials()]);
      setState(next);
      setCreds(cred.credentials);
    } catch (cause) {
      setError(cause);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const projects = (state?.registry.projects ?? []).filter(
    (project) => project.release.itch || project.release.npm,
  );

  return (
    <Shell
      title="Release"
      intro="Pushing to itch.io and publishing to npm, from the versions on this machine."
      actions={<Button onClick={load}>Refresh</Button>}
    >
      <Problem error={error} />

      <section className="flex flex-wrap gap-3">
        {creds.map((cred) => (
          <div key={cred.service} className="rounded border border-line bg-surface px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <strong className="font-medium">{cred.label}</strong>
              <span className={cred.valid === false ? "text-accent" : "text-muted"}>
                {cred.present ? (cred.valid === false ? "rejected" : cred.valid ? "ok" : "unverified") : "not set"}
              </span>
            </div>
            <div className="mt-1 text-muted">
              source={cred.source}
              {cred.identity ? ` · as ${cred.identity}` : ""}
              {cred.fingerprint ? ` · ${cred.fingerprint}` : ""}
            </div>
            {cred.detail ? <div className="mt-1 max-w-64 text-muted">{cred.detail}</div> : null}
          </div>
        ))}
      </section>

      {projects.length === 0 ? (
        <p className="text-sm text-muted">
          No project has a <code>release</code> block yet. Add one in{" "}
          <code>content/registry.json</code>.
        </p>
      ) : null}

      {projects.map((project) => (
        <section key={project.slug} className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">
            {project.title} <code className="text-xs text-muted">{project.slug}</code>
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {project.release.itch ? (
              <ReleaseCard
                kind="itch"
                slug={project.slug}
                credential={creds.find((cred) => cred.service === "itch")}
              />
            ) : null}
            {project.release.npm ? (
              <ReleaseCard
                kind="npm"
                slug={project.slug}
                credential={creds.find((cred) => cred.service === "npm")}
              />
            ) : null}
          </div>
        </section>
      ))}
    </Shell>
  );
}

function ReleaseCard({
  kind,
  slug,
  credential,
}: {
  kind: "itch" | "npm";
  slug: string;
  credential: CredentialRecord | undefined;
}) {
  const [status, setStatus] = useState<Status>(null);
  const [error, setError] = useState<unknown>(null);
  const [confirm, setConfirm] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await releaseStatus(kind, slug));
      setError(null);
    } catch (cause) {
      setError(cause);
    }
  }, [kind, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const expected = (status?.confirmation as string) ?? "";
  const blocked =
    credential?.valid === false
      ? (credential.detail ?? `${credential.label} is not authenticated`)
      : kind === "itch" && status?.installed === false
        ? "butler is not installed"
        : kind === "npm" && status?.alreadyPublished
          ? `${status.localVersion} is already published — bump the version first`
          : null;

  const publish = async () => {
    setBusy(true);
    try {
      const result = await release(kind, slug, { confirm });
      setStatus(result.status);
      setLog(result.log);
      setConfirm("");
      setError(null);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 text-xs">
      <div className="flex items-center gap-2">
        <strong className="text-sm font-medium">{kind === "itch" ? "itch.io" : "npm"}</strong>
        {status?.editUrl ? (
          <a
            className="text-muted underline hover:text-accent"
            href={status.editUrl as string}
            target="_blank"
            rel="noreferrer"
          >
            edit the game page
          </a>
        ) : null}
      </div>

      <Problem error={error} />

      {status ? (
        <dl className="flex flex-col gap-1 text-muted">
          <Row term="local" value={String(status.localVersion ?? "—")} />
          {kind === "itch" ? (
            <>
              <Row term="channel" value={`${status.target}:${status.channel}`} />
              <Row
                term="in browser"
                value={status.playableInBrowser ? "yes (channel name contains “html”)" : "no"}
              />
            </>
          ) : (
            <>
              <Row term="package" value={String(status.package)} />
              <Row
                term="published"
                value={
                  (status.publishedVersions as string[])?.length
                    ? (status.publishedVersions as string[]).slice(-5).join(", ")
                    : "never"
                }
              />
            </>
          )}
        </dl>
      ) : (
        <p className="text-muted">Loading…</p>
      )}

      {typeof status?.remote === "string" && status.remote ? (
        <Log lines={(status.remote as string).split("\n")} />
      ) : null}
      {status?.detail ? <p className="text-muted">{status.detail as string}</p> : null}

      {kind === "npm" && status?.pack ? (
        <details>
          <summary className="cursor-pointer text-muted">
            {(status.pack as { entries: string[] }).entries.length} files would be published
          </summary>
          <Log lines={(status.pack as { entries: string[] }).entries} />
        </details>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-line pt-3">
        {blocked ? (
          <p className="text-muted">Cannot publish: {blocked}</p>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-muted">
              Type <code className="text-foreground">{expected}</code> to confirm
              <input
                className={inputClass}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder={expected}
              />
            </label>
            <Button
              tone="danger"
              disabled={busy || !expected || confirm !== expected}
              onClick={publish}
            >
              {busy ? "Publishing…" : kind === "itch" ? "Build and push to itch.io" : "Publish to npm"}
            </Button>
          </>
        )}
        {kind === "npm" ? (
          <p className="text-muted">
            There is no unpublish: npm forbids it after 72 hours. Use{" "}
            <code>npm run release:npm deprecate</code> instead.
          </p>
        ) : null}
      </div>

      <Log lines={log} />
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-20">{term}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
