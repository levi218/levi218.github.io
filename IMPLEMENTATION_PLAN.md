# Personal home page — implementation plan

A static Next.js site published to GitHub Pages. It carries a minimal front page
(contact + profile links), a **Projects** sub-page, and it *hosts* some of the
sibling projects under sub-paths. A local, dev-only **admin panel** curates what
ships and drives the itch.io / npm releases.

---

## 0. Context this plan is written against

Discovered in the parent folder `/Users/quanghuy/Desktop/projects`:

| Folder | What it is | Build | Notes |
|---|---|---|---|
| `chinese` | Next 16 app, "汉字 Garden" | `next build`, `output: "export"` | Already reads `NEXT_PUBLIC_BASE_PATH` + `NEXT_PUBLIC_SITE_URL`; has `.github/workflows/deploy.yml`; git repo on `main`, **no remote yet** |
| `goo` | Next 15 + react-three-fiber game, "Amalgam" | `next build`, **not** static-export configured | **Not a git repo yet**; the itch.io candidate |
| `home-page` | this project | — | empty |

Local tooling: node 24.7, npm 11.5, git 2.50. **`gh` and `butler` are not
installed** — both are needed later (§7).

Two consequences drive the whole design:

1. The apps live *outside* this repo and are not all git repos. A GitHub Actions
   job can only check out this repo, so **the multi-app build runs locally** and
   pushes a built tree. CI stays as an optional later upgrade (§6.3).
2. A static site has no server, so the admin panel **cannot** be part of the
   published output. It is a dev-only surface that edits files on disk (§5).

---

## 1. Decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Next 16, App Router, TypeScript, `output: "export"` | Matches `chinese`; one mental model for every project |
| Styling | Tailwind v4 (`@tailwindcss/postcss`) | Same as `chinese` |
| Content model | One git-tracked JSON registry + a gitignored discovery cache | Curation is versioned and reviewable in a diff; discovery is disposable |
| Source of truth for "is it published" | **This repo**, not the project | Taking a project down never requires touching that project's repo |
| Sub-app hosting | `/<basePath>/apps/<slug>/` | Flat, predictable, no route collisions with the Next router |
| Games | Link out to itch.io (`deploy.mode: "external"`) | itch handles the player, ratings, and downloads |
| Admin panel | Dev-only routes inside this app, excluded from the production build via `pageExtensions` | No second toolchain; zero bytes shipped |
| Credentials | One gitignored `.env.local`, env-first with each tool's own store as fallback (§11) | One place to look and to rotate; a missing var degrades instead of breaking |
| Deploy | Local `npm run deploy` → push `out/` to `gh-pages` | Only the local machine can see the sibling folders |
| Base path | Never hardcoded — read from env, exactly like `chinese/next.config.ts` | Works as `<user>.github.io` **or** `<user>.github.io/home-page` unchanged |

---

## 2. Repository layout

```
home-page/
  app/
    layout.tsx                  # shell: header nav (Home · Projects), footer
    page.tsx                    # front page — name, one line, contact, profiles
    projects/page.tsx           # project index, filterable by tag
    projects/[slug]/page.tsx    # optional detail page (generateStaticParams)
    tags/page.tsx               # what the tags mean (incl. the >60% AI rule)
    not-found.tsx
    admin/                      # DEV ONLY — see §5
      page.dev.tsx              # dashboard
      discover/page.dev.tsx
      build/page.dev.tsx
      release/page.dev.tsx
    api/admin/                  # DEV ONLY route handlers
      registry/route.dev.ts
      discover/route.dev.ts
      build/route.dev.ts        # SSE log stream
      itch/[slug]/route.dev.ts
      npm/[slug]/route.dev.ts
  content/
    registry.json               # ← curated, git-tracked, the source of truth
    profile.json                # name, tagline, email, social links
  lib/
    registry/schema.ts          # zod schemas + TS types
    registry/load.ts            # read + validate + merge discovery cache
    registry/resolve.ts         # ← THE resolver: registry → build plan
    site.ts                     # basePath / canonical URL helpers
  scripts/
    discover.mjs                # scan ../* → .cache/discovery.json
    build-site.mjs              # orchestrated full build (§6)
    deploy.mjs                  # build + publish to gh-pages
    check-export.mjs            # post-build leak assertion (§11.2)
    creds.mjs                   # `npm run creds` status report (§11.3)
    release-itch.mjs            # butler wrapper
    release-npm.mjs             # npm wrapper
    lib/
      exec.mjs                  # spawn wrapper: no shell, redacted output
      credentials.mjs           # the credential loader (§11.1)
      credentials/{itch,npm,github}.mjs
  public/
    covers/<slug>.png           # project cards
  .cache/                       # gitignored: discovery.json, build stamps
  .build/last-build.json        # gitignored: what the last build produced
  .env.example                  # committed template; .env.local is gitignored
  next.config.ts
```

`lib/registry/resolve.ts` is deliberately shared by the admin panel, the build
script, and the projects page. "What will be in the build?" and "what *is* in
the build?" must never be two different code paths.

---

## 3. The registry

### 3.1 `content/registry.json`

```jsonc
{
  "version": 1,
  "projects": [
    {
      "slug": "chinese",                    // URL + folder name, [a-z0-9-]+
      "status": "published",                // published | hidden | draft
      "order": 10,
      "title": "汉字 Garden",
      "blurb": "Learn the 565 most-used Chinese characters through four games.",
      "tags": ["app", "ai-assisted"],
      "aiAssisted": { "share": 0.85, "note": "Content pipeline and UI written with Claude." },
      "source": {
        "dir": "../chinese",                // relative to this repo
        "repo": null,                       // GitHub URL once one exists
        "ref": "main"
      },
      "deploy": {
        "mode": "subpath",                  // subpath | external | none
        "path": "apps/chinese",
        "buildCommand": "npm run build",
        "outDir": "out",
        "basePathEnv": "NEXT_PUBLIC_BASE_PATH",
        "env": { "NEXT_PUBLIC_SITE_URL": "{{siteUrl}}/apps/chinese" }
      },
      "links": { "live": null, "source": null, "itch": null, "npm": null },
      "release": {
        "itch": null,
        "npm":  null
      },
      "cover": "/covers/chinese.png"
    },
    {
      "slug": "amalgam",
      "status": "draft",
      "title": "Amalgam",
      "blurb": "A turn-based tactics game where you command yourself, divided.",
      "tags": ["game", "ai-assisted"],
      "source": { "dir": "../goo", "repo": null, "ref": "main" },
      "deploy": { "mode": "external" },
      "links": { "itch": "https://<user>.itch.io/amalgam" },
      "release": {
        "itch": { "target": "<user>/amalgam", "channel": "html5", "dir": "out" },
        "npm": null
      }
    }
  ]
}
```

Rules enforced by the zod schema (`lib/registry/schema.ts`):

- `slug` unique, kebab-case, not one of the reserved route names
  (`projects`, `tags`, `admin`, `apps`, `_next`).
- `deploy.mode === "subpath"` ⟹ `path`, `buildCommand`, `outDir` required and
  `path` must start with `apps/`.
- `deploy.mode === "external"` ⟹ at least one entry in `links`.
- `tags` drawn from a closed vocabulary: `app`, `game`, `library`,
  `ai-assisted`, `experiment`, `archived`.
- `aiAssisted.share` is a number in `[0,1]`; the `ai-assisted` tag is *derived*
  when `share >= 0.6`, so the badge and the rule can never drift apart.
- `{{siteUrl}}` / `{{basePath}}` placeholders in `deploy.env` are interpolated
  at build time.

### 3.2 Discovery — `scripts/discover.mjs`

Scans every sibling directory of this repo (skipping dotfolders, `node_modules`
and itself) and, for each one holding a `package.json`, records:

- `name`, `version`, `description`, available `scripts`
- framework guess from dependencies (`next` / `vite` / `astro` / plain)
- **`canStaticExport`** — `output: "export"` present in the next config
- **`supportsBasePath`** — the source mentions `NEXT_PUBLIC_BASE_PATH`, or a
  vite `base`, or an explicit `homepage.json` declaration
- git presence, current branch, remote URL, dirty state
- README `# heading` and first paragraph, as default title/blurb
- an optional project-authored `homepage.json` at the project root (hints:
  suggested tags, itch target, npm package, cover image path)

Output → `.cache/discovery.json` (gitignored). Precedence when loading:
**registry.json > project's homepage.json > inferred**.

A project that appears in discovery but not in the registry is surfaced in the
admin panel as *new*, and is `status: "draft"` — **nothing is ever published by
accident**. A registry entry whose `source.dir` has vanished is surfaced as
*orphaned* and fails the build if it is `published`.

---

## 4. The public site

**Front page** — name, one sentence, an obfuscated `mailto:`, and icon links to
GitHub / LinkedIn / itch.io / npm read from `content/profile.json`. Nothing else.

**Header nav** — `Home · Projects`.

**`/projects`** — cards grouped by nothing, sorted by `order` then title, with
tag filter chips (`All · Apps · Games · AI-assisted`). Filter state lives in the
URL query so a filtered view is linkable; it is applied client-side over the
full statically-rendered list, so it works with JS off. Each card shows title,
blurb, tags, and the actions that exist: **Open** (sub-path app), **Play on
itch.io**, **Source**, **npm**.

**Tag semantics** — the `AI-assisted` badge links to `/tags`, which states the
rule plainly: *more than 60% of the code was written by an AI assistant.* Where
`aiAssisted.note` exists it is shown on the project detail page.

**Cross-app links must be plain `<a href>`, never `next/link`** — the sub-apps
are separate HTML trees that this app's router knows nothing about; `Link` would
prefetch and client-navigate into a 404.

`trailingSlash: true` everywhere (matching `chinese`) so that `/apps/chinese/`
resolves identically on Pages and locally.

---

## 5. Admin panel (dev-only)

### 5.1 Exclusion mechanism

`next.config.ts`:

```ts
const devOnly = process.env.NODE_ENV !== "production" || process.env.ADMIN === "1";
const pageExtensions = devOnly ? ["dev.tsx", "dev.ts", "tsx", "ts"] : ["tsx", "ts"];
```

Admin pages and handlers are named `page.dev.tsx` / `route.dev.ts`, so in a
production build Next does not see them as routes at all. That is what keeps
`output: "export"` working — a mutating `POST` route handler cannot be exported
— and it guarantees no admin code, and no shell-exec helper, reaches Pages.
`npm run admin` (= `next dev`) is the way in; a `scripts/check-export.mjs`
post-build assertion fails the build if `out/admin` or `out/api` ever appears.

### 5.2 Screens

- **Dashboard `/admin`** — one row per project: status select
  (published/hidden/draft), tags, order, title/blurb inline edit, and a
  computed **"In next build"** column with the reason when the answer is no
  (`draft`, `hidden`, `source dir missing`, `no build script`,
  `no base-path support`). Reordering by drag writes `order` in steps of 10.
- **Discover `/admin/discover`** — new sibling folders with everything the
  scanner inferred, and an *Adopt* button that appends a pre-filled draft entry.
- **Build `/admin/build`** — a **dry run** first (the resolver's plan: which
  projects, which commands, which env, which target folders, estimated output),
  then *Run build* with the log streamed over SSE, then the `last-build.json`
  report (per-project duration, output size, file count, git rev).
- **Release `/admin/release`** — per project: itch.io channel status and npm
  version status side by side with the local version, plus the publish actions.

### 5.3 Dev-only API contract

| Route | Does |
|---|---|
| `GET /api/admin/registry` | registry + discovery + resolver verdicts |
| `PUT /api/admin/registry` | zod-validate → atomic write (tmp + rename) → prettier-format `content/registry.json` |
| `POST /api/admin/discover` | run the scanner, refresh the cache |
| `POST /api/admin/build` | run `build-site.mjs`, stream stdout/stderr as SSE |
| `GET/POST /api/admin/itch/[slug]` | `butler status` / `butler push` |
| `GET/POST /api/admin/npm/[slug]` | `npm view` / `npm publish` |

Safety rails, all of them non-negotiable:

- Every handler returns `403` unless `process.env.NODE_ENV !== "production"`.
- Dev server bound to `127.0.0.1` only.
- Registry writes are validated **before** touching disk; a rejected payload
  leaves the file untouched.
- Irreversible actions (`butler push`, `npm publish`) require the client to echo
  back a confirmation string (`publish chinese@1.2.0`) that the server
  re-derives and compares.
- Credentials come from one place: the gitignored `.env.local` at the repo
  root, read through `scripts/lib/credentials.mjs`, with each tool's own store
  (`butler login`, `~/.npmrc`, git's keychain helper) kept as a fallback. See
  §11 — including the guarantees that keep those values out of `out/`.
- Child processes are spawned with argument arrays, never a shell string, and
  `source.dir` is resolved and asserted to stay within the parent folder.

---

## 6. Build & deploy

### 6.1 `scripts/build-site.mjs`

```
npm run build          # = node scripts/build-site.mjs
  --only <slug,slug>   # build a subset
  --skip-apps          # home page only
  --force              # ignore the unchanged-source cache
  --allow-partial      # a failing app is dropped instead of failing the build
  --dry-run            # print the plan, touch nothing
```

Steps:

1. **Resolve** — load registry + discovery, validate, compute the plan with
   `lib/registry/resolve.ts`. Abort on: duplicate slugs/paths, a published
   project whose `source.dir` is missing, a `subpath` project with no
   `outDir` after its build.
2. **Build the shell** — `next build` here → `out/`.
3. **Build each sub-app**, sequentially by default (`--concurrency=N` opts in):
   - `npm ci` if `node_modules` is absent or older than `package-lock.json`;
   - run `buildCommand` in the project dir with
     `{ [basePathEnv]: "<basePath>/apps/<slug>", ...deploy.env }`;
   - hash the project's source (git rev + dirty-file hash, or an mtime hash when
     there is no git) and **skip the build if the hash and env match the stamp
     in `.cache/`** — this is what keeps repeat deploys fast;
   - copy `<dir>/<outDir>` → `out/apps/<slug>/`.
4. **Finalize** — write `out/.nojekyll` (Pages strips `_next/` without it),
   `out/CNAME` when a custom domain is configured, and
   `out/apps/manifest.json` listing what shipped.
5. **Report** — `.build/last-build.json` for the admin panel, and a summary
   table on stdout.

A sub-app build failure fails the whole run by default. Half-published is worse
than not-published.

### 6.2 `scripts/deploy.mjs`

`npm run deploy` = validate → `build-site.mjs` → publish `out/` to the
`gh-pages` branch via a detached `git worktree` (no third-party action, no
force-push to `main`), with the commit message recording the included slugs and
their revisions. `--dry-run` prints the file diff against the currently
published branch instead of pushing.

Pages is then configured once: *Settings → Pages → Deploy from branch →
`gh-pages` / root*.

### 6.3 CI (later, optional)

Once `chinese` and `goo` have GitHub remotes, `.github/workflows/deploy.yml`
can reproduce this: check out this repo, then `actions/checkout` each published
project into `../<slug>` from `source.repo`/`source.ref`, run the same
`build-site.mjs`, and hand `out/` to `upload-pages-artifact` — the same shape as
`chinese/.github/workflows/deploy.yml`, with `configure-pages` supplying
`NEXT_PUBLIC_BASE_PATH`. Private project repos would need a PAT.
**Blocked until then:** `goo` is not a git repo at all.

---

## 7. Release management

### 7.1 itch.io (games)

itch.io has no public write API for uploads; the supported tool is **butler**.
Prerequisite: install butler and run `butler login` once (or set
`BUTLER_API_KEY`). The *game page itself* — creating it, marking the upload
"playable in browser", cover art, pricing — is a one-time manual step on
itch.io that no API covers; the admin panel deep-links to the edit page.

`scripts/release-itch.mjs <slug>`:

1. Build the game to `release.itch.dir` (a static export or a `dist/`).
2. `butler push <dir> <target>:<channel> --userversion <version>` — a channel
   whose name contains `html` is what makes it browser-playable.
3. `butler status <target>:<channel>` to confirm and to display build state.

Admin shows: last pushed version, channel list, build processing state, and the
local version about to be pushed. Read-only listing of all games uses
`GET https://itch.io/api/1/<key>/my-games`.

### 7.2 npm (packages)

`scripts/release-npm.mjs <slug>`:

- status: `npm view <pkg> versions dist-tags --json` vs the local
  `package.json` version;
- publish: `npm publish --access <public|restricted>` after the typed
  confirmation, with a pre-flight `npm pack --dry-run` file listing shown in the
  panel;
- tag management: `npm dist-tag ls/add`;
- takedown: **`npm deprecate`**, not unpublish — npm forbids unpublishing after
  72 hours, and the panel says so where the button would be.

Both tools read their credentials from `.env.local` via the adapters in
`scripts/lib/credentials/`, falling back to the machine's own stores when a
variable is unset. `npm run creds` reports which source is in play for each.
See §11.

---

## 8. Testing & guardrails

- `node --test` unit tests for `lib/registry/schema.ts`, `resolve.ts`, and the
  discovery inference (fixture folders under `test/fixtures/`).
- `scripts/check-export.mjs` runs after every production build and fails if
  `out/admin`, `out/api`, or any `*.dev.*` artifact exists.
- A link check over `out/` verifying every `deploy.mode: "subpath"` project has
  an `index.html` at its promised path and every external link is well-formed.
- `npm run lint` + `npm run typecheck`, mirroring `chinese`.

---

## 9. Phases

| Phase | Deliverable | Done when |
|---|---|---|
| **P0** Scaffold | Next app, Tailwind, layout, front page, `next.config.ts` with env-driven `basePath`, `deploy.mjs`, **plus the credential layer and `check-export.mjs` (§11)** | The bare home page is live on Pages and `npm run creds` reports |
| **P1** Registry + Projects | schema, loader, resolver, `/projects`, `/tags`, hand-written entries for `chinese` and `amalgam` | Projects page renders from `registry.json` |
| **P2** Discovery | `discover.mjs`, cache, precedence rules, tests | Both siblings are found with correct capabilities |
| **P3** Multi-app build | `build-site.mjs` with per-app build, base-path injection, copy, stamps, `.nojekyll` | `chinese` is live at `/apps/chinese/` |
| **P4** Admin — organize | dev-only route mechanism, dashboard, discover screen, registry write API, `check-export.mjs` | Toggling a project to `hidden` removes it from the next build |
| **P5** Admin — build | dry-run plan, SSE build runner, last-build report | A deploy can be driven end-to-end from `/admin` |
| **P6** Releases | butler + npm wrappers, the release screen, the credential status strip | `amalgam` pushed to itch.io from the panel |
| **P7** Polish | OG images, sitemap/robots, 404, dark mode, keyboard nav, Lighthouse pass | — |

P0–P3 is the useful milestone: a real site with real projects on it. P4–P6 is
the tooling on top.

---

## 10. Risks / open questions

1. ~~Repo name decides the base path.~~ **Decided:** a user site at
   `<user>.github.io`, so the base path is empty and stays empty. Setup guide
   in §12.
2. ~~`goo` needs to become a git repo.~~ **Decided:** it does, and it needs a
   static export for itch.io. Both are scoped in §13.
3. **Sibling `node_modules` are not shared.** The first cold build of each app
   is slow; the source-hash stamp makes every later one near-free.
4. **Pages limits** — a ~1 GB site and a 100 MB file cap. A three.js game with
   large assets is the realistic risk; itch.io hosting sidesteps it.
5. **Nested 404s.** Pages serves one `404.html` per site; a bad URL under
   `/apps/chinese/` lands on the home page's 404. Acceptable — worth a
   "back to the app" link.
6. **Private/unpublished projects.** The registry is public in this repo, so a
   `draft` entry still leaks a project's name and blurb. If that matters, drafts
   should live only in the gitignored discovery cache — say the word and the
   loader flips.

---

## 11. Credentials

Every credential lives in **one gitignored `.env.local`** at this repo's root,
read through one loader, with each tool's own store as a fallback so a
half-filled file degrades instead of breaking. `.env.example` is the committed
template and splits into two blocks whose headers are the documentation:
`NEXT_PUBLIC_*` values are compiled into the public site, and everything below
the SECRET header is read only by `scripts/` and the dev-only admin routes.

| Variable | Drives | Fallback when unset |
|---|---|---|
| `ITCH_API_KEY` | butler (`BUTLER_API_KEY` in the child env) | `butler login`'s own store |
| `NPM_TOKEN` | `npm publish` / `view` / `dist-tag` | `~/.npmrc` |
| `GITHUB_TOKEN` | the `gh-pages` push | git's macOS keychain helper |

### 11.1 The modules

- `scripts/lib/credentials.mjs` — `loadEnv()` (native `process.loadEnvFile`, no
  `dotenv`), `getCredential()`, `fingerprint()`, `redact()`, `secretValues()`,
  `assertNoPublicSecrets()`.
- `scripts/lib/credentials/{itch,npm,github}.mjs` — one adapter per service,
  each exporting a runner (`butler()`, `npm()`, `git()`) and a `status()`.
- `scripts/lib/exec.mjs` — the spawn wrapper. No shell, secrets only via `env`,
  every captured line redacted before it can be logged or streamed.
- `scripts/creds.mjs` — `npm run creds`. Lives outside the loader because the
  adapters import it, and a CLI inside would be an ESM cycle around a
  top-level await.

`next dev` loads `.env.local` into the app process by itself, so the admin route
handlers get these for free; only the standalone scripts call `loadEnv()`.

### 11.2 Why plaintext is safe enough here

Five things, in order of what they catch:

1. **Router-level exclusion** (§5.1) — no code that reads a secret is ever
   compiled into the site.
2. **`npm run check-export`** — after every production build, every emitted file
   is scanned for each secret's literal *value* (as bytes, so sourcemaps and
   binaries count) and for the variable *names* (in text, where an inlined
   `process.env.X` lands). It also fails on `out/admin`, `out/api`, and any
   `*.dev.*` file. `deploy.mjs` runs it before pushing; a failure means do not
   publish. Verified against all four leak classes.
3. **`assertNoPublicSecrets()`** at load — throws if a secret is declared with a
   `NEXT_PUBLIC_` name, or if any `NEXT_PUBLIC_*` variable holds a value equal
   to a known secret. That single typo is the shortest path from a local file to
   a public website.
4. **`redact()`** on every captured line — an npm or butler error can quote a
   token, and those lines reach the browser through the admin SSE stream.
5. **Argv discipline** — secrets travel in the child's `env`, never in `args`,
   because argv is readable by any process via `ps`. `npm` gets a temporary
   `0600` userconfig in the OS temp dir, removed in a `finally`; `~/.npmrc` is
   never read or written. `git` gets an inline credential helper whose *script*
   is in argv while the token comes from the env.

The residual risk is real and accepted: `.env.local` is readable by anything
running as your user, including a dependency's postinstall script. Use scoped,
revocable tokens — an npm *automation* token limited to the packages you
publish, an itch.io key you can rotate — so a leak is a rotation, not an
incident.

### 11.3 Status

`npm run creds` prints, per service: the source (`env` / `native` / `none`), a
token fingerprint (never the value), whether the credential actually works, and
the account it authenticates as. It exits non-zero when a *configured*
credential is rejected, so it can gate a release script. The dev-only
`GET /api/admin/credentials` returns the same records to the admin panel, which
disables each release button with the reason inline rather than failing after
the click.

---

## 12. Setting this repo up as the GitHub Pages root site

**A user site.** The repo is named `<user>.github.io` and serves at
`https://<user>.github.io/`. A user site is always served from the domain root
and can never move to a sub-path, so **`NEXT_PUBLIC_BASE_PATH` is empty
forever** — the single biggest simplification available here. Sub-apps get clean
URLs like `https://<user>.github.io/apps/chinese/`.

### 12.1 One-time setup

1. **Check the name is free.** One user site per account. If
   `<user>.github.io` already exists, either rename that repo (it loses its URL)
   or fall back to a project site and accept a `/home-page` prefix on every
   sub-app URL. The code handles both; only the env changes.
2. **The repo must be public** unless you have a paid plan — Pages from a
   private repository requires Pro/Team/Enterprise. Decide before pushing
   whether any `draft` project blurb is something you would rather not publish
   (§10.4).
3. **Initialise and push:**
   ```bash
   git init && git add -A && git commit -m "Initial commit"
   git branch -M main
   git remote add origin git@github.com:<user>/<user>.github.io.git
   git push -u origin main
   ```
4. **Fill the PUBLIC block of `.env.local`.** This is the entire base-path
   configuration — there is no code change anywhere:
   ```dotenv
   NEXT_PUBLIC_SITE_URL=https://<user>.github.io
   NEXT_PUBLIC_BASE_PATH=
   ```
5. **First deploy:** `npm run deploy` builds the shell and every published
   sub-app, runs `check-export`, and pushes `out/` to an orphan `gh-pages`
   branch through a detached git worktree.
6. **Point Pages at it:** *Settings → Pages → Build and deployment → Source:
   "Deploy from a branch" → Branch `gh-pages`, folder `/ (root)` → Save.*
   GitHub's docs state the source branch can be any branch in the repository,
   so `gh-pages` is valid for a user site — the old restriction to `main` on
   user sites no longer applies.
7. **Wait, then walk §12.3.** The first publish takes a few minutes; later ones
   about 30 seconds.

### 12.2 The two things that silently break this

- **`.nojekyll` is mandatory.** Pages runs Jekyll by default, and Jekyll strips
  directories beginning with an underscore — which deletes all of `_next/`,
  i.e. every script and stylesheet on the site. `build-site.mjs` writes
  `out/.nojekyll` as a finalize step (§6.1). If the site ever renders as
  unstyled HTML, check this file first.
- **Sub-app env is derived, never typed.** The build passes
  `NEXT_PUBLIC_BASE_PATH=/apps/<slug>` and
  `NEXT_PUBLIC_SITE_URL=<site>/apps/<slug>` — that is what the `{{siteUrl}}`
  interpolation in `deploy.env` is for. Hand-writing these into each project's
  own `.env` is how they drift.

### 12.3 Verification

1. `https://<user>.github.io/` loads, styled, nav works.
2. `https://<user>.github.io/apps/chinese/` loads **styled** — unstyled means
   `.nojekyll` is missing.
3. Navigate two pages deep inside the sub-app and reload: URLs stay under
   `/apps/chinese/` and assets resolve. This is what proves the base path was
   injected, not merely that the copy worked.
4. View source on the home page: asset URLs start with `/_next/`, not
   `/home-page/_next/`.
5. A card's **Open** link is a plain `<a>` in the rendered HTML — a `next/link`
   there produces a client-side 404 (§4).
6. `git log gh-pages --oneline -1` names the included slugs and revisions.

### 12.4 Custom domain, later

Set the domain in `content/profile.json`; the build writes `out/CNAME` from it.
DNS is an `ALIAS`/`ANAME` (or apex `A` records to GitHub's IPs) for a bare
domain, or a `CNAME` to `<user>.github.io` for `www`. Tick **Enforce HTTPS**
once the certificate issues and update `NEXT_PUBLIC_SITE_URL`.
`NEXT_PUBLIC_BASE_PATH` stays empty.

### 12.5 Fallback

If the branch dropdown ever refuses `gh-pages`, emit into `docs/` on `main` and
select *`main` / `/docs`*. That costs you build output in git history, which is
exactly what the worktree avoids — so it is the fallback, not the default.

---

## 13. Getting `goo` release-ready

`goo` (package `amalgam`) is **not a git repo** and is not configured for static
export. Both must change before it can be released or built by CI. From
inspecting it: `public/` is empty, `src/` is 236 KB, and there is no
`next/image`, no `use server`, no route handler and no `force-dynamic` — so
nothing blocks a static export, and the Pages size limits (§10.2) are irrelevant
for this one.

### 13.1 Make it a repo — do this first

```bash
cd ../goo
git init && git add -A && git commit -m "Initial commit"
git remote add origin git@github.com:<user>/amalgam.git && git push -u origin main
```

Then fill `source.repo` and `source.ref` in its registry entry. This is the only
thing standing between you and the optional CI upgrade in §6.3, which needs to
`actions/checkout` each project into `../<slug>`.

### 13.2 Static export for itch.io

itch.io unpacks an uploaded HTML game at an **unpredictable sub-path** inside an
iframe, so an export with absolute `/_next/...` asset URLs loads a blank page.
Add to `goo/next.config.ts`:

```ts
output: "export",
images: { unoptimized: true },
trailingSlash: true,
```

Then resolve the asset-path question — **this is a spike, not an assumption**:

1. Try `assetPrefix: "./"`, then open the export from a random sub-directory.
   If assets resolve, done.
2. If not, add a post-export rewrite in `release-itch.mjs` turning `/_next/`
   into `./_next/` across the exported `.html`, `.css` and `.js`. This always
   works and is the fallback to plan for.

Serve `out/` from a deliberately deep path and confirm it loads **before**
uploading — a broken itch build is a public one.

### 13.3 Release wiring

`release.itch = { target: "<user>/amalgam", channel: "html5", dir: "out" }`. A
channel name containing `html` is what makes itch treat the upload as
browser-playable.

One-time manual steps no API covers: create the game page, set *Kind of project
→ HTML*, tick *This file will be played in the browser* on the upload, and set
the viewport dimensions. The admin panel deep-links to that edit page. After
that, `butler push` from `/admin/release` is the whole loop, authenticated by
`ITCH_API_KEY` (§11).

### 13.4 Optional: self-host it too

Flip `deploy.mode` from `external` to `subpath` and add
`basePathEnv: "NEXT_PUBLIC_BASE_PATH"`. `goo` does not read that variable today,
so port the ten-line pattern from `chinese/next.config.ts` (the `basePath` const
plus the conditional spread). With §13.2 already done, that is the only
remaining work — and the game then appears at
`https://<user>.github.io/apps/amalgam/` **and** on itch, from one build.
