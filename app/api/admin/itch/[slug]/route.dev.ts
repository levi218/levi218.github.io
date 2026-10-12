/**
 * `GET`  — butler's view of a game's channel, next to the local version.
 * `POST` — build and push. Irreversible: an itch.io channel serves the newest
 *          build immediately, so the body must echo back a confirmation string
 *          the server re-derives and compares.
 */

import { failure, forbidden, json } from "@/lib/admin/dev-only.ts";
import { itchPush, itchStatus } from "@/scripts/release-itch.mjs";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const denied = forbidden();
  if (denied) return denied;
  try {
    return json(await itchStatus((await params).slug));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const denied = forbidden();
  if (denied) return denied;
  try {
    const { confirm } = await request.json();
    const log: string[] = [];
    const status = await itchPush((await params).slug, {
      confirm,
      onLine: (line: string) => log.push(line),
    });
    return json({ status, log });
  } catch (error) {
    return failure(error);
  }
}
