import { Plugin } from "@opencode/plugin"
import { readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

const MODEL_KEY = /("model"\s*:\s*")[^"]*(")/

function configFiles(): string[] {
  const base = process.env.XDG_CONFIG_HOME
    ? join(process.env.XDG_CONFIG_HOME, "opencode")
    : join(homedir(), ".config", "opencode")

  return [join(base, "opencode.json"), join(base, "opencode.jsonc")]
}

async function remember(model: string): Promise<void> {
  for (const file of configFiles()) {
    let text: string
    try {
      text = await readFile(file, "utf8")
    } catch {
      continue
    }

    if (!MODEL_KEY.test(text)) continue

    const next = text.replace(MODEL_KEY, `$1${model}$2`)
    if (next !== text) await writeFile(file, next, "utf8")
  }
}

/**
 * Remembers the last model selected in a root session and writes it to the
 * global OpenCode config, so it is used as the default on the next launch.
 */
export default Plugin.define({
  id: "opencode-last-model",
  async setup(ctx) {
    const controller = new AbortController()

    void (async () => {
      for await (const event of ctx.event.subscribe({
        types: ["session.model.selected"],
        signal: controller.signal,
      })) {
        const model = event.data.model
        if (!model) continue

        // Ignore child sessions (subagents) so they cannot override the default.
        try {
          const session = await ctx.session.get({ sessionID: event.data.sessionID })
          if (session.parentID) continue
        } catch {
          continue
        }

        await remember(`${model.providerID}/${model.id}`).catch(() => {})
      }
    })().catch(() => {})

    return () => controller.abort()
  },
})
