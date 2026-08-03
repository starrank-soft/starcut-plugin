# StarCut Plugin

The official StarCut plugin marketplace for Codex and ChatGPT desktop.

## Install

```bash
codex plugin marketplace add https://github.com/starrank-soft/starcut-plugin.git --ref main
codex plugin add starcut@starcut
```

The plugin connects to the production StarCut MCP server at
`https://starcut.io/mcp`. Authentication is completed through StarCut OAuth.

For guided installation, open `https://starcut.io/chatgpt.md` in the ChatGPT or
Codex desktop app.

## Repository Layout

```text
.agents/plugins/marketplace.json  Marketplace catalog
plugins/starcut/                  StarCut plugin
```

The development plugin lives in the StarCut monorepo and points to the local
MCP server. This repository contains only the production plugin configuration.

## License

MIT
