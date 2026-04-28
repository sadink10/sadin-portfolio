"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";

/*──────────────────────────────────────────────────────────────
  Multi-layered star field for deep-space depth.
  Three layers at different distances with varying densities
  and brightness levels to create a parallax sense.
──────────────────────────────────────────────────────────────*/

type StarLayerProps = {
  count: number;
  radius: number;
  depth: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
};

function StarLayer({ count, radius, depth, size, opacity, twinkleSpeed }: StarLayerProps) {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const phs = new Float32Array(count);

    let seed = count * 7 + Math.floor(radius);
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const r = radius + random() * depth;

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Subtle warm/cool color variation
      const warmth = random();
      if (warmth < 0.15) {
        // Warm yellowish
        col[i * 3]     = 1.0;
        col[i * 3 + 1] = 0.92;
        col[i * 3 + 2] = 0.8;
      } else if (warmth < 0.3) {
        // Cool blue
        col[i * 3]     = 0.8;
        col[i * 3 + 1] = 0.88;
        col[i * 3 + 2] = 1.0;
      } else {
        // White
        col[i * 3]     = 1.0;
        col[i * 3 + 1] = 1.0;
        col[i * 3 + 2] = 1.0;
      }

      phs[i] = random() * Math.PI * 2;
    }

    return [pos, col, phs];
  }, [count, radius, depth]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Gentle overall rotation
    ref.current.rotation.y = t * 0.003 * twinkleSpeed;
    ref.current.rotation.x = Math.sin(t * 0.001) * 0.02;

    // Twinkle by modulating opacity
    const material = ref.current.material as THREE.PointsMaterial;
    material.opacity = opacity + Math.sin(t * twinkleSpeed * 0.5) * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        transparent
        opacity={opacity}
        vertexColors
        sizeAttenuation
        depthWrite={false}
        blending={THREE.CustomBlending}
        blendEquation={THREE.AddEquation}
        blendSrc={THREE.SrcAlphaFactor}
        blendDst={THREE.OneFactor}
        blendEquationAlpha={THREE.AddEquation}
        blendSrcAlpha={THREE.OneFactor}
        blendDstAlpha={THREE.OneMinusSrcAlphaFactor}
      />
    </points>
  );
}

/*──────────────────────────────────────────────────────────────
  StarsContainer — layered star field
──────────────────────────────────────────────────────────────*/
const StarsContainer = () => {
  return (
    <group>
      {/* Near layer — large, bright, sparse */}
      <StarLayer
        count={isMobile ? 300 : 800}
        radius={60}
        depth={40}
        size={0.35}
        opacity={0.9}
        twinkleSpeed={0.8}
      />
      {/* Mid layer — medium stars */}
      <StarLayer
        count={isMobile ? 800 : 2500}
        radius={100}
        depth={80}
        size={0.2}
        opacity={0.7}
        twinkleSpeed={0.5}
      />
      {/* Far layer — faint dust */}
      <StarLayer
        count={isMobile ? 1500 : 3500}
        radius={180}
        depth={120}
        size={0.12}
        opacity={0.4}
        twinkleSpeed={0.3}
      />
    </group>
  );
};

export default StarsContainer;