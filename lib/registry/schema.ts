/**
 * The registry schema — the one definition of what a project *is*.
 *
 * This module is imported by the Next app (TypeScript, bundled) and by the
 * build scripts (`.mjs`, through Node's native type stripping), so it must stay
 * plain ESM with explicit `.ts` extensions on relative imports and no
 * TypeScript-only runtime constructs (`enum`, `namespace`, decorators).
 */

import { z } from "zod";

/**
 * Slugs that would collide with a route this app owns. `_next` and `apps` are
 * output directories; the rest are pages.
 */
export const RESERVED_SLUGS = ["projects", "tags", "admin", "api", "apps", "_next"] as const;

/** A closed vocabulary. An open one becomes twelve spellings of "game". */
export const TAGS = ["app", "game", "library", "ai-assisted", "experiment", "archived"] as const;

/** At or above this share of AI-written code, the `ai-assisted` tag is derived. */
export const AI_ASSISTED_THRESHOLD = 0.6;

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be kebab-case: [a-z0-9] and single hyphens")
  .refine((slug) => !(RESERVED_SLUGS as readonly string[]).includes(slug), {
    message: "is a reserved route name",
  });

export const tagSchema = z.enum(TAGS);

const linksSchema = z
  .object({
    live: z.url().nullish(),
    source: z.url().nullish(),
    itch: z.url().nullish(),
    npm: z.url().nullish(),
  })
  .default({});

const deploySchema = z.discriminatedUnion("mode", [
  /**
   * Built here and copied into the published tree. `path` is where it lands and
   * is also the URL, so it is constrained to `apps/` — anything else could
   * shadow a route this app owns.
   */
  z.object({
    mode: z.literal("subpath"),
    path: z.string().regex(/^apps\/[a-z0-9]+(-[a-z0-9]+)*$/, 'must look like "apps/<slug>"'),
    buildCommand: z.string().min(1),
    outDir: z.string().min(1),
    /**
     * The variable the project reads its sub-path from. `null` means it does not
     * support one — the resolver then refuses to publish it, because assets
     * would resolve against the domain root and the page would load blank.
     */
    basePathEnv: z.string().nullish(),
    /** `{{siteUrl}}` / `{{basePath}}` are interpolated at build time. */
    env: z.record(z.string(), z.string()).default({}),
  }),
  /** Lives somewhere else — itch.io, npm. Nothing is built or copied. */
  z.object({ mode: z.literal("external") }),
  /** Listed only. */
  z.object({ mode: z.literal("none") }),
]);

const releaseSchema = z
  .object({
    itch: z
      .object({
        /** `<user>/<game>` as itch.io spells it. */
        target: z.string().regex(/^[^/\s]+\/[^/\s]+$/, "must be <user>/<game>"),
        /** A channel name containing "html" is what makes itch play it in-browser. */
        channel: z.string().min(1),
        /** Directory to push, relative to the project. */
        dir: z.string().min(1),
        buildCommand: z.string().nullish(),
      })
      .nullish(),
    npm: z
      .object({
        package: z.string().min(1),
        access: z.enum(["public", "restricted"]).default("public"),
      })
      .nullish(),
  })
  .default({});

export const projectSchema = z
  .object({
    slug: slugSchema,
    /** `draft` is the default everywhere: nothing is ever published by accident. */
    status: z.enum(["published", "hidden", "draft"]).default("draft"),
    order: z.number().int().default(100),
    title: z.string().min(1),
    blurb: z.string().min(1),
    tags: z.array(tagSchema).default([]),
    aiAssisted: z
      .object({ share: z.number().min(0).max(1), note: z.string().nullish() })
      .nullish(),
    source: z.object({
      /** Relative to this repo's root. Asserted to stay inside the parent folder. */
      dir: z.string().min(1),
      repo: z.url().nullish(),
      ref: z.string().default("main"),
    }),
    deploy: deploySchema,
    links: linksSchema,
    release: releaseSchema,
    cover: z.string().nullish(),
  })
  .superRefine((project, ctx) => {
    // An external project with no link is a card with nothing behind it.
    if (project.deploy.mode === "external" && !Object.values(project.links).some(Boolean)) {
      ctx.addIssue({
        code: "custom",
        path: ["links"],
        message: 'deploy.mode "external" needs at least one link',
      });
    }
    if (project.deploy.mode === "subpath" && project.deploy.path !== `apps/${project.slug}`) {
      ctx.addIssue({
        code: "custom",
        path: ["deploy", "path"],
        message: `must be "apps/${project.slug}" to match the slug`,
      });
    }
  });

export const registrySchema = z
  .object({
    version: z.literal(1),
    projects: z.array(projectSchema).default([]),
  })
  .superRefine((registry, ctx) => {
    const seen = new Set<string>();
    for (const [index, project] of registry.projects.entries()) {
      if (seen.has(project.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["projects", index, "slug"],
          message: `duplicate slug "${project.slug}"`,
        });
      }
      seen.add(project.slug);
    }
  });

export type Tag = z.infer<typeof tagSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Registry = z.infer<typeof registrySchema>;
export type Deploy = Project["deploy"];

/**
 * The tag list as it is *displayed*: whatever was curated, plus `ai-assisted`
 * derived from `aiAssisted.share`.
 *
 * Derived rather than stored so the badge and the rule stated on `/tags` can
 * never drift apart — the number is the truth, the tag is a view of it.
 */
export function effectiveTags(project: Project): Tag[] {
  const tags = new Set<Tag>(project.tags);
  if ((project.aiAssisted?.share ?? 0) >= AI_ASSISTED_THRESHOLD) tags.add("ai-assisted");
  else tags.delete("ai-assisted");
  return [...tags];
}

/** Parse and explain. `zod`'s own error is a tree; this is a list of lines. */
export function parseRegistry(data: unknown): Registry {
  const result = registrySchema.safeParse(data);
  if (result.success) return result.data;
  const lines = result.error.issues.map(
    (issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
  throw new Error(`content/registry.json is invalid:\n${lines.join("\n")}`);
}
