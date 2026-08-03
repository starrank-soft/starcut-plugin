---
name: media-import
description: Use when importing local image, video, audio, or document files that Codex can read into a StarCut project Artifact library.
---

# StarCut Media Import

Import local files through a short-lived, project-scoped upload session. MCP
creates only the control-plane session. File bytes go from the local helper
directly to object storage and never pass through an MCP tool call.

1. Establish the exact project with `mcp__starcut__list_projects`,
   `mcp__starcut__create_project`, or `mcp__starcut__open_project`.
2. Call `mcp__starcut__import_media` once with the exact `projectId`.
3. Resolve the bundled Node runtime with `load_workspace_dependencies` when
   that host tool is available.
4. Run `scripts/upload-media.mjs` from this skill directory with the returned
   token, endpoint, and at most four readable local files.
5. Use `mcp__starcut__glob` or `mcp__starcut__head` on the returned Artifact
   paths when the next operation needs server-visible readiness.

```bash
"<node>" "<this-skill-dir>/scripts/upload-media.mjs" \
  --token "<short-lived-token>" \
  --endpoint "<import-endpoint>" \
  "/path/to/video.mp4" \
  "/path/to/image.png"
```

The helper preserves each original filename, computes its SHA-256 identity,
uses server-side deduplication, uploads large files as concurrent multipart
parts, and pings Artifact progress while work is active. Each returned item
reports `transfer: "deduplicated"` for a server-side hash hit or
`transfer: "uploaded"` when file bytes were transferred.

Do not put base64, byte arrays, file contents, local paths, OAuth tokens, or
browser cookies into MCP tool arguments. Do not replace the helper with manual
`curl` calls to presigned storage URLs. Never show the short-lived import token
to the user.

If host policy denies uploading a local file, stop. Tell the user that the
upload was denied and ask them to upload it through the StarCut media panel or
run the agent with permission for that file transfer.

Imported Artifacts are immediately addressable by their returned
`assets/<name>.<ext>` paths. Upload completion makes cloud bytes available;
OPFS/Tauri localization and derived media indexes remain lazy runtime work.
