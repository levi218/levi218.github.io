/**
 * `POST` — run `build-site.mjs` and stream its output back as Server-Sent Events.
 *
 * The build is the same script `npm run build` runs; the panel is a viewer, not
 * a second implementation. Flags are reconstructed from a fixed set of booleans
 * and slugs checked against the registry, so nothing a client sends is ever
 * concatenated into an argument list.
 *
 * Every line goes out through `run()`'s redaction — a failing child can quote a
 * token in its error, and this stream ends up in a browser.
 */

import { failure, forbidden } from "@/lib/admin/dev-only.ts";
import { ROOT, readRegistry } from "@/lib/registry/load.ts";
import { run } from "@/scripts/lib/exec.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = forbidden();
  if (denied) return denied;

  let args: string[];
  try {
    args = argsFrom(await request.json().catch(() => ({})));
  } catch (error) {
    return failure(error, 400);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("start", { argv: ["build-site.mjs", ...args] });
      run("node", ["scripts/build-site.mjs", ...args], {
        cwd: ROOT,
        allowFailure: true,
        onLine: (line: string) => send("log", line),
      })
        .then((result: { code: number }) => send("done", { code: result.code }))
        .catch((error: Error) => send("error", { message: error.message }))
        .finally(() => controller.close());
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

/** Booleans become flags; slugs are accepted only if the registry knows them. */
function argsFrom(body: Record<string, unknown>): string[] {
  const args: string[] = [];
  for (const flag of ["dry-run", "force", "skip-apps", "allow-partial"] as const) {
    if (body[toCamel(flag)]) args.push(`--${flag}`);
  }
  if (Array.isArray(body.only) && body.only.length) {
    const known = new Set(readRegistry().projects.map((project) => project.slug));
    const unknown = body.only.filter((slug) => !known.has(String(slug)));
    if (unknown.length) throw new Error(`unknown slug(s): ${unknown.join(", ")}`);
    args.push("--only", body.only.join(","));
  }
  return args;
}

function toCamel(flag: string): string {
  return flag.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
}
