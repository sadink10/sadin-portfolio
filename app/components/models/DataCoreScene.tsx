"use client";

import { Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import StarsContainer from "./Stars";

// ─── FLOATING DATA PARTICLES ──────────────────────────────────────────
// Subtle light motes drifting through the environment.
function DataParticles({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    // Seed for deterministic layout
    let seed = 77;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const r = 4 + rng() * 22;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.008;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.004) * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#00e5ff"
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── CENTRAL CORE ─────────────────────────────────────────────────────
// A glowing wireframe icosahedron with orbiting rings — the focal point.
function CoreObject() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (coreRef.current) {
      coreRef.current.rotation.x = t * 0.12;
      coreRef.current.rotation.y = t * 0.18;
      // Stronger pulsing animation
      const pulse = 1 + Math.sin(t * 1.5) * 0.08;
      coreRef.current.scale.setScalar(pulse);
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.35;
      ring1Ref.current.rotation.z = t * 0.15;
    }

    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.3;
      ring2Ref.current.rotation.x = Math.PI / 3 + t * 0.08;
    }

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + Math.sin(t * 1.5) * 0.05;
    }
  });

  return (
    <group position={[0, 1, -2]}>
      {/* Core wireframe */}
      <mesh ref={coreRef} scale={[1.4, 1.4, 1.4]}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00bfff"
          emissiveIntensity={2.5}
          metalness={0.9}
          roughness={0.1}
          wireframe
        />
      </mesh>

      {/* Inner soft glow */}
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial
          color="#0055ff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer ambient glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial
          color="#1133aa"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbit ring 1 */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.015, 8, 64]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.6} />
      </mesh>

      {/* Orbit ring 2 */}
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.2, 0.01, 8, 64]} />
        <meshBasicMaterial color="#b388ff" transparent opacity={0.5} />
      </mesh>

      {/* Core light — very bright */}
      <pointLight color="#00e5ff" intensity={3} distance={15} />
    </group>
  );
}

// ─── EXPORTED SCENE ───────────────────────────────────────────────────
export function DataCoreScene() {
  return (
    <group>
      {/* Background depth using Stars */}
      <StarsContainer />
      
      {/* Stronger ambient lighting */}
      <ambientLight intensity={0.25} color="#1a1a3a" />
      
      {/* Key light for primary illumination */}
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
      
      {/* Rim light to highlight edges and separate from background */}
      <directionalLight position={[-10, 5, -15]} intensity={2.0} color="#7c4dff" />
      
      {/* Fill lights for colored accents */}
      <pointLight position={[10, 8, 8]} intensity={1.0} color="#00e5ff" />
      <pointLight position={[-10, -5, -8]} intensity={0.8} color="#b388ff" />

      <DataParticles count={150} />
      
      {/* Float to make the core gently bob independently */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <CoreObject />
      </Float>
    </group>
  );
}
