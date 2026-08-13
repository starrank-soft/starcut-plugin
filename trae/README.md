# StarCut for TRAE

This package has one canonical `skills/` tree and a TRAE plugin manifest at
`.trae-plugin/plugin.json`.

TRAE SOLO and Trae IDE have different persistence boundaries:

- **TRAE SOLO CN** loads persistent user skills from `~/.trae-cn/skills`.
- **TRAE SOLO** loads persistent user skills from `~/.trae/skills`.
- **Trae IDE** loads project skills from `<project>/.agents/skills`.

Never copy skills into an internal `work-mode-projects` directory. Those
directories belong to individual SOLO conversations and are not durable.

For SOLO, copy the contents of this package's `skills/` directory into the
matching persistent user skills directory. For IDE, copy the same contents into
the project's `.agents/skills` directory. A marketplace installation can use
the manifest directly without creating another skills copy in this package.

Run the helper from the StarCut plugin source when TRAE shows `401 Unauthorized`
or "failed to start" with no OAuth button:

```bash
node scripts/mcp-manual-oauth.mjs \
  --host trae \
  --mcp-url "https://api.starcut.io/mcp" \
  --write-config \
  --trae-product "<solo-cn|solo|ide-cn|ide>"
```

On Windows, the bundled installer selects the correct persistent skills
directory and runs the same OAuth helper. Pass `-Project` for an IDE product:

```powershell
.\install.ps1 -TraeProduct solo-cn
.\install.ps1 -TraeProduct ide-cn -Project C:\path\to\project
```

For guided installation, open `https://starcut.io/trae.md` in TRAE.
