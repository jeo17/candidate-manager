# UX analysis

## Problems and response

| Recruiter problem                         | Implemented response                                                                                                             | Deliberate limit                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Too many applications to scan             | Server pagination; name, role, experience, stage, skills, and date visible together; global pipeline counts                      | Table is horizontally scrollable on narrow screens                                               |
| Finding a relevant profile takes too long | Debounced full-text `q` search combined with stage, skill, position, date range, and exact experience filters; sorting and reset | Supplied data has free-text experience; a normalized numeric field would improve range filtering |
| Losing context between visits             | Persist filters and preferred view; keep page state during in-app navigation                                                     | Filters are local preferences, not shareable URLs                                                |
| Understanding the next step               | Clear stage badges, profile stage menu, board columns, and drag/drop                                                             | Board is explicitly current-page only                                                            |
| Coordination between recruiters           | Named, timestamped notes stored on the candidate; a fresh read before appending                                                  | JSON Server cannot provide atomic collaboration or live conflict resolution                      |
| Unclear whether an action succeeded       | Immediate optimistic feedback, disabled duplicate writes, success/error notifications, rollback on failure                       | No automatic retry of writes, avoiding unintended duplicate creates/comments                     |
| Slow or unavailable API                   | Dedicated loading, empty, error, retry, timeout, and missing-record feedback                                                     | No offline writes or fake fallback dataset                                                       |
| Accidental data loss                      | Destructive-action confirmation and unsaved edit navigation prompt                                                               | No backend soft-delete or undo history                                                           |
| Different screens and input methods       | Responsive shell, semantic table/forms, visible focus, native modal, keyboard stage selects, reduced motion                      | Native dragging is supplemented by selects for touch and keyboard                                |

## Visual direction

The references informed the green/neutral palette, summary cards, skill tags, stage indicators, and candidate table. The layout uses a compact scrolling header and clickable breadcrumbs. The sidebar, promotional text, card descriptions, and footer slogans have been removed; visible copy focuses on data, actions, and necessary guidance.

All controls and system messages are English. Existing candidate content, names, notes, and cover letters remain unchanged; known French roles/statuses/availability are translated at the presentation boundary. API requests retain the original French values.

## Main journeys

1. Scan overview → search/filter → open profile → change stage/add note.
2. Add candidate → validate essentials → save via API → inspect profile.
3. Switch to board → drag candidate or select stage → save → refresh counts.
4. Edit profile → save; or delete → confirm → return to list.
5. Encounter an API error → read meaningful feedback → retry without losing filters.
