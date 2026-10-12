---
title: Post 3 · Tools: giving AI hands
date: 2026-10-11
series: AI Agents, Plainly Explained
summary: How does a model that only writes text get anything done?
---
*About a 6-minute read*

A model can only write text. A **tool** is how that text turns into action: the model writes a request — "look up client 1042's invoices" — and the software around it carries the request out and hands back the result.

## A brain with no hands

On its own, a model cannot open your spreadsheet, check today's exchange rate or send an email. It can only describe what it would do. Tools close that gap.

Think of a capable manager who works by phone from a room with no computer. They cannot touch the files, but they can say "pull up the March invoices" or "email the client", and an assistant outside the room does it and reads back what happened. The model is the manager. The software around it — the app, or later the agent — is the assistant with the keyboard.

## What a tool actually is

A tool is a single, clearly labelled action, described in plain words so the model knows when to use it. Each one has three parts:

- **A name** — for example, "look up invoices".
- **A description** — what it does, when to use it and what it returns.
- **Inputs** — what it needs to run, such as a client number and a month.

The model is handed the whole list at the start, like a menu. It reads the descriptions and decides which item, if any, the current step needs. That is why a clear tool description matters as much as a clear instruction: a vague label gets picked at the wrong moment, or never.

Common tools include web search, reading and writing files, a calculator, a calendar, email, a database or accounting system lookup, and running a small piece of code.

## How one tool call works

<figure class="diagram"><svg viewBox="0 0 760 436" role="img" aria-label="The model only asks; the app carries out the action" font-size="13"><defs><marker id="tool-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--cds-chart-axis)"></path></marker><marker id="tool-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--cds-chart-categorical-1)"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="var(--cds-text-primary)">The model only asks; the app carries out the action</text><g stroke="var(--cds-chart-grid)" stroke-width="1" stroke-dasharray="4 4"><line x1="96" x2="96" y1="92" y2="412"></line><line x1="285" x2="285" y1="92" y2="412"></line><line x1="475" x2="475" y1="92" y2="412"></line><line x1="664" x2="664" y1="92" y2="412"></line></g><g><rect x="26" y="56" width="140" height="36" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="96" y="79" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">You</text></g><g><rect x="215" y="56" width="140" height="36" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="285" y="79" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">The app</text></g><g><rect x="405" y="56" width="140" height="36" rx="8" fill="var(--cds-chart-categorical-1)" fill-opacity="0.12" stroke="var(--cds-chart-categorical-1)" stroke-width="2"></rect><text x="475" y="79" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">The model</text></g><g><rect x="594" y="56" width="140" height="36" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="664" y="79" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Tool / your system</text></g><g><path d="M96 128H285" stroke="var(--cds-chart-axis)" stroke-width="1.25" fill="none" marker-end="url(#tool-arrow)"></path><path d="M285 168H475" stroke="var(--cds-chart-axis)" stroke-width="1.25" fill="none" marker-end="url(#tool-arrow)"></path><path d="M475 208H285" stroke="var(--cds-chart-categorical-1)" stroke-width="2" fill="none" marker-end="url(#tool-arrow-accent)"></path><path d="M285 248H664" stroke="var(--cds-chart-axis)" stroke-width="1.25" fill="none" marker-end="url(#tool-arrow)"></path><path d="M664 288H285" stroke="var(--cds-chart-axis)" stroke-width="1.25" fill="none" marker-end="url(#tool-arrow)"></path><path d="M285 328H475" stroke="var(--cds-chart-axis)" stroke-width="1.25" fill="none" marker-end="url(#tool-arrow)"></path><path d="M475 368H285" stroke="var(--cds-chart-axis)" stroke-width="1.25" fill="none" marker-end="url(#tool-arrow)"></path><path d="M285 408H96" stroke="var(--cds-chart-axis)" stroke-width="1.25" fill="none" marker-end="url(#tool-arrow)"></path></g><text x="190.5" y="120" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">1. “What did client 1042 owe?”</text><text x="380" y="160" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">2. question + tool menu</text><text x="380" y="200" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--cds-text-primary)">3. “Use invoice lookup, 1042”</text><text x="569.5" y="240" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">4. app runs the lookup</text><text x="569.5" y="280" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">5. the invoice data</text><text x="380" y="320" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">6. result put on the desk</text><text x="380" y="360" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">7. written answer</text><text x="190.5" y="400" text-anchor="middle" font-size="11.5" fill="var(--cds-text-primary)">8. answer on screen</text></svg></figure>

The important moment is step 3. The model does not run anything itself: it writes a structured request, and the app decides whether to carry it out. The result then goes back on the model's desk (Post 2), and the model either answers or asks for another tool. A single question can involve several rounds of this.

This split is what makes tools safe enough for business. The app can refuse a request, ask a person to approve it first, or limit which records the model may see.

## Not all tools carry the same risk

| Kind of tool | Examples | What can go wrong | Usual safeguard |
| --- | --- | --- | --- |
| Read and look up | Search, read a file, check stock, look up a client | Little; at worst it reads the wrong thing | None beyond access limits |
| Calculate and convert | Calculator, currency rate, make a chart | A wrong input gives a wrong number | Show the inputs used |
| Create and change | Write a spreadsheet row, draft an email, create an invoice | A wrong record is saved | Easy undo, or a person reviews a batch |
| Send, pay, delete | Email a client, make a payment, delete records | Cannot be taken back | A person approves each one |

A useful rule: the harder an action is to undo, the closer a person should stand to it. Many successful agents can read almost anything but can only *draft* the actions that leave the building.

## Tools also reduce hallucination

Remember the weaknesses in Post 1: arithmetic, recent facts, private information. Tools fix all three. Instead of guessing a total, the model calls a calculator. Instead of recalling an exchange rate from training, it looks today's rate up. Instead of inventing a client's address, it reads it from your records.

When you design an agent, a good habit is to ask of every fact it needs: should the model *know* this, or should it *look it up*? Anything that changes, or anything that must be exact, should be looked up.

## Linh lists her tools

Linh walks through her receipt process and writes down every action a person takes. Her list:

- **Read** new receipts from the client's email or shared folder.
- **Look up** the client's own category list and tax settings.
- **Calculate** totals and convert foreign-currency receipts at the official rate.
- **Write** one row per receipt into the client's expense spreadsheet.
- **Draft** an email to the client listing receipts that are missing or unreadable.

She marks the last one "draft only": a person on her team will press Send. Everything else is either reading or easy to undo.

## Try it on your task

For the task you have been following, list every action a person takes in a system: opening, searching, calculating, writing, sending. Label each one Read, Calculate, Change or Send. The Send items are where you will place a human check in Post 7.
