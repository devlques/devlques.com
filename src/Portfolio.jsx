import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Github, Linkedin, Mail, ArrowUpRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   TOKENS — blueprint navy, coral reserved for coatings & marks
   ═══════════════════════════════════════════════════════════════ */
const C = {
  bg: '#070D1A',
  surface: '#0E1626',
  border: '#1C2A40',
  text: '#E9EFF8',
  muted: '#7C8DA6',
  accent: '#FF6F52',
};

/* ═══════════════════════════════════════════════════════════════
   TYPE SCALE — one source of truth per font, grouped by the role a
   piece plays rather than by where it happens to sit on the page.
   Two pieces doing the same job (two small uppercase labels, two
   card-level sub-headings) pull the exact same tier instead of
   drifting apart the way hand-typed px values do edit by edit.

   `fluid()` turns a {min, vw, max} triple into a CSS clamp() so
   responsive sizes are generated from three numbers instead of
   hand-typed per class — the actual interpolation, not just the
   value lookup.
   ═══════════════════════════════════════════════════════════════ */
const fluid = ({ min, vw, max }) => `clamp(${min}px, ${vw}vw, ${max}px)`;

const TYPE = {
  // --spec (Instrument Sans) — every technical/label piece on the page
  // falls into exactly one of three roles, nothing sized ad hoc:
  spec: {
    meta: 13,     // peripheral print: rail label, lab-meta caption, footer
    label: 13.5,  // standard label: eyebrow, readout idx/role/part, tabs,
                  // chips, the lab "file missing" note, skills headers
    accent: 14,   // accent-colored pieces standing next to bigger display
                  // type: nav, role years, process step numbers
  },
  // --body (Schibsted Grotesk) — running text
  body: {
    lead: { min: 15, vw: 1.5, max: 17 },  // hero-sub, the one lead-in line
    support: 14,      // readout note (desktop), role description
    supportSm: 13,    // readout note on mobile, where space is tight
    caption: 13.5,    // smallest supporting copy: lab caption, process
                       // step body, contact door body
  },
  // --disp (Bricolage Grotesque) — display type. The optical-size axis
  // is deliberately coupled to point size (see the .disp comment below),
  // so each tier below bundles opsz/wdth/wght with the size that earns
  // it, not just the size alone.
  disp: {
    hero: { min: 38, vw: 6.6, max: 88 },      // .h1 — variation settings
    contact: { min: 28, vw: 4.6, max: 54 },   // .ctitle — come from the
                                               // shared .disp base class
    readout: { min: 34, vw: 4.8, max: 60, opsz: 96, wdth: 100, wght: 640 },
    readoutSm: { min: 30, vw: 8.6, max: 44 }, // readout name, mobile
    lede: { min: 20, vw: 2.2, max: 29, opsz: 40, wdth: 100, wght: 420 },
    cardLg: { px: 24, opsz: 32, wdth: 100, wght: 600 },  // role company name
    cardMd: { px: 22, opsz: 30, wdth: 100, wght: 600 },  // process step
                                                          // title, contact
                                                          // door heading —
                                                          // same tier, was
                                                          // 580/600 apart
    cardSm: { px: 20, opsz: 28, wdth: 100, wght: 600 },  // visual lab title
  },
};

/* LQIP sampled from the Higgsfield clip */
const LQIP =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gAQTGF2YzYwLjMxLjEwMgD/2wBDABMNDhEODBMRDxEVFBMXHTAfHRoaHToqLCMwRT1JR0Q9Q0FMVm1dTFFoUkFDX4JgaHF1e3x7SlyGkIV3j214e3b/2wBDARQVFR0ZHTgfHzh2T0NPdnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnb/wAARCAAXACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDnJlURJjr3q5bwRssO7nOc1nnc2KuWs3zKDwR2pNlI6K3eLb5ZUbAMAGs64gt3nuj93A+X8qRpWSPdWbLctufqS1Nu4loJYFVlO/oRRVYN5RyQc0VNh3FhkKYGAR6Gr8Nxb/8ALWE59VNFFDVxJ2J2uLMj7s3TGM8VSneMn90hX3NFFCRTlcqFefeiiimQf//Z';

/* ── scroll reveal ─────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`rv ${visible ? 'rv--in' : ''} ${className}`}
         style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THE SIGNATURE — "THE GYROSCOPE"

   The hero is 5.6 viewports tall with the canvas pinned. Unlike
   every earlier concept, scroll does NOT swap one object for
   another: there is a single assembly on screen the whole way
   down — three concentric rings and a solid rotor — and each of
   the five stages hands over to a different axis.

   Stage by stage: the rotor alone (React), then the inner ring on
   Z (Node), the middle ring on Y (TypeScript), the outer ring on X
   (PostgreSQL), and finally all four turning at once (Three.js) —
   the whole system in motion as the natural close.

   "Active" means three things together: higher opacity, that
   ring's pins in saturated coral instead of muted steel, and a
   faster spin than everything else. One group, one active-axis
   target that changes per stage — not five separate scene graphs.
   ═══════════════════════════════════════════════════════════════ */

const GRID_VERT = `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GRID_FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uP;

void main() {
  vec2 uv = vUv * vec2(30.0, 19.0);
  uv.y += uTime * 0.035 + uP * 5.0;

  vec2 g = abs(fract(uv) - 0.5);
  float minor = 1.0 - smoothstep(0.0, 0.038, min(g.x, g.y));

  vec2 g5 = abs(fract(uv / 5.0) - 0.5);
  float major = 1.0 - smoothstep(0.0, 0.011, min(g5.x, g5.y));

  float a = minor * 0.13 + major * 0.26;
  a *= smoothstep(1.25, 0.22, length((vUv - 0.5) * 2.0));

  gl_FragColor = vec4(vec3(0.33, 0.53, 0.86) * a, a);
}
`;

/* ── the assembly ────────────────────────────────────────────────

   Three rings and a rotor, all centered on the same origin. This is
   a stylized gyroscope, not a real gimbal: no ring is nested inside
   another's rotation. They are flat siblings under one group, each
   turning about a different global axis.

   That flatness is exactly what makes the clearance argument hold at
   every angle. A torus centered on the origin occupies the spherical
   shell [R - tube, R + tube], and rotating about an axis through the
   origin cannot move a point off its own shell — so disjoint shells
   can never touch, whatever the angles happen to be. Measured from
   the real position buffers:

     rotor  [0.000, 0.500]
     inner  [0.790, 0.890]   gap to rotor  0.290
     mid    [1.122, 1.238]   gap to inner  0.232
     outer  [1.485, 1.615]   gap to mid    0.247

   Each ring's plane contains its own spin axis, so it sweeps through
   space like a gimbal ring instead of spinning flat in place, and the
   three hole axes come out mutually perpendicular: inner hole X, mid
   hole Z, outer hole Y. The base plane is baked into the geometry so
   each group's rotation stays a single clean axis with no Euler
   cross-talk.
   ─────────────────────────────────────────────────────────────── */
const RINGS = [
  { key: 'inner', R: 0.84, tube: 0.050, axis: 'z', bake: [0, Math.PI / 2, 0], idle: 0.05, drive: 1.15 },
  { key: 'mid',   R: 1.18, tube: 0.058, axis: 'y', bake: [0, 0, 0],           idle: 0.04, drive: 0.85 },
  { key: 'outer', R: 1.55, tube: 0.065, axis: 'x', bake: [Math.PI / 2, 0, 0], idle: 0.03, drive: 0.42 },
];

const ROTOR = { key: 'rotor', r: 0.5, axis: 'y', idle: 0.22, drive: 2.1 };

/* Pins ride ON their ring's spin axis, so they hold still while the
   ring sweeps past them — which is what a pivot pin actually does.
   Orient the mark's long (Y) dimension along that axis. */
const PIN_ROT = { x: [0, 0, Math.PI / 2], y: [0, 0, 0], z: [Math.PI / 2, 0, 0] };

/* activation per stage — the whole concept in one table */
const ACT = [
  { rotor: 1.00, inner: 0.00, mid: 0.00, outer: 0.00 },
  { rotor: 0.22, inner: 1.00, mid: 0.00, outer: 0.00 },
  { rotor: 0.22, inner: 0.00, mid: 1.00, outer: 0.00 },
  { rotor: 0.22, inner: 0.00, mid: 0.00, outer: 1.00 },
  { rotor: 1.00, inner: 1.00, mid: 1.00, outer: 1.00 },
];

/* an inactive element keeps this much of its opacity — enough to read
   as present, low enough that the active axis owns the frame */
const DIM = 0.16;

const PIN_OFF = new THREE.Color(0x2A3A55);
const PIN_ON = new THREE.Color(0xE0A83C);   // bright gold — same family as GLOW_ON, brighter so
                                             // the pin still pops against its own ring's body
const GLOW_OFF = new THREE.Color(0x05080F);
const GLOW_ON = new THREE.Color(0x4A3610);  // warm gold-brown, shared by ring/rotor body and pins —
                                             // the hero animation has no coral in it at all now

const STAGES = [
  {
    name: 'JS - React', role: 'Interface layer', part: 'Rotor — solid core, free spin',
    note: 'Component-based UI library. Used here for the whole interface, from layout to state.',
  },
  {
    name: 'Node.js', role: 'Service layer', part: 'Inner ring — Z axis',
    note: 'JavaScript runtime for the backend — APIs, background jobs, server-side logic.',
  },
  {   name: 'SQL', role: 'Persistence', part: 'Middle ring — Y axis',
    note: 'Relational database. Schema design, queries, and migrations for anything that needs to persist.',
  },
  {
    name: 'Three.js', role: 'Render layer', part: 'Outer ring — X axis',
    note: 'WebGL library for real-time 3D — the engine behind this page\u2019s own hero.',
  },
  {
    name: 'DevOps', role: 'Infrastructure', part: 'Full assembly — three axes at once',
    note: 'Cloud infrastructure — auth, storage, and deployment. The layer that keeps everything else running once it ships.',
  }, 
];

const INTRO_END = 0.14;
const PATH_IN = INTRO_END * 0.72;

function Gyroscope({ heroRef, railRef, introRef, readoutRef, onStage }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const hero = heroRef.current;
    if (!mount || !hero) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const junk = [];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42, mount.clientWidth / mount.clientHeight, 0.1, 60
    );
    camera.position.set(0, 0, 5.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    /* ── blueprint backdrop ─────────────────────────────────── */
    const gridUni = { uTime: { value: 0 }, uP: { value: 0 } };
    const grid = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 22),
      new THREE.ShaderMaterial({
        vertexShader: GRID_VERT,
        fragmentShader: GRID_FRAG,
        uniforms: gridUni,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    grid.position.z = -6;
    scene.add(grid);

    /* ── lighting ───────────────────────────────────────────── */
    scene.add(new THREE.HemisphereLight(0x2C4370, 0x04070E, 0.6));
    const key = new THREE.DirectionalLight(0xD8E6FF, 1.25);
    key.position.set(3.2, 4.4, 4.0);
    scene.add(key);
    const coral = new THREE.PointLight(0xFF6F52, 2.5, 16);
    coral.position.set(-3.1, -1.7, 2.6);
    scene.add(coral);
    const kick = new THREE.PointLight(0x4C7DFF, 1.3, 18);
    kick.position.set(4.0, 2.2, -2.2);
    scene.add(kick);

    /* ── material templates, cloned per element so each one can be
       driven independently ──────────────────────────────────── */
    const mats = {
      ring: new THREE.MeshPhongMaterial({
        color: 0x1A2640, specular: 0xA6BFE2, shininess: 64, transparent: true,
      }),
      rotor: new THREE.MeshPhongMaterial({
        color: 0x223152, specular: 0xC3D8F2, shininess: 90, transparent: true,
      }),
      // the pin's own accent — brightest gold in the assembly when active
      pin: new THREE.MeshPhongMaterial({
        color: 0xE0A83C, specular: 0xFFD9CE, shininess: 120, transparent: true,
      }),
      edge: new THREE.LineBasicMaterial({
        color: 0x8FB6E4, transparent: true, opacity: 0.3,
      }),
    };

    /* ── one assembly, built once ───────────────────────────── */
    const gyro = new THREE.Group();
    scene.add(gyro);

    const gMark = new THREE.BoxGeometry(0.048, 0.11, 0.03);
    junk.push(gMark);

    const elems = [];

    RINGS.forEach((r) => {
      const geo = new THREE.TorusGeometry(r.R, r.tube, 14, 72);
      // bake the ring's plane in, so the group's rotation is one clean axis
      geo.rotateX(r.bake[0]);
      geo.rotateY(r.bake[1]);
      junk.push(geo);

      const grp = new THREE.Group();
      const bodyMat = mats.ring.clone();
      grp.add(new THREE.Mesh(geo, bodyMat));

      // both pins of a ring share one material — they light up together
      const pinMat = mats.pin.clone();
      const pr = PIN_ROT[r.axis];
      [1, -1].forEach((sign) => {
        const pin = new THREE.Mesh(gMark, pinMat);
        pin.position[r.axis] = sign * r.R;
        pin.rotation.set(pr[0], pr[1], pr[2]);
        grp.add(pin);
      });

      gyro.add(grp);
      elems.push({ ...r, grp, bodyMat, pinMat, edgeMat: null, angle: 0, act: 0 });
    });

    /* the rotor: faceted, solid, and the only element carrying edge lines —
       it should read as machined rather than as another thin hoop */
    const gRotor = new THREE.IcosahedronGeometry(ROTOR.r, 0);
    const gRotorEdge = new THREE.EdgesGeometry(gRotor, 18);
    junk.push(gRotor, gRotorEdge);

    const rotorGrp = new THREE.Group();
    const rotorMat = mats.rotor.clone();
    const rotorEdgeMat = mats.edge.clone();
    rotorGrp.add(new THREE.Mesh(gRotor, rotorMat));
    rotorGrp.add(new THREE.LineSegments(gRotorEdge, rotorEdgeMat));
    gyro.add(rotorGrp);
    elems.push({
      ...ROTOR, grp: rotorGrp, bodyMat: rotorMat,
      pinMat: null, edgeMat: rotorEdgeMat, angle: 0, act: 0,
    });

    /* ── scroll drive ───────────────────────────────────────── */
    let lastStage = -1;
    const span = (1 - INTRO_END) / STAGES.length;

    const clock = new THREE.Clock();
    let elapsed = 0;
    let raf;

    const tick = () => {
      // one getDelta per frame — getElapsedTime() advances the same clock a
      // second time, which would double every spin rate. Clamped so a
      // backgrounded tab doesn't return and jump the rings forward.
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const t = elapsed;
      const tm = reduce ? 0 : t;
      const md = reduce ? 0 : dt;

      const rect = hero.getBoundingClientRect();
      const total = Math.max(rect.height - window.innerHeight, 1);
      const p = Math.min(Math.max(-rect.top / total, 0), 1);

      gridUni.uTime.value = t;
      gridUni.uP.value = p;

      if (introRef.current) {
        const fade = 1 - Math.min(p / INTRO_END, 1);
        introRef.current.style.opacity = String(fade);
        introRef.current.style.transform = `translateY(${(1 - fade) * -26}px)`;
      }
      const inAlpha = Math.min(
        Math.max((p - PATH_IN) / (INTRO_END - PATH_IN), 0), 1
      );
      if (readoutRef.current) readoutRef.current.style.opacity = String(inAlpha);
      if (railRef.current) {
        railRef.current.style.setProperty('--p', String(p));
        railRef.current.style.opacity = String(inAlpha);
      }

      const sf = (p - INTRO_END) / span;
      const idx = Math.min(Math.max(Math.floor(sf), 0), STAGES.length - 1);

      if (idx !== lastStage && p > PATH_IN) {
        lastStage = idx;
        onStage(idx);
      }

      gyro.visible = p >= PATH_IN;
      if (gyro.visible) {
        /* the assembly is on screen the whole way down, so it drifts and grows
           across the *whole* hero rather than once per stage */
        const q = Math.min(Math.max((p - PATH_IN) / (1 - PATH_IN), 0), 1);
        gyro.position.set(0.55 - q * 0.34, 0.12, -1.2 + q * 1.7);
        gyro.scale.setScalar((0.94 + q * 0.16) * (isMobile ? 0.68 : 1));
        // whole-assembly precession. Safe for the clearances: this rotates
        // about the shared center, so every ring stays on its own shell
        gyro.rotation.set(
          0.3 + Math.sin(tm * 0.23) * 0.05,
          Math.sin(tm * 0.17) * 0.12,
          0.06
        );

        const target = ACT[idx];
        // ease toward the stage's target so crossing a boundary reads as a
        // hand-over between axes rather than a hard cut. Snap if reduced.
        const k = reduce ? 1 : Math.min(dt * 4.5, 1);

        for (let i = 0; i < elems.length; i++) {
          const e = elems[i];
          e.act += (target[e.key] - e.act) * k;

          /* Opacity tracks activation linearly — a de-emphasized element
             should still read as present. Speed and glow track its SQUARE,
             which matters more than it looks: the rotor's drive is 2.1 rad/s,
             so at a linear 0.22 residual it would still out-spin the outer
             ring's deliberately slow 0.42 and steal stage 04 from it. Squaring
             makes "attenuated" actually look attenuated in motion, and keeps
             the glow off the pins until a ring is genuinely the active axis
             instead of muddying them halfway to it. */
          const hot = e.act * e.act;

          e.angle += md * (e.idle + hot * (e.drive - e.idle));
          e.grp.rotation[e.axis] = e.angle;

          const vis = (DIM + (1 - DIM) * e.act) * inAlpha;
          e.bodyMat.opacity = vis;
          // rings, rotor, and pins all glow the same gold when active — no
          // coral anywhere in the hero animation, only the pins' own base
          // color (PIN_ON) goes brighter to still read as the accent point
          e.bodyMat.emissive.copy(GLOW_OFF).lerp(GLOW_ON, hot);
          if (e.pinMat) {
            e.pinMat.opacity = vis;
            e.pinMat.color.copy(PIN_OFF).lerp(PIN_ON, hot);
            e.pinMat.emissive.copy(GLOW_OFF).lerp(GLOW_ON, hot);
          }
          if (e.edgeMat) e.edgeMat.opacity = 0.3 * vis;
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      junk.forEach((g) => g.dispose());
      elems.forEach((e) => {
        e.bodyMat.dispose();
        if (e.pinMat) e.pinMat.dispose();
        if (e.edgeMat) e.edgeMat.dispose();
      });
      Object.keys(mats).forEach((k) => mats[k].dispose());
      grid.geometry.dispose();
      grid.material.dispose();
      renderer.dispose();
    };
  }, [heroRef, railRef, introRef, readoutRef, onStage]);

  return <div ref={mountRef} className="stage-canvas" aria-hidden="true" />;
}

/* ── custom cursor ─────────────────────────────────────────── */
function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    setOn(fine);
    if (!fine) return;

    let mx = 0, my = 0, rx = 0, ry = 0, raf;
    const move = (e) => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) dot.current.style.transform = `translate(${mx}px, ${my}px)`;
    };
    const over = (e) => e.target.closest?.('[data-h]') && ring.current?.classList.add('ring--on');
    const out = (e) => e.target.closest?.('[data-h]') && ring.current?.classList.remove('ring--on');

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    window.addEventListener('mouseout', out);

    const loop = () => {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mouseout', out);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (!on) return null;
  return (<><div ref={dot} className="cur-dot" /><div ref={ring} className="cur-ring" /></>);
}

/* ═══════════════════════════════════════════════════════════════
   CONTENT
   ═══════════════════════════════════════════════════════════════ */
const BIO = `Fullstack Software Developer with a strong background in web applications
and a proven ability to adapt to different technologies and stacks. Particular focus on
frontend development, interactive visuals, and interface design — including 3D and
motion-driven experiences built with tools like Three.js — for both product engineering
and creative digital projects.`;

const ROLES = [
  {
    company: 'Triple Digital', year: '2026',
    desc: 'Website development in WordPress and React, with data processing and integration on the backend.',
    stack: ['WordPress', 'React', 'Python', 'PostgreSQL'],
  },
  {
    company: 'Microsoft', year: '2025',
    desc: 'UI features and improved UX practices for Xbox game developer web applications.',
    stack: ['UI engineering', 'UX practice'],
  },
  {
    company: 'HomeHunter', year: '2024',
    desc: 'Chrome extension built in modern React, integrating external APIs and AWS services.',
    stack: ['React', 'Chrome Extensions', 'AWS', 'REST APIs'],
  },
  {
    company: 'Steadworth', year: '2024',
    desc: 'Web application in modern React, designed in Figma and Framer, with AWS auth integration.',
    stack: ['React', 'AWS auth', 'Figma', 'Framer'],
  },
  {
    company: 'Publicis Groupe', year: '2019',
    desc: 'Fullstack development across client and service layers, test-driven throughout.',
    stack: ['React', 'Node', 'GraphQL', 'Clojure', 'TDD'],
  },
  {
    company: 'Publicis Groupe', year: '2016',
    desc: 'Led a content team maintaining large websites built on Sitecore CMS and .NET.',
    stack: ['Sitecore CMS', '.NET', 'Team leadership'],
  },
];

const PROCESS = [
  { n: '01', t: 'Understand', d: 'Find the actual problem before writing anything.' },
  { n: '02', t: 'Architect', d: 'Design the system and the experience together, not one after the other.' },
  { n: '03', t: 'Build', d: 'Ship something working early, then keep sharpening it.' },
  { n: '04', t: 'Direct', d: 'Handle the details that decide whether it feels considered or merely finished.' },
];

const SKILLS = {
  Engineering: ['React', 'Node.js', 'TypeScript', 'GraphQL', 'PostgreSQL', 'Python', 'AWS', 'TDD'],
  Creation: ['Three.js', 'GLSL / shaders', 'Motion & interaction', 'Figma / Framer', 'Art direction', 'Generative video'],
};

/* ═══════════════════════════════════════════════════════════════ */
export default function Portfolio() {
  const [track, setTrack] = useState('engineering');
  const [scrolled, setScrolled] = useState(false);
  const [videoOk, setVideoOk] = useState(true);
  const [stage, setStage] = useState(0);

  const heroRef = useRef(null);
  const railRef = useRef(null);
  const introRef = useRef(null);
  const readoutRef = useRef(null);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  const s = STAGES[stage];

  return (
    <div className="pg">
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800&family=Instrument+Sans:wght@400;500;600&family=Schibsted+Grotesk:wght@400;500&display=swap');

.pg, .pg *, .pg *::before, .pg *::after { box-sizing: border-box; }
.pg {
  --bg:${C.bg}; --surface:${C.surface}; --border:${C.border};
  --text:${C.text}; --muted:${C.muted}; --accent:${C.accent};
  --disp:'Bricolage Grotesque','Helvetica Neue',sans-serif;
  --body:'Schibsted Grotesk',system-ui,sans-serif;
  --spec:'Instrument Sans',ui-sans-serif,sans-serif;
  background: var(--bg); color: var(--text);
  font-family: var(--body);
  position: relative; overflow-x: clip;
  -webkit-font-smoothing: antialiased;
}
.pg a { color: inherit; text-decoration: none; }
.pg ::selection { background: var(--accent); color: var(--bg); }
.pg :focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; border-radius: 2px; }
.pg h1,.pg h2,.pg h3,.pg h4,.pg p { margin: 0; }

/* display: Bricolage's optical-size axis pushed to its display end,
   so large type gets tighter joins instead of a scaled-up text cut */
.disp { font-family:var(--disp); font-variation-settings:'opsz' 96,'wdth' 100,'wght' 620;
  line-height:1.03; letter-spacing:-0.025em; }
.spec { font-family:var(--spec); }

/* Instrument Sans — a clean grotesk sans, not a mono/typewriter face at
   all: the label voice moved from "technical readout" to "same sans
   register as the display face, one step plainer." It pairs with
   Bricolage Grotesque as two grotesks at different temperatures rather
   than as a display/mono contrast pair. Sizes come from TYPE.spec above. */
.eyebrow { font-family:var(--spec); font-weight:400; font-size:${TYPE.spec.label}px; letter-spacing:.11em;
  text-transform:uppercase; color:var(--accent); display:block; margin-bottom:22px; }

/* cursor */
.cur-dot,.cur-ring{position:fixed;top:0;left:0;pointer-events:none;z-index:100;will-change:transform;}
.cur-dot{width:5px;height:5px;margin:-2.5px;border-radius:50%;background:var(--accent);}
.cur-ring{width:30px;height:30px;margin:-15px;border-radius:50%;border:1px solid var(--accent);opacity:.5;
  transition:width .22s,height .22s,margin .22s,opacity .22s,border-color .22s;}
.ring--on{width:58px;height:58px;margin:-29px;opacity:1;border-color:var(--text);}

/* nav */
.nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;justify-content:space-between;
  align-items:center;padding:22px 6vw;border-bottom:1px solid transparent;
  transition:background .35s,border-color .35s,backdrop-filter .35s;}
.nav--on{background:rgba(7,13,26,.82);backdrop-filter:blur(12px);border-color:var(--border);}
.nav a,.nav span{font-family:var(--spec);font-size:${TYPE.spec.accent}px;letter-spacing:.05em;}
.nav a{color:var(--muted);transition:color .2s;}
.nav a:hover{color:var(--accent);}

/* ── HERO: 5.6 viewports of scroll, canvas pinned ─────────── */
.hero{position:relative;height:560vh;}
.stage{position:sticky;top:0;height:100svh;overflow:hidden;}
.stage-canvas{position:absolute;inset:0;z-index:1;}
.stage-canvas canvas{display:block;}
.stage::after{content:'';position:absolute;inset:0;z-index:2;pointer-events:none;
  background:radial-gradient(115% 80% at 62% 46%, rgba(7,13,26,0) 34%, rgba(7,13,26,.82) 100%);}

.intro{position:absolute;z-index:4;left:6vw;bottom:clamp(90px,16vh,170px);max-width:820px;
  pointer-events:none;will-change:opacity,transform;}
.h1{font-size:${fluid(TYPE.disp.hero)};margin-bottom:24px;text-shadow:0 2px 40px rgba(7,13,26,.9);}
/* same family, condensed and lighter — contrast without a second face */
.h1 em{font-style:normal;color:var(--accent);
  font-variation-settings:'opsz' 96,'wdth' 79,'wght' 470;}
.hero-sub{color:var(--muted);font-size:${fluid(TYPE.body.lead)};line-height:1.65;max-width:430px;}

/* part readout */
.readout{position:absolute;z-index:4;left:6vw;top:50%;transform:translateY(-50%);
  max-width:355px;pointer-events:none;opacity:0;}
.readout-idx{font-family:var(--spec);font-size:${TYPE.spec.label}px;letter-spacing:.14em;
  color:var(--accent);margin-bottom:16px;}
.readout-name{font-family:var(--disp);font-variation-settings:'opsz' ${TYPE.disp.readout.opsz},'wdth' ${TYPE.disp.readout.wdth},'wght' ${TYPE.disp.readout.wght};
  font-size:${fluid(TYPE.disp.readout)};line-height:1.0;letter-spacing:-0.03em;margin-bottom:12px;}
.readout-role{font-family:var(--spec);font-size:${TYPE.spec.label}px;letter-spacing:.13em;
  text-transform:uppercase;color:var(--text);opacity:.78;margin-bottom:9px;}
.readout-part{font-family:var(--spec);font-size:${TYPE.spec.label}px;letter-spacing:.05em;
  color:var(--muted);margin-bottom:18px;display:flex;align-items:center;gap:9px;}
.readout-part::before{content:'';width:15px;height:1px;background:var(--accent);flex:0 0 auto;}
.readout-note{color:var(--muted);font-size:${TYPE.body.support}px;line-height:1.7;}
.swap{animation:swapIn .5s cubic-bezier(.22,.61,.36,1) both;}
@keyframes swapIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

/* progress rail */
.rail{position:absolute;z-index:4;right:6vw;top:50%;transform:translateY(-50%);
  display:flex;flex-direction:column;gap:12px;align-items:flex-end;
  pointer-events:none;--p:0;opacity:0;}
.rail-track{width:2px;height:190px;background:var(--border);position:relative;overflow:hidden;}
.rail-track::after{content:'';position:absolute;left:0;top:0;width:100%;
  height:calc(var(--p) * 100%);background:var(--accent);}
.rail-lbl{font-family:var(--spec);font-size:${TYPE.spec.meta}px;letter-spacing:.13em;
  color:var(--muted);writing-mode:vertical-rl;}

/* mobile: intro near the top, readout at the foot — no overlap */
@media (max-width:860px){
  /* nudged down from the original clamp(96px,13vh,140px) so the intro
     block reads a little more vertically centered on first load, not
     pinned right at the top edge. Checked against a 600px-tall viewport
     (iPhone SE-class) — still leaves ~54px clear of the readout block at
     the bottom, well short of the collision this pairing had before */
  .intro{top:clamp(112px,15vh,156px);bottom:auto;}
  .hero-sub{display:none;}
  .readout{top:auto;bottom:clamp(72px,12vh,120px);transform:none;max-width:none;right:6vw;}
  .readout-name{font-size:${fluid(TYPE.disp.readoutSm)};}
  .readout-note{font-size:${TYPE.body.supportSm}px;line-height:1.65;}
  .rail{display:none;}
  .stage::after{background:linear-gradient(0deg, rgba(7,13,26,.95) 0%, rgba(7,13,26,.42) 36%, rgba(7,13,26,0) 68%);}
}

/* sections */
.sec{padding:clamp(90px,13vw,160px) 6vw;position:relative;z-index:3;background:var(--bg);}
/* capabilities sits between two already-spacious sections (work and
   contact) — it doesn't need the full section rhythm on both edges */
.sec--tight{padding-top:clamp(50px,7vw,90px);padding-bottom:clamp(50px,7vw,90px);}
.rv{opacity:0;transform:translateY(26px);
  transition:opacity .75s cubic-bezier(.22,.61,.36,1),transform .75s cubic-bezier(.22,.61,.36,1);}
.rv--in{opacity:1;transform:none;}

/* about + process: bio and the way it gets made, read side by side —
   About leads in source order, so it's first when this collapses to a
   single column on small screens */
.about-process{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(48px,6vw,96px);align-items:start;}
@media (max-width:768px){
  .about-process{grid-template-columns:1fr;gap:56px;}
}

.lede{font-family:var(--disp);font-variation-settings:'opsz' ${TYPE.disp.lede.opsz},'wdth' ${TYPE.disp.lede.wdth},'wght' ${TYPE.disp.lede.wght};
  font-size:${fluid(TYPE.disp.lede)};line-height:1.48;letter-spacing:-0.012em;}

/* work */
.tabs{display:flex;gap:32px;margin-bottom:52px;border-bottom:1px solid var(--border);}
.tab{font-family:var(--spec);font-size:${TYPE.spec.label}px;letter-spacing:.12em;text-transform:uppercase;
  background:none;border:0;color:var(--muted);padding:0 0 15px;cursor:pointer;margin-bottom:-1px;
  border-bottom:2px solid transparent;transition:color .22s,border-color .22s;}
.tab--on{color:var(--accent);border-color:var(--accent);}

/* roles: a chronology, not a card wall */
.roles{display:flex;flex-direction:column;}
.role{display:grid;grid-template-columns:1fr auto;gap:24px;padding:30px 0;
  border-top:1px solid var(--border);transition:border-color .25s;}
.roles > div:last-child .role{border-bottom:1px solid var(--border);}
.role:hover{border-color:var(--accent);}
.role-co{font-family:var(--disp);font-variation-settings:'opsz' ${TYPE.disp.cardLg.opsz},'wdth' ${TYPE.disp.cardLg.wdth},'wght' ${TYPE.disp.cardLg.wght};
  font-size:${TYPE.disp.cardLg.px}px;letter-spacing:-0.02em;margin-bottom:9px;transition:color .22s;}
.role:hover .role-co{color:var(--accent);}
.role-desc{color:var(--muted);font-size:${TYPE.body.support}px;line-height:1.7;max-width:560px;margin-bottom:16px;}
.role-yr{font-family:var(--spec);font-size:${TYPE.spec.accent}px;color:var(--accent);
  letter-spacing:.04em;white-space:nowrap;padding-top:7px;}
@media (max-width:560px){
  .role{grid-template-columns:1fr;gap:10px;}
  .role-yr{padding-top:0;order:-1;}
}

.chips{display:flex;flex-wrap:wrap;gap:8px;}
.chip{font-family:var(--spec);font-size:${TYPE.spec.label}px;letter-spacing:.02em;padding:6px 12px;
  border:1px solid var(--border);border-radius:99px;color:var(--muted);}

/* visual lab */
.lab{max-width:620px;margin:0;}
.lab-frame{position:relative;aspect-ratio:16/9;border:1px solid var(--border);border-radius:3px;
  overflow:hidden;background-size:cover;background-position:center;transition:border-color .3s;}
.lab-frame:hover{border-color:var(--accent);}
.lab-frame video{width:100%;height:100%;object-fit:cover;display:block;}
.lab-miss{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  text-align:center;padding:24px;font-family:var(--spec);font-size:${TYPE.spec.label}px;
  line-height:1.8;color:var(--muted);background:rgba(7,13,26,.72);}
.lab-meta{display:flex;justify-content:space-between;align-items:baseline;gap:16px;
  padding-top:18px;border-top:1px solid var(--border);margin-top:18px;}
.lab-meta h3{font-family:var(--disp);font-variation-settings:'opsz' ${TYPE.disp.cardSm.opsz},'wdth' ${TYPE.disp.cardSm.wdth},'wght' ${TYPE.disp.cardSm.wght};
  font-size:${TYPE.disp.cardSm.px}px;letter-spacing:-0.02em;}
.lab-meta span{font-family:var(--spec);font-size:${TYPE.spec.meta}px;color:var(--muted);
  letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;}
.lab-cap{color:var(--muted);font-size:${TYPE.body.caption}px;line-height:1.7;margin-top:12px;max-width:460px;}

/* process */
.step{display:flex;gap:26px;padding:26px 0;border-top:1px solid var(--border);align-items:baseline;}
.steps > div:last-child .step{border-bottom:1px solid var(--border);}
.step-n{font-family:var(--spec);color:var(--accent);font-size:${TYPE.spec.accent}px;width:34px;flex:0 0 auto;}
.step h4{font-family:var(--disp);font-variation-settings:'opsz' ${TYPE.disp.cardMd.opsz},'wdth' ${TYPE.disp.cardMd.wdth},'wght' ${TYPE.disp.cardMd.wght};
  font-size:${TYPE.disp.cardMd.px}px;letter-spacing:-0.02em;margin-bottom:7px;}
.step p{color:var(--muted);font-size:${TYPE.body.caption}px;max-width:440px;}

/* skills */
.skills{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,60px);}
.skills h3{font-family:var(--spec);font-size:${TYPE.spec.label}px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--muted);margin-bottom:20px;}
@media (max-width:640px){.skills{grid-template-columns:1fr;}}

/* contact */
.ctitle{font-size:${fluid(TYPE.disp.contact)};margin-bottom:52px;}
.doors{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:52px;}
.door{border:1px solid var(--border);border-radius:3px;padding:30px;display:block;
  transition:border-color .25s,background .25s;}
.door:hover{border-color:var(--accent);background:var(--surface);}
.door p{color:var(--muted);font-size:${TYPE.body.caption}px;margin-bottom:14px;}
.door span{display:flex;align-items:center;gap:8px;font-family:var(--disp);
  font-variation-settings:'opsz' ${TYPE.disp.cardMd.opsz},'wdth' ${TYPE.disp.cardMd.wdth},'wght' ${TYPE.disp.cardMd.wght};font-size:${TYPE.disp.cardMd.px}px;
  letter-spacing:-0.02em;color:var(--accent);}
@media (max-width:640px){.doors{grid-template-columns:1fr;}}
.social{display:flex;gap:22px;padding-top:36px;border-top:1px solid var(--border);}
.social a{color:var(--muted);transition:color .2s;}
.social a:hover{color:var(--accent);}

.foot{padding:26px 6vw;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;
  font-family:var(--spec);font-size:${TYPE.spec.meta}px;letter-spacing:.04em;color:var(--muted);background:var(--bg);}

@media (prefers-reduced-motion: reduce){
  .pg *{animation-duration:.001ms !important;transition-duration:.001ms !important;}
}
      `}</style>

      <Cursor />

      <nav className={`nav ${scrolled ? 'nav--on' : ''}`}>
        <span>Luis Quesada</span>
        <a href="#contact" data-h>CONTACT</a>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <header className="hero" ref={heroRef}>
        <div className="stage">
          <Gyroscope
            heroRef={heroRef}
            railRef={railRef}
            introRef={introRef}
            readoutRef={readoutRef}
            onStage={setStage}
          />

          <div className="intro" ref={introRef}>
            <span className="eyebrow">Fullstack Development — Creative Direction</span>
            <h1 className="disp h1">
              Crafting modern<br />
              <em>digital experiences.</em> 
            </h1>
            <p className="hero-sub">
              Fullstack engineer building interactive, motion-driven experiences —
              for products, brands, and creative work alike.
            </p>
          </div>

          <div className="readout" ref={readoutRef} key={stage}>
            <div className="readout-idx swap">
              {String(stage + 1).padStart(2, '0')} / {String(STAGES.length).padStart(2, '0')}
            </div>
            <div className="readout-name swap">{s.name}</div>
            <div className="readout-role swap">{s.role}</div>
            <div className="readout-part swap">{s.part}</div>
            <p className="readout-note swap">{s.note}</p>
          </div>

          <div className="rail" ref={railRef}>
            <span className="rail-lbl">THE GYROSCOPE</span>
            <div className="rail-track" />
          </div>
        </div>
      </header>

      {/* ── ABOUT + PROCESS — the bio and how it gets made, side by
          side on large screens; About leads on small ones ── */}
      <section className="sec about-process">
        <Reveal>
          <span className="eyebrow">About</span>
          <p className="lede">{BIO}</p>
        </Reveal>

        <div>
          <Reveal><span className="eyebrow">Process</span></Reveal>
          <div className="steps">
            {PROCESS.map((st, i) => (
              <Reveal key={st.n} delay={i * 55}>
                <div className="step">
                  <span className="step-n">{st.n}</span>
                  <div><h4>{st.t}</h4><p>{st.d}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORK ─────────────────────────────────────────────── */}
      <section className="sec" id="work">
        <Reveal><span className="eyebrow">Selected Work</span></Reveal>

        <Reveal delay={70}>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={track === 'engineering'} data-h
              className={`tab ${track === 'engineering' ? 'tab--on' : ''}`}
              onClick={() => setTrack('engineering')}>Engineering</button>
            <button role="tab" aria-selected={track === 'lab'} data-h
              className={`tab ${track === 'lab' ? 'tab--on' : ''}`}
              onClick={() => setTrack('lab')}>Visual Lab</button>
          </div>
        </Reveal>

        {track === 'engineering' ? (
          <div className="roles">
            {ROLES.map((r, i) => (
              <Reveal key={`${r.company}-${r.year}`} delay={i * 55}>
                <article className="role">
                  <div>
                    <h3 className="role-co">{r.company}</h3>
                    <p className="role-desc">{r.desc}</p>
                    <div className="chips">
                      {r.stack.map((x) => <span className="chip" key={x}>{x}</span>)}
                    </div>
                  </div>
                  <span className="role-yr">{r.year}</span>
                </article>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <figure className="lab">
              <div className="lab-frame" style={{ backgroundImage: `url(${LQIP})` }}>
                {videoOk && (
                  <video autoPlay loop muted playsInline preload="metadata"
                    poster="/between-the-trees-poster.jpg"
                    onError={() => setVideoOk(false)}>
                    <source src="/between-the-trees.webm" type="video/webm" />
                    <source src="/between-the-trees.mp4" type="video/mp4" />
                  </video>
                )}
                {!videoOk && (
                  <div className="lab-miss">
                    between-the-trees.mp4<br />
                    <span style={{ opacity: .6 }}>drop the file into /public to play</span>
                  </div>
                )}
              </div>
              <figcaption>
                <div className="lab-meta">
                  <h3>Between the Trees</h3>
                  <span>Self-initiated · 2026</span>
                </div>
                <p className="lab-cap">
                  A study in scale: ancient growth with something engineered buried
                  inside it, held in a single slow tracking shot.
                </p>
              </figcaption>
            </figure>
          </Reveal>
        )}
      </section>

      {/* ── SKILLS ───────────────────────────────────────────── */}
      <section className="sec sec--tight">
        <Reveal><span className="eyebrow">Capabilities</span></Reveal>
        <div className="skills">
          {Object.entries(SKILLS).map(([group, items], i) => (
            <Reveal key={group} delay={i * 90}>
              <div>
                <h3>{group}</h3>
                <div className="chips">
                  {items.map((x) => <span className="chip" key={x}>{x}</span>)}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────── */}
      <section className="sec" id="contact">
        <Reveal><h2 className="disp ctitle">Two doors, one practice.</h2></Reveal>
        <br/>
        <div className="doors">
          <Reveal>
            <a href="mailto:contact@devlques.com" className="door" data-h>
              <p>Looking for a fullstack developer?</p>
              <span>Let's talk <ArrowUpRight size={17} /></span>
            </a>
          </Reveal>
          <Reveal delay={70}>
            <a href="mailto:contact@devlques.com" className="door" data-h>
              <p>Looking for a creative build?</p>
              <span>Let's make it <ArrowUpRight size={17} /></span>
            </a>
          </Reveal>
        </div>
        <div className="social">
          <a href="https://github.com/devlques" target="_blank" rel="noreferrer" data-h aria-label="GitHub"><Github size={18} /></a>
          <a href="https://www.linkedin.com/in/luis-carlos-quesada-sequeira-167520101/" target="_blank" rel="noreferrer" data-h aria-label="LinkedIn"><Linkedin size={18} /></a>
          <a href="mailto:contact@devlques.com" data-h aria-label="Email"><Mail size={18} /></a>
        </div>
      </section>

      <footer className="foot">
        <span>© {new Date().getFullYear()} Luis Quesada, Costa Rica</span>
        <span>Built with React, Three.js</span>
      </footer>
    </div>
  );
}
