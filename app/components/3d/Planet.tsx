"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";

// Shared geometry segment counts — lower on mobile for perf
const SEG_HI = isMobile ? 24 : 32;
const SEG_LO = isMobile ? 16 : 24;

type PlanetProps = {
  texture: string;
  position: [number, number, number];
  size?: number;
  rotationSpeed?: number;
};

// ─── UTILS ─────────────────────────────────────────────────────────────
function getPlanetName(texture: string): string {
  const lower = texture.toLowerCase();
  if (lower.includes("mercury")) return "mercury";
  if (lower.includes("venus")) return "venus";
  if (lower.includes("earth")) return "earth";
  if (lower.includes("mars")) return "mars";
  if (lower.includes("jupiter")) return "jupiter";
  if (lower.includes("saturn")) return "saturn";
  if (lower.includes("uranus")) return "uranus";
  if (lower.includes("neptune")) return "neptune";
  if (lower.includes("pluto")) return "pluto";
  return "generic";
}

// ─── PLANET RENDERERS ────────────────────────────────────────────────

const Earth = ({ size }: { size: number }) => {
  const [map, cloudsMap] = useTexture([
    "/textures/2k_earth_daymap.jpg",
    "/textures/2k_earth_clouds.jpg",
  ]);
  
  const cloudsRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02; // Clouds rotate slightly faster
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[size, SEG_HI, SEG_HI]} />
        <meshStandardMaterial
          map={map}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[size * 1.015, SEG_HI, SEG_HI]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Subtle atmospheric glow */}
      <mesh>
        <sphereGeometry args={[size * 1.15, SEG_LO, SEG_LO]} />
        <meshBasicMaterial
          color="#4ab4ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

const Venus = ({ size }: { size: number }) => {
  const [surfaceMap, atmosMap] = useTexture([
    "/textures/2k_venus_surface.jpg",
    "/textures/2k_venus_atmosphere.jpg",
  ]);

  const atmosRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (atmosRef.current) {
      atmosRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[size, SEG_HI, SEG_HI]} />
        <meshStandardMaterial
          map={surfaceMap}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      <mesh ref={atmosRef}>
        <sphereGeometry args={[size * 1.01, SEG_HI, SEG_HI]} />
        <meshStandardMaterial
          map={atmosMap}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 1.1, SEG_LO, SEG_LO]} />
        <meshBasicMaterial
          color="#d4a050"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

const Saturn = ({ size }: { size: number }) => {
  const map = useTexture("/textures/2k_saturn.jpg");

  return (
    <group>
      <mesh>
        <sphereGeometry args={[size, SEG_HI, SEG_HI]} />
        <meshStandardMaterial
          map={map}
          roughness={0.6}
          metalness={0.0}
        />
      </mesh>
      {/* Procedural Disk System */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Inner faint ring */}
        <mesh receiveShadow castShadow>
          <ringGeometry args={[size * 1.15, size * 1.45, 64]} />
          <meshStandardMaterial color="#c0b080" transparent opacity={0.4} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
        {/* Main bright disk */}
        <mesh receiveShadow castShadow>
          <ringGeometry args={[size * 1.5, size * 2.0, 64]} />
          <meshStandardMaterial color="#d8c898" transparent opacity={0.8} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
        {/* Outer thin ring */}
        <mesh receiveShadow castShadow>
          <ringGeometry args={[size * 2.05, size * 2.3, 64]} />
          <meshStandardMaterial color="#b0a070" transparent opacity={0.5} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[size * 1.12, SEG_LO, SEG_LO]} />
        <meshBasicMaterial
          color="#e0c88b"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

const GenericPlanet = ({ name, size, texture }: { name: string; size: number; texture: string }) => {
  const map = useTexture(texture);

  const glowColor = useMemo(() => {
    switch (name) {
      case "mercury": return "#c8bfb5";
      case "mars": return "#ff8866";
      case "jupiter": return "#e8c4a0";
      case "uranus": return "#90e0f0";
      case "neptune": return "#6688ff";
      case "pluto": return "#d8c8ff";
      default: return "#ffffff";
    }
  }, [name]);

  const roughness = name === "jupiter" || name === "neptune" || name === "uranus" ? 0.3 : 0.8;
  const metalness = name === "mercury" || name === "pluto" ? 0.2 : 0.05;

  return (
    <group>
      <mesh>
        <sphereGeometry args={[size, SEG_HI, SEG_HI]} />
        <meshStandardMaterial
          map={map}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>
      {(name === "uranus" || name === "neptune" || name === "jupiter") && (
        <mesh>
          <sphereGeometry args={[size * 1.1, SEG_LO, SEG_LO]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.06}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────

const Planet = forwardRef<THREE.Group, PlanetProps>(
  ({ texture, position, size = 1, rotationSpeed = 0.15 }, forwardedRef) => {
    const groupRef = useRef<THREE.Group>(null);
    const rotationGroupRef = useRef<THREE.Group>(null);
    const name = getPlanetName(texture);

    // Unique phase offset per planet instance
    const phase = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame((state, delta) => {
      // Gentle floating bob
      const t = state.clock.elapsedTime;
      const floatY = Math.sin(t * 0.4 + phase) * 0.06;
      const floatX = Math.cos(t * 0.3 + phase * 1.3) * 0.03;

      if (groupRef.current) {
        groupRef.current.position.y = position[1] + floatY;
        groupRef.current.position.x = position[0] + floatX;
      }

      // Self rotation
      if (rotationGroupRef.current) {
        // Tilt axis slightly based on planet name (very basic)
        const tilt = name === "uranus" ? Math.PI / 2 : name === "saturn" ? 0.8 : 0.1;
        rotationGroupRef.current.rotation.x = tilt;
        rotationGroupRef.current.rotation.y += delta * rotationSpeed;
      }
    });

    return (
      <group
        ref={(node) => {
          groupRef.current = node;
          if (typeof forwardedRef === "function") {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        position={position}
      >
        <group ref={rotationGroupRef}>
          {name === "earth" ? (
            <Earth size={size} />
          ) : name === "venus" ? (
            <Venus size={size} />
          ) : name === "saturn" ? (
            <Saturn size={size} />
          ) : (
            <GenericPlanet name={name} size={size} texture={texture} />
          )}
        </group>
      </group>
    );
  }
);

Planet.displayName = "Planet";

export default Planet;
