/**
 * `GET`  — the published versions and dist-tags next to the local one, plus the
 *          `npm pack --dry-run` file listing, so what is about to ship is
 *          visible before the click rather than after it.
 * `POST` — `publish` (guarded by a confirmation string) or `deprecate`.
 *
 * There is no unpublish: npm forbids it after 72 hours, so the panel offers the
 * takedown that actually works.
 */

import { failure, forbidden, json } from "@/lib/admin/dev-only.ts";
import { npmDeprecate, npmPublish, npmStatus } from "@/scripts/release-npm.mjs";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const denied = forbidden();
  if (denied) return denied;
  try {
    return json(await npmStatus((await params).slug));
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const denied = forbidden();
  if (denied) return denied;
  try {
    const { slug } = await params;
    const body = await request.json();
    const log: string[] = [];
    const onLine = (line: string) => log.push(line);
    const status =
      body.action === "deprecate"
        ? await npmDeprecate(slug, { message: body.message, range: body.range, onLine })
        : await npmPublish(slug, { confirm: body.confirm, onLine });
    return json({ status, log });
  } catch (error) {
    return failure(error);
  }
}
