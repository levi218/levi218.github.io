/**
 * The guard every admin route starts with.
 *
 * The real exclusion is the router one: these files are named `route.dev.ts`
 * and `pageExtensions` drops "dev.ts" from a production build, so none of this
 * is compiled into the export at all. This check is the second lock — it covers
 * an `ADMIN=1` build and it makes the intent unmissable at each entry point.
 */

export function forbidden(): Response | null {
  if (process.env.NODE_ENV !== "production") return null;
  return Response.json({ error: "The admin panel is dev-only." }, { status: 403 });
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

/** Turn a thrown error into a message a person can act on, never a stack. */
export function failure(error: unknown, status = 400): Response {
  const message = error instanceof Error ? error.message : String(error);
  return Response.json({ error: message }, { status });
}

/**
 * The site's own two variables, as the admin panel needs them.
 * `next dev` loads `.env.local` into this process, so nothing is read by hand.
 */
export function siteEnv() {
  return {
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
    basePath: (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, ""),
  };
}
