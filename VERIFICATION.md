# Verification — 16 October 2026

- Python 3.10.12: all **19 unit and HTTP integration tests passed**.
- JavaScript syntax check: passed with `node --check static/app.js`.
- Python compilation: passed.
- Browser: sample scope renders with source excerpts and explicit sample labeling.
- Browser: rate change from $50 to $60 recalculates the total from $747.50 to $897.00 and updates an untouched reply.
- Browser: manually edited reply survives a rate change, a review reminder appears, and Refresh reply rebuilds the text from the current quote.
- Browser: copyable export fallback was opened and its actual Markdown inspected. The $897.00 total and $448.50 deposit matched the quote; a sample export is saved as `sample-proposal.md`. The in-app browser did not expose a downloadable-file path.
- Browser: no JavaScript console errors in the final sample flow.
- Mobile: checked at 390 × 844; no horizontal overflow.
- Real model inference: **passed** through the actual ScopeKit API with local `gemma3:1b`, CPU-only portable Ollama, and cloud inference disabled. Model digest and the unedited response are in `evidence/gemma-run.json`. The recorded 3.26-second run used an already loaded model; it is not a cold-start or performance benchmark.
- Real browser generation: passed with the same original florist brief. The UI shows the Gemma model provenance, exact source passages, and editable hours.
- Reviewed real export: `evidence/gemma-proposal.md` contains Gemma provenance, 11 manually adjusted planning hours, a $632.50 estimate, and a $316.25 deposit. These are example estimates, not a paid quote or validated effort prediction.
- Model quality limit: the raw model suggested just 2 hours in total and did not list mobile compatibility as a separate task. Its wording and estimates require human review. Exact passages are attached using word overlap and aliases, not semantic proof; matching does not guarantee completeness or prevent all overlapping tasks.
- Investigation: initial model-authored quotes were invented and rejected. Constraining quote choices still produced mismatched evidence. The final design assigns this mechanical source-linking step to code and rejects task names without matching source words.
- Portable runtime: official archive CPU files were extracted under `work/`, checked against ZIP CRCs, and the Ollama executable's Windows signature was valid. Gemma's model pull passed Ollama's SHA-256 verification. Model/runtime files and the authorized home configuration are excluded from the project source ZIP.
- Launcher check: an existing Ollama instance is reused; no duplicate subprocess is started.
- User interviews, willingness to pay, and business outcomes: **not tested**.
- Publication/submission: **not performed**. The DEV entry is an editable local draft.

The sponsor audit and official Side Hustle template are reflected in `SPONSOR-AUDIT.md` and `SUBMISSION.md`. A public source link, public demo recording, and first GitHub Actions run remain to be supplied. The local screenshot and real-generation export are included as evidence.

## Appearance and publishing preparation

- Light, Dark, and System appearance preferences persist across reloads.
- Theme, currency, and model menus share the same surfaces and support keyboard navigation and dismissal.
- Currency selection updates the sample quote and reply. Mobile checks at 390 px and tablet checks at 768 px showed no horizontal overflow.
- The 19 Python tests were rerun successfully before the initial repository push; JavaScript syntax validation also passed.
- Source repository: https://github.com/Kushaal-k/ScopeKit. Check GitHub Actions for CI results; local verification does not establish a successful hosted run.
