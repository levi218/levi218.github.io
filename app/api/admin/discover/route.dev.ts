/**
 * `POST` — rescan the sibling folders and refresh the discovery cache.
 *
 * Exactly what `npm run discover` does, through the same function, so the panel
 * and the CLI can never disagree about what is out there.
 */

import { failure, forbidden, json } from "@/lib/admin/dev-only.ts";
import { refreshDiscovery } from "@/lib/registry/discovery.ts";
import { DISCOVERY_FILE, ROOT, writeJsonCache } from "@/lib/registry/load.ts";

export const dynamic = "force-dynamic";

export async function POST() {
  const denied = forbidden();
  if (denied) return denied;
  try {
    const discovery = refreshDiscovery(ROOT);
    writeJsonCache(DISCOVERY_FILE, discovery);
    return json(discovery);
  } catch (error) {
    return failure(error, 500);
  }
}
