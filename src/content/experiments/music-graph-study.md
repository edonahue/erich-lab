---
slug: music-graph-study
title: Music-Credit Graph Study Lab
summary: A concept guide, Discogs data module, architecture plan, adaptive quiz, and flashcard lab for a distributed music-credit graph.
status: Prototype
kind: Study tool
technologies:
  - Python
  - Discogs API / Data Dumps
  - Docker Swarm
  - Redis / RQ
  - Parquet / DuckDB
  - PostgreSQL
  - Astro / Svelte
sourceUrl: https://github.com/edonahue/erich-lab/tree/main/public/experiments/music-graph-study
published: true
featured: true
created: 2026-06-27
updated: 2026-06-29
image: /images/experiments/music-graph-study.svg
offline:
  status: full
  note: The single-file edition includes the complete build plan, Discogs acquisition module, concept guide, official-reference links, quiz, flashcards, theme support, and browser-local progress tracking.
  formats:
    - type: html
      label: Download offline HTML
      href: /downloads/music-graph-study.html
      filename: music-credit-graph-study-lab.html
      note: Save one self-contained HTML file and open it in a modern browser without a local server. External documentation links still require connectivity.
---

This study lab separates transferable technology concepts from the decisions made for one specific music-credit graph build. A dedicated Discogs module now turns the catalog source into an explicit acquisition, identity, rights, and normalization plan.

## Build plan

The project begins with a private collection-derived seed, expands through adjacent catalog credits, and then scales toward a broader evidence-bearing graph. An SSD-backed x86 host initially performs the Ansible control-node, Docker Swarm manager, and application-state roles. Four Raspberry Pi 3B workers run a consistent 64-bit operating system and execute bounded jobs against versioned read-only graph snapshots.

The guide explicitly documents the tradeoffs:

- A single Swarm manager is intentionally simple but not highly available
- PostgreSQL, Redis, and canonical snapshots are pinned and backed up rather than treated as portable stateless services
- Redis and RQ handle operational background jobs, while Dask remains an optional advanced experiment
- Parquet, DuckDB, and PostgreSQL have distinct analytical and transactional responsibilities
- Memory-mapped adjacency arrays are a leading design subject to a benchmark gate, not a foregone conclusion
- The private collection seeds development, while public outputs use derived catalog paths and aggregate descriptions
- Static daily or curated challenges ship before bounded live arbitrary-artist search

## Discogs data module

The selected acquisition plan is hybrid and dump-first:

- Discogs Spinner may provide an optional, private export of owned release IDs, but the projects remain separate
- Monthly Discogs releases, artists, and masters dumps provide the first durable CC0 catalog snapshot
- The labels dump is deferred until a concrete product or data-model need appears
- A centralized API client handles targeted gaps, validation, and recent changes
- Pi workers process bounded immutable records without receiving the Discogs credential
- Original role text, PAN and ANV identity, release-versus-master semantics, track scope, and linked-versus-non-linked credits survive normalization
- Public API-derived displays must satisfy the current Discogs freshness, notice, linking, and restricted-data rules

The module also compares the very different download sizes of the four dumps, includes safe `lxml.iterparse` and API-rate-state exercises, and provides a project-preparation checklist. The implementation project lives in the separate [Networked Players repository](https://github.com/edonahue/networked-players), which has since moved past planning into a first tested vertical slice: a versioned monthly manifest, resumable checksummed downloads, streaming release/track/credit normalization, Zstandard Parquet output, and DuckDB validation. No deployed application, public API, or full catalog is claimed yet.

## Concept guide

Dedicated sections explain the underlying tools independently of this project, including:

- Ansible control nodes, inventories, playbooks, and idempotency
- Containers, images, and multi-platform builds
- Swarm managers, workers, services, tasks, and single-manager recovery
- RQ job queues compared with Dask task graphs
- Parquet, DuckDB, and PostgreSQL
- Bipartite graphs, projections, breadth-first search, and evidence paths
- Compact adjacency arrays and memory mapping
- Typed APIs, static-first delivery, Cloudflare Tunnel, and Tailscale
- Testing layers, provenance, observability, and Discogs data-use boundaries

Each concept includes an “Applied here” explanation, practical examples where useful, and links to official or primary documentation.

## Study modes

The adaptive quiz and flashcards are split into:

- **Technology concepts** for transferable understanding
- **Build decisions** for the selected architecture and its tradeoffs
- **Mixed review** for combined retrieval practice

The deeper Discogs module adds questions and cards across source selection, API behavior, identity, credits, rights, and ingestion decisions. Concept and build-decision mastery are tracked separately in the browser.

## Offline edition

The full guide, Discogs module, exercises, references, quiz, and flashcards are generated as one downloadable HTML file. It contains its styles and scripts inline, preserves progress locally, and can be opened directly without running a local web server. External reference links naturally require a connection.

## Public and private boundaries

These pages describe logical roles, technologies, algorithms, tradeoffs, source contracts, and measured outcomes rather than publishing a detailed map of the home network. Exact inventory, collection membership, addressing, storage paths, deployment commands, backup procedures, credentials, and operational runbooks remain private.
