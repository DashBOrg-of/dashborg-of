# DashBOrg Instance Recipe

This recipe is for `dashborg-of/{single-agent-haecceity}` repositories such as
`dashborg-of/arcturus-ottobot`, `dashborg-of/walrus-man`, and
`dashborg-of/leia-organa-bespin-oufit`.

## Required Files

```text
README.md
HAECCEITY.md
dashborg.instance.json
data/.gitkeep
logs/.gitkeep
```

## Recommended Files

```text
server.mjs
start.ps1
watch.ps1
style.css
docs/
```

## Required Instance Fields

```json
{
  "schema": "dashborg.instance.v0",
  "haecceity": {
    "type": "single-agent-haecceity",
    "slug": "agent-slug",
    "displayName": "Agent Display Name",
    "cards": []
  },
  "surfaces": [],
  "sources": [],
  "visualizations": []
}
```

## Source Categories

- `heartbeat-jsonl`: append-only heartbeat and station-turn records.
- `git-local`: local repo/worktree inventory.
- `github-remote`: GitHub org/repo/issue/PR state.
- `codex-session`: Codex rollout/session/compaction evidence.
- `agent-action`: explicit action/event records emitted by hooks or tools.

## Provenance Rule

A DashBOrg records evidence coordinates, not mythology. If a claim cannot point
to a source record, it is an annotation or hypothesis and must be marked that
way.

## Portability Rule

Instance repos must not require the original author's Windows username, drive
layout, account name, GitHub account, or card identity. All local paths belong
in `dashborg.instance.json` or an untracked local override.

## Relationship To The Abstract Repo

`DashBOrg-of/dashborg-of` is the SDK and contract. Instance repos may differ in
layout and UI, but should keep compatible snapshot vocabulary so swarm-level
DashBOrg instances can aggregate them.
