---
title: Post 5 · Skills and knowledge: giving AI know-how
date: 2026-10-11
series: AI Agents, Plainly Explained
summary: How do I give AI my know-how and my documents?
---
*About a 7-minute read*

Tools let an agent act; skills and knowledge let it act the way *you* would. A **skill** is a packaged procedure the agent opens only when a task calls for it. **Knowledge** is your own documents, organised so the agent can find the right passage and point to it.

## Four ways to give an AI what it lacks

By now you have met two of these. Together they cover almost everything an agent needs beyond the model itself.

| What you add | What it gives the agent | Workplace comparison | Linh's example |
| --- | --- | --- | --- |
| Instructions (Post 2) | Who it is and the rules that always apply | The job description | "Never estimate an amount" |
| Tools (Posts 3 and 4) | The ability to act in systems | A keyboard and a phone | Write a row in the spreadsheet |
| Skills | How to do a particular kind of job well | A chapter of the procedures manual | "How we handle a VAT invoice" |
| Knowledge | Facts from your own documents | The reference library | Tax rules on deductible expenses |

The last two are where your expertise lives, and so they are where an AI-powered service gets its edge.

## Skills: know-how on demand

You could write every procedure into the agent's instructions. But Post 2 explained the cost: a crowded desk distracts the model and slows it down. Most procedures are needed only now and then.

A skill solves this. It is a small folder with:

- **A one-line description** — "Use when a receipt is in a foreign currency." Only this line sits on the desk all the time.
- **The full procedure** — the steps, the checks, the common traps. The agent opens it only when the description matches the job in front of it.
- **Supporting material** — templates, worked examples, reference tables, sometimes a small script for an exact calculation.

Think of a new hire who has memorised the table of contents of the procedures manual. They do not carry the whole manual in their head, but they know which chapter to open, and they open it every time.

Skills matter for a business for three reasons:

- **They are written in plain language.** Your best practitioner can write and improve them without any programming.
- **They make results consistent.** The same job is done the same way, by every agent, every time.
- **They are an asset you own.** Models will keep changing and improving. Your carefully tested procedures move with you to the next model, and they are hard for a competitor to copy.

## Knowledge: letting the agent look things up

Skills hold *how* to do something. Knowledge holds *what is true* in your world: contracts, policies, price lists, regulations, past cases. Too much to fit on the desk, and it changes over time.

The usual approach has a long name, **retrieval-augmented generation**, often shortened to **RAG**. The idea is simple: before answering, the agent searches your library and puts the most relevant passages on its desk.

<figure class="diagram"><svg viewBox="0 0 760 274" role="img" aria-label="The agent answers from the passages it finds, and shows where they came from" font-size="13"><defs><marker id="rag-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--cds-chart-axis)"></path></marker></defs><text x="24" y="30" font-size="15" font-weight="600" fill="var(--cds-text-primary)">The agent answers from passages it finds, and shows where they came from</text><text x="24" y="72" font-size="11.5" font-weight="600" fill="var(--cds-text-secondary)">PREPARED ONCE</text><text x="24" y="186" font-size="11.5" font-weight="600" fill="var(--cds-text-secondary)">ON EVERY QUESTION</text><g fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"><path d="M148 112H171" marker-end="url(#rag-arrow)"></path><path d="M295 112H318" marker-end="url(#rag-arrow)"></path><path d="M380 140V166H233V194" marker-end="url(#rag-arrow)"></path><path d="M148 222H171" marker-end="url(#rag-arrow)"></path><path d="M295 222H318" marker-end="url(#rag-arrow)"></path><path d="M442 222H465" marker-end="url(#rag-arrow)"></path><path d="M589 222H612" marker-end="url(#rag-arrow)"></path></g><g><rect x="24" y="84" width="124" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="86" y="108" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Documents</text><text x="86" y="126" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">rules, contracts</text></g><g><rect x="171" y="84" width="124" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="233" y="108" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Split</text><text x="233" y="126" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">into passages</text></g><g><rect x="318" y="84" width="124" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="380" y="108" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Index</text><text x="380" y="126" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">by meaning</text></g><text x="466" y="108" font-size="11.5" fill="var(--cds-text-secondary)">Redone whenever your</text><text x="466" y="124" font-size="11.5" fill="var(--cds-text-secondary)">documents change</text><g><rect x="24" y="194" width="124" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="86" y="218" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Question</text><text x="86" y="236" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">from a user</text></g><g><rect x="171" y="194" width="124" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="233" y="218" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Search</text><text x="233" y="236" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">the library</text></g><g><rect x="318" y="194" width="124" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="380" y="218" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Best passages</text><text x="380" y="236" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">put on the desk</text></g><g><rect x="465" y="194" width="124" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="527" y="218" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">The model</text><text x="527" y="236" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">reads and writes</text></g><g><rect x="612" y="194" width="124" height="56" rx="8" fill="var(--cds-chart-categorical-1)" fill-opacity="0.12" stroke="var(--cds-chart-categorical-1)" stroke-width="2"></rect><text x="674" y="218" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Answer</text><text x="674" y="236" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">with its sources</text></g></svg></figure>

In the preparation step, documents are cut into short passages and indexed by *meaning*, not just by keywords. A search for "meal with a client" can then find a passage about "entertainment expenses" even though the words differ.

The pay-off is large. Answers reflect your current documents rather than the model's training, private material stays in your library, and every answer can point to the passage it came from — which makes checking fast.

Two cautions:

- **The library is only as good as what you put in it.** Outdated or contradictory documents produce confident, outdated or contradictory answers. Keep one current version of each.
- **Search can miss.** If the right passage is not found, the model may fall back on guessing. A good instruction says: "If the documents do not answer the question, say so."

## A rarer option: retraining the model

You may hear of **fine-tuning**: further training a model on your own examples so its default behaviour changes. It has its uses, such as a very particular writing style or a large volume of one narrow task. For most services, though, good instructions, skills and knowledge get you further, faster and more cheaply. Start there.

## Linh writes down her best accountant's head

Linh's senior accountant, Thu, knows dozens of small rules: which receipts are not deductible, how to treat a hotel bill that includes a dinner, what to do with a handwritten receipt. Until now that know-how existed only in Thu's head.

Together they write four skills: "Read a receipt", "Handle a VAT invoice", "Foreign-currency receipts" and "Missing-receipts email". Into the knowledge library go the current tax guidance on deductible expenses and a one-page profile of each client. Linh realises these files, not the AI model, are what her competitors cannot buy.

## Try it on your task

Write down three to five procedures your most experienced person follows that a newcomer gets wrong. Each one is a candidate skill. Then list the documents someone has to consult to do the task well. That is your knowledge library.
