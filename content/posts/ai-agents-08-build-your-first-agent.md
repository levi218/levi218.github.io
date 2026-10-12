---
title: Post 8 · Building your first agent, step by step
date: 2026-10-11
series: AI Agents, Plainly Explained
summary: What are the steps to build an agent for my task?
---
*About a 9-minute read*

Building an agent is mostly deciding, not coding: choose a narrow task, write down how an expert does it, decide what the agent may touch and know, then test it on real past examples before anyone relies on it. Nine steps take you from idea to a working pilot.

<figure class="diagram"><svg viewBox="0 0 760 372" role="img" aria-label="Nine steps take an agent from idea to proven pilot" font-size="13"><defs><marker id="build-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--cds-chart-axis)"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="var(--cds-text-primary)">Nine steps take an agent from idea to proven pilot</text><g><rect x="24" y="52" width="224" height="252" rx="8" fill="var(--cds-chart-reference-tint)" stroke="var(--cds-chart-axis)" stroke-width="1"></rect><text x="40" y="74" font-weight="600" fill="var(--cds-text-primary)">Define</text></g><g><rect x="268" y="52" width="224" height="252" rx="8" fill="var(--cds-chart-reference-tint)" stroke="var(--cds-chart-axis)" stroke-width="1"></rect><text x="284" y="74" font-weight="600" fill="var(--cds-text-primary)">Design</text></g><g><rect x="512" y="52" width="224" height="252" rx="8" fill="var(--cds-chart-reference-tint)" stroke="var(--cds-chart-axis)" stroke-width="1"></rect><text x="528" y="74" font-weight="600" fill="var(--cds-text-primary)">Prove</text></g><g fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"><path d="M136 144V160" marker-end="url(#build-arrow)"></path><path d="M136 216V232" marker-end="url(#build-arrow)"></path><path d="M232 260H250V116H284" marker-end="url(#build-arrow)"></path><path d="M380 144V160" marker-end="url(#build-arrow)"></path><path d="M380 216V232" marker-end="url(#build-arrow)"></path><path d="M476 260H494V116H528" marker-end="url(#build-arrow)"></path><path d="M624 144V160" marker-end="url(#build-arrow)"></path><path d="M624 216V232" marker-end="url(#build-arrow)"></path><path d="M624 288V328H380V288" marker-end="url(#build-arrow)"></path></g><g><rect x="40" y="88" width="192" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="136" y="112" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">1 · Pick the task</text><text x="136" y="130" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">narrow, frequent, valuable</text></g><g><rect x="40" y="160" width="192" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="136" y="184" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">2 · Define good</text><text x="136" y="202" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">what done looks like</text></g><g><rect x="40" y="232" width="192" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="136" y="256" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">3 · Map the expert</text><text x="136" y="274" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">how it is done today</text></g><g><rect x="284" y="88" width="192" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="380" y="112" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">4 · Shape the work</text><text x="380" y="130" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">patterns and checkpoints</text></g><g><rect x="284" y="160" width="192" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="380" y="184" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">5 · Gather the parts</text><text x="380" y="202" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">tools, skills, knowledge</text></g><g><rect x="284" y="232" width="192" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="380" y="256" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">6 · Write instructions</text><text x="380" y="274" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">the job description</text></g><g><rect x="528" y="88" width="192" height="56" rx="8" fill="var(--cds-chart-categorical-1)" fill-opacity="0.12" stroke="var(--cds-chart-categorical-1)" stroke-width="2"></rect><text x="624" y="112" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">7 · Build a test set</text><text x="624" y="130" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">real past examples</text></g><g><rect x="528" y="160" width="192" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="624" y="184" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">8 · Run a pilot</text><text x="624" y="202" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">people check everything</text></g><g><rect x="528" y="232" width="192" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="624" y="256" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">9 · Measure and widen</text><text x="624" y="274" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">earn more autonomy</text></g><text x="502" y="348" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">improve instructions and skills, then retest</text></svg></figure>

The first six steps are design decisions you can make on paper. Step 7, the test set, is highlighted because it is the one most often skipped — and without it you cannot tell whether a change made things better or worse.

## Define

**1. Pick one narrow task.** Not "automate my accounting" but "turn a client's monthly receipts into a categorised expense sheet". A good first task is *frequent* (it happens every week), *bounded* (it has a clear start and end), *checkable* (a person can tell quickly whether the result is right) and *valuable* (someone would pay to stop doing it). Avoid tasks where one mistake would be very costly; you can move to those later.

**2. Define what "good" looks like.** Write down the finished output in exact terms: which fields, which format, what counts as an error. Then set a bar, such as "every amount matches the receipt; categories match what our senior accountant would choose at least as often as a junior would". If you cannot describe good, the agent cannot hit it, and you cannot measure it.

**3. Map how the expert does it today.** Sit with the person who does the task best and write down every step, every decision and every exception they handle — including the ones they do without thinking. This map becomes your workflow, your skills and your instructions. It is also where most of the value lies: the AI is available to everyone, but this map is yours.

## Design

**4. Shape the work.** Using Post 7, decide which steps follow a fixed route and which need an agent to decide. Choose the patterns. Place the checkpoints: a gate before anything that leaves the building, an exception queue for anything uncertain. Choose a starting autonomy level from Post 6 — usually level 2.

**5. Gather the parts.** From the map, list:

- **Tools** the agent needs, marked read or act (Post 3), and whether a connector exists for each (Post 4).
- **Skills** for the procedures that need expertise (Post 5).
- **Knowledge** the agent must consult: rules, client profiles, templates.

Give each tool the narrowest access that does the job.

**6. Write the instructions.** Turn your Post 2 briefing into the agent's job description: purpose, the steps at a high level, the output format, when to use which skill, and above all what to do when unsure. Keep it short; detailed procedures belong in skills.

How you put these parts together depends on your situation. Some people use an AI assistant that already supports connectors and skills; some use a no-code agent builder; some work with a developer. The design decisions above are the same whichever route you take, and they are the part that determines quality.

## Prove

**7. Build a test set.** Collect 30 to 100 real past cases with the correct answer for each — here, receipts your team has already processed correctly. Include the awkward ones: faded, handwritten, foreign currency, duplicates. Run the agent on all of them and score the results against your definition of good. Every time you change the instructions or a skill, run the test set again. This turns "it seems better" into "it got 94 out of 100 right, up from 88".

**8. Run a pilot.** Use the agent on live work, but with a person checking every output before it goes anywhere. A gentle way to start is to run it **alongside** your team for a few weeks: both process the same work, and you compare. Every disagreement teaches you something, and the best of them become new test cases.

**9. Measure, improve and widen.** Track a handful of numbers each week:

| Measure | What it tells you |
| --- | --- |
| Accuracy against your definition of good | Whether the output can be trusted |
| Share of items sent to a person | How much work is really being saved |
| Corrections people make | Where the instructions or skills need work |
| Time per job, from start to delivery | The speed you can promise a client |
| Cost per job, including people's review time | Whether the service can be priced profitably (Post 9) |

When a stage is consistently accurate, move it up one autonomy level and keep measuring. When results dip, the improvement loop sends you back to step 6: sharpen an instruction, add a rule to a skill, add the failing case to the test set.

## The agent design canvas

The nine steps produce one page of decisions. Fill in the last column for your own task; Linh's answers are there as a guide.

| Decision | Linh's answer | Your answer |
| --- | --- | --- |
| Goal, in one sentence | Turn a client's monthly receipts into a categorised, checked expense sheet |  |
| Who it serves | Small businesses with 20 to 200 receipts a month |  |
| Inputs | Photos and PDFs of receipts, invoices, the bank statement |  |
| Output | One spreadsheet row per receipt, plus a list of missing or unclear items |  |
| "Good" means | Every amount exact; categories match the senior accountant's |  |
| Read tools | Email folder, shared drive, client category list, exchange rates |  |
| Act tools | Write spreadsheet rows; draft emails (never send) |  |
| Skills | Read a receipt; VAT invoice; foreign currency; missing-receipts email |  |
| Knowledge | Current deductible-expense rules; client profiles |  |
| Patterns | Router, parallel, chain, maker and checker, one agent step |  |
| Checkpoints | Exception queue for unclear items; gate on every client email |  |
| Starting autonomy | Level 2: act with approval |  |
| Test set | 80 past receipts, 20 of them awkward |  |
| Success measures | Accuracy, share sent to a person, review time per client |  |

## Linh's pilot

Linh runs her agent alongside her team for one month on five friendly clients. Her test set catches an early problem: restaurant receipts that include service charges were being split wrongly. Thu adds two lines to the "Read a receipt" skill, the test set confirms the fix, and the problem does not return.

By the end of the month her team is reviewing exceptions rather than typing, and she has the numbers to decide whether this can become a product. That decision is Post 9.

## Try it on your task

Fill in the "Your answer" column of the canvas above. Then start your test set: gather ten real past cases with their correct answers this week. Ten is enough to begin; you will add more as the pilot teaches you where the agent struggles.
