"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The frame every admin screen sits in.
 *
 * A plain component rather than a `layout.tsx`: `pageExtensions` is documented
 * to filter `page` and `route` files, and relying on it to filter layouts too
 * would be resting the whole dev-only guarantee on undocumented behaviour. A
 * component is only ever compiled if a route imports it, and only `*.dev.tsx`
 * routes import this one.
 */

const TABS = [
  { href: "/admin/", label: "Dashboard" },
  { href: "/admin/discover/", label: "Discover" },
  { href: "/admin/build/", label: "Build" },
  { href: "/admin/release/", label: "Release" },
];

export function Shell({
  title,
  intro,
  actions,
  children,
}: {
  title: string;
  intro?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Admin" className="flex flex-wrap gap-2 text-sm">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname === tab.href.replace(/\/$/, "");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-3 py-1 ${
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {intro ? <p className="max-w-prose text-sm text-muted">{intro}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {children}
    </div>
  );
}

export function Button({
  children,
  tone = "normal",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "normal" | "primary" | "danger" }) {
  const tones = {
    normal: "border-line hover:border-accent/50",
    primary: "border-accent bg-accent-soft text-accent",
    danger: "border-accent text-accent",
  };
  return (
    <button
      {...props}
      className={`rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded border border-line bg-surface px-2 py-1 text-sm text-foreground";

/** A red box that says what went wrong and nothing else. */
export function Problem({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-accent bg-accent-soft p-3 text-xs text-accent">
      {message}
    </pre>
  );
}

/** Terminal-ish output, pinned to the bottom as lines arrive. */
export function Log({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <pre className="max-h-96 overflow-auto rounded border border-line bg-surface-soft p-3 font-mono text-xs leading-relaxed">
      {lines.join("\n")}
    </pre>
  );
}
