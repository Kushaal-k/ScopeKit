# Real Gemma smoke test

`gemma-run.json` records an actual local `gemma3:1b` response through ScopeKit's HTTP API. The florist scenario is synthetic and was written specifically for this test. It is separate from the hand-written pottery-studio sample.

Observed result: the model identified a one-page website, bouquet gallery, and contact form. It proposed only two hours total, which is too low to treat as a dependable estimate. It mentioned basic phone compatibility only through the exclusions rather than a separate deliverable. A reviewer should ensure mobile behavior is included in the final agreed scope.

The screenshot and `gemma-proposal.md` came from a real browser generation using this brief. During UI testing, the suggested hours were manually changed to 5, 3, and 3. At $50/hour with 15% contingency, that produces $632.50 and a 50% deposit of $316.25. These edits demonstrate the review workflow; they are not expert estimates or evidence of a sale.

Source passages are attached in code by matching task words, with aliases such as phones/mobile. They are exact substrings, but matching is only a traceability aid. No claim is made that the output is complete or semantically correct.

The 3.26-second API timing is from one warm run on this device with the model already loaded. It cannot establish typical latency, cold-start performance, or accuracy. No first user, paying customer, or deployment is represented by this test.
