# StarCut for Grok Build

Install this package, enable the plugin, then use the bundled helper when MCP
authentication is required:

```bash
node scripts/mcp-manual-oauth.mjs \
  --host grok \
  --mcp-url "https://api.starcut.io/mcp" \
  --write-config
```

The helper preserves existing settings in `~/.grok/config.toml`, writes the
authenticated user-scoped `starcut` MCP server, and verifies the MCP handshake
without printing credentials. Start a new Grok Build session afterward.

Verify the installed plugin and MCP server:

```bash
grok inspect --json
grok mcp doctor starcut --json
```

For guided installation, open `https://starcut.io/grok.md` in Grok Build.
