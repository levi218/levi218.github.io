# home-page

A static personal site published to GitHub Pages, which also *hosts* some of the
sibling projects in the folder above it under `/apps/<slug>/`. A local, dev-only
admin panel curates what ships and drives the itch.io / npm releases.

The full design, and the one-time GitHub Pages setup, are in
[`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

## Commands

```bash
npm run dev            # the public site
npm run admin          # the same server, bound to 127.0.0.1 — /admin lives here
npm run build          # the whole published tree: shell + every published sub-app
npm run deploy         # build, check, and push out/ to the gh-pages branch
npm run discover       # rescan the sibling folders
npm run creds          # which credential each release tool will use, and whether it works
npm test               # node --test over the schema, the resolver and discovery
```

`npm run build` takes `--only <slug,slug>`, `--skip-apps`, `--force`,
`--allow-partial`, `--keep-published`, `--dry-run` and `--concurrency=N`.

`--keep-published` is for shipping one project without the others: any
published app this run does not build — skipped by `--only`, or its folder is
not on this machine — is copied unchanged from the live `gh-pages` branch
instead of being taken down. For example, to ship only Tidecall:

```bash
npm run deploy -- --only tidecall --keep-published
```

`npm run deploy -- --only <slug> --inject` goes further and leaves the published
site exactly as it is: only the app itself, the `projects/` pages, the manifest
and the sitemap change. Use it when this checkout cannot rebuild the rest of the
site faithfully — say, posts that live only on another machine. The new pages
load their own `_next/` assets, which are added beside the published ones, and
the merged tree is re-checked before the push. `npm run deploy` forwards
all of them and adds its own `--dry-run`, which prints the diff against the
published branch instead of pushing.

## How it fits together

`content/registry.json` is the source of truth — git-tracked, so taking a
project down is a reviewable diff and never requires touching that project's own
repo. `lib/registry/resolve.ts` turns it into a build plan, and is shared by the
build script, the admin panel and the projects page: *"what will be in the
build"* and *"what is in the build"* must never be two different code paths.

Sub-apps are built in place and copied into `out/apps/<slug>/`, with
`NEXT_PUBLIC_BASE_PATH` and `NEXT_PUBLIC_SITE_URL` derived by the build. Never
hand-write those into a project's own `.env` — that is how they drift.

## The admin panel is dev-only

Admin pages and route handlers are named `page.dev.tsx` / `route.dev.ts`, and
`pageExtensions` in `next.config.ts` drops `dev.tsx` from a production build, so
Next never compiles them. `npm run check-export` asserts afterwards that no
`out/admin`, no `out/api`, no `*.dev.*` file and no credential value or variable
name reached the export. `npm run deploy` runs it before it pushes; a failure
there means do not publish.

Credentials live in one gitignored `.env.local` (see `.env.example`), each with
the matching tool's own store as a fallback. `npm run creds` says which is in
play.

## Two things that silently break the deploy

- **`.nojekyll` must exist in `out/`.** Pages runs Jekyll by default, and Jekyll
  strips directories beginning with an underscore — which deletes all of
  `_next/`. `npm run check-links` fails if it is missing. If the live site ever
  renders unstyled, check this first.
- **Cross-app links must be plain `<a href>`, never `next/link`.** A sub-app is
  a separate HTML tree this app's router knows nothing about; `Link` would
  prefetch and client-navigate into a 404.
