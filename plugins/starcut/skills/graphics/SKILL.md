---
name: graphics
description: Use when creating or editing StarCut decorative elements, including static SVG stickers and icons plus animated Motion Graphics such as titles, callouts, lower thirds, charts, logo reveals, and animated stickers.
---

# Graphics

Treat decorative graphics as one product category with two authored formats:

| Need | Task | Artifact | Timeline Clip |
|---|---|---|---|
| Static sticker, icon, badge, or vector decoration | `create_svg` | `.svg` | `ImageClip` |
| Animated sticker, title, callout, chart, or lower third | `create_mg` | `.mg` | `MotionGraphicClip` |

## Workflow

- For a new graphic, use `mcp__starcut__run_task` with `task: "create_svg"` or
  `task: "create_mg"`.
- Use `mcp__starcut__write` only when the current Agent deliberately authors
  the complete source itself.
- For an existing graphic, use `mcp__starcut__read` followed by
  `mcp__starcut__edit` for a focused change.
  Do not regenerate an existing Artifact merely to change copy, color, timing,
  or one animation detail.
- Treat creation and Timeline placement as separate actions. Creation returns
  an editable text Artifact; place it only when the user asks.

Both Tasks accept `prompt`, optional `name`, `width`, `height`, `modelId`, and
optional `referenceImages`, `referenceVideos`, and `referenceAudios`. Each
reference list contains exact `{ "artifactId": "...", "url": "..." }` pairs
copied from `mcp__starcut__head`. `create_mg` additionally accepts `durationUs`
in integer microseconds. Omit `modelId` to use the primary reasoning model.

```json
{
  "projectId": "project-id",
  "task": "create_mg",
  "params": {
    "prompt": "A restrained lower third for a product launch",
    "width": 1920,
    "height": 1080,
    "durationUs": 5000000,
    "referenceImages": [
      { "artifactId": "reference-id", "url": "url-from-head" }
    ]
  }
}
```

If `run_task` returns `monitoring`, call `mcp__starcut__poll_task` with the exact
`projectId` and returned `taskId`. Never resubmit the same creation request.

## Edit Existing Source

SVG and MG are editable text Artifacts, not VML documents or Nodes. Read the
current raw source, then call `mcp__starcut__edit` with one exact replacement:

```json
{
  "projectId": "project-id",
  "path": "assets/lower-third.mg",
  "search": "<span class=\"title\">Launch</span>",
  "replace": "<span class=\"title\">Available Now</span>"
}
```

SEARCH includes whitespace and must match exactly once. Replace the smallest
distinct range that expresses the change. Use this same operation for focused
SVG copy, color, geometry, filter, and attribute changes, and for focused MG
HTML, CSS, copy, data, duration, or animation-code changes.

Do not use VML Node tools for SVG/MG source. Do not use
`mcp__starcut__write` merely to update an existing graphic; reserve complete
replacement for an explicitly requested rewrite. A successful edit keeps the
same project path, so existing Timeline Clip sources remain valid.

## Static SVG

Produce one complete, self-contained SVG document with a matching `viewBox`.
Use SVG elements, attributes, gradients, masks, and filters only. Do not use
scripts, event handlers, `foreignObject`, or external resources. Leave the
canvas transparent when transparency is requested instead of drawing a
checkerboard or preview background.

## Motion Graphics

Motion Graphics are animated or time-dependent `.mg` Artifacts backed by an
ordinary HyperFrames HTML composition. They are broader than animated stickers:
use them for titles, data graphics, lower thirds, callouts, and other editable
browser-rendered elements.

HyperFrames defines the MG authoring format. For direct authoring or a
substantial code edit, load
[`references/hyperframes.md`](references/hyperframes.md) before writing. A
`create_mg` Task already receives that reference; describe the desired result
without restating the format contract.

## Place and Verify

Use the exact returned Artifact path as the Clip `source`. SVG uses
`ImageClip`; MG uses `MotionGraphicClip` with `sourceStart` and
`sourceDuration`. Keep decorative elements on a visual Track above the content
they should cover.

Read the saved source when later work depends on its exact text. Inspect the
Timeline when placement, scale, duration, animation, or visual layering matters;
a successful source mutation alone does not prove visual correctness.
