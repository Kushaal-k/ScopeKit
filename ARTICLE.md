*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).*

## What I Built

“Just a simple website” can hide a surprisingly long conversation: Which pages? Who supplies the photos? Does “contact form” include email delivery? Are payments part of this phase?

I built **ScopeKit**, a small local AI workbench for freelancers who need to turn those informal messages into something they can review and quote.

Paste the client's brief, let Gemma suggest a scope, review the deliverables and hours, set your rate, and export a Markdown proposal with a client reply. Source passages sit beside the suggested tasks so you can trace them back to the request.

The intended customer is an independent web designer or small freelance studio. A possible paid offering is installation and customization of a branded proposal workflow. **That business idea is still a hypothesis: I have not tested willingness to pay or claimed customers or revenue.**

The project is deliberately small. There is no account system or client database. Working content stays in memory; only the appearance preference is saved in the browser.

## Demo

**[Watch the 28-second ScopeKit walkthrough (MP4)](https://raw.githubusercontent.com/Kushaal-k/ScopeKit/main/evidence/scopekit-demo.mp4)**

The video is an edited sequence of actual UI steps using a fictional florist brief and real local Gemma inference. Its pauses do not represent inference timings.

![ScopeKit showing a real local Gemma generation and source-linked deliverables](https://raw.githubusercontent.com/Kushaal-k/ScopeKit/main/evidence/latest-gemma-ui.png)

The test brief asks for a one-page florist website, wedding bouquet gallery, contact form, and phone compatibility. Gemma identifies the website, gallery, and contact form, then proposes questions, assumptions, and exclusions.

It also suggests only **two hours of work in total**. That is why review is part of the workflow. In the demonstration, the hours are manually changed to 5, 3, and 3. At $50/hour with a 15% contingency, the example estimate becomes **$632.50**, with a **$316.25** deposit. These are illustrative planning numbers, not validated effort predictions.

The model also puts “Mobile Responsiveness beyond basic phone compatibility” in its suggested exclusions. The client explicitly requested phone support, so that wording needs clarification before sharing. The tool does not establish that a scope is complete or that its proposed terms are appropriate.

**Try it locally:**

```sh
git clone https://github.com/Kushaal-k/ScopeKit.git
cd ScopeKit
ollama pull gemma3:1b
python app.py
```

Install [Ollama](https://ollama.com/download) and Python 3.10+ first. Keep Ollama running, then open `http://127.0.0.1:8765`. Windows users can use `start.cmd`. The hand-written **Try an example** option lets you explore editing and exporting without a model; it is clearly labeled as a sample.

## Code

**[ScopeKit on GitHub](https://github.com/Kushaal-k/ScopeKit)**

The MIT-licensed repository includes setup instructions, 19 automated tests, a cross-platform CI workflow, the demo video, a real model response, and a reviewed proposal export.

## How I Built It

The frontend is plain HTML, CSS, and JavaScript. A Python standard-library server handles validation, quoting, and the local Ollama connection. There are no Python application dependencies or frontend build tools.

**Gemma 3 1B** performs the core extraction through Ollama's schema-constrained chat API. Instructions and the brief use a user turn, consistent with [Gemma's prompt structure](https://ai.google.dev/gemma/docs/core/prompt-structure).

The most useful lesson came from source evidence. An early approach asked the model to produce supporting quotes. It sometimes invented them. Constraining the available quotes still allowed it to select an unrelated passage.

The final approach gives that mechanical step to code: Gemma proposes tasks, then the server attaches exact passages using task-word overlap and a few aliases, such as phones/mobile. It rejects unmatched task names and duplicate task anchors. One correction attempt is allowed before an error is surfaced.

This is a traceability heuristic. It cannot prove semantic correctness, completeness, or the absence of overlapping work.

The separation continues with money: **Python's Decimal arithmetic calculates the quote.** The model suggests hours; the user reviews them. Manually edited replies survive price changes, with a reminder to check their numbers.

```text
Client brief → local Gemma → validation and source linking
             → human review → decimal quote → Markdown proposal
```

The interface has Light, Dark, and System themes, matching dropdowns, keyboard navigation, and responsive layouts. Briefs and proposals clear when the page reloads.

All 19 local validation and HTTP integration tests passed. The adapter tests use a mock Ollama server; separate real Gemma runs verify actual inference. [GitHub Actions also passed](https://github.com/Kushaal-k/ScopeKit/actions/runs/38799480217), running Python checks on Windows and Linux and JavaScript syntax validation.

## Why Does Open Innovation Matter?

Local open-weight inference fits the material this tool handles: client messages, project details, and draft commercial terms.

Once the model is downloaded, ScopeKit's inference workflow can work offline. It needs no hosted inference account, API key, or per-request payment. Hardware and electricity still have costs, and a small model still makes mistakes.

Open weights also let the user choose a different local model independently of the application. The model is a replaceable part of a workflow whose validation, calculations, and export format are inspectable.

The application uses the MIT license. Gemma weights have their own [Google Gemma Terms](https://ai.google.dev/gemma/terms); they are a separate download and are not bundled with the source.

## Prize Categories

- **Best Use of Gemma:** Gemma 3 1B runs locally through Ollama and extracts the tasks, questions, assumptions, and exclusions at the center of the product. The repository includes real inference evidence and the walkthrough above.
- **Best Use of GitHub Copilot — through GitHub Actions automation:** The challenge explicitly includes GitHub Actions in this category. ScopeKit uses Actions for its Windows/Linux test matrix and JavaScript checks, with a [successful run](https://github.com/Kushaal-k/ScopeKit/actions/runs/38799480217). This entry is based on Actions automation; the app was built with Codex assistance.

### Community research

[AI Explore's “Structured Output Gives You Syntax. It Doesn't Give You Semantics”](https://dev.to/aiexplore369zoho/structured-output-gives-you-syntax-it-doesnt-give-you-semantics-3c13) informed the distinction between parseable output and trustworthy suggestions. ScopeKit's invented-quote failures made that distinction concrete.

### AI disclosure

ScopeKit was built with AI coding assistance and human direction. This article was written and published by an AI agent at my request. All scenarios shown are fictional test inputs; no customer outcomes or benchmark improvements are claimed.
