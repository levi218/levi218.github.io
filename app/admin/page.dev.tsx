"use client";

/**
 * The dashboard — one row per project, and the one column that matters:
 * "In next build", with the reason when the answer is no.
 *
 * The verdicts come from the server's resolver, not from anything recomputed
 * here, so what this screen promises and what `npm run build` does are the same
 * function. They go stale the moment you edit, and the row says so until saved.
 */

import { useCallback, useEffect, useState } from "react";

import { Button, Field, Log, Problem, Shell, inputClass } from "@/components/admin/Shell";
import { getState, putRegistry, type AdminState } from "@/components/admin/api";
import { AI_ASSISTED_THRESHOLD, TAGS, type Project, type Registry } from "@/lib/registry/schema.ts";

/** `ai-assisted` is derived from the share, so it is not a checkbox. */
const EDITABLE_TAGS = TAGS.filter((tag) => tag !== "ai-assisted");

export default function Dashboard() {
  const [state, setState] = useState<AdminState | null>(null);
  const [draft, setDraft] = useState<Registry | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await getState();
      setState(next);
      setDraft(next.registry);
      setError(null);
    } catch (cause) {
      setError(cause);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error && !state) return <Shell title="Projects"><Problem error={error} /></Shell>;
  if (!state || !draft) return <Shell title="Projects"><p className="text-sm text-muted">Loading…</p></Shell>;

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.registry);
  const verdict = (slug: string) => state.verdicts.find((entry) => entry.slug === slug);

  const update = (slug: string, patch: (project: Project) => Project) =>
    setDraft({
      ...draft,
      projects: draft.projects.map((project) => (project.slug === slug ? patch(project) : project)),
    });

  /** Renumber in steps of ten, so there is always room to insert between two. */
  const move = (slug: string, direction: -1 | 1) => {
    const ordered = [...draft.projects].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((project) => project.slug === slug);
    const swap = index + direction;
    if (swap < 0 || swap >= ordered.length) return;
    [ordered[index], ordered[swap]] = [ordered[swap], ordered[index]];
    const renumbered = ordered.map((project, position) => ({ ...project, order: (position + 1) * 10 }));
    setDraft({ ...draft, projects: renumbered });
  };

  const save = async () => {
    setSaving(true);
    try {
      const next = await putRegistry(draft);
      setState(next);
      setDraft(next.registry);
      setError(null);
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell
      title="Projects"
      intro={`${state.siteUrl}${state.basePath} — ${state.registry.projects.length} project(s). Nothing is published until its status says so.`}
      actions={
        <>
          <Button onClick={() => setDraft(state.registry)} disabled={!dirty || saving}>
            Revert
          </Button>
          <Button tone="primary" onClick={save} disabled={!dirty || saving}>
            {saving ? "Saving…" : dirty ? "Save registry" : "Saved"}
          </Button>
        </>
      }
    >
      <Problem error={error} />
      {state.problems.length ? (
        <Log lines={["The next build would abort:", ...state.problems.map((line) => `  ✗ ${line}`)]} />
      ) : null}

      <ul className="flex flex-col gap-4">
        {[...draft.projects]
          .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
          .map((project) => {
            const decided = verdict(project.slug);
            const share = project.aiAssisted?.share ?? 0;
            return (
              <li key={project.slug} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <code className="rounded bg-surface-soft px-1.5 py-0.5 text-xs">{project.slug}</code>
                    <span className="grow" />
                    <div className="flex gap-1">
                      <Button onClick={() => move(project.slug, -1)} aria-label={`Move ${project.title} up`}>
                        ↑
                      </Button>
                      <Button onClick={() => move(project.slug, 1)} aria-label={`Move ${project.title} down`}>
                        ↓
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
                    <Field label="Title">
                      <input
                        className={inputClass}
                        value={project.title}
                        onChange={(event) =>
                          update(project.slug, (entry) => ({ ...entry, title: event.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Status">
                      <select
                        className={inputClass}
                        value={project.status}
                        onChange={(event) =>
                          update(project.slug, (entry) => ({
                            ...entry,
                            status: event.target.value as Project["status"],
                          }))
                        }
                      >
                        <option value="published">published</option>
                        <option value="hidden">hidden</option>
                        <option value="draft">draft</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Blurb">
                    <textarea
                      className={`${inputClass} min-h-16`}
                      value={project.blurb}
                      onChange={(event) =>
                        update(project.slug, (entry) => ({ ...entry, blurb: event.target.value }))
                      }
                    />
                  </Field>

                  <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {EDITABLE_TAGS.map((tag) => {
                        const on = project.tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              update(project.slug, (entry) => ({
                                ...entry,
                                tags: on
                                  ? entry.tags.filter((value) => value !== tag)
                                  : [...entry.tags, tag],
                              }))
                            }
                            className={`rounded-full border px-2 py-0.5 ${
                              on ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    <Field label={`AI share (badge at ≥ ${AI_ASSISTED_THRESHOLD})`}>
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        className={`${inputClass} w-24`}
                        value={share}
                        onChange={(event) =>
                          update(project.slug, (entry) => ({
                            ...entry,
                            aiAssisted: {
                              share: Number(event.target.value),
                              note: entry.aiAssisted?.note ?? null,
                            },
                          }))
                        }
                      />
                    </Field>
                  </div>

                  <p className="text-xs">
                    <span className="text-muted">In next build: </span>
                    {decided?.built ? (
                      <span className="text-accent">yes</span>
                    ) : (
                      <span className="text-muted">
                        no — {decided?.fatal ?? decided?.reason ?? "unknown"}
                      </span>
                    )}
                    {dirty ? <span className="text-muted"> (from the last save)</span> : null}
                  </p>
                </div>
              </li>
            );
          })}
      </ul>
    </Shell>
  );
}
