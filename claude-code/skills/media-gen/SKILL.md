---
name: media-gen
description: Use when generating or editing StarCut image, video, music, sound-effect, or speech Artifacts through the live model catalog and Task workflow.
---

# StarCut Media Generation

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
compatible `mcp__plugin_starcut_starcut__query` result already present in the conversation.
Call it with `kind: "model"` before constructing detailed parameters only when
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
  "kind": "model",
  "where": { "intent": "video.generate" }
}
```

Choose an enabled result using its `summary`. Copy its `modelId` exactly. Then
read:

- `input.primary` for the exact required `prompt` or `text` key and hard
  `limit`, when present;
- `input.inputs.modes` for mutually exclusive media combinations; choose one
  mode and follow each entry in `accepts` by `role`, `mediaKind`, and `max`;
- `input.parameters` for exact parameter keys, types, choices, defaults, and
  limits;
- `features` for model-specific capabilities.

Do not merge slots from different input modes. Do not use remembered model
parameters when the current query differs.

Examples below use representative values. Include them only when the selected
model's current query result supports those exact values.

Submit one generation with:

```json
{
  "projectId": "project-id",
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

Locate a path with `mcp__plugin_starcut_starcut__glob` and inspect it with
`mcp__plugin_starcut_starcut__head`. Pass that path directly; never pass a URL, binary data,
or base64 as model media input.

Put every media item in one `inputs` array. Each item has the project `path`
and the exact `role` accepted by the selected mode:

```json
"inputs": [
  { "path": "assets/start.png", "role": "first" },
  { "path": "assets/end.png", "role": "last" }
]
```

Artifact kind is resolved from the project path. Do not send `mediaKind` or
provider tags. Do not mix entries from different modes.

## Image

Image generation and editing share the `generate` Task.

Primary input:

| Field | Meaning |
|---|---|
| `prompt` | The requested image or edit |
| `inputs` | Optional role-based project media list |

Common model parameters include `aspectRatio`, `resolution`, and sometimes
`quality`; use only keys and values returned by `mcp__plugin_starcut_starcut__query`.

Generation:

```json
{
  "projectId": "project-id",
  "task": "generate",
  "params": {
    "modelId": "image-model-id-from-query",
    "name": "product-hero.png",
    "input": {
      "prompt": "Studio product photograph on a warm neutral background",
      "aspectRatio": "16:9",
      "resolution": "2K"
    }
  }
}
```

Editing adds references rather than changing the Task type:

```json
{
  "projectId": "project-id",
  "task": "generate",
  "params": {
    "modelId": "image-edit-model-id-from-query",
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
model-specific and must come from `mcp__plugin_starcut_starcut__query`.

```json
{
  "projectId": "project-id",
  "task": "generate",
  "params": {
    "modelId": "video-model-id-from-query",
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

## Music

Before generating a generic music bed, query the curated BGM Library:

```json
{
  "kind": "bgm",
  "where": { "q": "optimistic electronic product launch" }
}
```

If a result fits, call `mcp__plugin_starcut_starcut__use_library` with its `libraryId` and the
current `projectId`, then use the returned Artifact. Generate only when the
Library has no suitable result or the user explicitly requests original music.

Music uses `prompt` for genre, mood, instrumentation, tempo, structure, and
intended use. Common model parameters include `duration` and `instrumental`.
Summarize the musical direction instead of pasting a script, document, or
storyboard into `prompt`. Prefer at most 300 characters even when the queried
model allows more. Never exceed `input.primary.limit` when present.

```json
{
  "projectId": "project-id",
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
lyrics or instrumental control. StarCut owns the audio delivery format; do not
submit provider encoding parameters.

## Sound Effects

Before generating, reuse a compatible SFX catalog result or search the reusable
Library:

```json
{
  "kind": "sfx",
  "where": { "q": "polished metallic whoosh" }
}
```

If a result fits, call `mcp__plugin_starcut_starcut__use_library` with its `libraryId` and the
current `projectId`, then use the returned Artifact. Query `kind: "model"` with
intent `audio.sfx` and generate only when the Library has no suitable result.

Sound effects use `prompt` for the audible event, environment, perspective,
intensity, and temporal shape. Some models expose controls such as `duration`,
`promptInfluence`, or `loop`; include only parameters returned by the selected
model query.

```json
{
  "projectId": "project-id",
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

TTS uses the primary key returned by the model query (`text` for current TTS
models), not Nexra's internal `texts` wire field. If `input.parameters`
contains a `voice` catalog parameter, query its live choices for the selected
model:

```json
{
  "kind": "voice",
  "where": { "modelId": "tts-model-id-from-query" }
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
  "projectId": "project-id",
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
Do not submit provider encoding parameters.

## Poll and Use the Result

`mcp__plugin_starcut_starcut__run_task` returns stable Task and Artifact identities without
waiting for generation to finish. If the workflow depends on progress or
output, call `mcp__plugin_starcut_starcut__poll` with the exact `projectId` and returned
`toolCallId`.
Never resubmit a queued or running Task.

Generation does not place media on a timeline. When placement is requested,
use the returned Artifact path as the `source` of a compatible `ImageClip`,
`VideoClip`, or `AudioClip` by following `timeline-editing`.
