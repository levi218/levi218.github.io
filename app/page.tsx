import Link from "next/link";

import { bySeries, readPosts, type Post } from "@/lib/posts";

function PostLink({ post, showDate }: { post: Post; showDate: boolean }) {
  return (
    <li className="flex flex-col gap-1">
      <Link href={`/posts/${post.slug}/`} className="text-lg font-medium hover:text-accent">
        {post.title}
      </Link>
      {showDate ? (
        <time dateTime={post.date} className="text-sm text-muted">
          {post.date}
        </time>
      ) : null}
      {post.summary ? <p className="max-w-prose text-muted">{post.summary}</p> : null}
    </li>
  );
}

export default function Home() {
  const groups = bySeries(readPosts());

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-semibold tracking-tight">Posts</h1>

      {groups.length === 0 ? <p className="text-muted">Nothing published yet.</p> : null}

      {groups.map(({ series, posts }) =>
        series ? (
          // A series reads as one unit: a card with its own header, posts in reading order.
          <section key={series} className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-6">
            <header className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase tracking-wide text-accent">Series</p>
              <h2 className="text-2xl font-semibold tracking-tight">{series}</h2>
              <p className="text-sm text-muted">
                {posts.length} posts · {posts[0].date}
                {posts.at(-1)!.date !== posts[0].date ? ` – ${posts.at(-1)!.date}` : ""}
              </p>
            </header>
            <ol className="flex flex-col gap-4 border-l border-line pl-5">
              {posts.map((post) => (
                <PostLink key={post.slug} post={post} showDate={false} />
              ))}
            </ol>
          </section>
        ) : (
          <section key="" className="flex flex-col gap-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Standalone</h2>
            <ol className="flex flex-col gap-4">
              {posts.map((post) => (
                <PostLink key={post.slug} post={post} showDate />
              ))}
            </ol>
          </section>
        ),
      )}
    </div>
  );
}
