# StarCut for WorkBuddy / CodeBuddy

Install the StarCut plugin from the marketplace for local skills, then use the
bundled helper when MCP authentication is required.

Write the MCP server to `~/.workbuddy/mcp.json` — exactly `mcp.json`, with no
leading dot.

Run the helper from the StarCut plugin source:

```bash
node scripts/mcp-manual-oauth.mjs \
  --host workbuddy \
  --mcp-url "https://api.starcut.io/mcp" \
  --write-config
```

On Windows, the bundled installer adds the marketplace, installs the plugin,
and runs the same OAuth helper:

```powershell
.\install.ps1
```

For guided installation, open `https://starcut.io/workbuddy.md` in WorkBuddy.
