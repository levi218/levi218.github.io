import { ProjectList } from "@/components/ProjectList";
import { readRegistry } from "@/lib/registry/load.ts";
import { listedProjects } from "@/lib/registry/resolve.ts";
import { toCard } from "@/lib/projects";
import { canonical } from "@/lib/site";

export const metadata = {
  title: "Projects",
  description: "Things I have built, and where to find them.",
  alternates: { canonical: canonical("/projects") },
};

export default function Projects() {
  const projects = listedProjects(readRegistry()).map(toCard);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="max-w-prose text-muted">
          Things I have built. Some are hosted here, some live on itch.io or npm.
        </p>
      </div>

      <ProjectList projects={projects} />
    </div>
  );
}
