---
name: media-gen
description: Use when generating or editing StarCut image, video, music, sound-effect, or speech Artifacts through the live model catalog and Task workflow.
---

# StarCut Media Generation

All unqualified tool names below refer to StarCut tools. If another provider
exposes the same basename, choose the StarCut tool.

All generated media follows one workflow:

```text
reuse a compatible model query, or query the requested capability
→ resolve any project media inputs
→ run one generate Task
→ poll that Task
→ use the resulting ready Artifact
```

The live model catalog is authoritative for model IDs, availability, supported
input modes, parameter names, allowed values, defaults, and limits. This skill
defines the stable generation envelope and the intent-specific basics. Reuse a
compatible `query` result already present in the conversation.
Call it with `request.kind: "model"` before constructing detailed parameters only when
the required intent or capability is not already known.

## Common Workflow

Query exactly one intent:

| Direction | Intent |
|---|---|
| Image generation | `image.generate` |
| Image editing | `image.edit` |
| Video generation | `video.generate` |
| Music generation | `audio.music` |
| Sound-effect generation | `audio.sfx` |
| Text-to-speech | `audio.tts` |

```json
{
  "request": {
    "kind": "model",
    "where": {
      "intent": "video.generate"
    }
  }
}
```

If the user named a model, honor that selection. Otherwise choose an enabled
result using its summary and the required capabilities. Copy its `modelId`
exactly and pass it explicitly in every `generate` Task. Inspect the selected
result before constructing inputs:

- `input.primary` for the exact required `prompt` or `text` key and hard
  `limit`, when present;
- `input.inputs.modes` for mutually exclusive media combinations; choose one
  mode and follow each entry in `accepts` by `role`, `mediaKind`, and `max`;
- `input.parameters` for exact parameter keys, types, choices, defaults, and
  limits;
- `features` for model-specific capabilities.

Do not merge slots from different input modes. Do not use remembered model
parameters when the current query differs.

Check duration and media-input compatibility before finalizing the plan. If a
user-selected model cannot meet the requirements, explain the limitation and
resolve it with the user. Retries and resumes must keep the saved `modelId`
and inputs. Changing the model requires a revised plan; never silently
substitute another model during execution.

Examples below use representative values. Replace `model-id-from-query` with
the selected catalog ID, and include parameters only when that model's current
query result supports those exact values.

Submit one generation with:

```json
{
  "contextId": "context-id",
  "task": "generate",
  "params": {
    "modelId": "model-id-from-query",
    "name": "optional-output-name.ext",
    "input": {}
  }
}
```

`name` is optional. One Task produces one stable Artifact. Do not submit
redundant variants. Long TTS narration is intentionally split into ordered
Tasks as described below.

## Project Media Inputs

Every project media input is an exact project path:

```json
"assets/reference.png"
```

Locate a path with `glob` and inspect it with
`head`. Pass that path directly; never pass a URL, binary data,
or base64 as model media input.

Put every media item in one `inputs` array. Each item has the project `path`
and the exact `role` accepted by the selected mode:

```json
"inputs": [
  { "path": "assets/start.png", "role": "first" },
  { "path": "assets/end.png", "role": "last" }
]
```

Artifact kind is resolved from the project path. Do not add fields not defined
by the selected input mode or mix entries from different modes.

## Image

Image generation and editing share the `generate` Task.

Primary input:

| Field | Meaning |
|---|---|
| `prompt` | The requested image or edit |
| `inputs` | Optional role-based project media list |

Common model parameters include `aspectRatio`, `resolution`, and sometimes
`quality`; use only keys and values returned by `query`.

Generation:

```json
{
  "contextId": "context-id",
  "task": "generate",
  "params": {
    "modelId": "model-id-from-query",
    "name": "product-hero.png",
    "input": {
      "prompt": "Studio product photograph on a warm neutral background",
      "aspectRatio": "16:9",
      "resolution": "2K"
    }
  }
}
```

For editing, query `image.edit` and add reference-role inputs supported by
the selected model. Editing is not a separate Task type:

```json
{
  "contextId": "context-id",
  "task": "generate",
  "params": {
    "modelId": "model-id-from-query",
    "name": "product-hero-edited.png",
    "input": {
      "prompt": "Preserve the product and replace only the background",
      "inputs": [{
        "path": "assets/product-reference.png",
        "role": "reference"
      }],
      "aspectRatio": "16:9",
      "resolution": "2K"
    }
  }
}
```

## Video

Input begins with `prompt`. Depending on the selected input mode, `inputs` may
contain either:

- `first` and optionally `last` roles; or
- one or more `reference` roles of the accepted media kinds.

Common model parameters include `aspectRatio`, `resolution`, `duration`, and
`generateAudio`. Their allowed values and compatible media combinations are
model-specific and must come from `query`.

```json
{
  "contextId": "context-id",
  "task": "generate",
  "params": {
    "modelId": "model-id-from-query",
    "name": "product-reveal.mp4",
    "input": {
      "prompt": "Slow cinematic push-in while light moves across the product",
      "inputs": [{
        "path": "assets/product-hero.png",
        "role": "first"
      }],
      "aspectRatio": "16:9",
      "resolution": "720p",
      "duration": 5,
      "generateAudio": true
    }
  }
}
```

Do not mix a first/last-frame mode with a reference-media mode unless the
queried model explicitly returns one mode containing both.

To replace a person while keeping an action, choose one `reference` mode that
accepts image and video references. For template replacement, follow
`reference-adaptation`: record every approved subject identity/detail image and
inspect replacement stills covering every original shot in each merged segment. Plan/build through the
variant executor, which assembles the full image set and the exact shot motion
clip from `extract_video`; do not submit standalone video Tasks to bypass it.
Reuse inspected imagery instead of generating duplicates. Never omit required
references to fit model capacity. A path written in `prompt` is not a media
input. Set `generateAudio` to false when the Timeline keeps the original sound.
If the provider rejects that reference combination, stop. Do not resubmit
without the video, and do not switch models.

When the Timeline will own captions, titles, stickers or product cards, generate
clean footage and author those elements with `timeline-editing` or `graphics`.
Keep exact overlay copy out of the video prompt; describe visible actions rather
than asking the model to illustrate spoken words as labels. Specify each
reference's role: identity/physical product facts versus motion/camera timing.
A negative "no text" instruction is only guidance, not a cleanup guarantee.
Inspect the ready Artifact itself with `extract_frame` before adding overlays;
use clear single frames for suspected letters. Do not accept garbled text or
hide it under another caption. Physical packaging lettering must match the
approved product reference; it is not an editable caption. For fixed-template
work, follow `reference-adaptation` for clean-source mapping and focused repair.

## Music

Before generating a generic music bed, query the curated BGM Library:

```json
{
  "request": {
    "kind": "bgm",
    "where": {
      "q": "optimistic electronic product launch"
    }
  }
}
```

If a result fits, call `use_library` with its `libraryId` and the
current `contextId`, then use the returned Artifact. Generate only when the
Library has no suitable result or the user explicitly requests original music.

Music uses `prompt` for genre, mood, instrumentation, tempo, structure, and
intended use. Common model parameters include `duration` and `instrumental`.
Summarize the musical direction instead of pasting a script, document, or
storyboard into `prompt`. Prefer at most 300 characters even when the queried
model allows more. Never exceed `input.primary.limit` when present.

```json
{
  "contextId": "context-id",
  "task": "generate",
  "params": {
    "modelId": "music-model-id-from-query",
    "name": "launch-bed.mp3",
    "input": {
      "prompt": "Optimistic electronic product-launch bed, restrained drums, no vocals",
      "duration": 30,
      "instrumental": true
    }
  }
}
```

Use the queried duration range. Do not assume that every music model supports
lyrics or instrumental control. Use only parameters exposed by the model query.

## Sound Effects

Before generating, reuse a compatible SFX catalog result or search the reusable
Library:

```json
{
  "request": {
    "kind": "sfx",
    "where": {
      "q": "polished metallic whoosh"
    }
  }
}
```

If a result fits, call `use_library` with its `libraryId` and the
current `contextId`, then use the returned Artifact. Query `request.kind: "model"` with
intent `audio.sfx` and generate only when the Library has no suitable result.

Sound effects use `prompt` for the audible event, environment, perspective,
intensity, and temporal shape. Some models expose controls such as `duration`,
`promptInfluence`, or `loop`; include only parameters returned by the selected
model query.

```json
{
  "contextId": "context-id",
  "task": "generate",
  "params": {
    "modelId": "sfx-model-id-from-query",
    "name": "logo-whoosh.mp3",
    "input": {
      "prompt": "Short polished metallic whoosh ending in a soft low impact"
    }
  }
}
```

Generate music and SFX as separate Tasks. They have different intents and
parameter contracts even though both produce Audio Artifacts.

## Text-to-Speech

Use only TTS input keys returned by the selected model query. If
`input.parameters` contains a `voice` catalog parameter, query its live choices
for the selected model:

```json
{
  "request": {
    "kind": "voice",
    "where": {
      "modelId": "tts-model-id-from-query"
    }
  }
}
```

Optionally add `q` to search by name, ID, language, category, or emotion. Use a
returned voice `id`; do not invent one.

Do not send a complete long script in one Task. Preserve the exact authored
copy, split it at paragraph or sentence boundaries, and generate one ordered
Artifact per chunk. Keep each chunk around 500 characters: up to 500 is the
comfortable range; above 500 and below 1000 may preserve a semantic unit but
is more likely to be slow; 1000 or more should be split even when the model's
hard limit is larger. A lower `input.primary.limit` always wins. If one
sentence is too long, split at clause punctuation without rewriting or
dropping text.

```json
{
  "contextId": "context-id",
  "task": "generate",
  "params": {
    "modelId": "tts-model-id-from-query",
    "name": "narration.mp3",
    "input": {
      "text": "让每一次创作，都更接近你的想象。",
      "voice": "voice-id-from-query"
    }
  }
}
```

The voice query returns `defaultVoiceId` when the model default is available.
Use only parameters exposed by the model query.

## Poll and Use the Result

`run_task` returns stable Task and Artifact identities without
waiting for generation to finish. If the workflow depends on progress or
output, call `poll` with the exact `contextId` and returned
`toolCallId`.
Never resubmit a queued or running Task.

`rejected`, `error`, `failed`, and `cancelled` end that attempt. Stop polling
for that Task, explain the cause and affected output, and preserve ready media
and existing Timeline work. An input or content-policy rejection needs an
allowed input or a supported alternative, not an unchanged retry. Temporary
failures use the Task runner's bounded retry policy; do not create duplicate
Tasks to retry them. Only start another attempt after resolving the cause
within the user's agreed work and model-selection policy.

Generation does not place media on a timeline. When placement is requested,
use the returned Artifact path as the `source` of a compatible `ImageClip`,
`VideoClip`, or `AudioClip` by following `timeline-editing`.
