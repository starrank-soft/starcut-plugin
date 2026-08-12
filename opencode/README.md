# StarCut for OpenCode

Copy the `.opencode` directory and `opencode.json` into the root of an
OpenCode project. If the project already has `opencode.json`, merge the
`mcp.starcut` entry instead of replacing the file. Then authenticate and
start a new session:

```powershell
.\opencode\install.ps1 -Project "D:\path\to\opencode-project"
```

Or manually:

```bash
opencode mcp auth starcut
```

For guided installation, open `https://starcut.io/opencode.md` in OpenCode.
