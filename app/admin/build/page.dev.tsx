"use client";

/**
 * Dry run first, then the real thing, then what the last one produced.
 *
 * The plan shown here *is* the plan the build follows — same resolver, same
 * process. The button spawns `build-site.mjs` and streams its output; there is
 * no second build implementation to drift.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Log, Problem, Shell } from "@/components/admin/Shell";
import { getState, streamBuild, type AdminState } from "@/components/admin/api";

export default function Build() {
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [force, setForce] = useState(false);
  const [skipApps, setSkipApps] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setState(await getState());
    } catch (cause) {
      setError(cause);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [lines]);

  const start = async (dryRun: boolean) => {
    setRunning(true);
    setLines([]);
    setError(null);
    try {
      await streamBuild(
        { dryRun, force, skipApps },
        {
          onLine: (line) => setLines((previous) => [...previous, line]),
          onDone: (code) =>
            setLines((previous) => [
              ...previous,
              code === 0 ? "✓ finished" : `✗ exited with code ${code}`,
            ]),
        },
      );
      await load();
    } catch (cause) {
      setError(cause);
    } finally {
      setRunning(false);
    }
  };

  const report = state?.lastBuild;

  return (
    <Shell
      title="Build"
      intro="Everything that will ship, and the command that will produce it. A failing sub-app fails the whole run — half-published is worse than not-published."
      actions={
        <>
          <Button onClick={() => start(true)} disabled={running}>
            Dry run
          </Button>
          <Button tone="primary" onClick={() => start(false)} disabled={running}>
            {running ? "Building…" : "Run build"}
          </Button>
        </>
      }
    >
      <Problem error={error} />

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
          <span>
            Force <span className="text-muted">— ignore the unchanged-source stamps</span>
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={skipApps} onChange={(e) => setSkipApps(e.target.checked)} />
          <span>
            Skip apps <span className="text-muted">— the home page only</span>
          </span>
        </label>
      </div>

      {state?.problems.length ? (
        <Log lines={["This build would abort:", ...state.problems.map((line) => `  ✗ ${line}`)]} />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Plan</h2>
        {state?.apps.length ? (
          <ul className="flex flex-col gap-3">
            {state.apps.map((app) => (
              <li key={app.slug} className="rounded border border-line bg-surface p-3 text-xs">
                <div className="flex flex-wrap items-baseline gap-2">
                  <strong className="text-sm font-medium">{app.slug}</strong>
                  <code className="text-muted">{app.url}</code>
                </div>
                <dl className="mt-2 flex flex-col gap-1 text-muted">
                  <div className="flex gap-2">
                    <dt className="min-w-20">command</dt>
                    <dd className="font-mono text-foreground">{app.argv.join(" ")}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="min-w-20">in</dt>
                    <dd className="font-mono">{app.dir}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="min-w-20">env</dt>
                    <dd className="font-mono">
                      {Object.entries(app.env).map(([key, value]) => (
                        <div key={key}>
                          {key}={value}
                        </div>
                      ))}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            No sub-apps in the next build — only the home page will be produced.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Output</h2>
        <Log lines={lines} />
        <div ref={bottom} />
        {lines.length === 0 ? <p className="text-sm text-muted">Nothing run yet.</p> : null}
      </section>

      {report ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">
            Last build — {new Date(report.finishedAt).toLocaleString()} ·{" "}
            {(report.durationMs / 1000).toFixed(1)}s · {report.ok ? "ok" : "failed"}
          </h2>
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 font-normal">app</th>
                <th className="py-1 font-normal">status</th>
                <th className="py-1 text-right font-normal">files</th>
                <th className="py-1 text-right font-normal">size</th>
                <th className="py-1 text-right font-normal">time</th>
                <th className="py-1 font-normal">rev</th>
              </tr>
            </thead>
            <tbody>
              {report.apps.map((app) => (
                <tr key={app.slug} className="border-t border-line">
                  <td className="py-1">{app.slug}</td>
                  <td className="py-1">{app.status === "failed" ? app.reason : app.status}</td>
                  <td className="py-1 text-right">{app.files}</td>
                  <td className="py-1 text-right">{(app.bytes / 1e6).toFixed(1)} MB</td>
                  <td className="py-1 text-right">{(app.durationMs / 1000).toFixed(1)}s</td>
                  <td className="py-1 font-mono">{app.rev ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </Shell>
  );
}
