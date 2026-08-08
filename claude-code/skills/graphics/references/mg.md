# StarCut Motion Graphic (`.mg`)

Author one self-contained Motion Graphic JavaScript module saved with the
`.mg` extension. Return only the complete module source without Markdown
fences or explanation.

An `.mg` file is the current source format for a Motion Graphic (MG). The
extension is a file-format distinction, not a separate product concept. It
exports static composition metadata and one Web Component class.
The component owns one SVG scene, replaceable props, and internal animation.
StarCut owns Timeline placement, compositing, and the exact playback clock.

## Module Contract

```js
export const metadata = {
  version: 1,
  width: 1920,
  height: 1080,
  duration: 5,
  variables: [
    {
      id: "title",
      type: "string",
      label: "Title",
      default: "Launch",
    },
    {
      id: "accent",
      type: "color",
      label: "Accent",
      default: "#67e8f9",
    },
  ],
};

const defaultProps = Object.fromEntries(
  metadata.variables.map((variable) => [variable.id, variable.default]),
);

export default class LaunchTitle extends HTMLElement {
  #timeline;
  #props = defaultProps;
  #title;
  #wave;

  set props(value) {
    this.#props = { ...defaultProps, ...value };
    this.#syncProps();
  }

  get props() {
    return this.#props;
  }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" }).innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg"
             viewBox="0 0 ${metadata.width} ${metadata.height}">
          <g id="title">
            <text x="960" y="540" text-anchor="middle"></text>
          </g>
          <path id="wave" fill="none" stroke-width="12" />
        </svg>
      `;
    }

    const { gsap } = this.runtime;
    this.#title = this.shadowRoot.querySelector("#title");
    this.#wave = this.shadowRoot.querySelector("#wave");
    this.#timeline = gsap.timeline({ paused: true }).fromTo(
      this.#title,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      0,
    );
    this.#syncProps();
  }

  render(time) {
    const t = Math.min(Math.max(time, 0), metadata.duration);
    this.#timeline.totalTime(t, true);

    const points = [];
    for (let x = 0; x <= metadata.width; x += 24) {
      const y = 760 + Math.sin(x * 0.012 + t * 3) * 48;
      points.push(`${x === 0 ? "M" : "L"}${x} ${y}`);
    }
    this.#wave.setAttribute("d", points.join(" "));
  }

  #syncProps() {
    if (!this.#title || !this.#wave) return;
    this.#title.querySelector("text").textContent = this.#props.title;
    this.#wave.setAttribute("stroke", this.#props.accent);
  }

  disconnectedCallback() {
    this.#timeline?.kill();
    this.#timeline = undefined;
  }
}
```

- Make the entire file valid JavaScript module source.
- Export exactly one static `metadata` object and one default class extending
  `HTMLElement`.
- Do not call `customElements.define`; StarCut imports and defines the class.
- Create one shadow root containing exactly one root `<svg>` element.
- Implement `connectedCallback()`, synchronous `render(time)`, and
  `disconnectedCallback()`.
- Define each required method and `props` accessor exactly once with direct,
  non-computed names; do not shadow them with class fields.
- `connectedCallback()` must synchronously mount the root SVG before it
  returns.

## Metadata

Keep `metadata` a direct JSON-compatible object literal so StarCut can inspect
and persist it without executing generated code.

```ts
type MotionGraphicMetadata = {
  version: 1;
  width: number;
  height: number;
  duration: number;
  variables: readonly MgVariable[];
};

type MgVariableBase = {
  id: string;
  label: string;
  description?: string;
};

type MgVariable = MgVariableBase & (
  | { type: "string"; default: string }
  | {
      type: "number";
      default: number;
      min?: number;
      max?: number;
      step?: number;
    }
  | { type: "color"; default: string }
  | { type: "boolean"; default: boolean }
  | {
      type: "enum";
      default: string | number;
      options: readonly {
        label: string;
        value: string | number;
      }[];
    }
);
```

- Use integer pixels from 64 through 4096 for `width` and `height`.
- Use 0.1 through 600 seconds for `duration`. StarCut converts it to integer
  microseconds when storing Artifact Blob metadata and Timeline source ranges.
- Declare at most 64 variables and at most 100 options on one enum variable.
- Keep variable IDs unique and stable across focused source edits.
- Use only `string`, `number`, `color`, `boolean`, and `enum` variables in v1.
- Require finite number defaults and bounds, positive `step`, and
  `min <= default <= max` when bounds exist.
- Require hex color defaults in `#RGB`, `#RGBA`, `#RRGGBB`, or `#RRGGBBAA`
  form.
- Require non-empty enum options with unique values and a default matching one
  option.
- Keep enum option values unique after string conversion. Clip overrides use
  their canonical string representation and the source schema restores the
  declared string or number type.
- Keep every variable, option, and default value JSON-serializable.
- Use variables only for replaceable component content or styling. Omit them
  when the component has no editable inputs.
- Derive default props from `variables[].default`; do not declare another
  independently maintained default-props object.
- Make the SVG viewBox derive from `metadata.width` and `metadata.height`.
- Make all internal timing fit within `metadata.duration`.

After creation or source editing, StarCut validates this descriptor and stores
`version`, `width`, `height`, duration in microseconds, and `variables` on the
immutable Artifact Blob. Media panels and Timeline placement read that stored
projection without importing or mounting the module.

The server must parse the module as JavaScript and statically evaluate only the
exported metadata object literal. It must never execute the generated module.
Reject references, calls, spreads, methods, accessors, computed keys, template
expressions, duplicate keys, non-finite numbers, and unknown metadata fields.

## Runtime Inputs

Before connecting an instance, StarCut assigns runtime capabilities and resolved
Clip props:

```ts
type MotionGraphicElement = HTMLElement & {
  runtime: Readonly<{ gsap: typeof gsap }>;
  props: Readonly<Record<string, unknown>>;
  render(time: number): void;
};
```

The custom-element constructor runs before those assignments. Keep it empty or
use it only for ordinary field initialization. Do not read `runtime`, `props`,
the shadow root, or host DOM until the setters and `connectedCallback()` run.
The `props` setter may run before connection, so it must tolerate the SVG not
being mounted yet.

The resolved props are variable defaults merged with the MotionGraphicClip's
instance overrides. Reject unknown override IDs and type mismatches before
assigning them. Assigning `element.props` again must update content without
changing placement.

Timeline state stores overrides as direct `MotionGraphicProp` members. The
source `variables` descriptor remains the only type schema:

```xml
<MotionGraphicClip source="assets/lower-third.mg"
                   start="0" duration="5000000"
                   sourceStart="0" sourceDuration="5000000">
  <Props>
    <MotionGraphicProp name="title" value="Available Now" />
    <MotionGraphicProp name="accent" value="#67e8f9" />
  </Props>
</MotionGraphicClip>
```

No member means use the variable default. Each variable ID may appear at most
once. String and color values remain strings; number, boolean, and enum values
are parsed and validated from the source-owned descriptor before assignment.

## Component Boundary

- Keep the SVG in the local coordinate system declared by metadata.
- Let the MotionGraphicClip own position, scale, rotation, opacity, layer,
  source timing, and external transform animation.
- Let the Motion Graphic component own its internal shapes, content, styling, and time-dependent SVG
  behavior.
- Do not put Timeline placement fields such as `x`, `y`, `scale`, `rotation`,
  or `zIndex` in variables.
- Make prop assignment deterministic. If props change timeline geometry,
  rebuild the internal paused timeline before rendering the current time.

## GSAP and Determinism

- Use `this.runtime.gsap`; do not import or bundle another GSAP copy.
- Create paused timelines in `connectedCallback()` and seek them from
  `render(time)` with the supplied absolute time.
- Use ordinary JavaScript for procedural paths, conditions, loops, counters,
  charts, interpolation, and other complex deterministic logic.
- Suppress GSAP callback dispatch while seeking. Put visible state calculation
  in `render(time)` instead of timeline callbacks.
- StarCut is the only clock. Do not use `requestAnimationFrame`, timers,
  `Date`, `performance.now`, media playback clocks, or animation loops.
- `render(time)` must reconstruct the exact state for any time and may be
  called out of order during scrub, thumbnails, capture, or export.
- Do not depend on previously rendered frames or unseeded randomness.
- Kill GSAP timelines and release retained resources in
  `disconnectedCallback()`.

## Vector Rules

- Use native SVG paths, text, gradients, masks, clip paths, patterns, and
  restrained filters.
- Keep the canvas transparent unless the request asks for a background.
- Use installed system fonts or embed font bytes inside the SVG. Do not depend
  on a host-page `@font-face`; serialized frames cannot carry that declaration.
- Keep resources self-contained. Embedded raster images may use `data:image/*`.
- Do not import packages, load external URLs, call network or storage APIs, or
  access the host document.
- Do not use `foreignObject`, nested browsing contexts, video, Canvas, WebGL,
  or 3D inside the Motion Graphic component.
- Keep per-frame work bounded and reuse allocations when practical.

## Product Rendering

- Interactive preview mounts the component in StarCut's shared HTML band.
- Thumbnail, capture, transition-cache, and export consumers mount the same
  component, call `render(time)`, then rasterize its SVG.
- Keep one implementation for preview and frame rendering.

StarCut reads source bytes by immutable Blob hash, validates metadata, creates a
`text/javascript` Blob URL, and dynamically imports that URL. One module promise
is cached per source hash; Clips share the imported constructor but own separate
element instances. StarCut revokes the Blob URL after import, defines the
constructor once, assigns `runtime` and resolved `props`, and only then connects
the element. A changed source hash imports a new module revision.

## Trust Boundary

An `.mg` module is trusted project code. Static metadata inspection protects
server processes because they never execute the module, but it does not sandbox
browser execution. A shadow root isolates DOM and styles, not JavaScript
authority. Do not accept arbitrary public `.mg` uploads into the editor runtime
without a separate security boundary. The no-network and no-host-document rules
are part of the authored contract, not a browser security guarantee.

## Final Check

- The file is directly importable JavaScript.
- Static metadata fully describes size, duration, and editable variables.
- The default export is an `HTMLElement` subclass owning one SVG.
- Animation uses injected GSAP; complex behavior uses deterministic JavaScript.
- Props change component content; Timeline state controls placement.
- Every visible state is reproducible from an arbitrary exact time.
