---
title: Post 6 · AI agents: the loop that gets work done
date: 2026-10-11
series: AI Agents, Plainly Explained
summary: What makes something an agent?
---
*About an 8-minute read*

An **AI agent** is a model given a goal, tools and know-how, and left to work in a loop: decide the next step, take it, check the result, and repeat until the goal is met or it needs a person. The loop is what separates an agent from a chat assistant.

## From answering to doing

Ask a chat assistant "what should I do about these 40 receipts?" and you get advice. Give an agent the goal "process this month's receipts for client 1042" and it opens the folder, reads each receipt, looks up the client's categories, writes the rows, notices three are missing and drafts an email about them. It does not stop after one reply; it keeps going until the job is done.

That difference — a single answer versus a finished piece of work — is why agents matter for anyone who wants to sell outcomes rather than advice.

## The loop

<figure class="diagram"><svg viewBox="0 0 760 392" role="img" aria-label="An agent repeats decide, act, check until the goal is met" font-size="13"><defs><marker id="loop-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--cds-chart-axis)"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="var(--cds-text-primary)">An agent repeats decide, act, check until the goal is met</text><g fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"><path d="M134 150H158" marker-end="url(#loop-arrow)"></path><path d="M278 150H302" marker-end="url(#loop-arrow)"></path><path d="M422 150H446" marker-end="url(#loop-arrow)"></path><path d="M566 150H580" marker-end="url(#loop-arrow)"></path><path d="M632 114V84H218V122" marker-end="url(#loop-arrow)"></path><path d="M632 186V242" marker-end="url(#loop-arrow)"></path><path d="M218 178V242" marker-end="url(#loop-arrow)"></path></g><g><rect x="24" y="122" width="110" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="79" y="146" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Goal</text><text x="79" y="164" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">from a person</text></g><g><rect x="158" y="122" width="120" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="218" y="146" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">1 · Decide</text><text x="218" y="164" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">the next step</text></g><g><rect x="302" y="122" width="120" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="362" y="146" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">2 · Act</text><text x="362" y="164" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">use a tool</text></g><g><rect x="446" y="122" width="120" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="506" y="146" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">3 · Check</text><text x="506" y="164" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">read the result</text></g><g><polygon points="580,150 632,114 684,150 632,186" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></polygon><text x="632" y="154" text-anchor="middle" fill="var(--cds-text-primary)">Done?</text></g><g><rect x="572" y="242" width="120" height="56" rx="8" fill="var(--cds-chart-categorical-1)" fill-opacity="0.12" stroke="var(--cds-chart-categorical-1)" stroke-width="2"></rect><text x="632" y="266" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Deliver</text><text x="632" y="284" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">the result</text></g><g><rect x="158" y="242" width="120" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="218" y="266" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Ask a person</text><text x="218" y="284" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">then carry on</text></g><text x="425" y="76" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">not yet: go round again</text><text x="642" y="220" font-size="11.5" fill="var(--cds-text-secondary)">yes</text><text x="228" y="214" font-size="11.5" fill="var(--cds-text-secondary)">unsure, or the step is risky</text><g><rect x="24" y="322" width="712" height="44" rx="8" fill="var(--cds-chart-reference-tint)" stroke="var(--cds-chart-axis)" stroke-width="1"></rect><text x="380" y="348" text-anchor="middle" fill="var(--cds-text-primary)">Every step draws on: instructions · tools · skills · knowledge · notes from earlier steps</text></g></svg></figure>

Each pass round the loop is one small step. The model looks at its desk — the goal, its instructions, what it has done so far — and decides what to do next. It asks for a tool. The result lands back on its desk. It checks whether the goal is now met. If not, round it goes again.

Two exits matter as much as the loop itself. **Deliver** when the work is complete. **Ask a person** when it is unsure, when something does not match, or when the next step is one you have marked as needing approval.

## The recipe

You have already met every ingredient:

- **A model** — the brain (Post 1).
- **Instructions** — the job description and the rules (Post 2).
- **Tools** — the actions it may take, often through connectors (Posts 3 and 4).
- **Skills and knowledge** — your procedures and your documents (Post 5).
- **The loop** — software that keeps passing results back to the model and decides when to stop. People sometimes call this the **harness**.
- **Stopping rules** — when to deliver, when to ask, and when to give up.

The model is the part everyone talks about, but the other five are the parts you design. They are also what makes one agent reliable and another a liability.

## Linh's agent, step by step

Here is one real pass through a client's month, with each loop marked:

1. **Decide:** "I should see what arrived." **Act:** list new files in the client's folder. **Check:** 38 receipts.
2. **Decide:** "Read the first receipt using the 'Read a receipt' skill." **Act:** read it. **Check:** a hotel bill that includes a dinner.
3. **Decide:** "The skill says split hotel and meals." **Act:** write two rows. **Check:** rows saved.
4. The same pattern repeats for the other receipts. Two are faded: it marks them UNCLEAR instead of guessing.
5. **Decide:** "Compare with the client's bank statement." **Act:** read the statement. **Check:** three payments have no receipt.
6. **Decide:** "Draft the missing-receipts email." **Act:** create a draft, not send it. **Check:** done?
7. **Exit: ask a person.** It hands Linh's team a summary: 36 receipts filed, 2 unclear, 3 missing, email waiting for approval.

Notice that nobody told the agent the order of steps 5 and 6. It worked them out from the goal and the skills. That flexibility is the strength of an agent, and also its risk.

## How much freedom to give

Autonomy is a dial, not a switch. Most businesses should move along it slowly, on evidence.

| Level | The agent... | The person... | Good for |
| --- | --- | --- | --- |
| 1 · Suggest | drafts or recommends | does the work, using the draft | Starting out; high-stakes tasks |
| 2 · Act with approval | prepares each action | approves or edits before it happens | Most new services |
| 3 · Act, then report | acts within set limits | reviews a summary and spot-checks | Proven, repetitive work |
| 4 · Act alone | handles everything routine | sees only the exceptions | Low-risk, high-volume work with a long track record |

Start at level 2. Move a task up a level only when your records show the agent gets it right reliably, and keep anything irreversible — sending, paying, deleting — at level 2 for longest.

## Guardrails

Guardrails are the limits you build around the loop so that a mistake stays small:

- **Narrow tools.** Give only the actions the job needs, read-only where possible.
- **Approval points.** Name the steps that always need a person, and make the agent stop there.
- **Budgets.** A maximum number of steps, minutes or cost per job, so a confused agent cannot loop forever.
- **A log.** A written record of every step, tool call and result. It is how you find out what went wrong, and how you prove to a client what was done.
- **"Ask when unsure."** Written into the instructions, and rewarded rather than treated as failure.

## Where agents still slip

Agents are improving fast, but a few weak spots are worth designing around:

- **Long tasks drift.** The longer the loop runs, the more chances for a small early mistake to grow.
- **They can get stuck,** retrying the same failing step.
- **They can be confidently wrong,** just like the model inside them.
- **Every pass costs time and money.** An agent that wanders uses more of both.

The cure for most of these is not a smarter agent but a better-designed piece of work: breaking the job into clear stages, with checks between them. That is the subject of Post 7.

## Try it on your task

Write the goal for your agent in one sentence, starting with a verb: "Process...", "Prepare...", "Answer...". Then choose its starting autonomy level from the table, and list the steps that must always stop for a person.
