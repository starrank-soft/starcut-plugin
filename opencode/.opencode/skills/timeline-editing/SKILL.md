---
name: timeline-editing
description: Use when creating or editing StarCut Timelines, including Composition VML, Track and Clip schemas, media placement, timing, layering, effects, transforms, crop, color, fades, text, and captions.
---

# Timeline Editing

Timeline documents live at `compositions/*.vml` with a `<Composition>` root.
Use “Timeline” for the product and workflow concept; use “Composition” for its
VML Node and renderer type.

Load `basics` for project discovery and common file or Node operations. This
Skill defines the deeper Timeline domain.

A Timeline has this public VML shape:

```text
Composition
├── VideoTrack
│   ├── VideoClip
│   │   └── registered Effect tag
│   ├── ImageClip
│   │   └── registered Effect tag
│   └── MotionGraphicClip
├── AudioTrack
│   └── AudioClip
├── TextTrack
    ├── TextClip
    └── CaptionClip
└── EffectTrack
    └── registered Effect tag
```

Tracks and Clips are direct ordered children. There are no `Tracks`, `Clips`,
`Segments`, or other collection wrapper elements.

## Authoring Contract

- Use integer microseconds for Composition, Clip, source-range, and fade times.
  One second is `1000000`.
- Existing Nodes returned by `starcut_read` have immutable IDs. Never
  invent an ID.
- Omit IDs from complete VML supplied to `starcut_write` and subtrees
  supplied to `starcut_add_node`; StarCut assigns them.
- Attributes with defaults may be omitted. A read may omit an Attribute whose
  current value equals its Schema default.
- Use tags such as `<VideoTrack>` and `<VideoClip>`; do not write
  `<Track type="video">` or `<Clip type="video">`.
- A complete write is exact and does not add the Schema's initial VideoTrack.
  Include every desired Track when creating a Composition.
- Use `starcut_add_node`, `starcut_update_node`,
  `starcut_move_node`, or `starcut_delete_node` for focused
  changes to an existing Timeline. Do not replace the complete document when a
  Node mutation expresses the change.

## Complete Composition Example

```vml
<Composition
  width="1920"
  height="1080"
  fps="30"
  backgroundColor="#000000"
>
  <AudioTrack name="Narration">
    <AudioClip
      source="assets/narration.mp3"
      start="0"
      duration="8000000"
      sourceStart="0"
      sourceDuration="8000000"
    />
  </AudioTrack>

  <VideoTrack name="A-Roll">
    <VideoClip
      source="assets/product-demo.mp4"
      start="0"
      duration="8000000"
      sourceStart="0"
      sourceDuration="8000000"
    >
      <VignetteEffect amount="0.7" />
    </VideoClip>
  </VideoTrack>

  <VideoTrack name="B-Roll">
    <ImageClip
      source="assets/product-shot.png"
      start="2000000"
      duration="2000000"
    />
  </VideoTrack>

  <VideoTrack name="Motion Graphics">
    <MotionGraphicClip
      source="assets/lower-third.mg"
      start="1000000"
      duration="4000000"
      sourceStart="0"
      sourceDuration="4000000"
    />
  </VideoTrack>

  <TextTrack name="Captions">
    <CaptionClip start="0" duration="8000000"><![CDATA[
<p begin="0.000" end="1.500">The story begins.</p>
]]></CaptionClip>
  </TextTrack>

  <EffectTrack name="Look">
    <VignetteEffect start="0" duration="5000000" amount="0.7" />
  </EffectTrack>
</Composition>
```

## Composition Root

| Attribute | Type and constraint | Default | Meaning |
|---|---|---:|---|
| `width` | number, `>= 1` | `1920` | Output width in pixels |
| `height` | number, `>= 1` | `1080` | Output height in pixels |
| `fps` | number, `>= 1` | `30` | Output frame rate |
| `backgroundColor` | color | `#000000` | Canvas background |
| `coverUrl` | optional string | omitted | Direct image URL used as the Timeline cover |

Set `coverUrl` through the editor's capture or cover-selection workflow. Do not
invent storage URLs.

Composition duration is derived from the maximum `start + duration` among its
Clips. It is not stored. There are no `Duration`, `Resolution`, or `Fps` child
Nodes.

Creating a Timeline in the editor starts with one `<VideoTrack name="Video">`.
A complete `starcut_write` uses the supplied VML exactly, so include that
Track explicitly when creating a Timeline through MCP.

## Tracks

Every Track has these common Attributes:

| Attribute | Type | Default | Meaning |
|---|---|---:|---|
| `name` | string | empty | Human-readable label |
| `enabled` | boolean | `true` | Whether the Track participates |
| `locked` | boolean | `false` | Whether editor operations may modify it |

`VideoTrack` and `AudioTrack` additionally have:

| Attribute | Type and constraint | Default | Meaning |
|---|---|---:|---|
| `volume` | number, `0..1` | `1` | Aggregate Track audio gain |
| `mute` | boolean | `false` | Aggregate Track audio mute |

`TextTrack` and `EffectTrack` have no `volume` or `mute` Attributes.

### Track Compatibility

| Public Track tag | Accepted direct children |
|---|---|
| `VideoTrack` | `VideoClip`, `ImageClip`, `MotionGraphicClip` |
| `AudioTrack` | `AudioClip` |
| `TextTrack` | `TextClip`, `CaptionClip` |
| `EffectTrack` | registered Effect tags that allow Track placement |

Putting a child on an incompatible Track is invalid.

Composition child order is back-to-front for visual compositing: a later
visual Track appears above an earlier visual Track. Timeline UI rows may
display that order in reverse, front-to-back.

### Layering and Track Planning

Plan Track order before writing Clips. A useful default VML order is:

| VML order, first to last | Role | Reason |
|---:|---|---|
| 1 | Audio | Canonical organization; audio mixes and has no visual z-order |
| 2 | A-roll / main visual | Base picture beneath every visual overlay |
| 3 | B-roll | Covers A-roll only over its active range |
| 4 | Motion graphics / image overlays | Lower thirds, callouts, and decorative overlays |
| 5 | Titles and captions | Readable foreground text above picture overlays |
| 6 | Foreground image or MG overlays | Only when they intentionally cover text |

This is a default, not a fixed set of Track types. The invariant is simpler:
later visual Tracks cover earlier visual Tracks. Audio Track position does not
change visual stacking, but keeping audio first makes the Composition order
predictable. The Timeline UI presents the same data in reverse, so its top row
is usually the frontmost visual Track.

Keep one semantic role per Track. Put sequential, non-overlapping Clips with
the same role on one Track. Use another Track for concurrent content or a
different z-order. Do not create one Track per Clip without a layering reason.

Place A-roll below B-roll and every intended overlay. Captions normally sit
above A-roll, B-roll, and background motion graphics. A foreground sticker is
not a separate Clip type: represent supported static stickers as `ImageClip`
and animated ones as `MotionGraphicClip`, then order their Track according to
whether they should cover captions.

Before creating a generic overlay, query `sticker` or `mg`. When a result fits,
call `starcut_use_library` with its `libraryId` and the current
`projectId`, then use the returned `path` as the Clip source. Create a custom
graphic only when no resource fits or the user requests an original design.

## Common Clip Timeline

Every Clip has:

| Attribute | Type and constraint | Default | Meaning |
|---|---|---:|---|
| `name` | string | empty | Human-readable label |
| `start` | integer microseconds, `>= 0` | `0` | Start on the parent timeline |
| `duration` | integer microseconds, `>= 1` | required | Duration on the parent timeline |

The parent-timeline interval is half-open:

```text
[start, start + duration)
```

Clips on the same Track cannot overlap. Adjacent ranges are valid. Put
simultaneous content on another compatible Track.

Video, Audio, and MotionGraphic sources are time-addressable and additionally
require a source range:

| Attribute | Type and constraint | Default | Meaning |
|---|---|---:|---|
| `sourceStart` | integer microseconds, `>= 0` | `0` | Start inside the source |
| `sourceDuration` | integer microseconds, `>= 1` | required | Selected source duration |

The source interval is:

```text
[sourceStart, sourceStart + sourceDuration)
```

For linear playback, speed is derived rather than stored:

```text
playbackRate = sourceDuration / duration
```

There is no `speed` Attribute. Use `starcut_head` to inspect a media source before
choosing its range. The Schema validates the numeric range shape, while the
author must keep it within the intended source content.

## Source References

| Clip | `source` target | Public VML value |
|---|---|---|
| `VideoClip` | Video Artifact | exact `assets/*` path |
| `ImageClip` | Image Artifact | exact `assets/*` path |
| `AudioClip` | Audio Artifact | exact `assets/*` path |
| `TextClip` | none | direct Text Data |
| `CaptionClip` | optional `AudioTrack` or `VideoTrack` | exact existing Track ID |
| `MotionGraphicClip` | MotionGraphic Artifact | exact `assets/*.mg` path |

Use exact paths returned by `starcut_glob`, `starcut_head`, current VML, or a completed
generation/import operation. Never invent an Artifact path and never put a raw
storage or CDN URL in VML.

References must resolve to the declared target type. A referenced Artifact,
Track, or document cannot be deleted until its references are removed.

### Motion Graphic Props

An `.mg` MotionGraphicClip may override source-declared variables through one
`Props` container. Variable IDs and types come only from the source metadata:

```xml
<MotionGraphicClip source="assets/lower-third.mg"
                   start="0" duration="4000000"
                   sourceStart="0" sourceDuration="4000000">
  <Props>
    <MotionGraphicProp name="title" value="Available Now" />
    <MotionGraphicProp name="accent" value="#67e8f9" />
  </Props>
</MotionGraphicClip>
```

Omit an override to use its source default. Each name may appear once. Do not
invent names or put position, scale, rotation, opacity, or layer state in
Props; those remain Clip attributes.

## Visual Attributes

`VideoClip`, `ImageClip`, `TextClip`, `CaptionClip`, and `MotionGraphicClip`
share these flat visual Attributes:

| Attribute | Type and constraint | Default |
|---|---|---:|
| `opacity` | number, `0..1` | `1` |
| `positionX`, `positionY` | number | `0` |
| `scaleX`, `scaleY` | number | `1` |
| `rotation` | number | `0` |
| `blendMode` | enum | `normal` |
| `cornerRadius` | optional number, `>= 0` | omitted |

`VideoClip`, `ImageClip`, and `MotionGraphicClip` also support `anchorX` and
`anchorY` with a default of `0.5`. Text origin comes from `align` and
`verticalAlign`; do not author text anchors.

`cornerRadius` uses Composition pixels at natural scale. A negative scale
performs a horizontal or vertical flip; there is no separate Flip Node.

`blendMode` is exactly one of:

```text
normal multiply screen overlay darken lighten
colorDodge colorBurn hardLight softLight difference exclusion
```

Visual values are Attributes on the Clip. Do not create `Transform`,
`Appearance`, or `Blend` child Nodes.

## VideoClip

In addition to common `name`, `start`, `duration`, `source`, `sourceStart`,
`sourceDuration`, and visual Attributes, VideoClip supports the following
flat Attribute groups.

### Crop

| Attribute | Type and constraint | Default |
|---|---|---:|
| `cropLeft`, `cropTop`, `cropRight`, `cropBottom` | number, `0..1` | `0` |

### Embedded Audio

| Attribute | Type and constraint | Default |
|---|---|---:|
| `volume` | number, `0..1` | `1` |
| `muteAudio` | boolean | `false` |

VideoClip uses `muteAudio`; AudioClip and Tracks use `mute`.

### Fades

| Attribute | Type and constraint | Meaning |
|---|---|---|
| `fadeInDuration`, `fadeOutDuration` | optional integer microseconds, `>= 0` | Visual/content fade |
| `audioFadeInDuration`, `audioFadeOutDuration` | optional integer microseconds, `>= 0` | Embedded-audio fade |

## ImageClip

ImageClip supports the common timeline and visual Attributes plus the same
Crop Attributes as VideoClip. It also supports visual `fadeInDuration` and
`fadeOutDuration`. It has no source range or embedded-audio controls.

| Attribute | Type and constraint | Default |
|---|---|---:|
| `fadeInDuration`, `fadeOutDuration` | optional integer microseconds, `>= 0` | omitted |

## Effects

An Effect uses a registered public tag and supports the placements declared by
that registration. Never write a generic `<Effect>` tag, an internal `source`,
or `scope`, `target`, `targetId`, `from`, or `to` Attributes.

Query `fx`, choose a result, then call `starcut_use_library` with its
`libraryId` and the current `projectId`. The returned `effect` contains the
public tag, allowed placements, and current parameters. Use that definition
instead of memorizing a static Effect catalog.

Every registered Effect tag also has timing control Attributes:

| Attribute | Type and constraint | Default | Meaning |
|---|---|---:|---|
| `enabled` | boolean | `true` | Whether the Effect participates |
| `start` | integer microseconds, `>= 0` | `0` | Clip-local when nested in a Clip; Timeline-global in EffectTrack |
| `duration` | optional integer microseconds, `>= 1` | omitted | Through the parent Clip end when omitted; required in EffectTrack |

Inside VideoClip or ImageClip, `start` is Clip-local and the effective output is
clipped to the parent Clip. Sibling Effects may overlap and execute in child order, so order is
significant. Inside EffectTrack, the Effect is a normal Timeline item; items on
one EffectTrack cannot overlap, while separate EffectTracks may overlap.
Use only a placement returned by `starcut_use_library`; never infer it
from the Effect name.

An EffectTrack processes the composited Canvas layers below it at its Track
order within the same Canvas band. It cannot process an HTML MotionGraphic
surface across a band boundary. Keep an HTML-only effect inside a
MotionGraphic, or compile that source when one Effect must process it together
with Canvas content.

## AudioClip

AudioClip supports:

| Attribute | Type and constraint | Default |
|---|---|---:|
| `volume` | number, `0..1` | `1` |
| `mute` | boolean | `false` |
| `fadeInDuration`, `fadeOutDuration` | optional integer microseconds, `>= 0` | omitted |

AudioClip has no visual, crop, or color-adjustment Attributes.

## TextClip

TextClip owns direct Text Data. It has no `source`, `Prompt`, `Input`,
`Content`, or style wrapper child.

TextClip supports the common timeline and visual Attributes plus Typography
and Decoration.

TextClip has no dedicated fade Attributes. Animate its existing visual
Attributes when the whole text layer needs an entrance or exit.

```vml
<TextClip
  start="0"
  duration="3000000"
  fontFamily="inter"
  fontSize="64"
  fontWeight="700"
  color="#ffffff"
  align="center"
><![CDATA[Opening title]]></TextClip>
```

### Typography

Use the default `sans-serif` without querying when no specific typography is
required. For an intentional font choice, reuse a compatible font query already
present in the conversation; otherwise call `starcut_query` with
`kind: "font"` and write the returned stable `id` to `fontFamily`. Never invent
a catalog font ID.

| Attribute | Type | Default |
|---|---|---:|
| `fontFamily` | CSS generic family or catalog font ID | `sans-serif` |
| `fontSize` | number, `>= 1` | `24` |
| `fontWeight` | named or numeric-string enum | `regular` |
| `color` | color | `#FFFFFF` |
| `letterSpacing` | number | `0` |
| `lineHeight` | number, `>= 0.1` | `1.5` |
| `align` | enum | `center` |
| `verticalAlign` | enum | `middle` |
| `italic` | boolean | `false` |
| `underline` | boolean | `false` |
| `strikethrough` | boolean | `false` |

Exact enum values:

```text
fontWeight: thin light regular medium semibold bold heavy black
            100 200 300 400 500 600 700 800 900
align: left center right
verticalAlign: top middle bottom
```

### Decoration

All Decoration Attributes are optional:

| Attribute | Type |
|---|---|
| `borderColor` | color |
| `borderWidth` | number, `>= 0` |
| `shadowColor` | color |
| `shadowOffsetX`, `shadowOffsetY` | number |
| `shadowBlur` | number, `>= 0` |
| `backgroundColor` | color |
| `padding` | number, `>= 0` |

For TextClip and CaptionClip, the shared `cornerRadius` Visual Attribute rounds
the `backgroundColor` box. There is no separate background-radius Attribute.

Typography and Decoration remain flat Clip Attributes. There are no
`Typography`, `Decoration`, `Style`, `Border`, `Shadow`, or `Background`
wrapper Nodes.

## CaptionClip

CaptionClip has the same timeline, visual, Typography, and Decoration
Attributes as TextClip, but its direct Text Data uses Caption syntax.

Caption-only Attributes:

| Attribute | Type and constraint | Default |
|---|---|---:|
| `source` | optional AudioTrack or VideoTrack reference | omitted |
| `language` | optional string | omitted |
| `motion` | `none`, `fade`, or `pop` | `none` |
| `motionUnit` | `line` or `character` | `character` |
| `motionDuration` | integer microseconds, `>= 1` | `180000` |
| `motionStagger` | integer microseconds, `>= 0` | `80000` |
| `motionIntensity` | number, `0..1` | `1` |

`CaptionClip.source` is a live relationship to the Track used for alignment,
not historical provenance. The source Track cannot be deleted while the
reference exists.

Caption motion controls its lines or characters; CaptionClip has no whole-Clip
fade Attributes. Line motion transforms the line background and text as one
block. Character motion animates glyphs while keeping the block background
stable.

### Caption Text Data

- `<p>` and `<span>` are text syntax, not VML Nodes. They have no
  IDs and are edited as the CaptionClip's one Text Data value.
- Each `p` is one caption line.
- `begin` and `end` are optional on `p`, but must appear together.
- An untimed line receives a derived three-second range after the preceding
  effective line. That estimate is not persisted into Text Data.
- A `span` may carry paired `begin`/`end`, `emphasis="true"`, and/or a `lang`
  override. Spans cannot nest or overlap.
- Caption times are local to the Clip and use decimal seconds such as `1.250`
  or `HH:MM:SS.mmm`, not timeline microseconds.
- Caption ranges are half-open. Keep the outer Clip `duration` long enough to
  cover the intended final line end.

## MotionGraphicClip

MotionGraphicClip supports the common timeline and visual Attributes. Its
MotionGraphic Artifact source is time-addressable, so `sourceDuration` is
required and `sourceStart` defaults to zero. Its source owns the internal
animation; MotionGraphicClip has no dedicated fade Attributes.

## Editing Timelines

- Read the exact document or Node before editing only when current IDs or values
  are not already in context.
- Use `starcut_update_node` for Clip or Track Attributes and for exact
  TextClip or CaptionClip Text Data replacement.
- Use `starcut_add_node` on a Composition to add a Track, on a Track to
  add one compatible Clip, or on a VideoClip or ImageClip to add a registered
  Effect tag.
  Use `beforeId` only for an intentional ordered insertion.
- Use `starcut_move_node` to reorder a Node or move it to a compatible
  parent. Never write internal owner or order fields.
- Use `starcut_delete_node` only after removing inbound references and
  while preserving at least one VideoTrack.
- Keep TextClip copy in direct Text Data. Edit CaptionClip Caption Text Data as
  one value; its `p` and `span` elements are text syntax, not Nodes.
- When an operation returns a new Artifact path, update the intended Clip's
  `source`. An SVG/MG edit at the existing path needs no Clip change.
- Keep timing, source ranges, transforms, crop, audio, fades, typography,
  decoration, and caption motion as flat Attributes on their owning Node. Do
  not create wrapper child Nodes. Each registered Effect tag creates a real
  child Node, while its parameters, `start`, and `duration` remain flat
  Attributes.

Read the affected Node when a later mutation needs a generated ID or resulting
Text Data. Inspect the composed Timeline when timing, placement, animation,
layering, or audiovisual correctness matters.
