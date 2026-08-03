# HyperFrames

Author `.mg` source as ordinary standalone HyperFrames HTML. Do not invent a
StarCut module format, entry function, bootstrap, animation API, or parameter
binding. Return only the complete HTML source without Markdown fences or
explanatory text.

## Composition Contract

- Give the composition root a stable `data-composition-id`, `data-start="0"`,
  the requested positive integer `data-width` and `data-height`, and a positive
  `data-duration` matching the requested duration. StarCut reads these values
  as Artifact metadata; the registered timeline still controls playback.
- Give every timed element a unique `id`, `data-start`, and `data-track-index`.
  Visible DOM and image clips also require `class="clip"`; video and audio do
  not. Images require `data-duration`, while video and audio may derive it from
  the source. Higher track indexes render in front.
- Create one finite `gsap.timeline({ paused: true })` synchronously and register
  it on `window.__timelines` under the exact composition ID.
- Make the timeline duration equal the requested duration. With the bundled
  HyperFrames runtime, composition duration is `timeline.duration()`; extend it
  with `timeline.set({}, {}, seconds)` when the last animation ends earlier.
- Use only real resource URLs supplied by the task or ordinary self-contained
  HTML/CSS/SVG. Do not invent local paths or placeholder URLs.

Use the official dependency and script shape:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@hyperframes/core@0.7.64/dist/hyperframe.runtime.iife.js"></script>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
      #title-reveal {
        position: relative;
        width: 1920px;
        height: 1080px;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="title-reveal" data-composition-id="title-reveal"
         data-start="0" data-duration="5"
         data-width="1920" data-height="1080">
      <h1 id="title" class="clip" data-start="0"
          data-duration="5" data-track-index="0">Launch</h1>
    </div>
    <script>
      const timeline = gsap.timeline({ paused: true });
      timeline.from("#title", {
        opacity: 0,
        y: 40,
        duration: 0.6
      }, 0);
      timeline.set({}, {}, 5);
      window.__timelines = window.__timelines || {};
      window.__timelines["title-reveal"] = timeline;
    </script>
  </body>
</html>
```

Load browser dependencies with their normal `<script src>` form and initialize
them in dependency order. Keep the official HyperFrames runtime script in the
authored document; do not replace it with a StarCut-specific import.

## Runtime Ownership and Determinism

- Use absolute GSAP position parameters so animation does not depend on build
  order.
- Do not use wall-clock time, timers, unseeded randomness, infinite repeats, or
  asynchronous timeline construction.
- Do not call `play()`, `pause()`, or set `currentTime` on media. HyperFrames
  owns media playback, seeking, and timed clip visibility.
- Use official seek adapters for Lottie, Three.js, CSS, WAAPI, Anime.js, or
  WebGPU. Multiple runtimes may coexist when each remains deterministically
  seekable.

## Editable Variables

Omit variables for a one-off composition unless the request explicitly asks for
reusable or editable controls. When controls are requested, declare editable
values with `data-composition-variables` on the document root.
Use `data-var-text`, `data-var-src`, and CSS custom properties for direct
bindings; call `window.__hyperframes.getVariables()` only for derived logic.
It returns a value object keyed by variable ID, not the declaration array, so
read `variables.title` or destructure it; do not call `.find()` on the result.
Every variable declaration requires `id`, `type`, `label`, and `default`.

```html
<html data-composition-variables='[
  {"id":"title","type":"string","label":"Title","default":"Launch"},
  {"id":"accent","type":"color","label":"Accent","default":"#7c3aed"}
]'>
  <!-- ... -->
  <h1 data-var-text="title" style="color:var(--accent)">Launch</h1>
</html>
```

## Optional Shader Transitions

For an actual scene transition, load the official shader adapter after GSAP and
the HyperFrames runtime:

```html
<script src="https://cdn.jsdelivr.net/npm/@hyperframes/shader-transitions@0.7.64/dist/index.global.js"></script>
<script>
  const timeline = HyperShader.init({
    bgColor: "#000000",
    scenes: ["scene-a", "scene-b"],
    transitions: [
      { time: 2.75, shader: "cinematic-zoom", duration: 0.5 }
    ]
  });
  timeline.from("#scene-a .title", {
    opacity: 0,
    y: 32,
    duration: 0.5
  }, 0);
</script>
```

Use shaders only when the design calls for a transition between real scene
elements. Each scene ID must identify an element with `class="scene"`.
`HyperShader.init()` creates and registers the timeline; add beat animations to
the returned timeline. Keep `scenes.length === transitions.length + 1`;
ordinary motion does not need HyperShader.

## Final Check

- Composition ID and timeline registry key match.
- Width, height, and positive finite timeline duration match the request.
- Timed elements have complete clip attributes; clips on the same track do not
  overlap.
- Every visible frame is a deterministic function of timeline time.

## Official References

- [Quickstart](https://hyperframes.heygen.com/quickstart)
- [HTML schema](https://hyperframes.heygen.com/reference/html-schema)
- [GSAP animation](https://hyperframes.heygen.com/guides/gsap-animation)
- [Variables](https://hyperframes.heygen.com/concepts/variables)
- [Frame adapters](https://hyperframes.heygen.com/concepts/frame-adapters)
- [Common mistakes](https://hyperframes.heygen.com/guides/common-mistakes)
