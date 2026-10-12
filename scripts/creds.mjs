#!/usr/bin/env node
/**
 * `npm run creds` — what is set, where it came from, and whether it works.
 *
 * This lives outside `lib/credentials.mjs` on purpose: the adapters import that
 * module, so a CLI inside it would be an ESM cycle around a top-level await.
 *
 * Values are never printed. A token is identified by a fingerprint, which is
 * enough to tell two apart and useless to anyone who reads it over your
 * shoulder. Exits non-zero when a configured credential is actively rejected,
 * so it can gate a release script.
 */

import { redact } from "./lib/credentials.mjs";
import { status as itch } from "./lib/credentials/itch.mjs";
import { status as npm } from "./lib/credentials/npm.mjs";
import { status as github } from "./lib/credentials/github.mjs";

const VERDICT = {
  true: { text: "ok", note: "" },
  false: { text: "FAIL", note: "" },
  null: { text: "?", note: "" },
};

const rows = await Promise.all([itch(), npm(), github()]);

console.log("\n  Release credentials — .env.local\n");
for (const row of rows) {
  const verdict = row.present ? VERDICT[String(row.valid)].text : "—";
  console.log(`  ${row.label.padEnd(9)}${verdict.padEnd(6)}source=${row.source}`);
  if (row.identity) console.log(`             as ${row.identity}`);
  if (row.fingerprint) console.log(`             token ${row.fingerprint}`);
  if (row.detail) {
    for (const line of redact(row.detail).split("\n")) console.log(`             ${line}`);
  }
}
console.log("\n  source=env → .env.local   source=native → the tool's own store");
console.log("  Copy .env.example to .env.local to fill any of these in.\n");

process.exitCode = rows.some((row) => row.present && row.valid === false) ? 1 : 0;
