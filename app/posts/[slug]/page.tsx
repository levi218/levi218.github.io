import { marked } from "marked";
import Link from "next/link";
import { notFound } from "next/navigation";

import { readPosts } from "@/lib/posts";
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
    </article>
  );
}
