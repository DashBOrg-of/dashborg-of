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

## BIAFRAL depth scanning

A repo-promises panel should start by checking the 2-register depth `<org>/<repo>`.
The full BIAFRAL grammar extends to 4+ registers: `<org>/<repo>/<copy>/<branch>`,
with nested `_/AS/<branch>/` chains for integrator-mode depth.

A complete dashborg implementation should scan recursively for nested AS-cast
working copies, classify each as worker-depth (one visible upstream) or
integrator-depth (full chain encoded in overpath), and surface dangling
integration chains — nodes where an inner copy's start-point branch has no
corresponding outer copy — as a new promise state: `integration-chain-broken`.

The scan depth knob determines visibility: repo-level scanning gives
worker-mode visibility; full chain scanning gives integrator-mode visibility.
Both are valid; the dashborg instance selects based on role.

## WordPress implementation contract

The abstract contract does not require a static site or a generated artifact.
The canonical implementation path for a shared project control plane is a
WordPress application when human and agent operators need one inspectable
surface. `dashborg-of/LeagueOS` is the first concrete implementation of this
path.

Its WordPress model must map first-class nouns to durable records: agents,
harnesses, workspaces, repositories, worktrees, branches, environments,
deployments, issues, pull requests, evidence, and events. REST responses and
browser pages must read the same records. Hooks may append observations, but
they must not silently turn an observation into accepted truth.

### Critique of the static-artifact phase

The earlier viewer/build-artifact pattern was a useful prototype for layout
and telemetry, but it was not a sufficient dashborg implementation. It
conflated exported state with live state, treated lease files as proof that a
process was running, and did not join source SHA, worktree, container mount,
deployment, and rendered validation into one queryable graph. Future
implementations must expose those distinctions explicitly and preserve
`missing`, `inaccessible`, `stale`, `unsupported`, and `verified-empty` as
different states.

### Human/agent simultaneity

A dashborg is successful only when the same current state is visible in both
places at once: a human can navigate the WordPress UI while an agent reads the
authenticated REST contract or hook endpoint. Neither interface is a sketch
of the other, and neither is allowed to become a private second database.
