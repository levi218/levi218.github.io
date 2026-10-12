/**
 * The shapes discovery produces — and nothing else.
 *
 * Split out from `discovery.ts` because the scanner needs `node:fs` and
 * `node:child_process`, and the admin panel's *client* components need these
 * types. A client bundle cannot contain a Node builtin, and an accidental
 * runtime import of the scanner is a build failure rather than a warning — so
 * the types live where anything may import them.
 */

import type { Tag } from "./schema.ts";

export type GitInfo = {
  present: boolean;
  branch: string | null;
  remote: string | null;
  /** `null` when unknown — reading the index needs git itself. */
  dirty: boolean | null;
};

export type DiscoveredProject = {
  /** Folder name, which is also the default slug. */
  slug: string;
  /** Path relative to this repo, as it would be written into the registry. */
  dir: string;
  name: string | null;
  version: string | null;
  description: string | null;
  scripts: Record<string, string>;
  framework: "next" | "vite" | "astro" | "node" | "unknown";
  /** `output: "export"` is present in the next config. */
  canStaticExport: boolean;
  /** The source mentions a base-path variable, or declares one in `homepage.json`. */
  supportsBasePath: boolean;
  /** The variable name to pass the sub-path in, when one was found. */
  basePathEnv: string | null;
  git: GitInfo;
  readme: { title: string | null; blurb: string | null };
  /** Optional project-authored hints; see `Hints`. */
  hints: Hints | null;
};

/**
 * `homepage.json` at a project's root: how a project tells this site about
 * itself. Every field is optional and every field loses to the registry.
 */
export type Hints = {
  title?: string;
  blurb?: string;
  tags?: Tag[];
  cover?: string;
  basePathEnv?: string;
  itch?: { target?: string; channel?: string; dir?: string };
  npm?: { package?: string; access?: "public" | "restricted" };
};

export type Discovery = {
  scannedAt: string;
  parent: string;
  projects: DiscoveredProject[];
};
