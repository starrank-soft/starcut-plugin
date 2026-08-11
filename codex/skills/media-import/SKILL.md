---
name: media-import
description: Use when finding license-compatible image, video, music, or sound-effect media on the web, downloading it for one StarCut project, or importing local image, video, audio, or document files that the host agent can read into a project Artifact library.
---

# StarCut Media Import

## Find Media on the Web

Use the host's web search or browser tools when the user asks for stock media
but has not supplied a file. Keep discovery outside StarCut: remote results are
not Library items and become project Media only after import.

1. Search for media matching the requested subject, style, duration, aspect
   ratio, and technical quality.
2. Open the original source page. Prefer public-domain, CC0, or clearly stated
   licenses that permit the user's intended video use. Do not infer permission
   from "free download" or from appearance in search results.
3. Record the source page, creator, and license URL. Reject watermarked
   previews, unclear licenses, login-gated files, and sources that require
   bypassing access controls.
4. Download the intended original or an appropriate production rendition to a
   temporary local directory with the host's normal download facilities.
5. Inspect the downloaded file's actual type, size, duration, and dimensions
   when relevant. Do not import an HTML error page, search thumbnail, or audio
   preview in place of the selected media.
6. Import the local file with the workflow below. Report its source and license
   links with the result so the user can retain the provenance.

Never publish web-discovered media into the system-owned StarCut Library. That
catalog has a separate, reviewed publishing process. This workflow imports only
into the current Project's Media.

## Import Local Files

Import local files through a short-lived, project-scoped upload session. MCP
creates only the control-plane session. File bytes go from the local helper
directly to object storage and never pass through an MCP tool call.

1. Establish the exact project with `mcp__starcut__list_projects`,
   `mcp__starcut__create_project`, or `mcp__starcut__open_project`.
2. Confirm the editor is loaded before importing. When
   `mcp__starcut__create_project` or `mcp__starcut__open_project` returns
   `browserHandoff.url` and the host exposes a trusted browser or navigation
   surface, open that exact URL immediately and wait until the editor loads.
   If the host has no trusted browser surface, never print the handoff token;
   ask the user to open the stable `editorUrl` and continue only after they
   confirm the editor loaded. Do not inspect, hash, or upload files while a
   one-time handoff is still unopened on a browser-capable host.
3. Call `mcp__starcut__import_media` once with the exact `projectId`.
4. Use Node.js 18 or newer from the host runtime or `PATH`. When the host offers
   a bundled dependency resolver, prefer its Node runtime without installing a
   second copy.
5. Run `scripts/upload-media.mjs` from this skill directory with the returned
   token, endpoint, and at most four readable local files.
6. Use `mcp__starcut__glob` or `mcp__starcut__head` on the returned Artifact
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
