/**
 * `GET`  — everything the dashboard renders from: the registry, the discovery
 *          cache, the resolver's verdict for each project, and the last build.
 * `PUT`  — replace the registry. Validated *before* anything touches disk, so a
 *          rejected payload leaves `content/registry.json` exactly as it was.
 *
 * Dev-only: this file is `route.dev.ts` and is not compiled in a production
 * build. See `lib/admin/dev-only.ts`.
 */

import { readFileSync } from "node:fs";

import { failure, forbidden, json, siteEnv } from "@/lib/admin/dev-only.ts";
import {
  DISCOVERY_FILE,
  LAST_BUILD_FILE,
  ROOT,
  readDiscovery,
  readRegistry,
  writeRegistry,
} from "@/lib/registry/load.ts";
import { resolvePlan } from "@/lib/registry/resolve.ts";

export const dynamic = "force-dynamic";

function state() {
  const { siteUrl, basePath } = siteEnv();
  const registry = readRegistry();
  const plan = resolvePlan({ registry, root: ROOT, siteUrl, basePath });
  let lastBuild = null;
  try {
    lastBuild = JSON.parse(readFileSync(LAST_BUILD_FILE, "utf8"));
  } catch {
    // No build yet. The dashboard says so rather than showing zeroes.
  }
  return {
    siteUrl,
    basePath,
    registry,
    discovery: readDiscovery(),
    discoveryFile: DISCOVERY_FILE,
    verdicts: plan.verdicts,
    problems: plan.problems,
    apps: plan.apps.map(({ slug, url, argv, env, dir }) => ({ slug, url, argv, env, dir })),
    lastBuild,
  };
}

export async function GET() {
  const denied = forbidden();
  if (denied) return denied;
  try {
    return json(state());
  } catch (error) {
    return failure(error, 500);
  }
}

export async function PUT(request: Request) {
  const denied = forbidden();
  if (denied) return denied;
  try {
    writeRegistry(await request.json());
    return json(state());
  } catch (error) {
    // A zod failure is a 400: the payload is wrong, the server is fine.
    return failure(error, 400);
  }
}
