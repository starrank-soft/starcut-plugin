# Budgeted reference production

Use this for paid reference replication in the embedded StarCut Agent. Before the first paid image, agree on the useful result for this round, describe the principal uncertainty, and establish the media budget. For an external host, first check whether these budget and approval capabilities are exposed; missing authority is a capability gap, not permission to bypass the variant workflow.

## Quote and authorize

`production_budget` is a server tool. All arguments are under `request`:

```json
{"request":{"command":"quote","requests":[{"task":"generate","params":{"modelId":"USER_SELECTED_OR_RESOLVED_MODEL","input":{"prompt":"ACTUAL_DIRECTION"}}}]}}
```

Use real model parameters, durations and existing project inputs from the current plan. Before future reference images exist, a quote request may additionally carry `plannedInputs:[{mediaKind:"image",role:"reference",count:3}]` (video/audio items also supply `durationSeconds`). These metadata-only planned inputs are capability-checked and included in pricing; they are never submitted or accepted by `run_task`. Do not invent Artifact paths for future images. Quotes use the same normalization and metering as submission; they submit no Tasks. Repeat a representative request only when the work actually needs multiple outputs. Reuse compatible quote results. Quote missing work, not already paid accepted media. Transcription quotes use the existing `transcribe` envelope. Quotes for usage-metered models return `bounded:false` and `credits:null`; they cannot be submitted under a hard allowance without an executable bound. Explain that limitation and retain the user's model choice. All image models support executable Nexra quotes after the actual reference media is ready. Prepare those inputs before the final quote; do not treat future image counts as a signed ceiling. The approved allowance reserves the quoted maximum, and final settlement returns unused credits. Video and audio retain their own catalog pricing policies.

Explain the expected media cost, the round's deliverable and the allowance for identified corrections. Propose the user's chosen number of StarCut credits:

```json
{"request":{"command":"propose","description":"One product-replacement review variant, including reference images and video revisions","limitCredits":60}}
```

The result is an unapproved proposal. Request the user's actual authorization with the existing human tool:

```json
{"question":"Authorize this round's media-production allowance? Agent conversation costs are separate.","budget":{"id":"RETURNED_BUDGET_UUID","limitCredits":60}}
```

The explicit authorization button saves the approved amount on the server. Free text, a successful proposal or the Agent's own assertion does not approve it. Reuse already approved budgets; do not ask again for routine work inside their scope. Use `production_budget` with `request:{command:"status",budgetId:"..."}` after a spending milestone or before a material next commitment. Ledger debits include uncompleted reservations; do not count reservations and final charges twice. The allowance covers linked media Tasks, including image/video/audio generation and transcription, not Agent conversation steps. No new paid attempt is justified merely by remaining credits.

Every `run_task` belonging to this production carries the approved `budgetId` at the top level, alongside `task` and `params`. It is not a model input parameter. Use the same ID in `build_composition_variant` and every revised version. New Tasks and retries check the allowance on the server. A budget rejection is terminal for that submission; retain completed work and resolve the requested scope or amount with the user.

If the user authorizes more work, propose an extension with the existing `budgetId` and the new **total** `limitCredits` (for example, 60 plus 60 becomes 120). This changes no server allowance until the user presses the same explicit authorization button. After approval, resume the same build and retained Tasks; its immutable manifest still points to the same budget. Do not create a second allowance just to bypass an exhausted cap. Conversation text alone cannot extend a server cap.

## Prepare and retain reference images

Use the existing subject images, per-shot `referenceFrames`, replacement occurrences and unresolved findings. Reuse accepted views. First establish each needed package form, then inspect source-matched stills for every internal shot in the production segments. Full-frame background and brief product returns count. Do not pay for video while a required still has unresolved defects. Generate more views only to resolve a named appearance or contact question.

Show concrete product/design choices when the user's judgment matters. Routine technical inspection belongs to the Agent. A useful update says what the image establishes, what remains uncertain and which action will test it; it does not narrate each tool.

When a required visual choice blocks the next step, show the relevant media and call `ask_user` with a concrete question and useful options. Wait for that answer; a plain-text statement such as "after you confirm" does not create a confirmation checkpoint. Only budget authorization carries `budget`; ordinary visual choices use the same question surface without it.

During preparation, persist a recipe draft through `client_call`:

- `command:"save_composition_variant_draft"`, `target` the pinned master snapshot, `params:{snapshotHash,recipe,budgetId}`. This stores a document Artifact without generation. The same recipe schema is used by planning and builds; incomplete reference coverage remains a preflight blocker.
- `command:"read_composition_variant_draft"`, `target` the returned Artifact ID/path, `params:{hash}` reads the exact draft version. Resume from it, existing Artifacts and the approved budget. Do not re-extract or regenerate merely to rebuild context.

Prepare the full still set before the first video build. This keeps the existing complete-subject and occurrence validation authoritative. The immutable build recipe freezes the selected images and hashes.

## Pilot, inspect, continue

Plan with `plan_composition_variant`. Build a complete recipe, supplying its `budgetId`, new Timeline path and `execution:{pilotNodeIds:[...]}`. Choose representative affected segments with different action/contact or framing questions. Selection limits execution only; it never narrows the declared subject scope. If omitted, the Agent command uses the first two picture replacements as its pilot.

The build returns the actual Timeline, generated media, original-to-variant Node mapping, `resumeTarget` and `checkpoint`. `needs-review` is a successful production checkpoint, not a failed or completed video. Remaining video requests are deferred until the pilot passes. Preview may contain original footage in deferred slots; say so and do not deliver it as the complete replacement.

Review the generated video Artifact itself before overlay composition. Use `extract_frame` batch `timesUs` on that Artifact to obtain independent evidence images. Check source-window opening/ending, action key events, internal cuts, package lettering, background appearances and occlusion reveals. The replacement video's clock is separate from original-source time: convert each event using the shot's original range and selected output offset. Actual movement and sound require playback evidence when available; still samples do not prove continuous fidelity.

Record `client_call` `command:"review_composition_variant"`, `target` the variant Timeline, with `params.review`:

```json
{
  "nodeId":"ORIGINAL_MASTER_CLIP_ID",
  "artifactId":"ACTUAL_REPLACEMENT_ARTIFACT_ID",
  "hash":"ACTUAL_VIDEO_HASH",
  "sourceStartUs":0,
  "sourceDurationUs":4000000,
  "verdict":"accepted",
  "findings":[],
  "evidence":[{"image":{"artifactId":"BATCH_FRAME_ID","hash":"FRAME_HASH"},"sourceTimeUs":500000,"observation":"Actual full-image findings at this moment"}]
}
```

Use the actual selected range; the example does not prescribe four seconds or one sample. Evidence must be batch-extracted from this exact video version at the stated time. An accepted review has no unresolved findings. For a defect use `verdict:"revise"` and specific nonempty `findings`. The record is the reviewer's observation, not automatic pixel certification. Changing video bytes, selected window or evidence invalidates its applicability. `head` on the variant exposes saved reviews.

After accepting the pilot, call `resume_composition_variant` on the same Timeline. It reuses ready Tasks and executes remaining work. Inspect and record the remaining replacements before final delivery. `render_timeline` for this staged variant requires current acceptance records; then review the actual composition and encoded export separately.

## Continue versus revise

A timeout, restart, pending Task or a normal checkpoint resumes the same build. Do not duplicate its generation or overwrite its Timeline. The existing Task protocol owns technical retries. A rejected visual result is a creative revision, not a technical retry.

When changing a prompt, image or plan, create the next variant from the same original snapshot. Reference compatible accepted video Artifacts directly in the new recipe, retain their provenance and reviewed shot stills, and generate only changed segments. Keep the same budget when its authorization still covers the work. Reinspect selected results in the new composition. Changing the shared product design invalidates dependent appearances; do not reuse an incompatible clip just because its previous review passed.

Explain the defect, the concrete input or method correction and its expected extra cost before committing. If existing tools cannot perform the needed local repair, state that gap; this round adds no tracking or arbitrary script execution. Repeating the same unsuccessful input without new evidence is not an optimization strategy. Manual Timeline edits remain authoritative and may require resolving the conflict before a saved build can resume.
