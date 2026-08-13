---
name: media-import
description: Use when finding license-compatible image, video, music, or sound-effect media on the web, downloading it for one StarCut project, or importing local image, video, audio, or document files that the host agent can read into a StarCut project Artifact library.
---

# StarCut Media Import

All unqualified tool names below refer to StarCut tools. If another provider
exposes the same basename, choose the StarCut tool.

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

Create a short-lived import session with `import_media`, then transfer readable
local files with this Skill's helper. Do not place file bytes in tool arguments.

1. Follow `basics` to establish the project context and confirm the editor is
   loaded.
2. Call `import_media` once with the current `contextId`.
3. Run `scripts/upload-media.mjs` with Node.js 18 or newer from this skill
   directory, using the returned
   token, endpoint, and at most four readable local files.
4. Use `glob` or `head` on the returned Artifact
   paths when the next operation needs readiness or metadata.

```bash
"<node>" "<this-skill-dir>/scripts/upload-media.mjs" \
  --token "<short-lived-token>" \
  --endpoint "<import-endpoint>" \
  "/path/to/video.mp4" \
  "/path/to/image.png"
```

The helper preserves each original filename and returns the imported Artifact
paths after completion.

Do not put base64, byte arrays, file contents, local paths, credentials, or
browser data into StarCut tool arguments. Never show the short-lived import
token to the user.

If host policy denies uploading a local file, stop. Tell the user that the
upload was denied and ask them to upload it through the StarCut media panel or
run the agent with permission for that file transfer.

After the helper succeeds, use its returned `assets/<name>.<ext>` paths for
subsequent StarCut operations.
