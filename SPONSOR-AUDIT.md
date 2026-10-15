# Week 2 sponsor and readiness audit

Checked 16 October 2026 against [DEV’s Week 2 challenge page](https://dev.to/challenges/hacktoberfest-week2-2026-10-12), DEV event #80, and the registered MLH Week 2 event. These are implementation decisions for a small local tool, not statements that categories have been entered or eligibility approved.

## Scope decisions

| Category | Decision for ScopeKit |
| --- | --- |
| Gemma | Main target; replaces the default model and performs extraction. |
| GitHub Copilot | Actions automation prepared; needs a successful GitHub run. |
| ElevenLabs | Possible voice briefs or demo narration; defer for now. |
| Render | Deferred; current inference runs on the user's machine. |
| DigitalOcean | Deferred; cloud deployment adds operational work. |
| .tech domain | Deferred until there is a public deployment. |
| Backboard | No current integration; unnecessary for one brief. |
| Entire | No Entire session captured; do not claim it. |
| Mastra | No framework needed for this small workflow. |
| MongoDB Atlas | No persistent client archive in the present scope. |
| Sentry Agent Tracing | Deferred; telemetry needs deliberate privacy choices. |
| SerpApi | No web search needed to scope the supplied brief. |
| Temporal | No durable multi-step background jobs in this version. |
| Tiger Data | No retrieval or embeddings in the present scope. |
| TabPFN | This is text extraction, not tabular prediction. |
| Tinker | No fine-tuning dataset or measured improvement available. |
| Arduino | No physical-device use case in the present scope. |

The GitHub category explicitly permits Actions automation on the public challenge page. A YAML file alone is not evidence that automation ran; link the eventual successful run and describe it accurately. A successful real Gemma generation is now saved as `evidence/gemma-run.json`; the public demo still needs a video or deployed link.

## Offers and sponsor skills

DevRelay confirms the user is registered for Hacktoberfest 2026 and Week 2. The Week 2 event itself returns no offers or skills. The broader Hacktoberfest registration exposes an ElevenLabs offer: three months of Creator, no credit card required, one code per account, codes do not stack. Its redemption destination is [ElevenLabs](https://elevenlabs.io/app/agents). No code was claimed.

The broad event also lists the official `elevenlabs/skills` repository, covering speech-to-text, text-to-speech, agents, and other audio workflows. It could support voice briefs or narration. No third-party skill was installed. No Gemma skill was listed; the implementation follows [Google's prompt-format documentation](https://ai.google.dev/gemma/docs/core/prompt-structure) and [Ollama's Gemma model documentation](https://ollama.com/library/gemma3:1b).

The challenge page points to [My Hacktoberfest promos](https://hacktoberfest.com/my/promos) for other partner benefits. Availability there has not been verified or claimed. A code offer is not evidence of a working integration.

## Other corrections and checks

- Default runtime, setup instructions, model-download command, fallback option, error text, README, and submission draft now use Gemma.
- Gemma instructions are sent in a user turn; no unsupported separate system turn is assumed.
- Invalid JSON or an unmatched task triggers at most one correction attempt. Source passages are attached in code through task-word overlap, not authored by the model.
- Exports retain the model selected for the generation, even if the dropdown is later changed.
- Manually edited replies show a reminder when quote values change and can be refreshed explicitly.
- Exported Markdown is also visible as copyable text, so a browser download limitation does not block access.
- The app code remains MIT; Gemma 3 weights use the separate Gemma Terms and are not bundled.
- DEV entry now follows the official template, including Code and Prize Categories, and both tags: `devchallenge`, `hf26challenge`.

## Deadline conflict

The [public DEV rules](https://dev.to/challenges/hacktoberfest-week2-2026-10-12) and DEV event #80 agree on **18 October, 11:59 PM PDT**, or **19 October 2026, 12:29 PM IST**. The MLH Week 2 mirror (`01a0f82a-6a2b-1e14-d612-d15f177f3d0c`) instead returns `2026-10-18T06:59:00Z`, or **18 October, 12:29 PM IST**. Use the challenge-specific DEV rules as authority, and aim before the earlier timestamp to avoid the discrepancy.

## Evidence still required

Real Gemma API inference is verified. The reviewed export is saved as `evidence/gemma-proposal.md`, alongside the real-run screenshot. A public source link and video or deployed demo remain for the submission package. First-user feedback is optional and must reflect a real interaction. GitHub Actions has only been prepared locally. See `VERIFICATION.md` for what has actually passed.
