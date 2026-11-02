# @conventions/cli

```
conventions lint [paths…] [--changed] [--json]   eslint + ast-grep + ls-lint in one run; every finding carries a rule id
conventions lint-file <file>                      the same for one file (editor and agent hooks)
conventions check [--changed] [--json]            structural checks: modules complete, tests next to use cases and
                                                  repositories, owner ids typed and isolation tested, header
                                                  version, deviations, database inventory, …
conventions explain <RULE-ID>                     print a catalogue entry
conventions init --profile <name> --isolation <tenant|owner|none> [--app-root .]
                                                  ARCHITECTURE.md, eslint.config.mjs, CI, CLAUDE.md, AGENTS.md (only what is missing)
conventions sync                                  align the ARCHITECTURE.md header with the installed profile version
```

Profile-agnostic: the installed `@conventions/<profile>` package's `profile.json` describes the
project shape and which linters to run; `rules/<profile>.yaml` is the catalogue. Rulesets not
listed in the header are skipped; rules whose `isolation` does not include the header's
`isolation:` are skipped; legacy folders get the layer rules only.
