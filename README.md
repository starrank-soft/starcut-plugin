# StarCut Agent Plugin

The official StarCut agent plugin repository. Host integrations are kept in
separate top-level packages so each host can evolve without leaking its
configuration into another host.

## Install

```bash
codex plugin marketplace add https://github.com/starrank-soft/starcut-plugin.git --ref main
codex plugin add starcut@starcut
```

The ChatGPT plugin connects to the production StarCut MCP server at
`https://starcut.io/mcp`. Authentication is completed through StarCut OAuth.

For guided installation, open `https://starcut.io/chatgpt.md` in the ChatGPT or
Codex desktop app.

## Repository Layout

```text
.agents/plugins/marketplace.json  ChatGPT/Codex marketplace catalog
chatgpt/                          ChatGPT desktop plugin package
claude-code/                      Claude Code host package
workbuddy/                        WorkBuddy host package
```

Only the ChatGPT package is published today. The other host directories define
their ownership boundary without pretending that an unimplemented integration
is available.

The development plugin lives in the StarCut monorepo and points to the local
MCP server. This repository contains production host packages.

## License

MIT
