import type { NextConfig } from "next";

/**
 * The admin panel is dev-only, and this is the mechanism that keeps it that way.
 *
 * Admin pages and route handlers are named `page.dev.tsx` / `route.dev.ts`.
 * When "dev.tsx" is not in `pageExtensions`, Next does not see those files as
 * routes at all — nothing is compiled, nothing is exported, and no shell-exec
 * helper can reach GitHub Pages. It is also what keeps `output: "export"`
 * viable: a mutating POST handler cannot be statically exported.
 *
 * `ADMIN=1` opts a production build back in, for testing the panel against a
 * production bundle locally. `scripts/check-export.mjs` is the assertion that
 * the mechanism actually held.
 */
const devOnly = process.env.NODE_ENV !== "production" || process.env.ADMIN === "1";

/**
 * Sub-path the site is served under. Empty at a domain root (a user site,
 * `<user>.github.io`); `/<repo>` on a project site. Never hardcoded — the
 * deploy passes it in, so the same tree works either way.
 */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Not exported in dev: `next dev` has to serve the admin panel's mutating
  // route handlers, which a static export cannot represent.
  ...(devOnly ? {} : { output: "export" as const }),
  images: { unoptimized: true },
  trailingSlash: true,
  pageExtensions: devOnly ? ["dev.tsx", "dev.ts", "tsx", "ts"] : ["tsx", "ts"],
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
