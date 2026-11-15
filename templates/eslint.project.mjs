// The project's own lint rules (E1), spread after the conventions' config in eslint.config.mjs,
// and its lint seams (E2), read by it.
// This file belongs to the project: a rollout of the conventions copies eslint.config.mjs again,
// never this file.
//
// eslint.config.mjs refuses to load if a block here sets a rule the conventions set
// (`no-restricted-imports`, `@typescript-eslint/no-restricted-imports`,
// `no-restricted-properties`, `@typescript-eslint/consistent-type-assertions`, the `local/*`
// rules): for a rule with options, a later block replaces the earlier options instead of adding to
// them. Boundaries the project adds use rules the conventions leave free, for example:
//
//   {
//     files: ["**/*.ts", "**/*.tsx"],
//     rules: {
//       // `integrations` is a leaf: it imports no other module.
//       "import/no-restricted-paths": ["error", { zones: [
//         { target: "./modules/integrations", from: "./modules", except: ["./integrations"] },
//       ] }],
//     },
//   },
//   {
//     files: ["**/*.ts", "**/*.tsx"],
//     ignores: ["lib/auth/**"],
//     rules: {
//       // Only lib/auth imports the auth library.
//       "no-restricted-syntax": ["error", {
//         selector: "ImportDeclaration[source.value=/^better-auth(\\u002F|$)/]",
//         message: "Only lib/auth/ imports better-auth.",
//       }],
//     },
//   },
//
// The same holds inside this file: set each rule in one block per file. Two blocks that both set
// `import/no-restricted-paths` for `**/*.ts` leave only the second one's zones. Keep shared zones
// in a const and give files that need fewer zones their own block with disjoint `files`.
//
// Each block names the decision it enforces (its entry under E1 in docs/EXTENSIONS.md, or an ADR).

const projectConfig = []

export default projectConfig

// E2: lint seams, options the conventions' config reads to widen one of its rules for named paths.
// Each one used has its entry in docs/EXTENSIONS.md.
//
//   moduleLibImports  paths under @/lib/ a module may import as values (Rule 12), e.g. a client's
//                     error classes for a use case that carries on without the service (E3):
//                     moduleLibImports: ["@/lib/fmp/errors"]
export const seams = {
  moduleLibImports: [],
}
