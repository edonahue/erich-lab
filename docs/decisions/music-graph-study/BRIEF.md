# Experiment Brief: Music-Credit Graph Study Lab

## Intent and audience

Build a self-contained study artifact that separates transferable technology concepts from the decisions made for one specific music-credit graph project. The audience is primarily the author — this is a working reference that can be opened offline on a tablet or laptop while doing the actual infrastructure work.

## Public outcome

Visitors can read the build plan and concept guide, run adaptive quizzes and flashcards in two separate banks (technology concepts and build decisions), track their own mastery locally, and download a single self-contained HTML file that works without an internet connection. External reference links still require connectivity.

## Current maturity

- Status: Prototype
- Experiment level: 3
- Definition of the current release: study guide, architecture plan, adaptive quiz, flashcard deck, and offline artifact. No live backend. No actual graph data exposed.

## Core interaction

Open the app, choose a study section (Build plan, Concepts, Quiz, Flashcards, References), and navigate freely. The quiz adapts to correct and incorrect answers. Flashcard mastery and quiz progress persist in localStorage independently for concept and build-decision banks. The offline HTML download enables study without a running web server.

## Data sources and rights

- Sources: No third-party data. All study content is original authorship describing publicly documented technologies (Ansible, Docker Swarm, Redis, RQ, Parquet, DuckDB, PostgreSQL, etc.) and the author's own architectural decisions.
- Access method: N/A — no external data fetches at runtime.
- License or terms: N/A for third-party data. Official documentation links embedded in the References section are read-only hyperlinks, not redistributed content.
- Restricted fields: None.
- Attribution or linking: Official documentation links maintained in the References section.
- Offline redistribution: The offline edition bundles only original authorship and inline style/script. No third-party assets are bundled.

## Public and private boundary

### Public

- Logical roles (control host, Swarm manager, workers, optional build node)
- Technology choices and tradeoffs (Ansible, Swarm, Redis/RQ, Parquet/DuckDB/PostgreSQL)
- Data flow architecture (collection seed → normalization → graph → static artifacts)
- Graph algorithms (BFS, bipartite projection, adjacency arrays, evidence paths)
- Study guide content and quiz/flashcard banks
- Build decisions and their explicit tradeoffs
- Product sequence (static MVP → bounded live search → later modes)

### Private

- Specific machine makes, models, and serial numbers beyond logical role descriptions
- Hostnames, IP addresses, port assignments, and physical network topology
- Personal music collection membership
- Ansible inventories, playbooks, credentials, and vault secrets
- Swarm stacks, service names, and environment variables
- Backup destinations, retention policies, and restore commands
- Tunnel configuration and access credentials
- Incident details that increase attack surface

## Architecture roles

| Role                        | Technology choices                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Infrastructure control      | Ansible (control node on the state host)                                               |
| Orchestration               | Docker Swarm (one manager initially)                                                   |
| Async jobs                  | Redis + RQ                                                                             |
| Analytical storage          | Parquet + DuckDB                                                                       |
| Mutable application state   | PostgreSQL                                                                             |
| Graph traversal             | BFS over compact adjacency arrays (leading design, benchmark-gated)                    |
| Public delivery             | Static Astro site; live search as bounded phase two                                    |
| Worker nodes                | Four Raspberry Pi 3B nodes running 64-bit OS, bounded jobs against read-only snapshots |
| Optional build acceleration | Workstation-class node for ingest, compaction, image builds                            |

## Chosen technologies

| Concern               | Choice                   | Why it fits                                                    |
| --------------------- | ------------------------ | -------------------------------------------------------------- |
| Host configuration    | Ansible                  | Idempotent, agentless, well-documented for small clusters      |
| Service orchestration | Docker Swarm             | Simpler than Kubernetes for one manager; built into Docker     |
| Job queuing           | Redis + RQ               | Stateless retryable tasks; simpler than Celery or Dask         |
| Analytical format     | Parquet                  | Columnar, immutable, portable across tools                     |
| In-process analytics  | DuckDB                   | Fast Parquet validation and transforms; no server process      |
| Application state     | PostgreSQL               | Mutable game state, scoring, and provenance                    |
| Graph format          | Compact adjacency arrays | Memory-mapped, fast traversal; benchmark-gated vs libraries    |
| Public delivery       | Astro static site        | Remains useful offline; live API is additive, not foundational |

## Alternatives considered

| Decision                      | Alternatives                               | Why not now                                                                               | Revisit trigger                                                   |
| ----------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Swarm vs Kubernetes           | Kubernetes, Nomad                          | Kubernetes control-plane overhead for 5 nodes; Nomad less familiar                        | If operational complexity or ecosystem gaps grow                  |
| RQ vs Celery vs Dask          | Celery (more features), Dask (task graphs) | Celery heavyweight for simple retryable tasks; Dask reserved for dependent-task workloads | If jobs need coordination or distributed collections              |
| Adjacency arrays vs libraries | NetworkX, iGraph, Neo4j                    | Libraries carry memory and process overhead at scale; arrays are measurable               | Benchmark shows inadequate improvement; or graph complexity grows |
| Static first vs live MVP      | Live arbitrary search as MVP               | Home uptime and API hardening become launch dependencies                                  | If static challenges are insufficient for the use case            |
| PostgreSQL vs SQLite          | SQLite                                     | SQLite adequate for single-node but Swarm-hostile for replicated state                    | If the cluster remains single-node long-term                      |

## Offline and failure behavior

The study guide, quiz, and flashcards are fully functional offline. Progress is stored locally. The offline HTML download contains all styles, scripts, and content inline; no web server is required. External reference links (official docs) require connectivity. No backend or API is required for the current study tool — the live graph API is a future phase-two addition.

## Accessibility

- Keyboard path: full tab navigation; tab/role panel switching; flashcard flip via Enter/Space; all quiz actions keyboard-accessible.
- Focus behavior: visible focus rings on all interactive elements; focus managed on view transitions.
- Reduced motion: quiz and flashcard reveal use CSS transitions; `prefers-reduced-motion` respected via media query in study.css.
- Mobile constraints: responsive single-column layout; touch targets meet minimum sizes; horizontal scroll eliminated in tables via overflow-x.
- Manual checks: keyboard navigation, screen reader section/tab semantics, and iOS Safari layout confirmed before each major update.

## Testing

- Static and schema checks: `npm run validate` (Zod content validation, manifest cross-check, generated artifact presence, indexing rules).
- Browser smoke tests: Playwright tests cover homepage, project notes, wrapper launch, study section navigation, localStorage persistence, offline download link, and sitemap output.
- Data or API tests: N/A — no live data fetches in the current release.
- Manual acceptance checks: open study lab, run through all five sections, confirm quiz adapts, confirm flashcard flip, download offline HTML and open without a server.

## Definition of done

- [x] Study guide covers build plan, concepts, and explicit tradeoffs
- [x] Quiz and flashcard banks are split into technology concepts and build decisions
- [x] Offline single-file HTML download generated and linked
- [x] Progress persists in localStorage per bank
- [x] Wrapper page is indexable; inner app and download are noindexed
- [x] Project notes page published with BlogPosting schema
- [x] Dark and light theme supported throughout
- [ ] Live graph API (phase two — not required for current release)
- [ ] Static challenge artifacts (phase two)

## Graduation or retirement criteria

Graduate when the live graph API is live and the public challenge experience moves to its own repository or deployed service. The study tool may remain in the lab indefinitely as a reference artifact even after the product matures.
