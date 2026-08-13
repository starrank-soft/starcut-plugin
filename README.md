# StarCut Agent Plugin

The official StarCut agent plugin repository for ChatGPT and Codex, Claude
Code, Grok Build, Cursor, Kimi Code, WorkBuddy/CodeBuddy, TRAE, and OpenCode.
Every package connects to
`https://api.starcut.io/mcp` and authenticates through StarCut OAuth.

## Install

### ChatGPT and Codex

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

For guided installation, open `https://starcut.io/claude.md` in Claude Code.

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

For guided installation, open `https://starcut.io/cursor.md` in Cursor Agent.

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

For guided installation, open `https://starcut.io/workbuddy.md` in WorkBuddy
or CodeBuddy.

On Windows, `workbuddy/install.ps1` performs the marketplace installation and
the manual OAuth flow in one foreground command.

### TRAE

The `trae/` package contains `.trae-plugin/plugin.json` and one canonical
`skills/` tree. TRAE SOLO users install those skills into the persistent user
directory (`~/.trae-cn/skills` for SOLO CN or `~/.trae/skills` for SOLO).
Trae IDE users copy the same `trae/skills` contents into the project's
`.agents/skills` directory. Never install into SOLO's internal
`work-mode-projects` directories.

Run `trae/scripts/mcp-manual-oauth.mjs` with the exact `--trae-product` value to
configure and verify the global MCP server without printing credentials.

For guided installation, open `https://starcut.io/trae.md` in TRAE.

On Windows, run `trae/install.ps1 -TraeProduct <product>`. TRAE IDE products
also require `-Project <path>`; SOLO products install into their persistent
user skills directory.

### OpenCode

Copy `opencode/.opencode` and `opencode/opencode.json` into the project root. If
`opencode.json` already exists, merge its `mcp.starcut` entry. Then run:

```bash
opencode mcp auth starcut
```

On Windows, `opencode/install.ps1 -Project <path>` copies the skills, merges
only `mcp.starcut` into the project config, and starts authentication.

## Repository Layout

```text
.agents/plugins/marketplace.json     ChatGPT and Codex marketplace
.claude-plugin/marketplace.json      Claude Code marketplace
.grok-plugin/marketplace.json        Grok Build marketplace
.cursor-plugin/marketplace.json      Cursor marketplace
.codebuddy-plugin/marketplace.json   WorkBuddy/CodeBuddy marketplace
.kimi-plugin/plugin.json             Kimi Code repository manifest
chatgpt/                             ChatGPT and Codex package
claude-code/                         Claude Code package
grok-build/                          Grok Build package
cursor/                              Cursor package
kimi-code/                           Kimi Code skills
workbuddy/                           WorkBuddy/CodeBuddy package
trae/                                TRAE plugin and skills package
opencode/                            OpenCode project bundle
```

The canonical skills and package generator live at `plugins/starcut` in the
StarCut monorepo. This repository is a generated production projection. Change
the canonical source and regenerate all host packages instead of editing one
host copy directly.
