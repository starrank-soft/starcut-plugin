---
name: reference-adaptation
description: Use when adapting a supplied reference video's structure, style, or timing to the user's own footage, subject, product, copy, or format, including master/template replication, consistent variants, and an editable StarCut Timeline. Reuses reference-analysis evidence and routes execution to existing editing and media skills.
---

# Adapt a Reference to an Editable Video

Default to replacing only what the user names while preserving the reference's
shots, actions, camera behavior, pacing, packaging and sound. Choose new shot
structure or timing only when the user explicitly requests creative adaptation.

Use the current StarCut project. External hosts follow `basics` for project
context and deferred-operation polling. All unqualified tools here are
StarCut tools; when another provider exposes the same basename, choose the
StarCut tool.

## Collaborate Through Production Checkpoints

For paid reference production, load `reference-adaptation` with
`reference: "collaboration"` before the first paid material request. It owns
budget quotes and user authorization, saved recipe drafts, pilot selection,
version-bound visual reviews and checkpoint resume. External skill hosts read
[the collaboration reference](references/collaboration.md) and verify that
the required tools and human authorization surface are available.

Show the material that settles a real choice, explain verified findings at
milestones, and continue routine work inside the agreed scope. Reuse accepted
images and motion. Reference preparation and result inspection inform the next
production decision; their value is not the number of images or tool calls.

## Establish the Target

Separate what the reference demonstrates from what the user wants changed:
subject or identity, product and claims, wording and language, duration,
aspect ratio, tone, and available media. Use supplied facts and current project
context. Inspect missing discoverable material before asking; ask only about
a consequential creative choice or a fact the user must supply.

Honor the requested stage. A request for a plan produces a plan. A request
to make or edit the video authorizes the corresponding project work; do not
insert another approval step for routine authorized editing. Preserve unrelated
project work and do not replace a Timeline simply because it is the default.

Use existing `reference-analysis` findings when their source and scope still
apply. Load that skill only when relevant evidence is missing. Reopen only
the passage whose uncertainty affects the adaptation, not the whole reference
as a routine precondition.

## Choose Template Replication or Free Adaptation

Requests to replicate, keep the same structure, replace a person/product/copy,
or make consistent variants use the master workflow below, including equivalent
Chinese requests. Use free adaptation below only when the user's explicit
direction permits new actions, shot order or timing. A different person, product
or visual style alone does not authorize new choreography or editing rhythm.
If fixed-template preparation is blocked, resolve or report the blocker; do not
fall back to standalone video Tasks or a free adaptation.

### Establish an Editable Master

Find existing Compositions with `glob` and inspect candidates with `read` and
`head`. `head` exposes document/artifact IDs, available snapshot IDs and hashes,
and variant lineage/build records. Choose the user's intended original master,
not an existing variant. Reuse a suitable snapshot instead of creating one on
every turn. A snapshot is a frozen structural baseline, not evidence of visual
approval; inspect its content and relevant frames before calling it reviewed.

If only MP4 exists, use `reference-analysis` and `timeline-editing` to
reconstruct an editable Composition first. Follow the analysis skill's sampling
convergence: overview, provisional shot table, at most two targeted refinement
passes, then segment planning. Carry unresolved cut brackets as estimates;
do not keep sampling the whole passage before producing any master structure.
Use `transcription` only when speech understanding or alignment needs it and
ASR is available. If it is unavailable or deferred, complete the visual master
with original sound and clearly mark speech/alignment as unverified. A task
that changes anchored speech remains blocked until its transcript is available.
A transcript does not authorize visible captions. Preserve
observed shot order, ranges, framing, captions, B-roll, transitions, and sound
relationships. Mark estimated cuts and unreadable details. Burned-in captions
remain in the original pixels; adding editable captions does not remove them.
Do not claim automatic MP4 structure recovery or exact motion transfer.

Before any paid replacement generation, reconstruct and check the selected
source passage with the existing VML editing tools:

- Identify the actual shots first, then call `client_call` with
  `command: "plan_reference_segments"`, targeting the original Video Artifact.
  Pass `params.timeRange` and `params.observedShots`, each containing its actual
  `sourceRange`, `evidence`, and `keyEvents`, and an explicit `params.modelId`
  selected through `media-gen` for the intended production. This read-only
  command merges adjacent whole short shots into segments
  of at least four seconds within the model's output limit. It retains as many
  real boundaries as possible and absorbs a short tail through an earlier
  merge. Keep an already sufficient continuous shot intact. It does not invent
  cuts, extend the source range, pad footage, or discard a tail. A whole source
  shorter than four seconds or an unsplittable over-limit shot is a blocker.
- Create one main VideoClip per returned production segment, in source order. Each Clip uses
  the original Artifact and its own `sourceStart`/`sourceDuration`, or an
  explicitly reviewed `cleanSource` for that same segment, with a Timeline
  `start` relative to the selected passage. Copy its `sourceRange`, `sourceCutsUs`,
  evidence and original-clock `keyEvents` into the corresponding review entry.
  A segment may contain several camera shots; its internal cuts remain in the
  source footage at their exact times. Do not turn them into one continuous
  camera move or mechanically divide the source at four-second intervals.
- Inventory observed captions, titles, stickers and graphics without changing
  their appearance. Reuse existing editable Clips. When packaging is burned
  into footage that remains in the master, record `preservation: "source-pixels"`
  and keep it there; do not add another visible Clip. ASR words are analysis and
  timing data, not a second caption layer. Keep original sound at its offsets.
- Populate `referenceMaster.description` with the observed whole-piece selling
  structure, look and pacing, and `preserve` with concrete relationships that
  must survive substitution. Inventory original roles in `elements`: stable
  `id`, `kind`, observed `description`, `replaceable`, and all `occurrences`.
  Each occurrence has its own `id`, actual production `clipId`, original-clock
  `sourceRange` and location/form/interaction `description`. Include the same
  product in foreground, tabletop copies, background boxes and reflections.
  Fixed hands or scenery can be inventoried as non-replaceable. Do not encode
  future product claims as observations. Resolve missing critical facts before
  capture; do not invent them to satisfy the schema.
- Rebuild packaging only when replacing its picture would remove it, or the
  user requested editable/revised packaging. Match the original wording, font,
  color, size, placement, timing and animation. A default unstyled CaptionClip
  is not a faithful reconstruction. Prepare a clean-picture strategy before
  showing the new layer; rebuilding must not leave the same text underneath.
  For each cleaned shot, record `cleanSource: { artifactId, sourceStartUs,
  evidence }`. Inspect the actual clean Artifact before recording evidence:
  overlays removed, action/framing intact, duration covers the whole shot.
  Keep `sourceRange` and `keyEvents` in the original video's clock; clean-media
  time is `sourceStartUs + sourceTimeUs - shot.sourceRange.startUs`. Never use
  the composed Timeline (with its rebuilt text) as the clean motion reference.
  Keep original sound on its own aligned AudioTrack when the clean video is
  silent; mute the clean VideoClip to avoid doubling sound.
  Mark each rebuilt overlay with `nodeId` and `replacesSourcePixels: true`.
  Every overlapping shot must use `cleanSource`; an overlay cannot be declared
  retained in source pixels on a cleaned shot. Existing editable overlays do
  not need this flag. These checks validate declarations, not image pixels.
  If clean imagery or the original styling is unavailable, report the blocker
  instead of duplicating, omitting or improvising the captions. The current
  tools do not provide an automatic video inpainting or subtitle-removal
  command. Use supplied clean footage or an actually supported preparation
  method; a negative prompt is not evidence that source lettering was removed.
- Read back the master and compare its ranges and packaging with the shot table.
  Reuse inspected source frames; sample the composed master at representative
  cuts and packaging changes, adding checks for an actual mismatch. Do not repeat
  fine-grained source sampling at every boundary. Record key action events and
  list anything still unresolved.

Freeze the checked baseline with `capture_composition_snapshot`, targeting
its path and passing `params.referenceMaster`. The source range and event times
are original-video microseconds. Review `shots` identify the planned production
segments; `sourceCutsUs` records each segment's internal original camera cuts.
Shot IDs and editable overlay IDs are actual
VML Node IDs returned by `read`; do not invent them. Source-pixel overlays have
no `nodeId`. Example for two observed shots with a burned-in title:

```json
{
  "command": "capture_composition_snapshot",
  "target": "compositions/master.vml",
  "params": {
    "referenceMaster": {
      "sourceArtifactId": "original-video-id",
      "sourceRange": { "startUs": 26500000, "endUs": 34500000 },
      "videoTrackId": "main-video-track-id",
      "description": "Product demonstration: present the pack, then rotate it for a detail reveal",
      "preserve": ["Keep the lift, reveal and camera rhythm; preserve unrelated hands and scenery"],
      "elements": [{ "id": "main-product", "kind": "product", "description": "The original featured product pack", "replaceable": true,
        "occurrences": [
          { "id": "product-held-01", "clipId": "shot-01-id", "sourceRange": { "startUs": 26500000, "endUs": 30500000 }, "description": "Hand-held pack at chest height" },
          { "id": "product-detail-02", "clipId": "shot-02-id", "sourceRange": { "startUs": 30500000, "endUs": 34500000 }, "description": "Pack rotated toward the camera" }
        ] }],
      "shots": [
        { "clipId": "shot-01-id", "sourceRange": { "startUs": 26500000, "endUs": 30500000 },
          "evidence": "Observed medium shot: hand lifts the product; hard cut at the end",
          "keyEvents": [{ "sourceTimeUs": 28000000, "description": "Product reaches chest height" }] },
        { "clipId": "shot-02-id", "sourceRange": { "startUs": 30500000, "endUs": 34500000 },
          "evidence": "Observed close-up: product is rotated toward the camera", "keyEvents": [] }
      ],
      "overlays": [{ "preservation": "source-pixels", "kind": "title", "sourceRange": { "startUs": 26500000, "endUs": 28500000 },
        "evidence": "Upper-center white title retained in the original frames; no duplicate TextClip" }],
      "unresolved": []
    }
  }
}
```

Use the actual observations, not the example's timings. `overlays: []` means
no packaging was observed; it is not a shortcut for burned-in packaging. Use
`nodeId` instead of `preservation` for an existing editable overlay. Clip observed
overlay ranges to the selected passage. The command checks shot coverage,
source offsets, cut placement, source-pixel ranges and editable overlay Nodes
before storing the snapshot. Nonempty `unresolved` blocks capture.
`reviewStatus: "structure_checked"` is a structural result, not visual approval.
The receipt retains the observations, snapshot ID/hash, VML and pinned media.
It also returns `templateDescription`, rendered from the same stored master.
Show the user its selling structure, replaceable roles/occurrences and fixed
relationships. Later tasks inspect the pinned snapshot; they do not reconstruct
the template from chat history. Earlier snapshots lacking this inventory need
a newly reviewed baseline; never silently guess the missing element scope.
Inspect existing snapshots by ID/path with `params: { snapshotHash }`; a snapshot
without `referenceMaster` needs a prepared baseline before Agent variant builds.

When this task requests regrouping an existing short-shot master, author a new
master path using the returned segments and retain the original master. Keep
all audio and overlay positions unchanged. Capture the regrouped baseline before
planning video generation; resuming an old build does not apply the new grouping.

After capture, keep the baseline fixed. If a replacement is too short, stop and
resolve that shot's input; do not shorten the master, recapture it to pass a
blocker, stretch the output, or move following shots. An authorized master
revision uses a new path and a newly checked baseline. Do not overwrite a saved
variant build through `write`; fix its cause and resume the same target.

### Permit Only Declared Local Product Adjustments

Product variants retain the original shot order, Clip durations, camera cuts,
action sequence/key-event times, and overlay/audio positions. A different item
can need a small grip or product-fit adjustment while performing the same action.
When the user allows that freedom, record each permitted adjustment in the
owning shot's `allowedAdaptations`: stable `id`, replaceable `elementId`,
`kind: "grip" | "product-fit"`, and the concrete permitted `description`.
Omission means strict preservation. Do not authorize a new action or shot through
these fields. A change of editorial rhythm needs a separately revised master.

Select only necessary adjustments in `change.adaptations` as `{ id, reason }`,
using the master's exact adjustment ID and the target product's concrete need.
No selection means no local adjustment. The still review and final visual
acceptance must check the selected adjustment as well as the fixed relationships.

### Prepare Replacement Media and Speech

Reuse ready user media when suitable. Otherwise use `media-gen`, sharing the
same complete approved identity/detail image set across shots. Follow its model-selection
policy for generation, splitting, retries, and resume; an earlier Agent-selected
model is not a user selection. Check actual conditioning capabilities;
identity and action fidelity still require visual review.
Ready replacements need real Artifact IDs (`head`), valid durations, and exact
source offsets. `sourceStartUs` changes the replacement's in-point while keeping
the master Clip duration, playback rate, styling, and placement.

Before generating a replacement, call `plan_composition_variant` to check the
intended shot. If it contains packaging recorded as `source-pixels`, replacing
that picture is blocked: prepare a new reviewed master with clean imagery and
the affected packaging rebuilt in the original style first, recording the
shot's actual clean Artifact with `cleanSource` and marking the rebuilt overlay
with `replacesSourcePixels: true`. The initial master
may keep its burned-in captions without an added subtitle layer. Do not erase
the inventory to pass the planner or assume generation preserves exact text.

### Replace a Person or Product While Keeping the Shot

Use this when the request keeps a shot's action and replaces its subject. Do
not promise frame-by-frame pose matching. Preserve action order, facing,
object contact, framing, and the shot's main rhythm.

1. Reuse confirmed `reference-analysis` for that shot's source range. Do not
   restart the whole reference.
2. Record the action that must survive: opening pose, action order, facing,
   which hand is used, object contact, ending state, and camera movement. A
   grid locates the shot. It does not prove a continuous trajectory. Check a
   disputed instant with a denser sample or a single frame, and say what
   remains unresolved.
3. Use one motion clip for this exact planned production segment. Master capture/build
   prepares it and makes it visible in Media > Video; planning reuses that
   pinned version. For explicit preparation use `client_call` `extract_video`.
   `target` is the shot's `cleanSource.artifactId` when prepared, otherwise the
   original video Artifact. Map original events to the clean-media clock above.
   `params.timeRange` is a required half-open
   integer-microsecond range covering the opening, the action, and the ending.
   The clip includes every original shot and internal cut assigned by the
   segment plan, in its original order and at its original speed. Do not add
   unrelated shots or cut one continuous action into generation requests.
4. Resolve all approved identity/detail images for each replacement person or product. If
   supplied imagery is sufficient, reuse it; otherwise generate and inspect it
   with `media-gen` before video work. Inspect every relevant supplied view,
   including profiles, wardrobe and product details; do not silently pick one
   and omit the rest. Record the complete ordered set in
   `recipe.subjects[].referenceImages` with each Artifact ID/hash. Each subject's
   `id` is the exact replaceable master element ID, while `description` states
   the target identity/product facts. The master owns the complete shot scope;
   do not restate or narrow it with `shotIds`. Use every inventoried occurrence,
   including brief returns, reflections and
   background appearances. For a product, include the hand-held item, repeated
   tabletop packages, background outer boxes and their printed product identity.
   Those are the same replacement subject, even behind the main object; preserve
   unrelated scenery, hands, props and their spatial relationships. Obtain approved
   imagery for each needed package form. A sachet image does not establish an
   outer-box design: resolve that gap before claiming the box was faithfully replaced.
   Collect a clear representative time for every original shot inside an
   affected production segment. Batch times sharing the same source with
   `extract_frame` `params.timesUs` (up to 12 per call); map clean-source times
   as above. Separate sources need separate batches. Reuse inspected stills
   already available and keep each returned image ID/hash mapped to its shot
   and original source time. For each shot, then use
   `image.edit` with that frame and all relevant approved subject images to prepare
   a replacement still. Direct the image edit to replace every inventoried
   occurrence while keeping pose, object contacts, placement and unrelated scenery.
   Reuse an already suitable inspected shot still instead of generating another.
   Inspect the whole image, including edges, background and reflections, for old
   product remnants, inconsistent face/wardrobe/packaging and unwanted text.
   Record `change.referenceFrames` in original-source time order, covering every
   internal shot, with image ID/hash, original `sourceTimeUs` and concrete review
   `evidence` for each. Each frame also requires `replacements`, listing each
   visible `subjectId` once with the exact master `occurrenceIds` checked at
   that source time, and `unresolved`, listing any remaining defect or missing
   visual fact. For example, check the hand-held sachet, all tabletop sachets and
   background boxes separately for the approved new product. Empty `replacements`
   is valid only when no declared subject is visible at that instant; every
   inventoried occurrence needs coverage in the segment. Sample a brief reveal
   at its actual time rather than claiming it was visible in another still.
   Use `unresolved: []`
   only after actual inspection finds no remaining issue. Nonempty findings or
   missing review coverage block production; fix the still before spending on video.
   These fields record visual observations; the planner cannot certify their truth
   from metadata. A path or successful image Task is not visual approval. If the image edit model
   cannot accept the required references, report the capability gap.
5. Query `video.generate` and check the selected model's image/video reference
   capacity. The variant planner assembles every declared subject image,
   all reviewed stills inside this segment, and its exact pinned motion clip in stable order.
   Explicit inputs must agree with that set; unrelated images, duplicates and
   another shot's video are blockers. Identical approved images shared across
   subjects are sent once. Never drop images or motion to fit capacity; explain
   the limit and resolve it with the user. Include the selected `modelId` in
   every generated source. Check inputs and duration before building; retries
   and resumes keep the model saved in that plan. Plan/build through the variant
   executor after image preparation; do not start standalone video Tasks before this preflight.
6. Describe only the requested replacement and verified visible action in the
   generation brief. The planner compiles the approved image roles, exact shot
   bounds and shot-local key-event times into replacement-only instructions.
   Images supply identity/details; the video supplies action and camera behavior.
   Its old subject appearance is not an authority for the target's packaging or
   identity. Keep the full checked replacement scope in the image directions and
   generation brief; "preserve the background" must not preserve old-product boxes.
   State that the image supplies the new person's identity and
   the shot still supplies the approved local appearance/composition and the
   clean video supplies the action and camera behavior. Describe visible
   poses, contact and camera events; keep spoken words and screen copy out of
   those descriptions. Rebuilt captions, titles, stickers and cards stay on
   the Timeline. Do not link a TextClip through `textNodeId` for this video or
   ask the generator to draw overlay copy. A "no text" sentence alone cannot
   counter a prompt that asks for a written label. Physical product packaging
   and scene signs are factual appearance, not subtitle layers: compare their
   lettering against the approved product image and report unresolved errors.
7. Use `plan_composition_variant` and resolve blockers before
   `build_composition_variant`. It submits generation and binds ready outputs;
   omitted reference inputs are filled from the master and declared images,
   and generated audio defaults to false. After generation, inspect the
   actual frames at the corresponding key events before declaring completion.
   Review the generated Artifact itself before adding the rebuilt overlays;
   a final Timeline frame may hide unwanted text underneath a correct caption.
   Use full-resolution single frames at text-bearing/packaging moments, not
   only the grid. Recheck all inventoried product occurrences at the opening,
   relevant key events, new camera views, reappearance after occlusion and ending.
   If a correct still became a video with old packaging again, repair that video's
   appearance/reference direction rather than accepting the foreground alone.
   Old-product remnants, inconsistent packages, garbled copy, ghost letters,
   duplicated captions and changed product lettering fail visual acceptance. Then review the
   composed Timeline for exact copy, style, placement and entry/exit timing. A
   ready file alone is not acceptance. Extra cuts, reordered actions or displaced
   key events block that shot's delivery; report the differences and retain the
   original and other ready work. If inspection fails, identify the responsible
   prompt, reference or editable layer. Correct the layer directly when it owns
   the error; regenerate only the affected shot when the error is baked into
   its pixels. Keep the same model, identity reference and frozen timing. A
   new paid attempt needs an identifiable correction; repeated unchanged
   failure is a blocker, not a reason to loop or regenerate accepted shots.

For a fixed shot, its target event time is the main Clip's Timeline start plus
`event.sourceTimeUs - shot.sourceRange.startUs`. Compare those same events,
not unrelated equally spaced images. Check packaging at its declared source
entry/exit converted relative to the selected passage.

Check the current model's duration contract before submission. Use the segment
planner's `generationDurationSeconds`, or omit `duration` in a variant recipe
so the executor picks the shortest supported output covering the whole source
window. A 4.1-second segment remains 4.1 seconds on the Timeline and needs a
five-second output when the model uses whole seconds. It does not become a
four-second source cut. Unmerged sub-four-second generation is blocked before
submission. Never select a disabled longer-output model. Review the actual
internal cuts and key events; a generation prompt is not proof of matching cuts.

```json
{
  "command": "plan_reference_segments",
  "target": "assets/reference.mp4",
  "params": {
    "timeRange": { "startUs": 0, "endUs": 5000000 },
    "observedShots": [
      { "sourceRange": { "startUs": 0, "endUs": 1000000 }, "evidence": "Observed wide opening", "keyEvents": [] },
      { "sourceRange": { "startUs": 1000000, "endUs": 2500000 }, "evidence": "Observed product close-up", "keyEvents": [] },
      { "sourceRange": { "startUs": 2500000, "endUs": 5000000 }, "evidence": "Observed demonstration", "keyEvents": [] }
    ]
  }
}
```

The first version uses `retimingWindows: []` and `replace-source` only for the
shot being replaced. Keep master shot order, Clip duration, framing, captions,
B-roll, transitions, and sound positions. Set `generateAudio` to false. That
picture replacement does not rewrite captions. The variant keeps the original
sound: a separate AudioClip stays in place, and sound embedded in the replaced
video is preserved and captions bound to that video track move with it. Do not
extract a second copy. Do not replace the original voice with generated audio.
A rejected, failed, or cancelled generation ends that attempt; keep ready clips
and report the cause. Do not poll a failed Task with a clock.

If changing speech used by word/segment anchors, generate or obtain it and
complete `transcription` first. Read the actual word/segment indices and times.
Map every affected anchor explicitly, including repeated words, with its
snapshot `anchorId`, `unit`, `index`, `edge`, and exact `expectedText`.
Missing transcripts or guessed mappings block the plan. Generate speech first
rather than put unmeasured anchored speech into the variant's generation step.
Update CaptionClip content with measured, Clip-local `<p>`/`<span>` times;
replacing speech alone does not rewrite captions.

### Plan, Build, and Resume Through the Existing Executor

Use `plan_composition_variant`, targeting the snapshot ID/path, with
`params: { snapshotHash, recipe }`. This command reads and validates only.
A recipe contains `changes` (replace-text or replace-source), optional
`anchorMappings`, and required `retimingWindows`:

```json
{
  "changes": [
    { "kind": "replace-text", "nodeId": "master-title", "content": "New product" },
    { "kind": "replace-source", "nodeId": "master-shot", "source": {
      "kind": "artifact", "artifactId": "ready-replacement"
    }, "sourceStartUs": 0 }
  ],
  "retimingWindows": []
}
```

Every `generate` source requires an explicit `modelId`, selected through
`media-gen` for the required image, video, or audio intent. The saved execution
plan retains this model for retries and resumes, independent of later default
configuration changes.

For each changed reference-master VideoClip, the recipe also declares the
subject scope and reviewed replacement still. The same subject uses its complete
approved image set/versions across its shots. Extend the recipe above with actual IDs/hashes:

```json
{
  "subjects": [{
    "id": "main-doctor", "description": "White male doctor, same face and white coat across shots",
    "referenceImages": [
      { "artifactId": "approved-doctor-front", "hash": "actual-front-hash" },
      { "artifactId": "approved-doctor-profile", "hash": "actual-profile-hash" }
    ]
  }],
  "changes": [{
    "kind": "replace-source", "nodeId": "master-shot",
    "referenceFrames": [{
      "image": { "artifactId": "approved-shot-still", "hash": "actual-still-hash" },
      "sourceTimeUs": 28000000,
      "evidence": "Inspected the still: target doctor, original raised hand and framing, no extra text",
      "replacements": [{ "subjectId": "main-doctor", "occurrenceIds": ["doctor-foreground"] }],
      "unresolved": []
    }],
    "source": { "kind": "generate", "modelId": "model-id-from-query", "input": {
      "prompt": "Replace only the doctor with the approved identity; preserve the observed raised-hand action and camera behavior",
      "duration": 4, "generateAudio": false
    } },
    "sourceStartUs": 0
  }],
  "retimingWindows": []
}
```

This example assumes a four-second reviewed shot; use its actual supported
duration. The planner fills the omitted image/video inputs from the declarations
and master. Use an `artifact` source for already prepared, reviewed footage.
The timestamp must fall inside that shot's original range. Listed shots without
a source replacement, unassigned replacement shots, missing/unready imagery,
or changed image hashes block the plan. Supplied replacement footage requires
actual visual comparison against its reviewed still. Generated ready footage
also needs its producing Task record to prove the same identity/still images,
exact motion reference and `generateAudio:false`; `head` exposes that request.
Extracting a generated clip does not remove this provenance requirement. Do not
re-import a generated clip as supplied footage to bypass the check. Missing
provenance is a blocker, not permission to guess reference usage.

Before batching, prefer two representative affected shots with different
framing to validate the shared identity and local stills. Preserve accepted
images/clips and repair only the failed shot. The executor enforces input
identity/version and declared scope, not semantic visual correctness; compare
the actual videos at their key events before delivery.

`retimingWindows: []` keeps every Clip's time range fixed. To retime a caption,
title, or B-roll against new words, explicitly list
`{ clipId, withinClipId }`, where `withinClipId` identifies a fixed audio/video
Clip that already contains it. Keep main shots fixed. The executor blocks
unmapped speech anchors, text mismatches, track overlaps, insufficient media,
and timing outside the containing Clip. It does not silently extend the shot
or move following scenes. Explain an impossible fit and resolve the input.

For authorized production, after a clear plan call `build_composition_variant`
with the same snapshot/hash/recipe and a new `params.path` under
`compositions/*.vml`. It clones independent Nodes, retains the master, and
returns a Timeline path, Node mapping, generated media, and resume target.
It does not export by default. The staged build returns a review checkpoint before submitting remaining videos; follow the collaboration reference. Build one path per version; do not overwrite an
existing path. Resume saved work with `resume_composition_variant` targeting
its Timeline path. Do not resend generation tasks or rebuild a partial variant
under a new path merely because a request timed out. An edited variant may
require manual review before resume; the saved recipe is not permission to
undo the user's edits.

If a required generation is rejected, failed, or cancelled, that attempt is
over. Report the affected shots and cause, retain ready replacements and the
partial variant, and resolve the blocker before continuing. A failed source
is not pending work; do not schedule clocks or resume it repeatedly unchanged.

Read back and sample the target at corresponding events. Verify shot order,
fixed ranges, captions/B-roll inside their permitted windows, and visible
identity/action consistency. Structural validation is not visual/audio review.
Deliver editable Timeline locations and remaining uncertainties. Call
`render_timeline` only when export is requested.

## Map the Reference's Function to the New Piece

Create a compact beat or shot plan with these useful relationships:

| Reference evidence | Function | Target realization |
|---|---|---|
| Source time and observed action, words, or visual change | What it makes the viewer notice or understand | New words, material, layout, and proposed target time |

Use this mapping for decisions, not as a mandatory document scaffold. Distinguish
source times from planned target times; a new spoken line or longer action can
change the timing. Match meaningful events rather than copying timestamps
mechanically. Keep estimates labeled until the target material establishes
its actual duration.

For example, a reference's picture change may answer a spoken question. With
different copy, preserve that answer-and-reveal relationship and place it
against the new words. Do not force the reveal into the original second if
the target wording has not reached the question yet.

- For supplied footage, choose useful source ranges and account for source
  duration, composition, and continuity. Grid JPEGs are inspection evidence;
  use original media for final VideoClips.
- For a new product or person, retain only relationships that fit the target.
  Supplied imagery establishes visible identity, not a voice, performance,
  product benefit, or unsupported claim.
- For several references, identify the function borrowed from each and resolve
  conflicting direction in the target plan instead of stacking every effect.
- Treat captions, independent titles, graphics, BGM, and sound effects as
  distinct roles. A recurring system can span several shots; plan its behavior
  once and locate its entries and changes.

## Execute Through Existing Owners

Load only the skills needed by the chosen work and retain their public
contracts rather than inventing another production pipeline:

| Work | Skill |
|---|---|
| Author or edit Composition VML, media ranges, Tracks, layering, and timing | `timeline-editing` |
| Get a transcript, align new speech, or create CaptionClips | `transcription` |
| Create or edit SVG or authored motion graphics | `graphics` |
| Generate missing images, video, music, sound effects, or speech | `media-gen` |

Reuse suitable ready project media. Generate missing material when it serves
the requested production; analysis and planning alone do not start generation.
Check actual model input capabilities through `media-gen` before conditioning
generation on a reference. Extracted frames can establish appearance but do
not carry the original motion. Do not claim a tool supports face replacement,
voice matching, or exact movement transfer without its documented capability.

Read an existing target Timeline before editing its Nodes. Write through the
project tools; keep Composition VML authoritative for target timing and media
placement. Use project-relative Artifact paths in Clips, not grid URLs or
imaginary asset IDs. Use focused changes for an existing edit and a complete
Timeline only when the task calls for a new one.

The `story-video` skill owns a specific eight-shot, approximately 60-second
executor. Use it only when that format matches the user's request. Do not
force a short reference adaptation into its presets or combine its executor
with manual Task orchestration.

## Verify the New Piece Against Its Purpose

Read back the authored Timeline to verify ranges, media references, layers,
and captions. When a connected Editor is available, use range `extract_frame`
on the target Timeline for visual evidence at relevant events, following
`reference-analysis` for sampling and reuse. Compare reference and target by
the event they express, with their respective source and target times.

A grid can check framing, layering, and visible states; it cannot establish
continuous motion, audio mixing, or exact synchronization. Use an available
playback/review surface for those questions. `client_call` with `play` starts
playback but is not proof that the Agent watched or listened. State what was
verified and what still needs playback review.

If rendering or generated media is pending, follow the original operation's
continuation rather than submitting it again. Preserve usable outputs after
failure and repair the responsible input or edit instead of restarting the
whole adaptation. Deliver the actual status: plan, authored Timeline, pending
media, or verified output.

Summarize the meaningful choices, what changed in the target, and the remaining
limits. Preserve an existing brief or plan when continuation needs durable
notes; avoid duplicate planning files and keep exact edit state in the Timeline.
