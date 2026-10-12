/**
 * Turning a registry entry into what a card shows.
 *
 * Server-side: the public pages render from this, so the browser is handed
 * finished links and nothing has to know about `deploy.mode`.
 */

import type { CardAction, CardData } from "@/components/ProjectList";
import type { Project } from "@/lib/registry/schema.ts";
import { effectiveTags } from "@/lib/registry/schema.ts";
import { basePath } from "@/lib/site";

/**
 * Every action that actually exists for a project — no placeholder buttons.
 *
 * All of them are plain `<a>` links. A sub-path app is a separate HTML tree
 * outside this app's router, and an itch.io page is another site entirely (§4).
 */
export function actionsFor(project: Project): CardAction[] {
  const actions: CardAction[] = [];

  if (project.deploy.mode === "subpath") {
    actions.push({
      label: "Open",
      href: `${basePath}/${project.deploy.path}/`,
      icon: "external",
      external: true,
    });
  } else if (project.links.live) {
    actions.push({ label: "Open", href: project.links.live, icon: "external", external: true });
  }

  if (project.links.itch) {
    actions.push({ label: "Play on itch.io", href: project.links.itch, icon: "itch", external: true });
  }
  const source = project.links.source ?? project.source.repo;
  if (source) actions.push({ label: "Source", href: source, icon: "github", external: true });
  if (project.links.npm) {
    actions.push({ label: "npm", href: project.links.npm, icon: "npm", external: true });
  }

  return actions;
}

export function toCard(project: Project): CardData {
  return {
    slug: project.slug,
    title: project.title,
    blurb: project.blurb,
    tags: effectiveTags(project),
    actions: actionsFor(project),
    cover: project.cover ?? null,
  };
}
