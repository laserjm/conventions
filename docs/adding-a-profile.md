# Adding a profile

A profile is a stack: its rules, the tools that enforce them, a runtime core, a reference
project and a fixture. The catalogue format, the CLI and the plugin are profile-agnostic;
a profile adds four things.

1. **Catalogue**: `catalog/<profile>/*.yaml`, one file per rule table, validated by
   `catalog/schema.json`. Ids are `<PREFIX>-<AREA>-<NN>` (`FA-LAYER-01` for FastAPI). Docs go
   in `docs/<profile>/` with a `<!-- rules: <table> -->` marker where each table belongs.
2. **Profile package** `packages/<profile>` published as `@conventions/<profile>`, with
   `profile.json` (the project shape `conventions check` walks: module glob, layer folders,
   use-case and repository globs, test suffixes, migrations and inventory paths, which linters
   to run) and `rules/<profile>.yaml` (generated). The linters are whatever fits the language;
   the CLI only needs each one to print messages that start with a rule id, or a mapping.
3. **Reference and fixture** under `examples/`: the reference passes everything; every file of
   the fixture names the ids it must fail with.
4. **Skill** under `skills/<profile>-conventions` and, if the shape differs, a `new-module`
   variant.

## FastAPI, sketched

| Concern | Tool |
| --- | --- |
| layers and module boundaries | import-linter (`layers`, `forbidden`, `independence` contracts, external packages included) |
| identifier naming, banned APIs per layer (`os.environ` outside settings, `raise` in domain) | Ruff `N` rules and `flake8-tidy-imports` banned-api, shipped as a `ruff.toml` the project extends |
| syntax rules | ast-grep, same YAML format and test runner, `language: python` |
| file and folder names | ls-lint, same config format |
| types | pyright strict; `Result` from `dry-python/returns` or a 40-line module in the core package |
| structural checks | `conventions check` with the FastAPI `profile.json` |

The CLI's `lint` command would gain a `ruff` and an `import-linter` runner (each a few lines:
run the tool with JSON output, map to findings). Everything else is shared.
