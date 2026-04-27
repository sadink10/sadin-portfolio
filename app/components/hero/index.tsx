'use client';

import { Text } from "@react-three/drei";
import { useProgress } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import StarsContainer from "../models/Stars";
import CloudContainer from "../models/Cloud";
import WindowModel from "../models/WindowModel";
import TextWindow from "./TextWindow";

const Hero = () => {
  const titleRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { progress } = useProgress();

  useEffect(() => {
    if (progress === 100 && titleRef.current) {
      // Cinematic entrance: slow scale up and drift up
      titleRef.current.position.y = -1.0;
      titleRef.current.scale.set(0.8, 0.8, 0.8);
      
      gsap.to(titleRef.current.position, {
        y: 1.5,
        duration: 1.3,
        ease: "power3.out"
      });
      gsap.to(titleRef.current.scale, {
        x: 1, y: 1, z: 1,
        duration: 1.3,
        ease: "power2.out"
      });
    }
  }, [progress]);

  useFrame((state) => {
    if (glowRef.current) {
      // Dynamic holographic parallax based on mouse
      const targetX = state.pointer.x * 0.3;
      const targetY = state.pointer.y * 0.3;
      glowRef.current.position.x = THREE.MathUtils.lerp(glowRef.current.position.x, targetX, 0.1);
      glowRef.current.position.y = THREE.MathUtils.lerp(glowRef.current.position.y, targetY, 0.1);
      
      // Pulse the glow opacity if hovered
      const targetOpacity = hovered ? 0.9 + Math.sin(state.clock.elapsedTime * 8) * 0.3 : 0.6;
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
    }

    // Scale interaction on hover
    if (titleRef.current) {
      const targetScale = hovered ? 1.05 : 1.0;
      titleRef.current.scale.x = THREE.MathUtils.lerp(titleRef.current.scale.x, targetScale, 0.1);
      titleRef.current.scale.y = THREE.MathUtils.lerp(titleRef.current.scale.y, targetScale, 0.1);
      titleRef.current.scale.z = THREE.MathUtils.lerp(titleRef.current.scale.z, targetScale, 0.1);
    }
  });

  const soriaFont = "./soria-font.ttf";
  const sansFont = "./Vercetti-Regular.woff";

  return (
    <>
      <group 
        ref={titleRef} 
        position={[0, 1.5, -9]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Subtitle / Intro */}
        <Text
          position={[0, 2.0, 0]}
          font={sansFont}
          fontSize={0.45}
          letterSpacing={0.4}
          color="#a0b0c0"
          depthTest={false}
          renderOrder={1000}
        >
          HI, I AM
        </Text>

        {/* Main Name - Solid Layer */}
        <Text
          position={[0, 0, 0]}
          font={soriaFont}
          fontSize={2.5}
          letterSpacing={0.02}
          color="#ffffff"
          depthTest={false}
          renderOrder={1001}
        >
          SADIN K
        </Text>

        {/* Main Name - Glowing Ethereal Stroke Layer behind it */}
        <Text
          ref={glowRef}
          position={[0, 0, -0.1]}
          font={soriaFont}
          fontSize={2.5}
          letterSpacing={0.02}
          fillOpacity={0}
          strokeWidth={0.04}
          strokeColor={hovered ? "#66aaff" : "#4488cc"}
          strokeOpacity={0.6}
          depthTest={false}
          renderOrder={999}
        >
          SADIN K
        </Text>
      </group>

      {/* Layered deep-space star field */}
      <StarsContainer />

      {/* ── Cinematic Lighting ─────────────────────────────── */}

      {/* Subtle fill — just enough to see silhouettes */}
      <ambientLight intensity={0.15} color="#1a1a3a" />

      {/* Main directional key light — warm sun from upper-right */}
      <directionalLight
        position={[12, 8, 6]}
        intensity={2.5}
        color="#fff4e0"
        castShadow
      />

      {/* Cool blue rim from behind-left for depth separation */}
      <directionalLight
        position={[-8, 4, -10]}
        intensity={0.8}
        color="#4488cc"
      />

      {/* Warm accent from below for cinematic drama */}
      <pointLight
        position={[0, -8, -5]}
        intensity={1.2}
        color="#cc6644"
        distance={30}
        decay={2}
      />

      {/* Far back fill to illuminate distant planets */}
      <pointLight
        position={[0, 0, -25]}
        intensity={0.6}
        color="#6666aa"
        distance={40}
        decay={2}
      />

      {/* ── Depth Fog ──────────────────────────────────────── */}
      <fog attach="fog" args={["#030308", 12, 35]} />

      <CloudContainer />

      <group position={[0, -25, 5.69]}>
        <pointLight castShadow position={[1, 1, -2.5]} intensity={60} distance={10}/>
        <WindowModel receiveShadow/>
        <TextWindow/>
      </group>
    </>
  );
};

export default Hero;
