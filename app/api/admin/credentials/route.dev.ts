/**
 * `GET` — the same records `npm run creds` prints, for the release screen.
 *
 * Values never leave the machine: each record carries a source, a fingerprint
 * and a verdict. The panel uses them to disable a release button *with the
 * reason inline*, rather than letting the click fail four seconds later.
 */

import { failure, forbidden, json } from "@/lib/admin/dev-only.ts";
import { status as github } from "@/scripts/lib/credentials/github.mjs";
import { status as itch } from "@/scripts/lib/credentials/itch.mjs";
import { status as npm } from "@/scripts/lib/credentials/npm.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = forbidden();
  if (denied) return denied;
  try {
    return json({ credentials: await Promise.all([itch(), npm(), github()]) });
  } catch (error) {
    return failure(error, 500);
  }
}
