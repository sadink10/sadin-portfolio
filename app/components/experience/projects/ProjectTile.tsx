import { ThreeEvent, useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";

import { usePortalStore } from "@stores";
import { Project } from "@types";

// ─── CONTROLLED PALETTE ────────────────────────────────────────────────
// Cyan → Blue → Purple with minimal accents. Intentional, not random.
const ARTIFACT_CONFIGS = [
  { color: "#00e5ff", emissive: "#004455" },   // cyan
  { color: "#2979ff", emissive: "#0d2255" },   // blue
  { color: "#7c4dff", emissive: "#221155" },   // purple
  { color: "#00bcd4", emissive: "#003844" },   // teal
  { color: "#536dfe", emissive: "#1a2244" },   // indigo
  { color: "#448aff", emissive: "#112244" },   // sky blue
  { color: "#6200ea", emissive: "#150033" },   // deep purple
  { color: "#00b8d4", emissive: "#003340" },   // dark cyan
  { color: "#b388ff", emissive: "#2a1d44" },   // lavender
];

// ─── GEOMETRY COMPONENT ────────────────────────────────────────────────
// Each project gets a unique shape.
function ArtifactShape({ index }: { index: number }) {
  const shapes = [
    <boxGeometry key={0} args={[0.7, 0.7, 0.7]} />,
    <octahedronGeometry key={1} args={[0.55, 0]} />,
    <icosahedronGeometry key={2} args={[0.55, 0]} />,
    <torusGeometry key={3} args={[0.4, 0.18, 16, 24]} />,
    <torusKnotGeometry key={4} args={[0.35, 0.1, 48, 8]} />,
    <dodecahedronGeometry key={5} args={[0.5, 0]} />,
    <cylinderGeometry key={6} args={[0.35, 0.35, 0.7, 6]} />,
    <coneGeometry key={7} args={[0.45, 0.9, 5]} />,
    <tetrahedronGeometry key={8} args={[0.6, 0]} />,
  ];
  return shapes[index % shapes.length];
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────

interface ProjectTileProps {
  project: Project;
  index: number;
  position: [number, number, number];
  rotation: [number, number, number];
  activeId: number | null;
  onClick: () => void;
  onHover: (project: Project | null) => void;
}

const ProjectTile = ({
  project,
  index,
  position,
  rotation,
  activeId,
  onClick,
  onHover,
}: ProjectTileProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const artifactRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const hoveredRef = useRef(false);
  const isProjectSectionActive = usePortalStore(
    (state) => state.activePortalId === "projects"
  );

  const config = ARTIFACT_CONFIGS[index % ARTIFACT_CONFIGS.length];

  // Unique per-instance seeds for layered animation
  const seeds = useMemo(
    () => ({
      bobSpeed: 0.3 + (index * 0.07) % 0.3,
      bobAmp: 0.08 + (index * 0.02) % 0.06,
      rotSpeed: 0.15 + (index * 0.04) % 0.2,
      driftRadius: 0.04 + (index * 0.01) % 0.04,
      driftSpeed: 0.1 + (index * 0.03) % 0.15,
      phase: (index * 1.7) % (Math.PI * 2),
    }),
    [index]
  );

  // ── Layered animation: rotation + bobbing + orbital drift ──
  useFrame((state) => {
    if (!artifactRef.current) return;
    const t = state.clock.elapsedTime;
    const s = seeds;

    // Self rotation
    artifactRef.current.rotation.x = t * s.rotSpeed;
    artifactRef.current.rotation.y = t * s.rotSpeed * 1.3;

    // Bob up/down
    artifactRef.current.position.y = Math.sin(t * s.bobSpeed + s.phase) * s.bobAmp;

    // Slight orbital drift
    artifactRef.current.position.x =
      Math.cos(t * s.driftSpeed + s.phase) * s.driftRadius;
    artifactRef.current.position.z =
      Math.sin(t * s.driftSpeed * 0.7 + s.phase) * s.driftRadius;
  });

  // ── Hover animation ──
  const setHovered = (hovered: boolean) => {
    hoveredRef.current = hovered;

    if (artifactRef.current) {
      gsap.to(artifactRef.current.scale, {
        x: hovered ? 1.4 : 1.15,
        y: hovered ? 1.4 : 1.15,
        z: hovered ? 1.4 : 1.15,
        duration: 0.3,
      });
      const mat = artifactRef.current.material as THREE.MeshStandardMaterial;
      gsap.to(mat, {
        emissiveIntensity: hovered ? 2.5 : 1.2,
        duration: 0.3,
      });
    }

    if (glowRef.current) {
      const gMat = glowRef.current.material as THREE.MeshBasicMaterial;
      gsap.to(gMat, {
        opacity: hovered ? 0.25 : 0.12,
        duration: 0.3,
      });
    }

    onHover(hovered ? project : null);
  };

  // ── Mobile: use activeId for hover state ──
  useEffect(() => {
    if (isMobile) {
      setHovered(activeId === index);
    }
  }, [isMobile, activeId]);

  // ── Animate in when portal becomes active ──
  useEffect(() => {
    if (groupRef.current) {
      gsap.to(groupRef.current.position, {
        y: isProjectSectionActive ? 0 : -10,
        duration: 1,
        delay: isProjectSectionActive ? index * 0.08 : 0,
      });
    }
  }, [isProjectSectionActive]);

  // ── Click handler ──
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isMobile) {
      onClick();
    }
  };

  return (
    <group position={position} rotation={rotation}>
      <group
        ref={groupRef}
        onClick={handleClick}
        onPointerOver={() =>
          !isMobile && isProjectSectionActive && setHovered(true)
        }
        onPointerOut={() =>
          !isMobile && isProjectSectionActive && setHovered(false)
        }
      >
        {/* Main artifact mesh */}
        <mesh ref={artifactRef} scale={[1.15, 1.15, 1.15]}>
          <ArtifactShape index={index} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.color}
            emissiveIntensity={1.2}
            metalness={0.7}
            roughness={0.1}
            transparent={false}
          />
        </mesh>

        {/* Glow sphere — stronger, additive */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Stronger point light per artifact */}
        <pointLight
          color={config.color}
          intensity={0.8}
          distance={6}
        />
      </group>
    </group>
  );
};

export default ProjectTile;