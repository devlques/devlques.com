# Portfolio — project context

Personal portfolio for a fullstack developer (React/Node) who also positions
himself as a creative technologist — building visual, motion-driven work for
brands and creative industries (film, theatre) alongside product engineering.

Stack: React + Vite + hand-written Three.js (no react-three-fiber — deliberately
not used; scenes are built imperatively inside `useEffect` so the code stays
readable without an extra abstraction layer). No Tailwind — all styling is
plain CSS in a `<style>` block inside `Portfolio.jsx`, driven by CSS custom
properties.

## Where things are

- `src/Portfolio.jsx` — the entire site, single file, default export.
- `public/between-the-trees.*` — the Higgsfield video for the Visual Lab
  section (mp4 + webm + poster), already compressed for web (~600KB, was 8MB).
- `public/favicon.svg` (+ `favicon-32x32.png`, `apple-touch-icon.png`,
  wired up in `index.html`) — a miniature of the gyroscope hero: three gold
  rings (`#E0A83C`, brighter than the hero's own resting-state gold since
  it has to read at 16–32px) around a coral core (`#FF6F52`), on the site's
  `--bg` navy. **Out of sync as of the pin-color change below**: the hero's
  pivot pins are gold now too, so the favicon's coral core is the one place
  left where that old coral-pin design still shows — regenerate it (same
  one-off `sharp` script, not a project dependency) if you want the two to
  match again. The PNGs are rasterized from the SVG; don't hand-edit them.
- `src/main.jsx` — Vite entry point, nothing to touch here normally.

## Design system — do not improvise a new one

- Colors: `--bg:#070D1A` `--surface:#0E1626` `--border:#1C2A40`
  `--text:#E9EFF8` `--muted:#7C8DA6` `--accent:#FF6F52` (coral).
  **One accent color for UI/type, no exceptions.** It lives on: the readout,
  the progress rail, role years, hover states, chips. The gyroscope hero is
  its own material system and uses none of it — every active surface there,
  pivot pins included, glows gold (`GLOW_ON` / `0x4A3610` in
  `Portfolio.jsx`), not coral. That wasn't the original plan (the pins were
  coral through several earlier passes) but was changed on request — the
  reasoning was to have zero coral inside the 3D scene rather than one
  isolated accent point sitting oddly against an otherwise gold animation.
  See "The hero" below for the exact color constants.
- Fonts: `Bricolage Grotesque` (display — headlines, names, big numbers, used
  via variable-font `font-variation-settings`, not separate weight files),
  `Schibsted Grotesk` (body text), `Instrument Sans` (labels/eyebrows/chips/
  nav — everything driven by the `--spec` CSS var, so it's one line to
  swap). Four swaps happened here, all on request — don't revert any
  without being asked: Martian Mono → IBM Plex Mono → Space Mono → Courier
  Prime (three successive mono/typewriter faces, explicitly ruled out as a
  direction) → **Instrument Sans**, a plain grotesk sans with no mono or
  typewriter character at all. The pairing logic changed with this last
  swap too: earlier passes leaned on mono-vs-display contrast (technical
  readout, or old typewriter face, against Bricolage); Instrument Sans
  instead sits as a second, plainer grotesk next to Bricolage's — same
  family of shapes, different temperature, not a contrast pair. Bricolage
  itself has stayed untouched across all four swaps; it's the font actually
  used for the About body copy (the `.lede` class), and the fallback stack
  changed from `ui-monospace,monospace` to `ui-sans-serif,sans-serif` to
  match.
- **Font sizes live in one place: the `TYPE` config object**, defined right
  after the `C` color tokens, near the top of `Portfolio.jsx`. Every
  `font-size` in the `<style>` template pulls from it — there should be no
  hand-typed px or `clamp()` value anywhere in that block. `TYPE` is keyed
  by CSS font var (`spec` / `body` / `disp`), and each is keyed by *role*,
  not by page location — two pieces doing the same job pull the literal
  same tier, so they can't drift apart the way hand-typed values did across
  the font swaps above (that drift — chip at 13px next to eyebrow at
  13.5px, `.step h4` at wght 600 next to `.door span` at wght 580 — is
  exactly what this refactor cleaned up; `.chip` now shares `spec.label`
  and `.door span` now shares `disp.cardMd` with `.step h4`, wght included).
  Current tiers:
  - `TYPE.spec` (Instrument Sans, all px): `meta` 13 (rail label, lab-meta
    caption, footer), `label` 13.5 (eyebrow, readout idx/role/part, tabs,
    chips, lab "file missing" note, skills headers), `accent` 14 (nav,
    role years, process step numbers — paired with an accent color next to
    bigger display type).
  - `TYPE.body` (Schibsted Grotesk): `lead` (hero-sub, fluid 15–17px),
    `support` 14px (readout note desktop, role description), `supportSm`
    13px (readout note on mobile), `caption` 13.5px (lab caption, process
    step body, contact door body).
  - `TYPE.disp` (Bricolage Grotesque): each tier bundles `opsz`/`wdth`/
    `wght` with its size, since Bricolage's optical-size axis is meant to
    travel with point size, not stay fixed — `hero`/`contact` are fluid,
    sized-only (their variation settings come from the shared `.disp`
    class); `readout` and `lede` are fluid with their own bundled
    settings; `cardLg`/`cardMd`/`cardSm` are the three card/item-level
    sub-heading sizes (role company name, process-step/contact-door
    heading, visual-lab title).
  `fluid({min, vw, max})` turns a triple into a `clamp()` string — this is
  the actual interpolation: responsive sizes are generated from three
  numbers in `TYPE`, not hand-typed per class. When you add a new
  `--spec`/`--body`/`--disp` usage, put its size in `TYPE` under the
  closest existing role rather than writing a new literal inline — if
  nothing fits, that's a sign a new named tier belongs in `TYPE`, not that
  this one usage should be the exception.
- Bio and the 5 work history entries (Triple Digital, Microsoft, HomeHunter,
  Steadworth, Publicis Groupe) are real content, not placeholders — don't
  regenerate them.

## The hero — read this before touching it

The hero is 5.6 viewports tall (`height: 560vh`) with the canvas pinned via
`position: sticky`. Scroll position (0–1, computed from the hero's bounding
rect) drives everything: which axis is active, its motion, and a text
readout on the left. This is the signature piece of the site — ask before
replacing it with something simpler.

Current concept: **"The Gyroscope"** — and note the structural break from
every concept before it: scroll does **not** swap one object for another.
There is a single assembly on screen the whole way down (three concentric
rings plus a solid rotor), and each of the five stages hands over to a
different axis. One `THREE.Group`, one activation target per stage — not
five separate scene graphs. Don't re-fragment it into per-stage parts.

Axis map, one per layer of the stack:

| stage | layer      | active            | axis | drive rad/s |
|-------|------------|-------------------|------|-------------|
| 01    | React      | rotor only        | Y    | 2.10        |
| 02    | Node.js    | inner ring        | Z    | 1.15        |
| 03    | TypeScript | middle ring       | Y    | 0.85        |
| 04    | PostgreSQL | outer ring        | X    | 0.42 (slow) |
| 05    | Three.js   | all four at once  | —    | all of them |

"Active" is four things at once, all driven from one `act` scalar per
element that eases toward the stage's target (~0.85s hand-over): higher
opacity, the body's emissive glowing gold instead of near-black, that
ring's two pivot pins glowing a brighter gold than the body (still their
own accent point, just no longer a different color), and a faster spin
than everything else. There is no coral anywhere in the 3D scene — an
earlier pass kept the pins coral deliberately (as the page's one accent
carried into the hero), but that read as one oddly-colored point sitting
on an otherwise gold animation, so it was changed to gold on request.
`GLOW_ON` (`0x4A3610`, warm gold-brown) is shared by `bodyMat.emissive` and
`pinMat.emissive` — ring/rotor body and pins glow the exact same gold.
The only remaining distinction is `PIN_ON` (`0xE0A83C`, bright gold) on
`pinMat.color`, which the ring/rotor body has no equivalent for (a body's
base `color` never animates, only its `opacity` and `emissive` do) — that
brighter base color is what still makes the pins pop as *a* point, just
not *a different hue*, against their own ring's body.

**Opacity tracks `act` linearly, but speed and glow track `act²`** — this
is load-bearing, not a flourish. The rotor's drive is 2.1 rad/s, so at a
linear 0.22 residual it out-spins the outer ring's deliberately slow 0.42
and steals stage 04 from it; squaring also keeps the pins and ring glow
from sitting at a muddy halfway color. A simulation of the stage table
caught exactly this — worth re-running if you retune any `idle`/`drive`/
`ACT` value, asserting that in each stage the targeted element is both the
brightest and the fastest thing on screen.

Ring clearances — the reason this can be a flat sibling group instead of a
real nested gimbal. A torus centered on the origin permanently occupies the
spherical shell `[R - tube, R + tube]`, and rotating about any axis through
that origin cannot move a point off its own shell. So **if the shells are
disjoint, no two rings can ever touch at any combination of angles** — no
parent-child hierarchy needed, and the whole-assembly precession is free
for the same reason (it also rotates about the shared center):

    rotor  r=0.50                 shell [0.000, 0.500]
    inner  R=0.84  tube=0.050     shell [0.790, 0.890]   gap 0.290 to rotor
    mid    R=1.18  tube=0.058     shell [1.122, 1.238]   gap 0.232 to inner
    outer  R=1.55  tube=0.065     shell [1.485, 1.615]   gap 0.247 to mid

Verified from the real position buffers, not just the arithmetic, and every
pair checked rather than only neighbours. Re-run that if you touch any
radius or tube.

Each ring's plane contains its own spin axis, so it sweeps through space
like a gimbal ring instead of spinning flat in place — which also makes the
three hole axes mutually perpendicular (inner hole X, mid hole Z, outer
hole Y). The base plane is **baked into the geometry** (`geo.rotateX/Y` at
build time) so each group's `rotation` stays one clean axis with no Euler
cross-talk. Pins sit ON their ring's spin axis at radius R, so they hold
still while the ring sweeps past them, like a real pivot pin; they need no
collision check because they live on the tube centerline.

One more thing to preserve: the tick loop takes `clock.getDelta()` **once**
per frame and accumulates its own `elapsed`. Calling `getElapsedTime()` as
well would advance the same clock a second time and double every spin rate.
The delta is clamped to 0.05s so a backgrounded tab doesn't jump the rings
forward on return.

Earlier concepts that were tried and rejected, in order — don't reintroduce
without being asked: (1) rotating wireframe icosahedron + particles — too
generic/default-Three.js; (2) infinite forward-tracking corridor with GLSL
particle haze — good, replaced only because the direction changed to a
scroll-indexed catalogue; (3) industrial machine parts (gears, bolts,
flanges) on the same catalogue concept — replaced by watchmaking parts;
(4) watchmaking movement (balance wheel, mainspring barrel, pallet fork,
ratchet, tourbillon) — replaced by optics per explicit request; (5) "The
Optical Path" — five procedurally-built optical elements (iris diaphragm,
knurled lens barrel, dispersing prism, cemented doublet, Fresnel lens), all
real revolved `LatheGeometry` profiles, including a validated 9-blade iris
pivot mechanism (`aperture(stop) = pivotR*cos(stop) - bladeHalfWidth`,
blades sandwiched between rear plate and front cover in disjoint z bands)
that opened a real inscribed aperture rather than faking it with a scale
trick; (6) a mixed line of five unrelated objects — low-poly figure,
low-poly tree with an amber canopy, the barrel and doublet carried over
from (5), and a glass seed pod with six hinged petals. Rejected because it
simply **looked deficient** — most likely because it was generated by a
model with less sculptural capability for organic geometry; the mechanical
pieces held up but the figure and tree did not. That concept was also the
only time the single-accent rule was broken (warm amber ~#D9A24E on the
canopy, as a link to the Higgsfield clip); that exception died with it, and
the rule is strict again.

Worth carrying forward from all of the above: the scroll-catalogue
*structure*, the discipline of oscillating or handing over rather than
spinning everything uniformly, and the habit of validating every procedural
mechanism in a standalone script before wiring it in. What did **not**
survive is the assumption that each stage needs its own object — the
gyroscope shows one assembly re-read five ways, and that reads as more
considered than five unrelated props.

Mobile: intro text is pinned near the top (`top: clamp(112px,15vh,156px)`,
nudged down from the original `clamp(96px,13vh,140px)` on request so it
reads a little more vertically centered on first load) and the part
readout at the bottom — they were overlapping before this was fixed,
don't let them collide again. If you touch this clamp again, check it
against a short viewport (~600px tall, iPhone SE-class) — that's the case
where intro's bottom edge and readout's top edge come closest; there's
currently about 54px of clearance there. `hero-sub` is hidden on mobile
(redundant with the About section directly below).

## Known gaps to fill before publishing

- Name, email, GitHub, and LinkedIn are real (Luis Quesada /
  contact@devlques.com / github.com/devlques / linkedin.com/in/luis-carlos-
  quesada-sequeira-167520101) — filled in across nav, footer, and the
  contact doors/social row. Not placeholders anymore, don't regenerate them.
- No engineering project has a live link — the roles section intentionally
  dropped "View project" links since most of this history is agency/employer
  work without a public case study to point to.

## Validation habits from this project — keep doing this

Every custom geometry profile (gear teeth, lens lathe profiles, watch
components, petal hinges, gyroscope ring shells) was checked in a standalone
Node script before being wired into the component: build the geometry, assert
no `NaN` in the position buffer, confirm vertex/edge counts are sane, and
measure any clearance that matters from the real position buffer rather than
from the arithmetic that was supposed to produce it. Every GLSL shader was
checked with `@shaderfrog/glsl-parser` before shipping. Do the same for any
new procedural geometry or shader — it catches broken triangulation and
syntax errors before they show up as a black canvas.

Extend that habit to *animation state* too, not just geometry. The
gyroscope's five-stage activation table was simulated frame-by-frame in a
standalone script, asserting the property the design actually claims — in
every stage the active element is both the brightest and the fastest thing
on screen. That caught a real bug (a de-emphasized rotor out-spinning the
active outer ring) that no amount of reading the code would have surfaced,
and that would have been easy to miss by eye in the browser.
