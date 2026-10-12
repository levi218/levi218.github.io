---
title: Post 1 · What AI and LLMs actually are
date: 2026-10-11
series: AI Agents, Plainly Explained
summary: What is AI, and what is a large language model?
---
*About a 7-minute read*

A large language model (LLM) is a program that has read an enormous amount of text and learned to continue it: give it some words, and it predicts, remarkably well, what should come next. Almost everything in this series is built on that one ability.

## AI is a family, not a single thing

"AI" is used for everything from a chess program to a chat assistant. It helps to see it as a family of nested ideas, each one a more specific kind of the one around it.

<figure class="diagram"><svg viewBox="0 0 760 380" role="img" aria-label="Large language models are the most specific branch of AI" font-size="13"><text x="24" y="34" font-size="15" font-weight="600" fill="var(--cds-text-primary)">Large language models are the most specific branch of AI</text><g><rect x="24" y="52" width="712" height="304" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="40" y="76" font-weight="600" fill="var(--cds-text-primary)">Artificial intelligence (AI)</text><text x="40" y="94" font-size="11.5" fill="var(--cds-text-secondary)">Computers doing tasks that seem to need human thinking, e.g. chess programs, route planners</text></g><g><rect x="48" y="112" width="664" height="228" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="64" y="136" font-weight="600" fill="var(--cds-text-primary)">Machine learning</text><text x="64" y="154" font-size="11.5" fill="var(--cds-text-secondary)">Learns patterns from examples instead of hand-written rules, e.g. a spam filter</text></g><g><rect x="72" y="172" width="616" height="152" rx="8" fill="none" stroke="var(--cds-chart-axis)" stroke-width="1.25"></rect><text x="88" y="196" font-weight="600" fill="var(--cds-text-primary)">Generative AI</text><text x="88" y="214" font-size="11.5" fill="var(--cds-text-secondary)">Creates new content: text, images, audio, video</text></g><g><rect x="96" y="232" width="568" height="76" rx="8" fill="var(--cds-chart-categorical-1)" fill-opacity="0.12" stroke="var(--cds-chart-categorical-1)" stroke-width="2"></rect><text x="112" y="256" font-weight="600" fill="var(--cds-text-primary)">Large language models (LLMs)</text><text x="112" y="274" font-size="11.5" fill="var(--cds-text-primary)">Generative AI for language: reads, understands and writes text</text><text x="112" y="292" font-size="11.5" fill="var(--cds-text-secondary)">The brain inside chat assistants and AI agents</text></g></svg></figure>

- **Artificial intelligence** is the broad goal: computers doing things we would normally say need human thinking.
- **Machine learning** is the main way we get there today. Instead of writing every rule by hand, we show the system thousands of examples and let it find the patterns. A spam filter learns what spam looks like from emails people have marked as spam.
- **Generative AI** is machine learning that produces something new — a paragraph, a picture, a voice — rather than only sorting or scoring things.
- **Large language models** are generative AI for language. "Large" refers to two things: the huge amount of text they learn from, and the very large number of internal settings (called parameters) that store what they learned.

Most modern LLMs can also read images and documents, not only typed text. That matters for business tasks like reading a photographed receipt or a scanned contract.

## How an LLM learns

Picture an apprentice locked in a library that holds a large share of everything ever written. Day after day, someone covers up the next word on a page and asks the apprentice to guess it. When the guess is wrong, the apprentice adjusts slightly. Repeat that billions of times.

To guess well across so many subjects, the apprentice has to absorb far more than vocabulary: grammar, facts, how arguments are built, how a polite email differs from a legal clause, how a recipe is laid out. That stage is called **training**.

A second stage then teaches the model to be a helpful assistant: to follow instructions, answer questions and decline harmful requests. It learns this from examples of good answers and from people rating its replies. This is why a model chats with you instead of just rambling on from where you left off.

Two consequences are worth remembering:

- **Training happens once, before you ever use the model.** Each time you ask it something, it is only *using* what it learned. It does not learn from your conversation the way a person would.
- **Its knowledge has a cut-off date.** Anything that happened after training, and anything private to you — your clients, your prices, your files — it simply does not know unless you show it.

## Predicting the next word is enough to seem smart

If you type "The invoice is due in 30", the most likely next word is "days". That looks trivial. But to predict the next word in a contract, a tax explanation or a customer complaint, the model has to capture what the text *means*. Prediction at that scale starts to look like understanding.

The model writes its answer one small piece at a time, each piece chosen in light of everything before it. That is why answers appear on screen word by word. It is also why the same question can produce slightly different wording each time: the model picks among likely continuations rather than looking up one fixed answer.

## What LLMs are good at, and where they slip

**Strong at:**

- Reading messy material and pulling out what matters — an email thread, a receipt, a 40-page report.
- Writing and rewriting: drafts, summaries, translations, replies in a given tone.
- Sorting and labelling: is this message a complaint, an order or a question?
- Following a written procedure, step by step, when the steps are spelled out.
- Explaining things at whatever level the reader needs.

**Weak at, on their own:**

- Exact arithmetic on long numbers. They are predicting text, not running a calculator.
- Anything after their training cut-off, or anything private to you.
- Knowing when they do not know.

That last point has a name.

## Hallucination: the weakness to never forget

A **hallucination** is a confident, fluent answer that is simply made up — an invented figure, a policy that does not exist, a citation to a document nobody wrote. It happens because the model's job is to produce *plausible* text. When the true answer is not in what it learned or in front of it, a plausible-sounding wrong answer is still the most "likely" continuation.

You cannot switch hallucination off, but you can make it rare and catch it when it happens. The rest of the series shows how:

- Put the real source material in front of the model (Posts 2 and 5).
- Let it check facts with tools instead of guessing (Post 3).
- Ask it to point to where each answer came from.
- Put a person at the points where a mistake would be costly (Posts 7 and 9).

## Model, assistant, agent: three words people mix up

- **Model** — the trained "brain". Text (and images) in, text out. Nothing else.
- **Assistant** — a product built around a model: the chat window, file uploads, saved conversations.
- **Agent** — a model given tools and a goal, working through a task step by step until it is done. That is Post 6.

## Linh's first experiment

Linh photographs a crumpled supermarket receipt and asks a chat assistant: "Give me the vendor, date, total and an expense category." It gets all four right, in seconds. She tries twenty more. Nineteen are right. On one faded receipt, it reports a tax amount that is not printed anywhere.

Her conclusion is the right one: this is an excellent reader and a fast drafter, but it needs structure around it and a check where money is involved. That structure is what the next eight posts build.

## Try it on your task

Pick one task you do every week. List its steps, and mark each one:

- **L** — reading, writing or judging language. An LLM is likely good at this.
- **S** — looking something up in a system or calculating exactly. This will need a tool (Post 3).
- **P** — a judgment where a mistake is costly. Keep a person here, at least at first.
