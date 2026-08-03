---
name: basics
description: Use for StarCut project access and browser handoff, understanding project files, VML Nodes, and editable source files, discovering and reading documents or Artifacts, applying common writes and focused updates, immediate Editor calls, and routing deeper Timeline, graphics, transcription, generation, or import work.
---

# StarCut Basics

Keep the StarCut project as the editable source of truth. Make changes through
StarCut tools instead of replacing the project with a flattened local video.

Use the exact StarCut MCP tool names exposed by this Plugin. They begin with
`mcp__starcut__`; do not shorten them to names that may collide with host or
other MCP tools.

## Establish the Project

Use the exact `projectId` returned by StarCut for every project-scoped call.

1. Call `mcp__starcut__create_project` when the user wants a new project.
2. Call `mcp__starcut__list_projects` when an existing project is intended but
   its ID is unknown.
3. Call `mcp__starcut__open_project` when an editor browser handoff is needed.
4. Open the exact `browserHandoff.url`; it contains a short-lived credential.
   Never print it or expose it in a Markdown link.
5. Use `editorUrl` for user-facing links.

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
  script.md
compositions/
  main.vml
```

| Path | Content | Purpose |
|---|---|---|
| `project.json` | JSON | System-owned Project metadata |
| `docs/*.md` | Markdown | Reusable editable text |
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
`mcp__starcut__write` or `mcp__starcut__edit`. Markdown, SVG, and MG are editable
source files. SVG and MG are text Artifacts. Editing any source file keeps the
same project path, so existing references remain valid.

## Discover and Read

| Need | Tool |
|---|---|
| Find a project | `mcp__starcut__list_projects` |
| List project files or Artifacts | `mcp__starcut__glob` |
| Search editable file content | `mcp__starcut__grep` |
| Read one VML, Markdown, SVG, or MG file | `mcp__starcut__read` |
| Read one VML Node | `mcp__starcut__read` with `path` and `nodeId` |
| Inspect file or Artifact metadata | `mcp__starcut__head` |
| Inspect live model capability | `mcp__starcut__query` |

Useful `mcp__starcut__glob` patterns include:

```text
project.json
docs/**/*.md
compositions/**/*.vml
assets/*
assets/*.{png,jpg,jpeg,webp,svg}
assets/*.{mp4,mov,webm}
assets/*.{mp3,wav,m4a}
assets/*.mg
```

Use `mcp__starcut__read` for known editable text. A VML Node can be read with
its file `path` and exact `nodeId`; Markdown, SVG, and MG are always read as
complete source files. Do not ask `read` to return binary Artifact bytes.
Reading VML does not follow a `source`; read or inspect the exact referenced
path separately when needed.

Use `mcp__starcut__head` for authoritative Artifact kind, readiness, dimensions,
duration, URL, and `artifactId`. Model inputs copy a ready Artifact's exact
`{ "artifactId": "...", "url": "..." }` pair. Timeline `source` Attributes use
the project-relative path instead.

Use `mcp__starcut__grep` for VML or Markdown source. VML matches can include
Node IDs; Markdown matches identify the file and matching line. It does not
search Artifact content or metadata.

## Write and Update

MCP calls use the structured fields shown below. Do not encode multiple Node
mutations into one string.

### Project Metadata

`project.json` is system-owned. Do not create, replace, move, rename, or delete
it. Use `mcp__starcut__update_project` for explicit name, description, or cover
changes:

```json
{
  "projectId": "project-id",
  "name": "Summer Launch",
  "coverUrl": "https://cdn.example.com/summer-cover.webp"
}
```

`coverUrl` is a directly usable image URL, not an Artifact ID or project path.

### VML Files

Use `mcp__starcut__write` to create a complete Composition VML file:

```json
{
  "projectId": "project-id",
  "path": "compositions/main.vml",
  "content": "<Composition width=\"1920\" height=\"1080\" fps=\"30\" backgroundColor=\"#000000\"><VideoTrack name=\"Main\" /></Composition>"
}
```

Omit VML IDs. Include a main `VideoTrack` when creating a Composition;
`mcp__starcut__write` does not add one implicitly.

Treat complete replacement as exceptional. Use it for creation or when the
user explicitly requests a full rewrite. Replacing VML recreates descendants
while preserving the file path and root ID.

Use `mcp__starcut__add_node` to add one child or subtree to an existing parent:

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

Use `mcp__starcut__update_node` to change Attributes and/or one exact Text Data
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

Use `mcp__starcut__move_node` to reorder a child or move it to another compatible
parent. Omit `parentId` to keep the current parent, and omit `beforeId` to append.
Never write internal owner or order fields.

Use `mcp__starcut__delete_node` only for a non-root Node. Deletion includes its
descendants and is rejected when the remaining document would be invalid.

### Source Files

Use `mcp__starcut__write` to create a complete Markdown file under `docs/`, or
a complete SVG or MG source under `assets/`:

```json
{
  "projectId": "project-id",
  "path": "docs/script.md",
  "content": "# Product Launch\n\nAvailable now."
}
```

Markdown, SVG, and MG do not expose VML Nodes. Use `mcp__starcut__edit` for one
exact, unique source replacement:

```json
{
  "projectId": "project-id",
  "path": "assets/lower-third.mg",
  "search": "<span class=\"title\">Launch</span>",
  "replace": "<span class=\"title\">Available Now</span>"
}
```

Read the current source first when its exact text is unknown. Replace the
smallest meaningful range. Do not use VML Node tools for Markdown, SVG, or MG,
and do not use `write` merely to change copy, color, timing, or one animation
detail. Load `graphics` before authoring or substantially changing graphic
source.

## Run Project Operations

Use `mcp__starcut__run_task` for media generation, SVG/MG generation, and ASR.
If it returns `monitoring`, call
`mcp__starcut__poll_task` with the exact `projectId` and returned `taskId`.
Never resubmit the same request merely because it is still running.

Use `mcp__starcut__client_call` for work that needs the connected Editor's
playback state, Timeline renderer, or local media:

| Command | Target |
|---|---|
| `play` | exact Timeline path or ID; activates it first |
| `pause`, `seek` | `active` |
| `activate_timeline`, `render_timeline` | exact Timeline path or ID |
| `extract_frame` | exact Timeline path/ID or visual Artifact ID |
| `extract_audio` | exact Video Artifact ID |
| `get_transcript` | exact Audio or Video Artifact ID |

`seek` uses `params.positionUs` in integer microseconds. Client calls may return
Artifacts. They require a connected Editor.

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
