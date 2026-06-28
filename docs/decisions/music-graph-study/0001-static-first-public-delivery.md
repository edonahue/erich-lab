# ADR 0001: Make the music graph public experience static first

- **Status:** Accepted
- **Date:** 2026-06-28
- **Scope:** music-graph-study

## Context

The graph project may eventually expose live arbitrary-artist search from a home-hosted API. The public experience should not become unavailable whenever the home cluster, internet connection, or maintenance window is unavailable.

## Decision

The first public product will use static daily or curated challenges, evidence paths, and published findings. Live arbitrary-artist search is a bounded phase-two enhancement. The interface must communicate service unavailability without removing the static experience.

## Alternatives considered

- **Live search as the MVP:** immediately demonstrates the full graph, but makes home uptime and API hardening launch dependencies.
- **Cloud-host the entire graph:** improves availability but creates cost, operational, and data-publication decisions before the product is validated.
- **Never expose live search:** simplest, but unnecessarily limits the eventual interactive value.

## Consequences

### Benefits

- The public site remains useful during home-service outages.
- Static output can be cached, downloaded, tested, and shared easily.
- API security and performance can be validated independently.

### Costs and risks

- Static challenges do not initially support arbitrary exploration.
- Publication pipelines need versioned challenge and evidence artifacts.
- The UI must clearly distinguish static content from optional live capability.

## Validation

Disable the home API and confirm that the public challenge, evidence display, project notes, and offline study edition remain usable.

## Revisit trigger

Reconsider the hosting split if live search becomes the dominant use case or if a low-cost managed graph service clearly reduces operational complexity.

## Public and private implications

The public architecture describes bounded live search and graceful degradation. Tunnel configuration, hostnames, addresses, and recovery commands remain private.
