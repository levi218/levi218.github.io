import { Icon } from "@/components/icons";
import { canonical, profile } from "@/lib/site";

export const metadata = {
  title: "About",
  alternates: { canonical: canonical("/about") },
};

// Name, email and LinkedIn are left out for now; they stay in content/profile.json, unrendered.
const SHOWN = ["github", "itch", "npm"];
const links = profile.links.filter((link) => SHOWN.includes(link.kind));

export default function About() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
        {links.map((link) => (
          <a
            key={link.kind}
            href={link.url}
            className="inline-flex items-center gap-2 hover:text-accent"
            target="_blank"
            rel="me noreferrer"
          >
            <Icon name={link.kind} />
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
