# Dashborg

Dashborg is an agent-centered, GitHub-org-centric view of an agent's
repositories, issues, projects, tasks, relationships, and local stewardship
state across every GitHub organization in its purview.

The repository name is both an abstract class and a protocol boundary:

```text
DashBOrg-of/dashborg-of  -> abstract contract
DashBOrg-of/<agent-name> -> one agent/machine instance
```

## Core model

A dashborg joins four kinds of state:

- GitHub state: organizations, repositories, branches, issues, projects, PRs,
  rulesets, permissions, and remote refs;
- local stewardship state: worktrees, folder casts, branch claims, remotes,
  pending mutations, verification records, and handoffs;
- agent identity state: harness, workspace, session, q-semver, compaction/
  instance number, parent, and child lineage links;
- relationship state: dependencies and ownership edges among organizations,
  repositories, quests, skills, hooks, agents, and tasks.

The source of truth remains the underlying GitHub API, local repositories, and
durable harness records. A dashborg is a projection with explicit evidence
coordinates, not a replacement database that silently invents state.

## Three interfaces and three privacy scopes

Each instance reserves three ports and exposes the same model through three
access methods:

| Scope | Intended audience | Access method |
| --- | --- | --- |
| agent | current agent and parent/child agents | token-efficient JSON/CLI contract |
| local | user on the host machine | loopback web dashboard |
| network | authorized user or agent on LAN/internet | authenticated web/API gateway |

The exact port numbers are instance configuration, never hard-coded by the
abstract class. A default allocation reserves consecutive ports for agent,
local, and network surfaces.

## Agent contract

An agent must be able to ask for a compact snapshot containing:

```text
identity: harness, session, q-semver, instance number
lineage: parent, children, upstream/downstream links
github: orgs, repos, branches, PRs, issues, projects, tasks
local: worktree, cast path, remote, branch, dirty state, claimed mutations
relationships: foreign keys and evidence coordinates
health: stale, inaccessible, unsupported, verified, or pending states
```

Responses must distinguish `missing`, `inaccessible`, `unsupported`,
`stale`, `empty`, and `verified-empty`. This prevents private GitHub state or
failed searches from being represented as absence.

## Human dashboard contract

The human view should render the same snapshot as a navigable graph and a
compact activity stream. It must show the current instance, q-semver,
compaction count, dungeon/ungeon context, org and repository status, open
issues/PRs, worktree claims, and evidence freshness. It should expose links up
and down the agent lineage without exposing private payloads outside the
selected privacy scope.

## Sister repositories

The intended namespace is:

```text
quests-of/foo       problem space and unfinished edges
skill-of/foo        reusable mental solving contract
hooks-of/foo        durable automation and regression prevention
dashborg-of/foo     live org-centric projection and dashboard
```

Dashborg consumes the other three surfaces; it does not replace them. The
abstract class becomes stable only when multiple agent lineages and harnesses
can produce equivalent snapshots.

## Modular SDK Layout

The repository is now shaped as a small monorepo:

```text
packages/core
packages/data-source-heartbeats
packages/data-source-git-local
packages/visualization-html
packages/runtime-node
```

See [docs/modular-monorepo.md](docs/modular-monorepo.md) for the layer
boundaries and [docs/instance-recipe.md](docs/instance-recipe.md) for the
portable recipe each `dashborg-of/{single-agent-haecceity}` repo should follow.

Run the current checks with:

```bash
npm run check
node packages/runtime-node/src/collect-snapshot.mjs examples/arcturus.instance.json
```

To actually bind an instance's configured surfaces (not just produce a
one-shot snapshot):

```bash
node packages/runtime-node/src/serve.mjs examples/arcturus.instance.json
```

Starts one HTTP listener per entry in `instance.surfaces`. `GET /snapshot`
returns the full snapshot on a surface with `exposeRaw: true`, and the
redacted form (via `redactSnapshot`, already in `packages/core`) otherwise.
`POST /heartbeat` appends to the instance's `heartbeat-jsonl` source, but
only on a surface with `canWrite: true` — any other surface gets `403`.
