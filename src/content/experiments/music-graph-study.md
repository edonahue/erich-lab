---
slug: music-graph-study
title: Music-Credit Graph Study Lab
summary: A concept guide, architecture plan, adaptive quiz, and flashcard lab for a distributed music-credit graph.
status: Prototype
kind: Study tool
technologies:
  - Python
  - Docker Swarm
  - Redis / RQ
  - Parquet / DuckDB
  - PostgreSQL
  - Astro / Svelte
sourceUrl: https://github.com/edonahue/erich-lab/tree/main/public/experiments/music-graph-study
published: true
featured: true
created: 2026-06-27
updated: 2026-06-28
image: /images/experiments/music-graph-study.svg
offline:
  status: full
  note: The single-file edition includes the complete build plan, concept guide, official-reference links, quiz, flashcards, theme support, and browser-local progress tracking.
  formats:
    - type: html
      label: Download offline HTML
      href: /downloads/music-graph-study.html
      filename: music-credit-graph-study-lab.html
      note: Save one self-contained HTML file and open it in a modern browser without a local server. External documentation links still require connectivity.
---

This study lab now separates transferable technology concepts from the decisions made for one specific music-credit graph build.

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

Concept and build-decision mastery are tracked separately in the browser.

## Offline edition

The full guide, exercises, references, quiz, and flashcards are generated as one downloadable HTML file. It contains its styles and scripts inline, preserves progress locally, and can be opened directly without running a local web server. External reference links naturally require a connection.

## Public and private boundaries

These pages describe logical roles, technologies, algorithms, tradeoffs, and measured outcomes rather than publishing a detailed map of the home network. Exact inventory, collection membership, addressing, storage paths, deployment commands, backup procedures, and operational runbooks remain private.
