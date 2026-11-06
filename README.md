# opencode-last-model

An [OpenCode](https://opencode.ai) V2 plugin that remembers the last model you selected and makes it the default on the next launch.

## The problem

By design, OpenCode reads the default model only from the `model` field in `opencode.json(c)`. Switching a model with `/models` applies to the current session and does **not** rewrite the config, so every new launch starts with the same configured default again.

This plugin closes that gap: whenever you switch models in a root session, it writes the selected model into your global config. Next time you start OpenCode, that model is the default.

## Install

OpenCode installs plugins from npm:

```sh
opencode plugin add opencode-last-model
```

Or add the package to the `plugins` array in your **global** config (`~/.config/opencode/opencode.json` or `opencode.jsonc`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["opencode-last-model"]
}
```

Config changes apply without restarting OpenCode.

## How it works

- Subscribes to the `session.model.selected` event.
- Ignores child sessions (subagents), so only your own choices are remembered.
- Replaces the top-level `"model"` value in `~/.config/opencode/opencode.json` or `opencode.jsonc` (respects `XDG_CONFIG_HOME`).
- Preserves the rest of the file, including comments in JSONC.

Project-level configs can still override the global `model`, so a project that pins its own model keeps it.

## Notes

- The plugin updates the config file, so keep it writable.
- Only the global config is modified. If your config does not define a top-level `model` key at all, nothing is written until you add one.

## License

MIT
