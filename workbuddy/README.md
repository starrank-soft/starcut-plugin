# StarCut for WorkBuddy / CodeBuddy

Install the StarCut plugin from the marketplace for local skills, then authenticate
MCP manually. WorkBuddy usually requires a static `Authorization: Bearer` header
instead of a native OAuth button.

Write the MCP server to `~/.workbuddy/mcp.json` — exactly `mcp.json`, with no
leading dot.

Run the one-shot installer from this package:

```powershell
.\workbuddy\install.ps1
```

Or run the OAuth helper directly:

```bash
node workbuddy/scripts/mcp-manual-oauth.mjs --host workbuddy --write-config
```

For guided installation, open `https://starcut.io/workbuddy.md` in WorkBuddy.
