/**
 * Blog posts: one Markdown file per post in `content/posts/`, slug = filename.
 *
 *   ---
 *   title: Shipping a static site
 *   date: 2026-10-12
 *   series: Building this site     (optional — omitted means "Standalone")
 *   summary: One line for the list.  (optional)
 *   ---
 *   Body in Markdown.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "content", "posts");

export type Post = {
  slug: string;
  title: string;
  date: string;
  series: string | null;
  summary: string | null;
  body: string;
};

// ponytail: flat `key: value` frontmatter only, swap for a YAML parser if posts need lists/nesting.
function parse(slug: string, source: string): Post {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`content/posts/${slug}.md: missing frontmatter`);
  const meta = Object.fromEntries(
    match[1].split(/\r?\n/).flatMap((line) => {
      const at = line.indexOf(":");
      return at > 0 ? [[line.slice(0, at).trim(), line.slice(at + 1).trim()]] : [];
    }),
  );
  if (!meta.title || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date ?? "")) {
    throw new Error(`content/posts/${slug}.md: needs \`title\` and \`date: YYYY-MM-DD\``);
  }
  return {
    slug,
    title: meta.title,
    date: meta.date,
    series: meta.series || null,
    summary: meta.summary || null,
    body: match[2],
  };
}

/** Newest first. */
export function readPosts(): Post[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => parse(file.slice(0, -3), readFileSync(path.join(DIR, file), "utf8")))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Posts grouped by series, the series with the newest post first. Inside a
 * series posts read oldest-first, the order they are meant to be read in;
 * standalone posts (`series: null`) stay newest-first.
 */
export function bySeries(posts: Post[]): { series: string | null; posts: Post[] }[] {
  const groups = new Map<string | null, Post[]>();
  for (const post of posts) groups.set(post.series, [...(groups.get(post.series) ?? []), post]);
  return [...groups].map(([series, list]) => ({ series, posts: series ? list.reverse() : list }));
}
