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
compatible `starcut__query` result already present in the conversation.
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

- `inputModes` for valid combinations of first, last, and reference media;
- each slot's `role`, `mediaKind`, and `max`;
- `params` for exact parameter keys, types, choices, defaults, and limits;
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

`name` is optional. One Task produces one stable Artifact. Submit separate
Tasks only when the user asks for separate outputs.

## Project Media Inputs

Every project media input is an exact project path:

```json
"assets/reference.png"
```

Locate a path with `starcut__glob` and inspect it with
`starcut__head`. Pass that path directly; never pass a URL, binary data,
or base64 as model media input.

Stable media-slot mappings are:

| Query slot | Task input |
|---|---|
| first image | `firstFrame` |
| last image | `lastFrame` |
| reference images | `referenceImages` |
| reference videos | `referenceVideos` |
| reference audios | `referenceAudios` |

Add only slots from the selected `inputMode`.

## Image

Image generation and editing share the `generate` Task.

Stable input:

| Field | Meaning |
|---|---|
| `prompt` | The requested image or edit |
| `referenceImages` | Optional project-path array for editing or guidance |

Common model parameters include `aspectRatio`, `resolution`, and sometimes
`quality`; use only keys and values returned by `starcut__query`.

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
      "referenceImages": ["assets/product-reference.png"],
      "aspectRatio": "16:9",
      "resolution": "2K"
    }
  }
}
```

## Video

Stable input begins with `prompt`. Depending on the selected input mode, it may
also contain either:

- `firstFrame` and optionally `lastFrame`; or
- `referenceImages`, `referenceVideos`, and `referenceAudios`.

Common model parameters include `aspectRatio`, `resolution`, `duration`, and
`generateAudio`. Their allowed values and compatible media combinations are
model-specific and must come from `starcut__query`.

```json
{
  "projectId": "project-id",
  "task": "generate",
  "params": {
    "modelId": "video-model-id-from-query",
    "name": "product-reveal.mp4",
    "input": {
      "prompt": "Slow cinematic push-in while light moves across the product",
      "firstFrame": "assets/product-hero.png",
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

If a result fits, call `starcut__use_library` with its `libraryId` and the
current `projectId`, then use the returned Artifact. Generate only when the
Library has no suitable result or the user explicitly requests original music.

Music uses `prompt` for genre, mood, instrumentation, tempo, structure, and
intended use. Common model parameters include `duration` and `instrumental`.

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

If a result fits, call `starcut__use_library` with its `libraryId` and the
current `projectId`, then use the returned Artifact. Query `kind: "model"` with
intent `audio.sfx` and generate only when the Library has no suitable result.

Sound effects use `prompt` for the audible event, environment, perspective,
intensity, and temporal shape. Common model parameters include `duration`,
`promptInfluence`, and `loop`.

```json
{
  "projectId": "project-id",
  "task": "generate",
  "params": {
    "modelId": "sfx-model-id-from-query",
    "name": "logo-whoosh.mp3",
    "input": {
      "prompt": "Short polished metallic whoosh ending in a soft low impact",
      "duration": 4,
      "promptInfluence": 0.3,
      "loop": false
    }
  }
}
```

Generate music and SFX as separate Tasks. They have different intents and
parameter contracts even though both produce Audio Artifacts.

## Text-to-Speech

TTS uses `text`, not `prompt`. ElevenLabs V3 parameters include `voice`,
`stability`, `timestamps`, `language`, and `applyTextNormalization`. Use
`language: "auto"` for provider auto-detection; StarCut omits the provider
language field in that mode.

```json
{
  "projectId": "project-id",
  "task": "generate",
  "params": {
    "modelId": "tts-model-id-from-query",
    "name": "narration.mp3",
    "input": {
      "text": "让每一次创作，都更接近你的想象。",
      "voice": "Rachel",
      "stability": 0.5,
      "timestamps": true,
      "language": "auto",
      "applyTextNormalization": "auto"
    }
  }
}
```

For catalog-backed parameters such as `voice`, use the returned default or a
known value supported by that catalog. Do not invent a voice identifier or
submit provider encoding parameters.

## Poll and Use the Result

`starcut__run_task` returns stable Task and Artifact identities without
waiting for generation to finish. If the workflow depends on progress or
output, call `starcut__poll` with the exact `projectId` and returned
`toolCallId`.
Never resubmit a queued or running Task.

Generation does not place media on a timeline. When placement is requested,
use the returned Artifact path as the `source` of a compatible `ImageClip`,
`VideoClip`, or `AudioClip` by following `timeline-editing`.
