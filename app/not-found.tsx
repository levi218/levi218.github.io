import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      {/*
        GitHub Pages serves one 404.html for the whole site, so a bad URL inside
        a sub-app lands here too — hence the second link out (§10.5).
      */}
      <p className="text-muted">There is nothing at this address.</p>
      <p className="flex gap-4 text-sm">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <Link href="/projects/" className="hover:text-accent">
          Projects
        </Link>
      </p>
    </div>
  );
}
