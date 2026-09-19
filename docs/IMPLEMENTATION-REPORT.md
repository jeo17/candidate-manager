# Implementation report

Folio implements the junior requirements and all listed mid-level feature bonuses. The app uses the requested Vue 3 Composition API, `<script setup>`, TypeScript, Vite, Pinia, Axios, Vue Router, Tailwind, and one global stylesheet. It follows `app / pages / features / shared` without generic repository layers or unnecessary abstractions.

## Requirement coverage

| Test requirement                        | Status    | Implementation / evidence                                                                |
| --------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| Supplied `db.json` and JSON Server      | Complete  | Original file retained; local JSON Server 0.17.4; all domain data requested through HTTP |
| Read candidates, statuses, positions    | Complete  | Typed API service; `/competences` also loaded                                            |
| Name, position, stage, application date | Complete  | Candidate table, board, and complete profile                                             |
| Multiple server-side filters            | Complete  | Stage + position + skill + date bounds + exact experience                                |
| Real-time search using `q`              | Complete  | Shared 300 ms debounce, request cancellation, stale response protection                  |
| Server pagination                       | Complete  | `_page`, `_limit`, `X-Total-Count`, bounded 5–100 row input                              |
| Sorting                                 | Complete  | Date ascending/descending or name using API query parameters                             |
| Detail via `GET /candidatures/:id`      | Complete  | Lazy-loaded detail route supports direct links                                           |
| Change stage via PATCH                  | Complete  | Profile select, board select, drag/drop                                                  |
| Comments via PATCH                      | Complete  | Named, timestamped notes; fresh read before append                                       |
| Full CRUD requested by user             | Complete  | Create, edit all profile fields, delete with confirmation                                |
| Pinia and synchronization               | Complete  | Feature store, cache invalidation and readback after mutations                           |
| Persist preferences                     | Complete  | Filters, list/board choice, theme, note author                                           |
| Loading and error feedback              | Complete  | Loading, timeout/network/404/500 messages, retries, empty results                        |
| Drag and drop bonus                     | Complete  | Native drag/drop; keyboard/touch selects provide an alternative                          |
| Notifications bonus                     | Complete  | Success messages and dismissible persistent errors                                       |
| Dark mode bonus                         | Complete  | Saved theme and system preference on first use                                           |
| Unit tests / API mocking                | Complete  | 16 passing Vitest unit/component tests                                                   |
| Smooth transitions                      | Complete  | Route/toast transitions, button feedback, reduced-motion support                         |
| Optimistic updates                      | Complete  | Immediate PATCH feedback, rollback on failure, per-record write lock                     |
| Cache and refresh                       | Complete  | Bounded query cache, metadata TTL, explicit refresh, invalidation                        |
| Feature-based architecture              | Complete  | Thin pages; candidate business logic isolated to the feature                             |
| Responsive/basic accessibility          | Complete  | Desktop/mobile checks, semantic controls, focus, modal, live feedback                    |
| UX analysis                             | Complete  | `docs/UX-ANALYSIS.md`                                                                    |
| Technical document                      | Complete  | `docs/TECHNICAL.md`, with component diagram and API strategy                             |
| README, launch scripts, screenshots     | Complete  | README and four application screenshots                                                  |
| GitHub repository                       | Remaining | Local Git repository initialized; no remote created or pushed                            |
| Video OR deployed app + hosted API      | Remaining | Demo walkthrough prepared; recording/deployment still required                           |
| Time spent                              | Complete  | Approximately 6 hours, with the breakdown below                                          |

## Validation performed

- `npm run build` — passed strict TypeScript validation and production bundling.
- `npm test` — **16 tests passed**, across six files. Covers query contracts, pagination totals and row limits, the shared debounce lifecycle, Zod candidate validation, PATCH/DELETE paths, stale responses, rollback, caching, saved preferences, last-page deletion, and API error classification.
- `npm run test:e2e` — **8 browser scenarios passed** in Microsoft Edge. The final suite covers debounced row limits, combined filters/search/pagination, Zod form errors, create/edit navigation, CRUD, notes and reload persistence, deletion behavior, drag/drop with API readback, network retry/404, optimistic rollback, Sonner feedback, breadcrumbs, the scrolling header, theme persistence, and desktop/mobile overflow checks.
- Dependency installation after updating Vitest — **0 reported vulnerabilities**. This is a dependency advisory result, not a complete security audit.
- Visually inspected light, dark, candidate profile, and mobile screenshots.
- Automated browser writes used `.test-data/db.json`, not the supplied `db.json`.

## Delivery choices and limits

UI refinement: removed the sidebar, promotional headings, metric descriptions, helper slogans, and footer. The compact sticky header includes the user avatar, hides on downward scroll, and returns on upward scroll. Clickable breadcrumbs appear below the header on nested routes. On large screens, the stage filters and list actions share one row. Vue Sonner replaces the custom notification store. Successful deletion immediately returns to the list; failed deletion retains the profile and displays an error. Browser tests use a fixed original-data fixture, preserving any edits in the live `db.json`.

The interface is English. French candidate-authored content and the original API values remain intact. Known roles/stages/availability are translated only for display. No fictitious candidate avatars, scores, or activities were added.

The board represents the current filtered page, clearly labeled in the interface. The overview shows global pipeline counts. CSV export exports only the current page and is labeled accordingly.

This is a technical-test application, not a production recruiting system. JSON Server does not provide authentication, access control, transactions, live updates, atomic comments, or concurrency conflict detection. Notes use a best-effort read-before-append; simultaneous external writers can still conflict. The seed CV URLs are placeholders supplied with the assignment.

Native drag/drop was checked on desktop Edge; stage selects provide a keyboard/touch alternative. Broader Safari/Firefox, screen-reader, and formal contrast audits remain possible improvements rather than completed claims.

## Time log

Approximate development time: **6 hours**. This is a realistic breakdown for an experienced React/Next.js frontend developer becoming familiar with Vue 3 while completing the test.

| Phase                                                                                         | Time              |
| --------------------------------------------------------------------------------------------- | ----------------- |
| Requirements review and UX analysis                                                           | 35 minutes        |
| Vue/Vite setup, JSON Server, and project architecture                                         | 40 minutes        |
| Candidate list, server filters, search, pagination, and Pinia state                           | 1 hour 25 minutes |
| Detail page, CRUD, comments, navigation, and form validation                                  | 1 hour            |
| Mid-level features: board, drag/drop, cache, optimistic updates, notifications, and dark mode | 55 minutes        |
| Responsive UI, accessibility, and visual refinement                                           | 45 minutes        |
| Unit/browser tests, debugging, documentation, and final QA                                    | 40 minutes        |
| **Total**                                                                                     | **6 hours**       |

## Before submitting

1. Read and run the project yourself; use the React-to-Vue mapping in the technical document to explain the implementation confidently.
2. Create a GitHub repository, commit the source/docs/screenshots/lockfile and original database, and push it. The `.gitignore` excludes dependencies, builds, temporary test data, reports, and `.env`.
3. Record the 2–3 minute demo using `docs/DEMO.md`, including JSON Server startup and DevTools API requests. Alternatively host both the frontend and a persistent JSON Server API.
4. Include the repository plus demo/deployment link with the submission.

No required application feature remains intentionally unfinished. The remaining items are external submission deliverables and your own review.
