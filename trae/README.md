# StarCut for TRAE

StarCut on TRAE uses two layers:

1. **Global MCP auth** — write `starcut` to TRAE's user-scope `User/mcp.json`
   with a bearer token from the manual OAuth flow.
2. **Project skills** — copy `.agents/skills` into the TRAE project root that
   should use StarCut.

Do not rely on project `.trae/mcp.json` alone for authentication unless your
TRAE build ignores the global MCP file.

Run the one-shot installer (replace `PROJECT` with the TRAE project root):

```powershell
.\trae\install.ps1 -Project "D:\path\to\trae-project"
```

Or run the OAuth helper when TRAE shows `401 Unauthorized`
or "failed to start" with no OAuth button:

```bash
node trae/scripts/mcp-manual-oauth.mjs --host trae --write-config
```

For guided installation, open `https://starcut.io/trae.md` in TRAE.
