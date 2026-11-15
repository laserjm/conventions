// Copy to test/tools.test.ts. CONVENTIONS.md, Testing §8: every tool a module offers a model is
// named in the set every provider and MCP accept. Saved conversations store the name
// (`tool-<name>` in a message part), so a name that slips through can't be fixed without a
// migration of the stored messages.
import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const TOOL_NAME = /^[a-z][a-z0-9_]{0,63}$/

const modulesDir = path.resolve(import.meta.dirname, "../modules")
const withTools = existsSync(modulesDir)
  ? readdirSync(modulesDir).filter((name) =>
      existsSync(path.join(modulesDir, name, "tools.ts"))
    )
  : []

// A tool set is a plain object whose every value is a tool: an object with an `inputSchema`.
// Functions that build a set per request (`toolsFor(…)`) are skipped; their keys come from a
// set this test already sees.
const isTool = (value: unknown) =>
  typeof value === "object" && value !== null && "inputSchema" in value
const isToolSet = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0 &&
  Object.values(value).every(isTool)

// A project without a tools.ts yet still has one test, so the file doesn't fail as empty.
if (withTools.length === 0) it.skip("no module has a tools.ts yet", () => {})

describe.each(withTools)("modules/%s/tools.ts", (name) => {
  it("names every tool in snake_case, at most 64 characters", async () => {
    const exports: Record<string, unknown> = await import(`../modules/${name}/tools.ts`)
    let sets = 0
    for (const [exportName, value] of Object.entries(exports)) {
      if (!isToolSet(value)) continue
      sets++
      for (const toolName of Object.keys(value)) {
        expect(toolName, `${exportName}.${toolName}`).toMatch(TOOL_NAME)
      }
    }
    expect(sets, "at least one exported tool set").toBeGreaterThan(0)
  })
})
