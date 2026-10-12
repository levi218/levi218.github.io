"use client";

/**
 * What is in the parent folder, what this site already knows about, and what it
 * would take to publish each one.
 *
 * The scan is the same function `npm run discover` calls. Adopting appends a
 * pre-filled `draft` entry — never a published one.
 */

import { useCallback, useEffect, useState } from "react";

import { Button, Log, Problem, Shell } from "@/components/admin/Shell";
import { getState, putRegistry, rescan, type AdminState } from "@/components/admin/api";
import { adopt, unadopted } from "@/lib/registry/adopt.ts";
import type { DiscoveredProject } from "@/lib/registry/discovery-types.ts";

export default function Discover() {
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setState(await getState());
      setError(null);
    } catch (cause) {
      setError(cause);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scan = async () => {
    setBusy(true);
    try {
      await rescan();
      await load();
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };

  const adoptOne = async (found: DiscoveredProject) => {
    if (!state) return;
    setBusy(true);
    try {
      const registry = state.registry;
      setState(
        await putRegistry({ ...registry, projects: [...registry.projects, adopt(found, registry)] }),
      );
      setError(null);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };

  if (!state) {
    return (
      <Shell title="Discover">
        <Problem error={error} />
        {error ? null : <p className="text-sm text-muted">Loading…</p>}
      </Shell>
    );
  }

  const found = state.discovery?.projects ?? [];
  const fresh = new Set(unadopted(found, state.registry).map((project) => project.dir));

  return (
    <Shell
      title="Discover"
      intro={
        state.discovery
          ? `${state.discovery.parent} — scanned ${new Date(state.discovery.scannedAt).toLocaleString()}`
          : "Nothing scanned yet."
      }
      actions={
        <Button onClick={scan} disabled={busy}>
          {busy ? "Scanning…" : "Rescan"}
        </Button>
      }
    >
      <Problem error={error} />

      {found.length === 0 ? (
        <p className="text-sm text-muted">No sibling folders with a package.json. Try a rescan.</p>
      ) : null}

      <ul className="flex flex-col gap-4">
        {found.map((project) => {
          const isNew = fresh.has(project.dir);
          const blockers = [
            project.scripts.build ? null : "no build script",
            project.canStaticExport ? null : "no static export configured",
            project.supportsBasePath ? null : "does not read a base path from the environment",
            project.git.present ? null : "not a git repository",
          ].filter(Boolean);

          return (
            <li key={project.dir} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-medium">{project.readme.title ?? project.name ?? project.slug}</h2>
                  <code className="rounded bg-surface-soft px-1.5 py-0.5 text-xs">{project.dir}</code>
                  {isNew ? (
                    <span className="rounded-full border border-accent bg-accent-soft px-2 py-0.5 text-xs text-accent">
                      new
                    </span>
                  ) : (
                    <span className="text-xs text-muted">already in the registry</span>
                  )}
                  <span className="grow" />
                  {isNew ? (
                    <Button tone="primary" onClick={() => adoptOne(project)} disabled={busy}>
                      Adopt as draft
                    </Button>
                  ) : null}
                </div>

                {project.readme.blurb ?? project.description ? (
                  <p className="max-w-prose text-sm text-muted">
                    {project.readme.blurb ?? project.description}
                  </p>
                ) : null}

                <dl className="grid gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-2">
                  <Row term="Framework" value={project.framework} />
                  <Row term="Version" value={project.version ?? "—"} />
                  <Row
                    term="Git"
                    value={
                      project.git.present
                        ? `${project.git.branch ?? "detached"}${project.git.dirty ? " (dirty)" : ""}${
                            project.git.remote ? ` → ${project.git.remote}` : " — no remote"
                          }`
                        : "not a repository"
                    }
                  />
                  <Row term="Base path" value={project.basePathEnv ?? "not supported"} />
                </dl>

                {blockers.length ? (
                  <Log lines={["Cannot be hosted here until:", ...blockers.map((line) => `  · ${line}`)]} />
                ) : (
                  <p className="text-xs text-accent">Can be hosted under /apps/{project.slug}/.</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-24">{term}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}
