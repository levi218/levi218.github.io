import { marked } from "marked";
import Link from "next/link";
import { notFound } from "next/navigation";

import { bySeries, readPosts } from "@/lib/posts";
import { canonical } from "@/lib/site";

export function generateStaticParams() {
  const slugs = readPosts().map((post) => ({ slug: post.slug }));
  // `output: "export"` rejects an empty list; before the first post, emit one
  // slug that renders the 404 page so the site still builds.
  return slugs.length ? slugs : [{ slug: "none" }];
}

function find(slug: string) {
  return readPosts().find((post) => post.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = find((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary ?? undefined,
    alternates: { canonical: canonical(`/posts/${post.slug}`) },
    openGraph: { type: "article", title: post.title, description: post.summary ?? undefined },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = find((await params).slug);
  if (!post) notFound();

  // Neighbours in the same series, in reading order; undefined at either end or for standalone posts.
  const series = post.series ? bySeries(readPosts()).find((g) => g.series === post.series)!.posts : [];
  const at = series.findIndex((p) => p.slug === post.slug);
  const previous = series[at - 1];
  const next = series[at + 1];

  return (
    <article className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/" className="text-sm text-muted hover:text-accent">
          ← Posts{post.series ? ` · ${post.series}` : ""}
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
        <time dateTime={post.date} className="text-sm text-muted">
          {post.date}
        </time>
      </div>

      {/* Markdown is authored in this repo, not user input — rendered as-is. */}
      <div className="post-body" dangerouslySetInnerHTML={{ __html: marked.parse(post.body, { async: false }) }} />

      {post.series ? (
        <footer className="grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
          {previous ? (
            <Link href={`/posts/${previous.slug}/`} className="group flex flex-col gap-1">
              <span className="text-sm text-muted">← Previous</span>
              <span className="text-lg font-medium group-hover:text-accent">{previous.title}</span>
            </Link>
          ) : (
            // Keeps "Next" in the right-hand column on the first post.
            <span className="hidden sm:block" />
          )}
          {next ? (
            <Link href={`/posts/${next.slug}/`} className="group flex flex-col gap-1 sm:text-right">
              <span className="text-sm text-muted">Next in {post.series} →</span>
              <span className="text-lg font-medium group-hover:text-accent">{next.title}</span>
            </Link>
          ) : (
            <Link href="/" className="self-end text-sm text-muted hover:text-accent sm:text-right">
              End of {post.series} · back to all posts
            </Link>
          )}
        </footer>
      ) : null}
    </article>
  );
}
