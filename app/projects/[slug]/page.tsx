import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icons";
import { actionsFor } from "@/lib/projects";
import { readRegistry } from "@/lib/registry/load.ts";
import { listedProjects } from "@/lib/registry/resolve.ts";
import { AI_ASSISTED_THRESHOLD, effectiveTags } from "@/lib/registry/schema.ts";
import { canonical } from "@/lib/site";

/** Only published projects get a page — a draft's detail URL must not exist. */
export function generateStaticParams() {
  return listedProjects(readRegistry()).map((project) => ({ slug: project.slug }));
}

function find(slug: string) {
  return listedProjects(readRegistry()).find((project) => project.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const project = find((await params).slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.blurb,
    alternates: { canonical: canonical(`/projects/${project.slug}`) },
    openGraph: { title: project.title, description: project.blurb },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = find((await params).slug);
  if (!project) notFound();

  const tags = effectiveTags(project);
  const actions = actionsFor(project);
  const share = project.aiAssisted?.share;

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/projects/" className="text-sm text-muted hover:text-accent">
          ← Projects
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
        <p className="max-w-prose text-lg text-muted">{project.blurb}</p>
      </div>

      {project.cover ? (
        <Image
          src={project.cover}
          alt=""
          width={1200}
          height={630}
          className="rounded-lg border border-line"
        />
      ) : null}

      {actions.length ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {actions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-1.5 hover:border-accent/40 hover:text-accent"
              rel="noreferrer"
            >
              <Icon name={action.icon} className="size-4" />
              {action.label}
            </a>
          ))}
        </div>
      ) : null}

      {tags.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/projects/?tag=${tag}`}
              className="rounded border border-line px-1.5 py-0.5 hover:border-accent/40"
            >
              {tag}
            </Link>
          ))}
        </div>
      ) : null}

      {share !== undefined && share >= AI_ASSISTED_THRESHOLD ? (
        <section className="rounded-lg border border-line bg-surface-soft p-5 text-sm">
          <h2 className="font-medium">
            <Link href="/tags/#ai-assisted" className="hover:text-accent">
              AI-assisted
            </Link>
          </h2>
          <p className="mt-2 text-muted">
            About {Math.round(share * 100)}% of the code was written by an AI assistant.
            {project.aiAssisted?.note ? ` ${project.aiAssisted.note}` : ""}
          </p>
        </section>
      ) : null}
    </article>
  );
}
