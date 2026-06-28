---
slug: music-graph-study
title: Music-Credit Graph Study Lab
summary: An adaptive architecture guide for a collection-seeded, distributed music-credit graph and its static-first public game.
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
---

This study lab captures the selected architecture for a music-credit graph that begins with a personal record collection, expands through adjacent credits, and then scales toward a broader catalog.

## Architecture direction

An SSD-backed x86 control node coordinates four Raspberry Pi 3B+ workers over a compact wired network. An optional workstation-class machine can accelerate large data builds without becoming a dependency for the public experience.

The selected stack uses:

- Ansible for repeatable host setup
- Docker Swarm for service placement
- Redis and RQ for independent Python work batches
- Parquet and DuckDB for durable analytical data
- PostgreSQL for search, challenge, and snapshot state
- Compact memory-mapped adjacency arrays for the production graph
- NetworkX for small fixtures and algorithm validation
- Astro with a Svelte island for the public game

Dask remains an optional advanced study module rather than the operational job system.

## Product sequence

The first playable release is a static daily or curated challenge that remains available without a live home service. Arbitrary two-artist search is a committed second phase, exposed through a bounded API only after the graph and failure behavior are proven.

## Public and private boundaries

These pages intentionally describe logical roles, technologies, and data flow rather than publishing a detailed map of the home network. Exact inventory, addressing, storage paths, deployment commands, backup procedures, and operational runbooks will live in a separate private infrastructure and data-operations repository.

## What is included

- A revised architecture and technology guide
- Adaptive questions covering the selected stack
- Flashcards for implementation review
- Logical architecture diagrams without private topology details
- Browser-local mastery tracking with no account or backend
