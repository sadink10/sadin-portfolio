"use client";

import { Float, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";
import Planet from "../3d/Planet";
import StarsContainer from "./Stars";

import { WORK_TIMELINE } from "@constants";

// ─── SHARED CURVE ──────────────────────────────────────────────────────
const timelineCurve = new THREE.CatmullRomCurve3(
  WORK_TIMELINE.map((p) => p.point),
  false
);

// ─── SEEDED RNG ────────────────────────────────────────────────────────
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// ─── MILESTONE PLANETS ─────────────────────────────────────────────────
// Each WORK_TIMELINE entry maps to a specific planet placed near its point.
const MILESTONE_PLANETS = [
  // IIT Roorkee → 🌍 Earth (the beginning)
  { texture: "/textures/2k_earth_daymap.jpg",  offset: [1.8, 1.0, 0.3] as const, size: 1.4, speed: 0.04 },
  // XPrep → 🔴 Mars (first venture, new territory)
  { texture: "/textures/2k_mars.jpg",          offset: [-1.5, 0.8, 0.2] as const, size: 1.0, speed: 0.06 },
  // Headout → 🪐 Saturn (rings = travel) — pushed further right
  { texture: "/textures/2k_saturn.jpg",        offset: [4.5, -0.8, 0.0] as const, size: 1.8, speed: 0.02 },
  // Cohesity → Jupiter (massive, enterprise) — pushed further left
  { texture: "/textures/2k_jupiter.jpg",       offset: [-4.0, 2.0, 0.0] as const, size: 2.2, speed: 0.03 },
  // Future → 🔵 Neptune (the unknown) — pushed further back
  { texture: "/textures/2k_neptune.jpg",       offset: [1.5, 0.0, -3.0] as const, size: 1.5, speed: 0.05 },
];

// ─── ASTEROIDS ─────────────────────────────────────────────────────────
function Asteroids({ count = 100 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const rng = makeRng(42);
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = rng();
      const base = timelineCurve.getPoint(t);
      const isFlyBy = rng() > 0.82;

      const angle = rng() * Math.PI * 2;
      const dist = isFlyBy ? 1 + rng() * 2.5 : 4 + rng() * 16;

      const x = base.x + Math.cos(angle) * dist;
      const y = base.y + Math.sin(angle) * dist * 0.6;
      const z = base.z + (rng() - 0.5) * 6;

      const scale = isFlyBy ? 0.01 + rng() * 0.08 : 0.03 + rng() * 0.45;
      const speedX = (rng() - 0.5) * 0.15;
      const speedY = (rng() - 0.5) * 0.15;
      const speedZ = (rng() - 0.5) * 0.15;
      const driftDist = 15 + rng() * 20;
      const rotX = (rng() - 0.5) * 1.5;
      const rotY = (rng() - 0.5) * 1.5;
      const phase = rng() * Math.PI * 2;

      temp.push({ x, y, z, scale, speedX, speedY, speedZ, driftDist, rotX, rotY, phase });
    }
    return temp;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const elapsed = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(elapsed * p.speedX + p.phase) * p.driftDist,
        p.y + Math.cos(elapsed * p.speedY + p.phase) * p.driftDist,
        p.z + Math.sin(elapsed * p.speedZ + p.phase) * p.driftDist
      );
      dummy.rotation.x += p.rotX * delta;
      dummy.rotation.y += p.rotY * delta;
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#555566" roughness={0.85} metalness={0.15} />
    </instancedMesh>
  );
}

// ─── NEBULA ────────────────────────────────────────────────────────────
// Subtle, layered, additive-blended clouds — felt not seen.
function Nebula() {
  const ref = useRef<THREE.Group>(null);

  const clouds = useMemo(() => [
    { pos: [10,   5,  -3]  as [number, number, number], color: "#2200aa", s: 12 },
    { pos: [-12, -6,  -16] as [number, number, number], color: "#003388", s: 18 },
    { pos: [5,    10, -28] as [number, number, number], color: "#440044", s: 14 },
    { pos: [-8,  -3,  -38] as [number, number, number], color: "#110044", s: 22 },
    { pos: [0,    0,  -50] as [number, number, number], color: "#000833", s: 28 },
  ], []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const scale = clouds[i].s + Math.sin(t * 0.12 + i * 1.3) * 1.2;
      child.scale.setScalar(scale);
      child.rotation.y = t * 0.0015 * (i % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color={c.color}
            transparent
            opacity={0.03}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── GLOWING ORBS ──────────────────────────────────────────────────────
function GlowingOrbs() {
  const orbs = useMemo(() => [
    { pos: [6,   3,  -6]  as [number, number, number], color: "#00ffcc", intensity: 1.2 },
    { pos: [-5, -2,  -20] as [number, number, number], color: "#ff44aa", intensity: 0.8 },
    { pos: [3,   6,  -34] as [number, number, number], color: "#4488ff", intensity: 1.0 },
  ], []);

  return (
    <>
      {orbs.map((o, i) => (
        <Float key={i} speed={0.6 + i * 0.25} rotationIntensity={0.2} floatIntensity={1.2}>
          <mesh position={o.pos}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial color={o.color} transparent opacity={0.12} />
            <pointLight distance={20} intensity={o.intensity} color={o.color} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

// ─── GUIDE WISP ───────────────────────────────────────────────────
// A subtle, glowing energy wisp that follows the path ahead.
function GuideShip() {
  const ref = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame((state) => {
    if (!ref.current || !scroll) return;
    const t = state.clock.elapsedTime;
    const scrollT = Math.min(scroll.offset + 0.04, 0.98);

    const pos = timelineCurve.getPoint(scrollT);
    const lookAt = timelineCurve.getPoint(Math.min(scrollT + 0.06, 1));

    // Offset to the side + slight drift
    ref.current.position.set(
      pos.x + 0.8 + Math.cos(t * 0.25) * 0.06,
      pos.y - 0.3 + Math.sin(t * 0.4) * 0.08,
      pos.z + 0.3
    );
    ref.current.lookAt(lookAt);
  });

  return (
    <group ref={ref} scale={0.2}>
      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color="#7c4dff" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Trailing light */}
      <pointLight distance={5} intensity={1.5} color="#00e5ff" />
    </group>
  );
}

// ─── MAIN SCENE ────────────────────────────────────────────────────────
export function SpaceScene() {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    if (groupRef.current && scroll) {
      const t = scroll.offset;
      // Parallax: scroll the foreground group through z-space
      groupRef.current.position.z = t * 40;
      groupRef.current.rotation.y = Math.sin(t * Math.PI) * 0.15;
      groupRef.current.position.y = Math.sin(t * Math.PI * 2) * -1.5;
    }
  });

  return (
    <group>
      {/* ── LIGHTING ──────────────────────────────────────────── */}
      <ambientLight intensity={0.12} />
      <directionalLight position={[15, 25, 15]} intensity={1.6} color="#fffcf0" castShadow />
      <pointLight position={[-15, -10, -20]} intensity={0.35} color="#4488ff" />
      <pointLight position={[10, 5, -40]} intensity={0.25} color="#ff6644" />

      {/* ── BACKGROUND (furthest – slow parallax) ────────────── */}
      <StarsContainer />
      <Nebula />

      {/* ── MID-DEPTH (glowing orbs) ─────────────────────────── */}
      <GlowingOrbs />

      {/* ── FOREGROUND (scrolls with camera) ─────────────────── */}
      <group ref={groupRef}>
        <Asteroids count={isMobile ? 100 : 200} />

        {/* Milestone planets at timeline positions */}
        {WORK_TIMELINE.map((milestone, i) => {
          const cfg = MILESTONE_PLANETS[i % MILESTONE_PLANETS.length];
          return (
            <Planet
              key={i}
              texture={cfg.texture}
              position={[
                milestone.point.x + cfg.offset[0],
                milestone.point.y + cfg.offset[1],
                milestone.point.z + cfg.offset[2],
              ]}
              size={cfg.size}
              rotationSpeed={cfg.speed}
            />
          );
        })}

        {/* Guide spaceship */}
        <GuideShip />
      </group>
    </group>
  );
}