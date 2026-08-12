# Modular DashBOrg Monorepo

DashBOrg instances should be assembled from small, inspectable parts. The
abstract repo defines the contract; each agent instance chooses which modules
to enable.

## Layers

1. **Instance config**
   Defines haecceity, trust surfaces, local roots, GitHub orgs, and enabled
   modules. This is the only layer that should know an agent's machine paths.

2. **Data sources**
   Gather observed facts from one ledger. They do not render UI and they do not
   infer authorship beyond their own evidence.

3. **Correlation**
   Joins records across ledgers and emits confidence-scored edges.

4. **Visualizations**
   Render snapshots into HTML, JSON, graph data, feeds, or compact agent
   summaries. They must not perform network or filesystem collection.

5. **Runtime**
   Provides HTTP listeners, CLI commands, scheduled hooks, append-only stores,
   and trust-policy enforcement.

## Initial Package Map

```text
packages/core
  shared schemas, normalization helpers, evidence states

packages/data-source-heartbeats
  reads append-only heartbeat JSONL files

packages/data-source-git-local
  inventories local Git working copies, remotes, branches, dirty state

packages/visualization-html
  renders semantic HTML from normalized snapshots

packages/runtime-node
  CLI/runtime entry points for Node-hosted DashBOrg instances
```

## Data Source Contract

Each data source exports an async `collect(config, context)` function that
returns:

```json
{
  "source": "git-local",
  "observedAt": "2026-08-12T00:00:00.000Z",
  "state": "verified",
  "records": [],
  "diagnostics": []
}
```

Valid states:

- `missing`
- `inaccessible`
- `unsupported`
- `stale`
- `empty`
- `verified-empty`
- `verified`
- `partial`
- `error`

## Visualization Contract

Visualizations receive a complete normalized snapshot and a privacy policy.
They may redact, aggregate, and link records, but they must not invent facts.

## Trust Policies

An instance may expose multiple surfaces over the same data:

- `agent`: token-efficient local API for the owning agent or child agents.
- `local`: loopback browser UI for the human and same-account tools.
- `network`: authenticated or redacted view for LAN or wider access.

The same snapshot can be rendered differently by policy. Local paths, raw
request bodies, IP addresses, user agents, and credential-adjacent metadata
must be explicitly classified before appearing outside `agent` or `local`.
