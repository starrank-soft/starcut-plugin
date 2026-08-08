# StarCut Agent Plugin

The official StarCut agent plugin repository for Codex and ChatGPT, Claude
Code, Grok Build, Cursor, Kimi Code, and WorkBuddy/CodeBuddy. Every package
connects to `https://api.starcut.io/mcp` and authenticates through StarCut
OAuth.

## Install

### Codex and ChatGPT

```bash
codex plugin marketplace add https://github.com/starrank-soft/starcut-plugin.git --ref main
codex plugin add starcut@starcut
```

For guided installation, open `https://starcut.io/chatgpt.md` in ChatGPT or
Codex.

### Claude Code

```bash
claude plugin marketplace add starrank-soft/starcut-plugin
claude plugin install starcut@starcut
```

### Grok Build

```bash
grok plugin marketplace add starrank-soft/starcut-plugin
grok plugin install starcut@starcut --trust
```

The Grok website is a different host surface. Add
`https://api.starcut.io/mcp` as a custom connector at
`https://grok.com/connectors`; the website receives MCP tools but does not load
the coding-agent skills in this repository.

### Cursor

The package under `cursor/` follows the Cursor plugin specification and is
ready for marketplace submission. For local testing, link or copy that package
to `~/.cursor/plugins/local/starcut/` and reload Cursor.

### Kimi Code

Run this command inside the Kimi Code TUI, then start a new session:

```text
/plugins install https://github.com/starrank-soft/starcut-plugin
```

Open `/plugins`, select StarCut, and press `M` to manage or authorize its MCP
server if Kimi asks for authentication.

### WorkBuddy and CodeBuddy

```bash
codebuddy plugin marketplace add starrank-soft/starcut-plugin
codebuddy plugin install starcut@starcut
```

## Repository Layout

```text
.agents/plugins/marketplace.json     Codex and ChatGPT marketplace
.claude-plugin/marketplace.json      Claude Code marketplace
.grok-plugin/marketplace.json        Grok Build marketplace
.cursor-plugin/marketplace.json      Cursor marketplace
.codebuddy-plugin/marketplace.json   WorkBuddy/CodeBuddy marketplace
.kimi-plugin/plugin.json             Kimi Code repository manifest
codex/                               Codex and ChatGPT package
claude-code/                         Claude Code package
grok-build/                          Grok Build package
cursor/                              Cursor package
kimi-code/                           Kimi Code skills
workbuddy/                           WorkBuddy/CodeBuddy package
```

The canonical skills and package generator live at `plugins/starcut` in the
StarCut monorepo. This repository is a generated production projection. Change
the canonical source and regenerate all host packages instead of editing one
host copy directly.
