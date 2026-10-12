import Link from "next/link";

import { bySeries, readPosts } from "@/lib/posts";

export default function Home() {
  const groups = bySeries(readPosts());

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-semibold tracking-tight">Posts</h1>

      {groups.length === 0 ? <p className="text-muted">Nothing published yet.</p> : null}

      {groups.map((group) => (
        <section key={group.series ?? ""} className="flex flex-col gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            {group.series ?? "Standalone"}
          </h2>
          <ol className="flex flex-col gap-4">
            {group.posts.map((post) => (
              <li key={post.slug} className="flex flex-col gap-1">
                <Link href={`/posts/${post.slug}/`} className="text-lg font-medium hover:text-accent">
                  {post.title}
                </Link>
                <time dateTime={post.date} className="text-sm text-muted">
                  {post.date}
                </time>
                {post.summary ? <p className="max-w-prose text-muted">{post.summary}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
