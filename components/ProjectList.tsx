"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Icon } from "@/components/icons";

export type CardAction = {
  label: string;
  href: string;
  icon: string;
  /** A sub-app or another site: a plain `<a>`, never `next/link`. */
  external: boolean;
};

export type CardData = {
  slug: string;
  title: string;
  blurb: string;
  tags: string[];
  actions: CardAction[];
  /** A file under `public/covers/`, or `null` when the project has none. */
  cover: string | null;
};

const CHIP_LABELS: Record<string, string> = {
  app: "Apps",
  game: "Games",
  library: "Libraries",
  "ai-assisted": "AI-assisted",
  experiment: "Experiments",
  archived: "Archived",
};

/**
 * The project list, filtered by `?tag=`.
 *
 * Filtering is client-side over the full, statically-rendered list rather than
 * a route per tag: with JavaScript off the page still shows every project *and*
 * every chip, and with it on the filtered view has its own linkable URL.
 *
 * The query is read in an effect rather than through `useSearchParams`, which
 * in a statically exported page forces the whole subtree behind a Suspense
 * boundary and out of the pre-rendered HTML — exactly the JS-off rendering we
 * want to keep. Chips are plain `<a>`, so each filtered view is a real
 * navigation and back/forward need no state of our own.
 */
export function ProjectList({ projects }: { projects: CardData[] }) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    setActive(new URLSearchParams(window.location.search).get("tag"));
  }, []);
  const present = [...new Set(projects.flatMap((project) => project.tags))].filter(
    (tag) => tag in CHIP_LABELS,
  );
  const shown = active ? projects.filter((project) => project.tags.includes(active)) : projects;

  return (
    <>
      {present.length > 1 ? (
        <nav aria-label="Filter by tag" className="flex flex-wrap gap-2 text-sm">
          <Chip href="/projects/" label="All" active={!active} />
          {present.map((tag) => (
            <Chip
              key={tag}
              href={`/projects/?tag=${tag}`}
              label={CHIP_LABELS[tag]}
              active={active === tag}
            />
          ))}
        </nav>
      ) : null}

      <ul className="flex flex-col gap-4">
        {shown.map((project) => (
          <li
            key={project.slug}
            className="rounded-lg border border-line bg-surface p-5 transition-colors hover:border-accent/40"
          >
            <div className="flex flex-col gap-3">
              {project.cover ? (
                <Image
                  src={project.cover}
                  alt=""
                  width={1200}
                  height={630}
                  className="rounded border border-line"
                />
              ) : null}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-lg font-medium">
                  <Link href={`/projects/${project.slug}/`} className="hover:text-accent">
                    {project.title}
                  </Link>
                </h2>
                <span className="flex flex-wrap gap-2 text-xs text-muted">
                  {project.tags.map((tag) => (
                    <Tag key={tag} tag={tag} />
                  ))}
                </span>
              </div>

              <p className="max-w-prose text-sm text-muted">{project.blurb}</p>

              {project.actions.length ? (
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  {project.actions.map((action) => (
                    <a
                      key={action.label}
                      href={action.href}
                      className="inline-flex items-center gap-1.5 hover:text-accent"
                      {...(action.external ? { rel: "noreferrer" } : {})}
                    >
                      <Icon name={action.icon} className="size-4" />
                      {action.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {shown.length === 0 ? <p className="text-sm text-muted">Nothing tagged that, yet.</p> : null}
    </>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1 ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line text-muted hover:border-accent/40 hover:text-foreground"
      }`}
    >
      {label}
    </a>
  );
}

/** The AI-assisted badge links to the page that states the rule (§4). */
function Tag({ tag }: { tag: string }) {
  const label = CHIP_LABELS[tag] ?? tag;
  if (tag !== "ai-assisted") {
    return <span className="rounded border border-line px-1.5 py-0.5">{label}</span>;
  }
  return (
    <Link
      href="/tags/#ai-assisted"
      className="rounded border border-accent/40 bg-accent-soft px-1.5 py-0.5 text-accent"
    >
      {label}
    </Link>
  );
}
