"use client";

import Planet from "../3d/Planet";
import { useScroll } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/*──────────────────────────────────────────────────────────────
  Planet definitions — sizes use a compressed relative scale
  based on actual planetary radii.
──────────────────────────────────────────────────────────────*/
const planets = [
  { texture: "/textures/2k_mercury.jpg",         size: 0.7,  speed: 0.55 },
  { texture: "/textures/2k_venus_surface.jpg",   size: 1.2,  speed: 0.45 },
  { texture: "/textures/2k_earth_daymap.jpg",    size: 4.0,  speed: 0.35 },
  { texture: "/textures/2k_mars.jpg",            size: 1.8,  speed: 0.40 },
  { texture: "/textures/2k_jupiter.jpg",         size: 2.8,  speed: 0.20 },
  { texture: "/textures/2k_saturn.jpg",          size: 2.8,  speed: 0.25 },
  { texture: "/textures/2k_uranus.jpg",          size: 1.8,  speed: 0.30 },
  { texture: "/textures/2k_neptune.jpg",         size: 1.7,  speed: 0.30 },
  { texture: "/textures/2k_pluto.jpg",           size: 0.5,  speed: 0.60 }, 
];

/*──────────────────────────────────────────────────────────────
  Scroll-Based Progressive Reveal Configuration
  - Earth, Mars, Saturn are stable hero elements (start=end=0).
  - Other planets start far off-screen and glide in.
  - Staggered entry based on distance/size (Jupiter/Venus first, Pluto last).
──────────────────────────────────────────────────────────────*/
const LAYOUT_CONFIG = [
  // 0: Mercury — Enters late from top
  { init: { x: -35.0, y:  25.0, z: -13 }, target: { x: -5.0,  y:  6.5,  z: -13 }, start: 0.60, end: 0.90 },
  // 1: Venus — Enters early-mid from bottom-left
  { init: { x: -35.0, y: -25.0, z: -11 }, target: { x: -8.5,  y: -4.0,  z: -11 }, start: 0.20, end: 0.45 },
  // 2: Earth — hero center lower. MASSIVE anchor. Drifts down/back on scroll.
  { init: { x:  0.0,  y: -4.5,  z: -8  }, target: { x:  0.0,  y: -25.0, z: -12 }, start: 0.00, end: 0.50 },
  // 3: Mars — hero left, pushed very far out. Drifts further left on scroll.
  { init: { x: -12.5, y:  0.0,  z: -9  }, target: { x: -16.0, y: -2.0,  z: -10 }, start: 0.00, end: 0.40 },
  // 4: Jupiter — Enters first from far left.
  { init: { x: -30.0, y: -5.0,  z: -16 }, target: { x: -15.0, y: -4.0,  z: -16 }, start: 0.05, end: 0.35 },
  // 5: Saturn — hero right, pushed very far out. Drifts further right on scroll.
  { init: { x:  12.5, y:  3.5,  z: -11 }, target: { x:  16.0, y:  5.0,  z: -12 }, start: 0.00, end: 0.40 },
  // 6: Uranus — far, deep. Enters mid from bottom left.
  { init: { x: -10.0, y: -30.0, z: -16 }, target: { x: -6.5,  y: -7.0,  z: -16 }, start: 0.35, end: 0.60 },
  // 7: Neptune — very far. Enters late from top-left.
  { init: { x: -35.0, y:  25.0, z: -18 }, target: { x: -10.5, y:  5.0,  z: -18 }, start: 0.50, end: 0.75 },
  // 8: Pluto — farthest. Enters very late from top right.
  { init: { x:  20.0, y:  30.0, z: -20 }, target: { x:  6.0,  y:  7.5,  z: -20 }, start: 0.75, end: 0.95 },
];

/*──────────────────────────────────────────────────────────────
  SceneMotion — Drives the antigravity curved paths AND the
  scroll-based progressive reveal logic.
──────────────────────────────────────────────────────────────*/
type MotionLayout = {
  init: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  scrollStart: number;
  scrollEnd: number;
  speed: number;
  driftX: number; driftY: number; driftZ: number;
  orbitRadius: number; orbitSpeed: number;
  curvePhase: number;
  parallaxFactor: number;
};

type SceneMotionProps = {
  refs: { current: Array<THREE.Group | null> };
  scroll: { offset: number };
  layout: MotionLayout[];
};

// Custom smoothstep easing for the reveal movement
function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function SceneMotion({ refs, scroll, layout }: SceneMotionProps) {
  const { pointer } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const scrollOffset = scroll.offset;

    refs.current.forEach((group, index) => {
      if (!group) return;

      const l = layout[index];
      
      // 1. Calculate Reveal Progress
      let progress = 0;
      if (l.scrollStart === l.scrollEnd) {
        progress = 1; // Always visible hero planets
      } else if (scrollOffset <= l.scrollStart) {
        progress = 0;
      } else if (scrollOffset >= l.scrollEnd) {
        progress = 1;
      } else {
        // Map current offset into the [0, 1] range of this planet's active window
        const normalized = (scrollOffset - l.scrollStart) / (l.scrollEnd - l.scrollStart);
        progress = easeInOutCubic(normalized);
      }

      // Interpolate base position from init to target
      const baseX = THREE.MathUtils.lerp(l.init.x, l.target.x, progress);
      const baseY = THREE.MathUtils.lerp(l.init.y, l.target.y, progress);
      const baseZ = THREE.MathUtils.lerp(l.init.z, l.target.z, progress);

      // 2. Add Antigravity Motion
      const phase = l.curvePhase;

      const curveX = Math.sin(t * l.speed * 0.6 + phase) * l.driftX
                   + Math.sin(t * l.speed * 0.3 + phase * 2.1) * l.driftX * 0.4;
      const curveY = Math.cos(t * l.speed * 0.5 + phase * 1.4) * l.driftY
                   + Math.cos(t * l.speed * 0.25 + phase * 0.7) * l.driftY * 0.5;
      const curveZ = Math.sin(t * l.speed * 0.4 + phase * 1.8) * l.driftZ;

      const orbitX = Math.sin(t * l.orbitSpeed + phase) * l.orbitRadius;
      const orbitY = Math.cos(t * l.orbitSpeed * 0.7 + phase * 1.5) * l.orbitRadius * 0.6;

      // 3. Add Scroll Parallax (only vertical shift, applied universally for depth)
      const scrollY = scrollOffset * l.parallaxFactor;

      // 4. Add Mouse Parallax (farther planets move less)
      const depthFactor = THREE.MathUtils.mapLinear(Math.abs(baseZ), 8, 20, 0.25, 0.05);
      const mouseX = pointer.x * depthFactor;
      const mouseY = pointer.y * depthFactor * 0.5;

      // Apply final composite position
      group.position.x = baseX + curveX + orbitX + mouseX;
      group.position.y = baseY + curveY + orbitY - scrollY + mouseY;
      group.position.z = baseZ + curveZ;
    });
  });

  return null;
}

/*──────────────────────────────────────────────────────────────
  CloudContainer — builds the scene
──────────────────────────────────────────────────────────────*/
const CloudContainer = () => {
  const scroll = useScroll();
  const refs = useRef<Array<THREE.Group | null>>([]);

  const layout = useMemo<MotionLayout[]>(() => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    return planets.map((planet, index) => {
      const config = LAYOUT_CONFIG[index];
      
      // Natural depth-based vertical parallax for ALL planets
      const parallaxFactor = THREE.MathUtils.mapLinear(Math.abs(config.target.z), 8, 20, 1.2, 3.5);

      return {
        init: config.init,
        target: config.target,
        scrollStart: config.start,
        scrollEnd: config.end,
        speed: planet.speed,
        
        // Drift amplitudes — gentle, never huge
        driftX: 0.15 + random() * 0.25,
        driftY: 0.12 + random() * 0.2,
        driftZ: 0.04 + random() * 0.08,
        
        // Anti-orbital sweep
        orbitRadius: 0.12 + random() * 0.18,
        orbitSpeed: 0.08 + random() * 0.12,
        
        // Phase offsets for variety
        curvePhase: random() * Math.PI * 2,
        
        parallaxFactor,
      };
    });
  }, []);

  return (
    <group>
      {layout.map((planet, index) => (
        <Planet
          key={planets[index].texture}
          ref={(node) => {
            refs.current[index] = node;
          }}
          texture={planets[index].texture}
          position={[planet.init.x, planet.init.y, planet.init.z]}
          size={planets[index].size}
          rotationSpeed={0.08 + index * 0.02}
        />
      ))}

      <SceneMotion refs={refs} scroll={scroll} layout={layout} />
    </group>
  );
};

export default CloudContainer;