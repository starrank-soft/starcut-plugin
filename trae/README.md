# StarCut for TRAE

StarCut on TRAE uses two layers:

1. **Global MCP auth** — write `starcut` to TRAE's user-scope `User/mcp.json`
   with a bearer token from the manual OAuth flow.
2. **Project skills** — copy `.agents/skills` into the TRAE project root that
   should use StarCut.

Do not rely on project `.trae/mcp.json` alone for authentication unless your
TRAE build ignores the global MCP file.

Run the helper from the StarCut plugin source when TRAE shows `401 Unauthorized`
or "failed to start" with no OAuth button:

```bash
node scripts/mcp-manual-oauth.mjs --host trae --write-config
```

For guided installation, open `https://starcut.io/trae.md` in TRAE.
