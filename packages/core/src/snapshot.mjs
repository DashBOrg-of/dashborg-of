import { nowIso } from './states.mjs';

export function createSnapshot(instance, sourceResults) {
  const observedAt = nowIso();
  return {
    schema: 'dashborg.snapshot.v0',
    observedAt,
    identity: instance.haecceity,
    surfaces: instance.surfaces || [],
    sources: sourceResults,
    health: summarizeHealth(sourceResults, observedAt),
  };
}

export function summarizeHealth(sourceResults, observedAt) {
  const states = sourceResults.map((result) => result.state);
  const state = states.includes('error') || states.includes('inaccessible')
    ? 'partial'
    : states.every((value) => value === 'verified' || value === 'verified-empty')
      ? 'verified'
      : 'partial';

  return {
    state,
    observedAt,
    sourceCount: sourceResults.length,
    recordCount: sourceResults.reduce((sum, result) => sum + (result.records?.length || 0), 0),
  };
}

export function redactSnapshot(snapshot, policy = {}) {
  if (policy.exposeRaw) return snapshot;
  return JSON.parse(JSON.stringify(snapshot, (_key, value) => {
    if (typeof value !== 'string') return value;
    return redactLocalPath(value);
  }));
}

export function redactLocalPath(value) {
  return value
    .replace(/[A-Za-z]:\\[^\s<>|"]+/g, '[local path redacted]')
    .replace(/\\\\[^\s<>|"]+/g, '[UNC path redacted]')
    .replace(/\/(?:Users|home|var|tmp|mnt|c)\/[^\s<>|"]+/g, '[local path redacted]');
}
