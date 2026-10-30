---
name: reference-analysis
description: Use when analyzing a supplied reference video or Timeline, explaining its visual structure and pacing, or inspecting time-located frames, captions, and existing transcript evidence. Produces an evidence-based reading; use reference-adaptation when applying that reading to a new edit.
---

# Reference Video Analysis

Answer the user's question with time-located evidence and explain how the
observed choices guide attention or support the piece's purpose. The requested
scope determines how much to inspect; a sampled passage is not a whole-video
review.

Use the connected StarCut project and exact supplied references. External
hosts follow `basics` for project context and deferred-operation polling. All
unqualified tools here are StarCut tools; when another provider exposes the
same basename, choose the StarCut tool.

## Establish the Question and Source

- Reuse the reference path, metadata, transcript, and grids already present in
  the conversation. Use `head` only for missing metadata; use `glob` only when
  the intended source is not located. An attached Video reference identifies
  media; it does not establish that its pictures or sound have been inspected.
- Confirm the source duration before planning a range. Metadata times are
  integer microseconds. Retain exact values in tool inputs and use readable
  seconds in the report. Frame rate and dimensions alone do not establish
  cinematic style, camera equipment, or image quality.
- Honor an explicit range and sampling request. If the user says to use the
  whole duration when the video is shorter, use that fallback. Otherwise, an
  out-of-bounds request needs a stated adjustment rather than silent clipping.
- For an unspecified whole-reference analysis, begin with an overview spanning
  its duration. Choose density for the question: a short slow passage may need
  one page, while a longer or denser reference may need more pages or purposeful
  passages. Do not treat a default opening grid as coverage of the whole video.

## Plan One Useful Sampling Pass

Use `client_call` with `command: "extract_frame"`. Range mode takes
`params.timeRange` and exactly one of `count` or `intervalUs`. Ranges are
half-open; the end timestamp is excluded. A request supports at most 60
samples and automatically produces 4-by-3 grid pages. Multiple pages do not
require multiple tool calls.

Prefer one batch for a contiguous sampling plan within that limit. For
example, the requested first five seconds and twelve frames need one call:

```json
{
  "command": "extract_frame",
  "target": "assets/reference.mp4",
  "params": {
    "timeRange": { "startUs": 0, "endUs": 5000000 },
    "count": 12,
    "includeText": true
  }
}
```

External MCP callers add their current `contextId` to the call. Keep the
source and sampling plan stable until the result is understood.

For known moments that need independent reference images rather than a grid,
use `params.timesUs: [1000000, 4000000, 8000000]` in one `extract_frame` call
on the same source. Batch mode accepts up to 12 distinct timestamps and optional
`maxLongEdge` (default 1280), returning ordered `frames` with separate image
IDs, hashes, paths and requested/decoded times. Do not combine `timesUs` with
`timeUs`, `timeRange`, grid sampling or `includeText`. Repeated or overlapping
batches reuse matching saved frames; source or Timeline content changes
invalidate them. Reuse returned images for subsequent editing rather than
extracting the same moment again. A grid remains preferable for an overview.

- Consume every returned page relevant to the question. Reuse a successful
  result for the same source version, range, density, and text context; do not
  repeat it to confirm that it succeeded or to make a report sound thorough.
- If execution is pending, follow that operation's continuation rather than
  submitting it again. On failure, inspect the cause and whether usable output
  already exists; change the relevant input or resolve the prerequisite before
  retrying. Repeating extraction cannot add vision support to a text-only model.
- Supplement only to resolve a named gap that could change the answer, such as
  a possible cut, a title's wording, or a graphic's entry. Narrow and densify a
  range for changes over time; use single-frame `params.timeUs` and, when
  needed, `maxLongEdge` for spatial or text detail. Do not send `maxLongEdge`
  in grid mode.
- Broaden coverage when the requested analysis requires it, and explain the
  new question. Do not automatically extract every remaining segment after a
  bounded request. Stop once available evidence answers the request; if the
  current tools cannot resolve a detail, report that limit rather than looping.

### Converge on a Shot Table

For ordinary master preparation, use an overview followed by bounded refinement.
Honor an explicit user sampling request instead of imposing these defaults.

- For a passage up to one minute, start around one or two samples per second,
  with 12 to 48 samples total. For a longer source, inspect purposeful passages.
  Reuse an existing overview covering the selected range.
- After the overview, assemble a provisional shot table before extracting more:
  source ranges, visible action, candidate cut brackets, packaging changes and
  the specific unknowns that would affect reconstruction. Do not start a second
  overview merely because the first contains several pages.
- Refine only those named brackets, in at most two supplemental passes for the
  selected passage. Collect known instants on the same source into `timesUs`
  batches (up to 12, with `maxLongEdge: 640` for cut inspection); use a small
  range grid when the gap itself needs inspection. Reuse previously decoded
  times. Request high resolution only for an unreadable spatial detail.
- Stop refining a cut once its bracket is no wider than 100 ms or two source
  frames, whichever is larger. Do not routinely chase 50 ms differences or
  perform frame-perfect validation of every boundary. Keep the observed bracket
  and mark the chosen reconstruction boundary as estimated. More precision is
  warranted only for an explicit frame-accurate task or a demonstrated mismatch.
- Stop earlier when a pass produces no decision-changing evidence. At the
  pass limit, consolidate confirmed shots and unresolved brackets, then continue
  the visual master or report the particular blocker. Do not invent a cut,
  remove a real short shot, or restart sampling to avoid reporting uncertainty.

Treat speech as an independent evidence channel. Missing transcript data does
not call for more frames. When ASR is unavailable or the user deferred it,
continue visual shot/packaging analysis, preserve original sound, and state
that speech wording and word-level alignment remain unverified. Do not prepare
audio, submit transcription or infer dialogue from pictures in that case.

## Read Pictures, Text, and Time Together

The result is `{ command, status, result }`; a successful grid's
`result.pages` contains image references and per-frame evidence. Use
`sampleTimeUs` to locate the requested moment and `sourceFrameTimeUs` for the
actual decoded Video frame time when present. Timeline samples may have no
single source-frame timestamp. All grid timestamps belong to the input source,
not automatically to a Clip's time in another Timeline.

Inspect the actual image content delivered by the tool before making visual
claims. A path, URL, or manifest alone is not visual observation. If images
were not available to the current model, report that limitation and restrict
the answer to metadata and available text.

Read composition, subjects and actions, visible text, picture changes, and
recurring visual systems. Relate these observations to the hook, development,
payoff, or mood when the evidence supports that interpretation. A graphic can
persist across camera changes; describe its role once and locate its changes
rather than treating every tile as a separate shot.
For a later subject replacement, locate its repeated appearances within each
shot as well: hand-held products, tabletop packages, background boxes, reflections
and brief reveals after occlusion. Distinguish those product occurrences from
unrelated scenery and separate packaging forms that need their own approved
appearance references. Record what is visible, including uncertain lettering.
For master preparation, give each original person/product/prop role a stable
element ID. Inventory its occurrences with source ranges, locations and package
forms; do not collapse the foreground sachet and background boxes into one vague
"product" observation. Record what is replaceable, what must stay fixed, and
which local grip/product-fit adjustments the user's direction permits. Carry
this into the existing `referenceMaster` data when capturing the Timeline.

Keep these evidence limits explicit:

- Samples show their moments and leave gaps. Consistent neighboring pictures
  do not prove the absence of cuts or brief events. Approximate a change's
  interval between samples; do not invent an exact cut time or motion curve.
- Grid pages are inspection evidence. When a later edit must keep a continuous
  action, prepare that range with `extract_video` and send the clip into
  generation. Do not describe a precise motion path from sparse tiles.
- For fixed-template replication, identify real shot boundaries within the
  selected source range. Densify uncertain cut intervals and use actual decoded
  frame times where available. Do not treat an imported long VideoClip as one
  shot or cut at equal intervals merely to fit generation duration limits.
  Keep a continuous action intact. Record each shot's source range, observed
  action/camera behavior, and key events with source times. Analysis records
  every real shot even when it is shorter than four seconds. For production,
  `reference-adaptation` uses `plan_reference_segments` to merge adjacent short
  shots into supported segments while retaining their internal cut times.
  Do not change the observed cut times to make them look like four-second shots.
- Inventory packaging separately: spoken captions, independent titles, stickers,
  logos and graphics. Record wording, placement, appearance, and entry/exit times.
  Distinguish text burned into source pixels from existing editable Timeline
  Clips. Inventory and transcription do not require creating visible subtitles;
  preserve existing text without stacking a second copy over it.
  Separate screen overlays from lettering physically printed on products or
  present in the scene. Removing overlay captions does not authorize removing
  or inventing a product label. Use higher-resolution frames for unreadable text. ASR recovers speech, not
  burned-in lettering or sticker animation. Carry unresolved packaging into the
  master review instead of silently discarding it.
- Grid pictures are previews with a 320-pixel longest edge. Enlarge a relevant
  single frame if legibility matters. Grid labels show abbreviated text; use
  the manifest's full text when reporting available wording.
- `includeText` reads an existing Video transcript or Timeline Caption; it
  performs no ASR or OCR. `textStatus: "missing"` means those data were not
  available, not that the source has no speech or burned-in captions.
- Visible captions, an ASR transcript, and audible speech are different
  evidence. Cached words do not establish BGM, sound effects, vocal delivery,
  or exact audiovisual synchronization. Claim heard content only after audio
  was actually inspected through an available capability.

If speech understanding is part of the task and the needed transcript is
missing, load `transcription` and follow its canonical workflow. Do not start
ASR solely to decorate a visual report. Once a transcript arrives, consume
its text directly; regenerate a grid only when word-labeled pictures would
resolve a remaining alignment question.

## Deliver a Useful Reading

Scale the answer to the task. Normally include:

1. The inspected source, actual coverage, sampling density, and evidence limits.
2. Time-located observations with available wording and the relevant grid page
   or sample, followed by the interpretation those details support.
3. The reference's useful visual or pacing principles and concrete implications
   for editing, with unresolved questions kept distinct from conclusions.

Distinguish observed, inferred, and unknown information in ordinary language.
Say that sampling found no obvious cut when that is the evidence; avoid claims
of absolute accuracy. Do not prescribe a generic BGM or font without connecting
it to the user's goal and the inspected material.

Use the host's available image attachment or preview presentation for returned
grids. Do not assume printing an `assets/...` path displays an image or invent
a preview command. If the host cannot show attachments, describe the available
evidence honestly without claiming a picture was displayed.

An analysis-only request finishes with the reading. It does not place the
reference or its grids on a Timeline. When the user requests an adaptation,
carry this evidence into `reference-adaptation` without repeating inspection.
The master snapshot is the authority for its description, fixed relationships,
element inventory and occurrences. Its readable description is generated from
that same data. Use existing `docs/*.md` for additional planning only when needed
or requested; do not maintain a competing copy of the master facts.
