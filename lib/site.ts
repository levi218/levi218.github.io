/**
 * Everything the site says about itself, plus URL helpers.
 *
 * The two environment variables below are the only things that change between
 * a local build and the deployed one — see `.env.example` and §12 of the plan.
 * A user site (`<user>.github.io`) has an empty base path; a project site has
 * `/<repo>`. Nothing here is hardcoded, so the same tree works either way.
 */

import profileJson from "@/content/profile.json";

export type ProfileLink = {
  kind: string;
  label: string;
  url: string;
};

export type Profile = {
  name: string;
  shortName: string;
  tagline: string;
  email: string;
  location: string | null;
  /** Custom domain. When set, the build writes `out/CNAME` from it (§12.4). */
  domain: string | null;
  links: ProfileLink[];
};

export const profile: Profile = profileJson as Profile;

/** Origin *plus* any sub-path, e.g. `https://you.github.io`. */
const ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/**
 * The sub-path the site is served under, `""` at a domain root. Next rewrites
 * `<Link>` hrefs and bundled assets itself; this exists for the handful of
 * places that build a URL by hand — chiefly the links into the sub-apps, which
 * the router knows nothing about.
 */
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

/**
 * Absolute, canonical URL for a route.
 *
 * `trailingSlash: true` means `/projects` and `/projects/` are two spellings of
 * one page and only the slashed one is a real file in the export, so the slash
 * is added here rather than at every call site.
 */
export function canonical(path = "/"): string {
  const clean = `/${path}`.replace(/\/{2,}/g, "/");
  const slashed = clean.endsWith("/") ? clean : `${clean}/`;
  return `${ORIGIN}${slashed}`;
}

/**
 * Scheme and host only. This is what `metadataBase` wants: Next applies
 * `basePath` itself afterwards, so handing it the sub-path version would double
 * the sub-path in every social tag.
 */
export const origin = new URL(ORIGIN).origin;

/** Absolute URL for a file in `public/` — for things a *remote* machine fetches. */
export function asset(path: string): string {
  return `${ORIGIN}/${path.replace(/^\/+/, "")}`;
}

/**
 * Same-origin href for something outside this app's router — a sub-app under
 * `/apps/<slug>/`, a favicon. Must be used with a plain `<a>`: `next/link`
 * would prefetch and client-navigate into a separate HTML tree and 404 (§4).
 */
export function local(path: string): string {
  return `${basePath}/${path.replace(/^\/+/, "")}`;
}

export const site = {
  name: profile.name,
  url: ORIGIN,
  locale: "en_US",
  title: `${profile.name}`,
  description: profile.tagline,
} as const;

/**
 * A `mailto:` the naive address harvesters miss.
 *
 * Percent-encoding is the one obfuscation that costs nothing: browsers decode
 * it before dialling, so the link works with JavaScript off, while a scraper
 * grepping for `\w+@\w+` in the HTML finds nothing. It is a speed bump, not a
 * defence — the address is still in the page for anything that parses it.
 */
export function mailto(email: string): string {
  const encode = (text: string) =>
    [...text].map((char) => `%${char.codePointAt(0)!.toString(16).padStart(2, "0")}`).join("");
  return `mailto:${encode(email)}`;
}

/**
 * The address split for display, so the rendered text is not a harvestable
 * literal either. Rejoined visually by the markup, never by a string.
 */
export function emailParts(email: string): [local: string, domain: string] {
  const at = email.lastIndexOf("@");
  return [email.slice(0, at), email.slice(at + 1)];
}
