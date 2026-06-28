# ADR 0001: Preserve portable standalone experiments

- **Status:** Accepted
- **Date:** 2026-06-28
- **Scope:** Lab-wide

## Context

The lab needs a shared catalog, metadata, theme, and deployment system without forcing every small experiment into the Astro component model. Some artifacts should remain useful as a folder of plain HTML, CSS, and JavaScript or as one downloadable HTML file.

## Decision

Astro owns the catalog and project-note pages. Each runnable experiment remains under `public/experiments/<slug>/` with a technical `experiment.json` manifest. A build script generates the shared public wrapper and any declared offline artifact around the maintained standalone entry file.

## Alternatives considered

- **Build every experiment as an Astro page:** stronger framework integration, but weaker portability and more ceremony for tiny artifacts.
- **Hand-author every wrapper:** initially simple, but duplicates theme, navigation, indexing, and download behavior.
- **One repository per experiment:** appropriate after graduation, but excessive for early studies and prototypes.

## Consequences

### Benefits

- Tiny artifacts remain valid.
- Experiments can be downloaded or promoted without rewriting their core application.
- Wrapper behavior is consistent and generated from one template.

### Costs and risks

- Editorial metadata and technical packaging live in separate files.
- The build must validate that the two agree on slug and title.
- Framework features are not automatically available inside standalone applications.

## Validation

The Music-Credit Graph Study Lab must build an indexable wrapper, a noindexed inner app, a self-contained offline edition, and pass the browser smoke suite from one manifest.

## Revisit trigger

Reconsider if most new experiments require shared Astro components or server-rendered behavior and the standalone boundary creates more duplication than portability value.

## Public and private implications

The public repository documents the packaging contract. Exact operational infrastructure for data-backed experiments may remain in private repositories.
