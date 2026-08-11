---
name: basics
description: Use for StarCut project access and browser handoff, understanding project files, VML Nodes, and editable source files, discovering and reading documents or Artifacts, applying common writes and focused updates, immediate Editor calls, and routing deeper Timeline, graphics, transcription, generation, or import work.
---

# StarCut Basics

Keep the StarCut project as the editable source of truth. Make changes through
StarCut tools instead of replacing the project with a flattened local video.

Use the exact StarCut MCP tool names shown throughout this host package. Resolve
them within the `starcut` MCP server; do not rename them or substitute a tool
from another MCP server. Host packages intentionally use different namespace
forms around the same StarCut tool basename.

## Host Connection

MCP authentication and tool refresh are owned by the host. If the StarCut
plugin is installed but its tools are absent, authenticate the configured
`starcut` server and reload the host's plugin/tool session. Reinstalling the
same package does not repair a missing OAuth session.

Complete OAuth for the StarCut server in Cursor Settings under MCP, then reload the Cursor window or begin a new Agent conversation.

## Establish the Project

Use the exact `projectId` returned by StarCut for every project-scoped call.

1. Call `create_project` when the user wants a new project.
2. Call `list_projects` when an existing project is intended but
   its ID is unknown.
3. Project creation does not open the editor. When the host exposes a trusted
   browser or navigation surface, make opening the exact `browserHandoff.url`
   returned by `create_project` the next action. Do not import,
   generate, edit, call another project tool, or ask a follow-up until the
   editor is confirmed loaded. If the host has no trusted browser surface,
   never print the handoff token; ask the user to open the stable `editorUrl`
   and continue after the editor is loaded.
4. Treat `browserHandoff.url` as a short-lived, one-time credential. Never
   print, retain, reuse, or expose it in a Markdown link. Submit its navigation
   once; a queued browser launch is already in progress and must not open the
   same handoff again.
5. Call `open_project` to reopen an existing project or replace
   an expired handoff. Only call it when ready to open the returned URL
   immediately.
6. A successful media import does not preserve an unopened handoff. Confirm
   the editor first, then continue project work.
7. Use `editorUrl` for user-facing links.

Authorization already selects the StarCut workspace. Do not ask for or pass an
organization ID.

## Project Files

```text
project.json
assets/
  product-shot.png
  product-demo.mp4
  narration.mp3
  logo.svg
  lower-third.mg
docs/
  brief.md
  script.md
  storyboard.md
  shot-list.md
  edit-plan.md
compositions/
  main.vml
```

| Path | Content | Purpose |
|---|---|---|
| `project.json` | JSON | System-owned Project metadata |
| `docs/*.md` | Markdown | Editorial planning and reusable text |
| `compositions/*.vml` | Composition VML | Editable Timelines |
| `assets/*` | media, SVG, or MG | Project Artifacts |

VML is StarCut's XML-based domain language for Composition files. Every VML file
has one Composition root. A Node has scalar Attributes, optional direct Text
Data, and direct ordered child Nodes. There are no default collection wrappers
such as `Tracks`, `Clips`, or `Children`.

StarCut assigns immutable Node IDs. Reads and mutations return real IDs; never
invent one. Omit every `id` from a new VML document or subtree. A root Node
belongs to its document path; non-root Nodes are addressed by their ID inside
that document and do not have independent paths.

References use exact project-relative paths such as
`source="assets/product-demo.mp4"`, never storage URLs. Each parent schema
determines which child tags and Attributes it accepts. Load `timeline-editing`
for the complete Composition, Track, and Clip catalog.

Binary Artifacts can be referenced and inspected but not changed with
`write` or `edit`. Markdown, SVG, and MG are editable
source files. SVG and MG are text Artifacts. Editing any source file keeps the
same project path, so existing references remain valid.

### Editorial Documents

Treat `docs/` as the Agent-facing editorial view of the project, not as a
second Timeline model. Use clear production-oriented files when they help:

| Suggested path | Purpose |
|---|---|
| `docs/brief.md` | Goal, audience, format, tone, constraints, and deliverables |
| `docs/script.md` | Narration, dialogue, on-screen copy, and structural beats |
| `docs/storyboard.md` | Ordered scenes or beats with timing intent, visuals, audio, and referenced `assets/*` paths |
| `docs/shot-list.md` | Available shots, selects, source ranges, and missing material |
| `docs/edit-plan.md` | Mapping from story beats to Timeline structure, pacing, graphics, transitions, and sound |
| `docs/review-notes.md` | Decisions, requested changes, and unresolved questions |

Create only the documents the work needs. Keep decisions in one relevant file
instead of duplicating them across several. A storyboard or edit plan describes
editorial intent; `compositions/*.vml` remains authoritative for exact Clip
timing, Track order, effects, and render settings.

## Discover and Read

| Need | Tool |
|---|---|
| Find a project | `list_projects` |
| List project files or Artifacts | `glob` |
| Search editable file content | `grep` |
| Read one VML, Markdown, SVG, or MG file | `read` |
| Read one VML Node | `read` with `path` and `nodeId` |
| Inspect file or Artifact metadata | `head` |
| Inspect models, fonts, or reusable Library/FX resources | `query` |

Useful `glob` patterns include:

```text
project.json
docs/**/*.md
compositions/**/*.vml
assets/*
assets/*.{png,jpg,jpeg,webp,svg}
assets/*.{mp4,mov,webm}
assets/*.{mp3,wav,m4a,ogg}
assets/*.mg
```

Use `read` for known editable text. A VML Node can be read with
its file `path` and exact `nodeId`; Markdown, SVG, and MG are always read as
complete source files. Do not ask `read` to return binary
Artifact bytes.
Reading VML does not follow a `source`; read or inspect the exact referenced
path separately when needed.

Use `head` for authoritative Artifact kind, readiness, dimensions,
duration, URL, and provenance. Agent operations and Timeline `source`
Attributes use the project-relative path.

Use `grep` for VML or Markdown source. VML matches can include
Node IDs; Markdown matches identify the file and matching line. It does not
search Artifact content or metadata.

## Query Catalogs

`query` reads one leaf catalog selected by `kind`:

| `kind` | Use |
|---|---|
| `model` | Resolve live model capabilities for one intent |
| `font` | Find curated fonts and supported weights, styles, and subsets |
| `bgm` | Find reusable background music before generating new music |
| `sfx` | Find reusable sound effects before generating a new one |
| `fx` | Find registered visual Effects and their tags, placements, and parameters |
| `mg` | Find reusable animated Motion Graphic components |
| `sticker` | Find reusable static SVG stickers |

Reuse compatible results already present in the conversation. Query again only
when the previous result does not cover the current intent or filters.

Every resource result has a `libraryId`. After choosing one, call
`use_library` with that ID and the current `projectId`. Use a
returned `path` as a Clip source, or a returned `effect` definition in a
compatible Clip or `EffectTrack`. Resource storage and sharing scope are
server concerns; do not infer behavior from the ID.

## Write and Update

MCP calls use the structured fields shown below. Do not encode multiple Node
mutations into one string.

### Project Metadata

`project.json` is system-owned. Do not create, replace, move, rename, or delete
it. Use `update_project` for explicit name, description, or cover
changes:

```json
{
  "projectId": "project-id",
  "name": "Summer Launch",
  "coverUrl": "https://cdn.example.com/summer-cover.webp"
}
```

`coverUrl` is a directly usable image URL, not a project path.

### VML Files

Use `write` to create a complete Composition VML file:

```json
{
  "projectId": "project-id",
  "path": "compositions/main.vml",
  "content": "<Composition width=\"1920\" height=\"1080\" fps=\"30\" backgroundColor=\"#000000\"><VideoTrack name=\"Main\" /></Composition>"
}
```

Omit VML IDs. Include a main `VideoTrack` when creating a Composition;
`write` does not add one implicitly.

Treat complete replacement as exceptional. Use it for creation or when the
user explicitly requests a full rewrite. Replacing VML recreates descendants
while preserving the file path and root ID.

Use `add_node` to add one child or subtree to an existing parent:

```json
{
  "projectId": "project-id",
  "path": "compositions/main.vml",
  "parentId": "track-id",
  "beforeId": "optional-sibling-id",
  "content": "<VideoClip source=\"assets/demo.mp4\" start=\"0\" duration=\"5000000\" sourceStart=\"0\" sourceDuration=\"5000000\" />"
}
```

Omit `beforeId` to append. Omit all IDs from the new subtree.

Use `update_node` to change Attributes and/or one exact Text Data
range on an existing Node:

```json
{
  "projectId": "project-id",
  "path": "compositions/main.vml",
  "nodeId": "clip-id",
  "attributes": {
    "start": 1000000,
    "duration": 3000000,
    "opacity": 0.8
  }
}
```

```json
{
  "projectId": "project-id",
  "path": "compositions/main.vml",
  "nodeId": "text-clip-id",
  "textData": {
    "search": "Launch",
    "replace": "Available Now"
  }
}
```

Text Data SEARCH must match exactly once. Replace the whole Text Data value only
when the user intends a complete body rewrite. Never change `id`.

Use `move_node` to reorder a child or move it to another compatible
parent. Omit `parentId` to keep the current parent, and omit `beforeId` to append.
Never write internal owner or order fields.

Use `delete_node` only for a non-root Node. Deletion includes its
descendants and is rejected when the remaining document would be invalid.

### Source Files

Use `write` to create a complete Markdown file under `docs/`, or
a complete SVG or MG source under `assets/`:

```json
{
  "projectId": "project-id",
  "path": "docs/script.md",
  "content": "# Product Launch\n\nAvailable now."
}
```

Markdown, SVG, and MG do not expose VML Nodes. Use `edit` for one
exact, unique source replacement:

```json
{
  "projectId": "project-id",
  "path": "assets/lower-third.mg",
  "search": "<text id=\"title\">Launch</text>",
  "replace": "<text id=\"title\">Available Now</text>"
}
```

Read the current source first when its exact text is unknown. Replace the
smallest meaningful range. Do not use VML Node tools for Markdown, SVG, or MG,
and do not use `write` merely to change copy, color, timing, or
one animation detail. Load `graphics` before authoring or substantially
changing graphic source.

## Run Project Operations

Use `run_task` for media generation, SVG/MG generation, and ASR.
If it returns `monitoring`, call `poll` with the exact `projectId`
and returned `toolCallId`; never resubmit the same request merely because it is
still running.

Only `run_task` and `client_call` are pollable. A
deferred operation returns a `toolCallId`; pass that same `toolCallId` to
`poll`. `taskId` and `callId` remain compatibility aliases for
older clients, not separate identities for new workflows. Project file and
Node tools such as `glob`, `head`, `read`,
`write`, and `edit` return a terminal result and
never return `monitoring`.

Use `client_call` for work that needs the connected Editor's
playback state, Timeline renderer, or local media:

| Command | Target |
|---|---|
| `play` | exact Timeline path or ID; activates it first |
| `pause`, `seek` | `active` |
| `activate_timeline`, `render_timeline` | exact Timeline path or ID |
| `extract_frame` | exact Timeline or visual Artifact path |
| `extract_audio` | exact Video Artifact path |
| `get_transcript` | exact Audio or Video Artifact path |

`seek` uses `params.positionUs` in integer microseconds. `extract_frame` uses
`params.timeUs`; it never reads the active playhead, and omitting it extracts
the source at 0 seconds. Do not pass `positionUs` to `extract_frame`.

For example, extract a 640-pixel-long-edge frame at 1.2 seconds for visual
inspection:

```json
{
  "projectId": "project-id",
  "command": "extract_frame",
  "target": "compositions/main.vml",
  "params": { "timeUs": 1200000, "maxLongEdge": 640 }
}
```

`params.maxLongEdge` accepts 64–4096 pixels and preserves the source aspect
ratio and layout. Omit it only when full source resolution is required. Client
calls may return Artifacts. They require a connected Editor.

Artifact-producing operations do not place their result on a Timeline
automatically. Add or update the intended Clip explicitly when placement is
requested.

## Load Deeper Guidance

| Intent | Skill |
|---|---|
| Edit Tracks, Clips, timing, captions, audio, or layering | `timeline-editing` |
| Create or edit SVG and MG elements | `graphics` |
| Get a transcript or produce captions | `transcription` |
| Generate image, video, speech, sound, or music | `media-gen` |
| Import readable local media | `media-import` |

## Verify

Use the returned ID, path, Node, Task, or Artifact as the first confirmation.
Read only when later work depends on generated IDs, resulting structure, exact
text, or updated metadata. Inspect the composed Timeline when visual or audible
correctness matters; a successful mutation alone proves persistence, not the
final presentation.
