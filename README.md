# StarCut Agent Plugin

The official StarCut agent plugin repository for Codex and ChatGPT, Claude
Code, Grok Build, Cursor, Kimi Code, WorkBuddy/CodeBuddy, Qoder, TRAE, GitHub
Copilot CLI, and OpenCode. Every package connects to
`https://api.starcut.io/mcp` and authenticates through StarCut OAuth.

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

### Qoder

```bash
qodercli plugins marketplace add https://raw.githubusercontent.com/starrank-soft/starcut-plugin/main/qoder-marketplace.json
qodercli plugins install starcut
```

Run `/plugins reload` after installation. Open `/mcp` to complete StarCut OAuth
if Qoder requests authorization.

### TRAE

Copy `trae/.agents` and `trae/.trae` into the project root. If either hidden
directory already exists, merge its contents. Open TRAE's MCP settings,
authorize StarCut, and start a new Agent conversation.

### GitHub Copilot CLI

```bash
copilot plugin marketplace add starrank-soft/starcut-plugin
copilot plugin install starcut@starcut
```

Open `/mcp` to complete StarCut OAuth if Copilot requests authorization.

### OpenCode

Copy `opencode/.opencode` and `opencode/opencode.json` into the project root. If
`opencode.json` already exists, merge its `mcp.starcut` entry. Then run:

```bash
opencode mcp auth starcut
```

## Repository Layout

```text
.agents/plugins/marketplace.json     Codex and ChatGPT marketplace
.claude-plugin/marketplace.json      Claude Code marketplace
.grok-plugin/marketplace.json        Grok Build marketplace
.cursor-plugin/marketplace.json      Cursor marketplace
.codebuddy-plugin/marketplace.json   WorkBuddy/CodeBuddy marketplace
.github/plugin/marketplace.json      GitHub Copilot CLI marketplace
.kimi-plugin/plugin.json             Kimi Code repository manifest
qoder-marketplace.json               Qoder marketplace
codex/                               Codex and ChatGPT package
claude-code/                         Claude Code package
grok-build/                          Grok Build package
cursor/                              Cursor package
kimi-code/                           Kimi Code skills
workbuddy/                           WorkBuddy/CodeBuddy package
qoder/                               Qoder package
trae/                                TRAE project bundle
github-copilot/                      GitHub Copilot CLI package
opencode/                            OpenCode project bundle
```

The canonical skills and package generator live at `plugins/starcut` in the
StarCut monorepo. This repository is a generated production projection. Change
the canonical source and regenerate all host packages instead of editing one
host copy directly.
