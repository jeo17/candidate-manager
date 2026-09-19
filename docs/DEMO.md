# Suggested 2–3 minute submission demo

This is a recording checklist, not a claim that a video has been recorded.

1. **0:00–0:20 — Run it.** Show `npm start` launching JSON Server on 3000 and Vite on 5173. Open `/candidatures` on the API to show the supplied records.
2. **0:20–0:50 — Find a candidate.** Open the app and DevTools Network. Search for Sophie; point out `q=`. Clear, combine a skill with a stage/date filter, change sort, and paginate. Show the query parameters and total header.
3. **0:50–1:25 — Review a profile.** Open a candidate, show the dedicated GET, update the stage, and add a note under your name. Show both PATCH requests and reload to demonstrate persistence.
4. **1:25–1:50 — Use the board.** Clear filters and switch views. Drag a card between stages, then demonstrate its keyboard/touch stage select. Toggle dark mode and resize to mobile.
5. **1:50–2:20 — CRUD.** Create a clearly named demo candidate, edit its details, and delete it with confirmation. Use a copy of the data if preserving the initial dataset matters.
6. **2:20–2:45 — Reliability and architecture.** Briefly stop the API or use DevTools offline, refresh, show error/retry, then restore it. Point to the thin pages, feature store/API, tests, and report. Mention the JSON Server collaboration limitation.

Before recording, rehearse the flow and close unrelated browser tabs. If choosing deployment instead, both the app and a persistent API must be hosted and `VITE_API_URL` set at build time; deploying only the frontend does not satisfy the brief.
