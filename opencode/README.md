# StarCut for OpenCode

Copy the `.opencode` directory and `opencode.json` into the root of an
OpenCode project. If the project already has `opencode.json`, merge the
`mcp.starcut` entry instead of replacing the file. Then authenticate and
start a new session:

```bash
opencode mcp auth starcut
```

On Windows, the bundled installer copies the skills, merges only the
`mcp.starcut` entry, and starts authentication:

```powershell
.\install.ps1 -Project C:\path\to\project
```

For guided installation, open `https://starcut.io/opencode.md` in OpenCode.
