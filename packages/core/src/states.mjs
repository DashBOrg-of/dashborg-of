export const OBSERVATION_STATES = Object.freeze([
  'missing',
  'inaccessible',
  'unsupported',
  'stale',
  'empty',
  'verified-empty',
  'verified',
  'partial',
  'error',
]);

export function normalizeState(value, fallback = 'partial') {
  return OBSERVATION_STATES.includes(value) ? value : fallback;
}

export function nowIso() {
  return new Date().toISOString();
}

export function makeDiagnostic(level, message, details = {}) {
  return { level, message, details };
}
