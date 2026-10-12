/**
 * Child-process helper for anything that touches a credential.
 *
 * Secrets are passed through `env` and never through `args`, and everything
 * captured is redacted before it can reach a log line, an SSE frame or a thrown
 * error message.
 */

import { spawn } from "node:child_process";
import { redact } from "./credentials.mjs";

/**
 * Is a binary on PATH? Used to tell "not installed" apart from "not logged in".
 * Probes the binary directly rather than going through a shell, so nothing is
 * ever concatenated into a command line.
 */
export async function which(bin, versionFlag = "--version") {
  const { code } = await run(bin, [versionFlag], { allowFailure: true });
  return code !== 127;
}

/**
 * Run a command and capture its output.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {{cwd?: string, env?: Record<string,string>, allowFailure?: boolean,
 *          onLine?: (line: string) => void}} options
 *   `env` is merged over `process.env` and is the only channel for secrets. A
 *   key set to `undefined` is *removed* from the child's environment — that is
 *   how a sub-app build is denied this repo's secrets.
 *   `onLine` receives redacted lines as they arrive, for streaming callers.
 */
export function run(command, args = [], options = {}) {
  const { cwd, env, allowFailure = false, onLine } = options;

  return new Promise((resolve, reject) => {
    const merged = { ...process.env, ...env };
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined) delete merged[key];
    }

    const child = spawn(command, args, {
      cwd,
      env: merged,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const collect = (stream, onChunk) => {
      stream.setEncoding("utf8");
      let buffer = "";
      stream.on("data", (chunk) => {
        onChunk(chunk);
        if (!onLine) return;
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) onLine(redact(line));
      });
      stream.on("end", () => {
        if (onLine && buffer) onLine(redact(buffer));
      });
    };

    collect(child.stdout, (chunk) => (stdout += chunk));
    collect(child.stderr, (chunk) => (stderr += chunk));

    child.on("error", (error) => {
      if (error.code === "ENOENT" && allowFailure) {
        resolve({ code: 127, stdout: "", stderr: `${command}: not found` });
        return;
      }
      reject(new Error(redact(error.message)));
    });

    child.on("close", (code) => {
      const result = { code: code ?? 1, stdout: redact(stdout).trim(), stderr: redact(stderr).trim() };
      if (code === 0 || allowFailure) resolve(result);
      else reject(Object.assign(new Error(`${command} exited ${code}\n${result.stderr}`), result));
    });
  });
}
