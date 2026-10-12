import { AI_ASSISTED_THRESHOLD } from "@/lib/registry/schema.ts";
import { canonical } from "@/lib/site";

export const metadata = {
  title: "What the tags mean",
  description: "The vocabulary used on the projects page, stated plainly.",
  alternates: { canonical: canonical("/tags") },
};

const TAGS = [
  { id: "app", term: "App", says: "Something you use. Hosted here or linked out." },
  { id: "game", term: "Game", says: "Playable. Usually on itch.io, which handles the player." },
  { id: "library", term: "Library", says: "Code for other code. Published to npm." },
  { id: "experiment", term: "Experiment", says: "Built to find something out. May not survive." },
  { id: "archived", term: "Archived", says: "Still up, no longer maintained." },
];

export default function Tags() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">What the tags mean</h1>
        <p className="max-w-prose text-muted">
          Six words, used consistently. The one worth reading is the last.
        </p>
      </div>

      <dl className="flex flex-col gap-5">
        {TAGS.map((tag) => (
          <div key={tag.id} id={tag.id} className="scroll-mt-20">
            <dt className="font-medium">{tag.term}</dt>
            <dd className="max-w-prose text-muted">{tag.says}</dd>
          </div>
        ))}

        <div id="ai-assisted" className="scroll-mt-20 rounded-lg border border-line bg-surface-soft p-5">
          <dt className="font-medium text-accent">AI-assisted</dt>
          <dd className="mt-2 flex max-w-prose flex-col gap-3 text-muted">
            <p>
              More than {Math.round(AI_ASSISTED_THRESHOLD * 100)}% of the code was written by an AI
              assistant.
            </p>
            <p>
              The badge is derived from a number recorded per project, not typed by hand, so it
              cannot drift from the rule stated here. Below the threshold there is no badge — not
              because no assistant was involved, but because the work was mostly mine.
            </p>
            <p>
              Where a project has something more specific to say about how it was built, it says so
              on its own page.
            </p>
          </dd>
        </div>
      </dl>
    </div>
  );
}
