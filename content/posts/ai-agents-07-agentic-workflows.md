---
title: Post 7 · Agentic workflows: designing the work, not just the worker
date: 2026-10-11
series: AI Agents, Plainly Explained
summary: How do I design the whole piece of work, not just one step?
---
*About an 8-minute read*

An **agentic workflow** is a piece of work broken into stages, where some stages are done by AI and some by people, joined by clear hand-offs and checks. How you design those stages usually matters more than how clever any single agent is.

## Workflow or agent? Usually both

Post 6 described an agent that decides its own steps. That freedom is powerful, but you pay for it in predictability. At the other end sits a **fixed workflow**: you decide the steps in advance, and AI simply performs some of them.

- **Fixed workflow.** You write the route: read the receipt, then sort it, then record it. Predictable, cheap, easy to check and easy to explain to a client.
- **Agent.** The AI chooses the route. Flexible, handles surprises, but harder to predict and to audit.

Most good services use a fixed backbone with agentic steps placed only where the path genuinely varies. A simple rule: **if you can write the steps down, make it a workflow. Let the AI choose only where you cannot.**

## Five patterns that cover most work

Almost every agentic workflow is built from a handful of recurring shapes. Learn to recognise them and you can sketch a design on a napkin.

<figure class="diagram"><svg viewBox="0 0 760 592" role="img" aria-label="Five patterns cover most agentic workflows" font-size="13"><defs><marker id="pat-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--cds-chart-axis)"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="var(--cds-text-primary)">Five patterns cover most agentic workflows</text><g stroke="var(--cds-chart-grid)"><line x1="24" x2="736" y1="156" y2="156"></line><line x1="24" x2="736" y1="260" y2="260"></line><line x1="24" x2="736" y1="364" y2="364"></line><line x1="24" x2="736" y1="468" y2="468"></line></g><g fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"><path d="M396 104L436 104" marker-end="url(#pat-arrow)"></path><path d="M532 104L572 104" marker-end="url(#pat-arrow)"></path><path d="M396 208L470 178" marker-end="url(#pat-arrow)"></path><path d="M396 208L470 208" marker-end="url(#pat-arrow)"></path><path d="M396 208L470 238" marker-end="url(#pat-arrow)"></path><path d="M396 312L436 282" marker-end="url(#pat-arrow)"></path><path d="M396 312L436 312" marker-end="url(#pat-arrow)"></path><path d="M396 312L436 342" marker-end="url(#pat-arrow)"></path><path d="M532 282L572 312" marker-end="url(#pat-arrow)"></path><path d="M532 312L572 312" marker-end="url(#pat-arrow)"></path><path d="M532 342L572 312" marker-end="url(#pat-arrow)"></path><path d="M396 416L436 416" marker-end="url(#pat-arrow)"></path><path d="M532 416L572 416" marker-end="url(#pat-arrow)"></path><path d="M484 430V450H348V430" marker-end="url(#pat-arrow)"></path><path d="M396 520L436 490" marker-end="url(#pat-arrow)"></path><path d="M396 520L436 520" marker-end="url(#pat-arrow)"></path><path d="M396 520L436 550" marker-end="url(#pat-arrow)"></path><path d="M546 490L590 520" marker-end="url(#pat-arrow)"></path><path d="M546 520L590 520" marker-end="url(#pat-arrow)"></path><path d="M546 550L590 520" marker-end="url(#pat-arrow)"></path></g><g><text x="24" y="84" font-weight="600" fill="var(--cds-text-primary)">1 · Chain</text><text x="24" y="102" font-size="11.5" fill="var(--cds-text-primary)">Fixed steps; each output feeds the next</text><text x="24" y="120" font-size="11.5" fill="var(--cds-text-secondary)">Use when the steps never change</text><rect x="300" y="90" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="436" y="90" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="572" y="90" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="348" y="108" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Read</text><text x="484" y="108" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Sort</text><text x="620" y="108" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Record</text></g><g><text x="24" y="188" font-weight="600" fill="var(--cds-text-primary)">2 · Router</text><text x="24" y="206" font-size="11.5" fill="var(--cds-text-primary)">Sort the input, send it down the right path</text><text x="24" y="224" font-size="11.5" fill="var(--cds-text-secondary)">Use when inputs come in different kinds</text><rect x="300" y="194" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="470" y="166" width="116" height="24" rx="6" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="470" y="196" width="116" height="24" rx="6" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="470" y="226" width="116" height="24" rx="6" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="348" y="212" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Classify</text><text x="528" y="182" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Receipt path</text><text x="528" y="212" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Invoice path</text><text x="528" y="242" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Statement path</text></g><g><text x="24" y="292" font-weight="600" fill="var(--cds-text-primary)">3 · Parallel</text><text x="24" y="310" font-size="11.5" fill="var(--cds-text-primary)">Split the work, do the parts at once, combine</text><text x="24" y="328" font-size="11.5" fill="var(--cds-text-secondary)">Use for many similar items</text><rect x="300" y="298" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="436" y="270" width="96" height="24" rx="6" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="436" y="300" width="96" height="24" rx="6" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="436" y="330" width="96" height="24" rx="6" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="572" y="298" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="348" y="316" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Split</text><text x="484" y="286" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Receipt 1</text><text x="484" y="316" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Receipt 2</text><text x="484" y="346" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Receipt 3</text><text x="620" y="316" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Combine</text></g><g><text x="24" y="396" font-weight="600" fill="var(--cds-text-primary)">4 · Maker and checker</text><text x="24" y="414" font-size="11.5" fill="var(--cds-text-primary)">One step drafts, another checks against rules</text><text x="24" y="432" font-size="11.5" fill="var(--cds-text-secondary)">Use when quality must be verified</text><rect x="300" y="402" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="436" y="402" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="572" y="402" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="348" y="420" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Draft</text><text x="484" y="420" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Check</text><text x="620" y="420" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Passed</text><text x="500" y="456" font-size="11.5" fill="var(--cds-text-secondary)">fails: fix and retry</text></g><g><text x="24" y="500" font-weight="600" fill="var(--cds-text-primary)">5 · Manager and helpers</text><text x="24" y="518" font-size="11.5" fill="var(--cds-text-primary)">A lead agent decides how to split the job</text><text x="24" y="536" font-size="11.5" fill="var(--cds-text-secondary)">Use for big jobs that vary each time</text><rect x="300" y="506" width="96" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="436" y="478" width="110" height="24" rx="6" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="436" y="508" width="110" height="24" rx="6" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="436" y="538" width="110" height="24" rx="6" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><rect x="590" y="506" width="110" height="28" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="348" y="524" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Lead agent</text><text x="491" y="494" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Helper: VAT</text><text x="491" y="524" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Helper: payroll</text><text x="491" y="554" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Helper: assets</text><text x="645" y="524" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">Lead assembles</text></g></svg></figure>

1. **Chain.** Steps in a fixed order, each feeding the next. The simplest and most reliable pattern; reach for it first.
2. **Router.** A first step works out what kind of input this is and sends it down the right path. Each path can then have its own instructions and skills.
3. **Parallel.** Many similar items handled at the same moment, then gathered up. Forty receipts take about as long as one.
4. **Maker and checker.** One step produces a draft; a second, with different instructions, checks it against the rules and sends it back if it fails. This mirrors the four-eyes principle many professions already use.
5. **Manager and helpers.** A lead agent looks at a large, varied job, decides how to split it, hands the parts to helper agents and assembles the results. Use it for work that looks different every time, such as a year-end package.

Patterns combine freely. A router can send each path into its own chain; a chain can include a maker-and-checker step.

## Where people step in

A workflow is also the natural place to put people — often called **human in the loop**. There are three common kinds of checkpoint:

- **Gate.** Work stops until a person approves. Use it before anything that cannot be undone: sending, paying, filing.
- **Exception queue.** Only items the AI flags — unclear, unusual, low confidence — go to a person. Everything else flows through.
- **Spot-check.** A person reviews a sample after the fact. Use it for proven, low-risk stages, and to catch slow drift in quality.

Place each checkpoint by asking two questions about a stage: *how costly is a mistake here?* and *how easily can it be undone?* Costly and hard to undo means a gate. Cheap and easy to undo means a spot-check.

Checkpoints are not a sign that the AI is weak. In a service, they are part of what the client is paying for: an accountable person standing behind the result.

## Linh's workflow

Linh redesigns her agent from Post 6 as a workflow with one agentic step:

1. **Router:** each new document is classified as receipt, VAT invoice or bank statement.
2. **Parallel:** all receipts are read at once, each with the "Read a receipt" skill.
3. **Chain:** each result is categorised, then recorded in the client's spreadsheet.
4. **Maker and checker:** a separate checking step compares the month's rows against the bank statement and the tax rules, and flags mismatches.
5. **Exception queue:** unclear receipts and mismatches go to a person on Linh's team.
6. **Agent step:** for the flagged items, an agent investigates — searching the client's email for a missing receipt, for instance — and drafts the follow-up message.
7. **Gate:** a person approves every email before it is sent to the client.

The result is faster and more predictable than the free-roaming agent, and every stage can be measured on its own.

## Design tips

- **Keep stages small and single-purpose.** A stage that does one thing is easy to test and to fix.
- **Fix the hand-off format.** Decide exactly what each stage passes to the next — for example, the same five fields for every receipt.
- **Check between stages,** not only at the end. An error caught at stage 2 is cheaper than one found by the client.
- **Log everything.** Each stage should leave a record of what it received, what it did and what it produced.
- **Measure each stage separately.** When results dip, you will know exactly where to look.

## Try it on your task

Take the steps from your Post 1 list and redraw them using the five patterns. Mark which steps follow a fixed route and which genuinely need the AI to decide. Then place your checkpoints: a gate before every "Send" from Post 3, and an exception queue wherever the AI should be allowed to say "I'm not sure".
