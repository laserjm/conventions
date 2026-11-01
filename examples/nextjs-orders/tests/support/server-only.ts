// vitest alias for 'server-only': the marker throws outside Next's server bundle, and unit tests
// import modules through index.ts, which re-exports actions.ts (NX-STR-06).
export {};
