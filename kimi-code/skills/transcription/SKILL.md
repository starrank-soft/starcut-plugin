---
name: transcription
description: Use when getting timestamped transcripts from StarCut audio or video, extracting selected audio ranges, or creating and realigning Timeline captions from recognized or generated speech.
---

# Transcription and Captions

Use one transcript workflow for both readable transcripts and Timeline
captions:

```text
Audio or Video Artifact
→ mcp__starcut__client_call with command: get_transcript
→ mcp__starcut__run_task with task: transcribe when prepared
→ timestamped transcript
→ optional CaptionClip
```

StarCut stores the transcript in the canonical Audio Artifact metadata. It does
not create a transcript Artifact or file. Create a `docs/*.md` Markdown file
only when the user separately asks to preserve readable transcript copy.

## Operations

| Need | Call |
|---|---|
| Get a cached transcript or prepare canonical audio | `mcp__starcut__client_call` with `command: "get_transcript"` |
| Materialize audio or select a source range | `mcp__starcut__client_call` with `command: "extract_audio"` |
| Run ASR on an exact ready Audio Artifact | `mcp__starcut__run_task` with `task: "transcribe"` |
| Generate speech | `mcp__starcut__query` with `kind: "model"` and intent `audio.tts`, then `mcp__starcut__run_task(generate)` |
| Persist captions | StarCut Node tools on the target Timeline |

Use `mcp__starcut__client_call` with `command: "get_transcript"` by default for both
Audio and Video Artifacts. For Video,
the connected editor prepares, uploads, and reuses its canonical full-length
Audio Artifact before ASR. Repeated calls reuse the linked audio and completed
transcript.

The `get_transcript` command only resolves cached transcript metadata and
prepares canonical audio. If it returns `succeeded`, consume the transcript. If
it returns `prepared`, call `mcp__starcut__run_task` once with the returned
`runTask` value. Merge any chosen `modelId`, `language`, `diarize`, or
`keyterms` into `runTask.params`. If that Task is still running, call
`mcp__starcut__poll` with its returned `toolCallId`; do not call
`get_transcript` again to poll or start duplicate work.

## Get a Transcript

Locate the source with `mcp__starcut__glob`, inspect it with
`mcp__starcut__head`, and pass its exact path:

```json
{
  "projectId": "project-id",
  "command": "get_transcript",
  "target": "assets/dialogue.mp4"
}
```

When the result is `prepared`, pass its `runTask.task` and `runTask.params` to
`mcp__starcut__run_task`. Optional ASR fields are `modelId`, `language`,
`diarize`, and `keyterms`; add them to those Task params, not to
`mcp__starcut__client_call`. Omit `modelId` to use the configured ASR default.
Call `mcp__starcut__query` with `kind: "model"` and intent `audio.asr` only
when model selection matters.

Consume:

```text
text
language?
languageConfidence?
words[]: text, startUs, endUs, type, confidence?
segments[]: text, startUs, endUs, wordStart, wordEnd
```

Words and segments use microseconds.

## Explicit Audio Extraction

Use `mcp__starcut__client_call` with `command: "extract_audio"` only when the user
wants a reusable Audio Artifact or recognition must cover an explicit source
range:

```json
{
  "projectId": "project-id",
  "command": "extract_audio",
  "target": "assets/interview.mp4",
  "params": {
    "timeRange": {
      "startUs": 2000000,
      "endUs": 9000000
    },
    "name": "selected-dialogue.m4a"
  }
}
```

The range is half-open. After extracting a selected range, run
`mcp__starcut__run_task` with `task: "transcribe"` and the returned Audio path.
Do not extract full video audio as a routine precondition for the
`get_transcript` command.

## Transcript to Timeline Captions

1. Read the target Timeline and identify the source Clip and related Track.
2. Get the transcript from its exact Audio or Video Artifact.
3. Use ASR segments as initial caption lines and word timing only when useful.
4. Reuse or create a TextTrack, then add or update one `CaptionClip`.
5. Set `CaptionClip.source` to the AudioTrack or VideoTrack ID, never an
   Artifact, Task, or URL.

If ASR covered the whole source Artifact, keep timestamps inside the Clip's
half-open source range, subtract `sourceStart`, and map playback rate:

```text
captionClip.start = sourceClip.start
captionLocalUs = sourceLocalUs * sourceClip.duration / sourceClip.sourceDuration
```

Caption Text Data uses decimal seconds local to the CaptionClip:

```vml
<CaptionClip
  source="audio-track-id"
  language="zh"
  start="0"
  duration="3200000"
><![CDATA[
<p begin="0.000" end="1.400"><span begin="0.000" end="0.420">你好</span><span begin="0.420" end="0.860">世界</span></p>
<p begin="1.400" end="3.200">欢迎使用 StarCut</p>
]]></CaptionClip>
```

Preserve visible spacing. Omit audio-event words unless sound-description
captions were requested. Do not fabricate uncertain timestamps.

## Authored Copy to Speech and Captions

Treat authored copy as wording authority and ASR as timing authority:

1. Write provisional untimed Caption paragraphs.
2. Split the exact copy into ordered paragraph- or sentence-boundary chunks
   following the TTS guidance in `media-gen`.
3. Generate one TTS Artifact per chunk and place the ordered Artifacts as
   adjacent AudioClips on one AudioTrack.
4. Call `mcp__starcut__client_call` with `command: "get_transcript"` on each generated Audio Artifact.
5. If prepared, call `mcp__starcut__run_task` with each returned Task input.
6. Align recognized words to the authored copy and regroup readable lines.
7. Update the same CaptionClip and set its source to the AudioTrack.

Preserve authored wording and punctuation unless the user asks to adopt the
recognized text. Omit uncertain token spans rather than changing the copy.

Read the affected CaptionClip before finishing and verify its text, local
timing, source Track, start, and duration.
