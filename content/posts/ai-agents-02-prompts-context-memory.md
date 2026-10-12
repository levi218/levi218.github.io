---
title: Post 2 · Prompts, context and memory
date: 2026-10-11
series: AI Agents, Plainly Explained
summary: What does the model actually see, and why does it forget?
---
*About a 7-minute read*

Each time a model answers, it sees exactly one thing: a single block of text called its **context**. Your instructions, the conversation so far, any documents and any results from its actions are all placed into it. Anything outside it does not exist for the model.

## The context window is the model's desk

Imagine a brilliant consultant who works at a desk of fixed size, with no filing cabinet and no memory of yesterday. Whatever you want them to use must be on the desk when they start. That desk is the **context window**.

<figure class="diagram"><svg viewBox="0 0 760 444" role="img" aria-label="The model sees only what is in its context window" font-size="13"><defs><marker id="ctx-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--cds-chart-axis)"></path></marker></defs><text x="24" y="34" font-size="15" font-weight="600" fill="var(--cds-text-primary)">The model sees only what is in its context window</text><g><rect x="24" y="52" width="400" height="368" rx="8" fill="var(--cds-chart-reference-tint)" stroke="var(--cds-chart-axis)" stroke-width="1"></rect><text x="40" y="76" font-weight="600" fill="var(--cds-text-primary)">Context window: the model’s desk</text></g><g><rect x="40" y="92" width="368" height="56" rx="8" fill="var(--cds-chart-categorical-1)" fill-opacity="0.12" stroke="var(--cds-chart-categorical-1)" stroke-width="2"></rect><text x="56" y="116" font-weight="600" fill="var(--cds-text-primary)">Instructions (system prompt)</text><text x="56" y="134" font-size="11.5" fill="var(--cds-text-primary)">set by the builder, the same on every turn</text></g><g><rect x="40" y="156" width="368" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="56" y="180" font-weight="600" fill="var(--cds-text-primary)">Documents and memory notes</text><text x="56" y="198" font-size="11.5" fill="var(--cds-text-secondary)">pasted in by the app when they are relevant</text></g><g><rect x="40" y="220" width="368" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="56" y="244" font-weight="600" fill="var(--cds-text-primary)">Tool results</text><text x="56" y="262" font-size="11.5" fill="var(--cds-text-secondary)">what its actions returned (Post 3)</text></g><g><rect x="40" y="284" width="368" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="56" y="308" font-weight="600" fill="var(--cds-text-primary)">Conversation so far</text><text x="56" y="326" font-size="11.5" fill="var(--cds-text-secondary)">re-sent in full on every turn</text></g><g><rect x="40" y="348" width="368" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="56" y="372" font-weight="600" fill="var(--cds-text-primary)">Your latest message</text><text x="56" y="390" font-size="11.5" fill="var(--cds-text-secondary)">the question or request right now</text></g><g fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"><path d="M424 248H480" marker-end="url(#ctx-arrow)"></path><path d="M560 276V320" marker-end="url(#ctx-arrow)"></path><path d="M560 376V400H448V312H408" marker-end="url(#ctx-arrow)"></path></g><g><rect x="480" y="220" width="160" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="560" y="244" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">The model</text><text x="560" y="262" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">predicts the reply</text></g><g><rect x="480" y="320" width="160" height="56" rx="8" fill="none" fill-opacity="1" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="560" y="344" text-anchor="middle" font-weight="600" fill="var(--cds-text-primary)">Reply</text><text x="560" y="362" text-anchor="middle" font-size="11.5" fill="var(--cds-text-secondary)">shown to you</text></g><text x="456" y="420" font-size="11.5" fill="var(--cds-text-secondary)">added to the conversation for the next turn</text><text x="480" y="120" font-size="11.5" fill="var(--cds-text-secondary)">Anything not on the desk</text><text x="480" y="136" font-size="11.5" fill="var(--cds-text-secondary)">does not exist for the model</text></svg></figure>

The size of the desk is measured in **tokens**, small chunks of text that are often part of a word. Today's desks are large — often enough for a long report or a whole book — but not unlimited. And a fuller desk costs more and takes longer to work through, because the model reads everything on it every time.

## Why the model "forgets"

The model itself remembers nothing between one answer and the next. What feels like a continuous conversation is the app quietly re-sending the whole conversation every time you press Enter.

This explains three things people find puzzling:

- **Long chats get worse.** Once the desk fills up, older parts are trimmed or squeezed into a summary, and details drop out.
- **A new chat starts from zero.** Nothing carries over unless the app puts it back on the desk.
- **"Memory" is an app feature, not a brain feature.** When an assistant remembers your name next week, the app saved a note and pasted it back in. The model did not learn anything.

For anyone building an agent, this is good news. You decide what goes on the desk, so you control what the model knows on each turn.

## Two kinds of prompt

A **prompt** is simply the text you give the model. In practice there are two kinds:

- **The system prompt** (also called instructions) is written once by whoever builds the product. It sets the role, the rules, the tone and the format, and it sits at the top of the desk on every turn. When you build an agent, this is your main lever: it is the agent's job description.
- **The user prompt** is what someone types in the moment: "Process these twelve receipts."

Your clients will rarely see the system prompt. They will feel it in every answer.

## How to write instructions that work

Write as if briefing a sharp new hire on their first morning — someone capable who knows nothing about your business. A good briefing covers six things:

1. **Purpose.** Who the work is for and why it matters.
2. **The task.** What to do, in the order you would do it.
3. **What good looks like.** One or two real examples of a finished result, and if possible one bad one with the reason it is bad.
4. **The format.** Exactly how the answer should be laid out — for example, a table with named columns.
5. **What to do when unsure.** "If the total is unreadable, write UNCLEAR. Never estimate it." This one line prevents more mistakes than any other.
6. **The material itself.** Put the policy, price list or template on the desk instead of hoping the model knows it.

Here is the difference in practice.

**Weak:** "Read this receipt and tell me about it."

**Strong:** "You process expense receipts for small businesses in Vietnam. For each receipt, return one row with: vendor, date (DD/MM/YYYY), total in VND, VAT amount, and one category from this list: Meals, Travel, Office supplies, Utilities, Other. Copy amounts exactly as printed. If any field is missing or unreadable, write UNCLEAR in that field and do not guess."

The strong version is longer, but every extra sentence removes a decision the model would otherwise make on its own.

## More on the desk is not always better

It is tempting to pile everything onto the desk — every policy, every past email. Resist it. Irrelevant material distracts the model the same way it would distract a person, and an important instruction buried on page 30 gets less attention than one at the top.

The craft of choosing what goes on the desk, and when, is sometimes called **context engineering**. For agents it matters more than clever wording. A plain instruction with the right documents beats a polished instruction with the wrong ones.

## Linh writes her first briefing

After her experiment in Post 1, Linh writes a one-page instruction sheet: the purpose, the five fields, her category list, three example receipts with correct answers, and the UNCLEAR rule. She pastes it in before each batch.

The invented tax amounts stop. The model now writes UNCLEAR on faded receipts, which her team can check in seconds. Her categories also become consistent, because the model is choosing from her list instead of inventing its own.

## Try it on your task

Write a one-page briefing for the task you picked in Post 1, using the six points above. Include one real example of a finished result. Keep this page: it becomes your agent's instructions in Post 8.
