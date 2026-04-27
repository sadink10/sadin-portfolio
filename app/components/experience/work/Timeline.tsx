import { Box, Edges, Line, Text, TextProps } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { usePortalStore } from "@stores";
import gsap from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";

import { WORK_TIMELINE } from "@constants";
import { WorkTimelinePoint } from "@types";

const reusableLeft = new THREE.Vector3(-0.3, 0, -0.1);
const reusableRight = new THREE.Vector3(0.3, 0, -0.1);

const TimelinePoint = ({ point, diff }: { point: WorkTimelinePoint, diff: number }) => {
  const reticleRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (reticleRef.current) {
      reticleRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  const isLeft = point.position === 'left';
  const getPoint = useMemo(() => {
    // Increased offset to make room for text and leader line
    return isLeft ? new THREE.Vector3(-0.6, 0.2, 0) : new THREE.Vector3(0.6, 0.2, 0);
  }, [isLeft]);

  const textAlign = isLeft ? 'right' : 'left';
  const sign = isLeft ? -1 : 1;

  // Opacity fading based on scroll diff
  const opacity = Math.max(0, 1 - diff * 1.5);
  
  // Base text props
  const baseTextProps: Partial<TextProps> = useMemo(() => ({
    font: "./Vercetti-Regular.woff",
    anchorX: textAlign,
    anchorY: "middle",
    fillOpacity: opacity,
    depthTest: false, // Ensure text draws over the background
  }), [textAlign, opacity]);

  return (
    <group position={point.point} scale={isMobile ? 0.35 : 0.6}>
      {/* Sci-Fi Reticle */}
      <group ref={reticleRef} scale={[1 - diff * 0.5, 1 - diff * 0.5, 1 - diff * 0.5]}>
        <mesh>
          <torusGeometry args={[0.2, 0.015, 8, 32]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={opacity * 0.8} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.01, 8, 32]} />
          <meshBasicMaterial color="#7c4dff" transparent opacity={opacity * 0.6} />
        </mesh>
        {/* Center dot */}
        <mesh>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={opacity} />
        </mesh>
      </group>

      <group>
        {/* Leader Line */}
        <Line 
          points={[[0, 0, 0], [getPoint.x * 0.5, getPoint.y, 0], [getPoint.x, getPoint.y, 0]]} 
          color="#00e5ff" 
          lineWidth={1.5}
          transparent
          opacity={opacity * 0.5} 
        />

        {/* Text and HUD Panel */}
        <group position={getPoint}>
          {/* Text Elements */}
          <Text 
            {...baseTextProps} 
            color="#00e5ff" 
            fontSize={0.2} 
            position={[0, 0.15, 0]}
            letterSpacing={0.1}
          >
            {point.year}
          </Text>
          
          <Text 
            {...baseTextProps} 
            font="./soria-font.ttf"
            color="#ffffff" 
            fontSize={0.4} 
            position={[0, -0.2, 0]}
            maxWidth={3}
          >
            {point.title}
          </Text>

          <Text 
            {...baseTextProps} 
            color="#aabbee" 
            fontSize={0.15} 
            position={[0, -0.55, 0]}
            maxWidth={2.8}
            lineHeight={1.4}
          >
            {point.subtitle}
          </Text>
        </group>
      </group>
    </group>
  );
};

const Timeline = ({ progress }: { progress: number }) => {
  const { camera } = useThree();
  const isActive = usePortalStore((state) => state.activePortalId === 'work');
  const timeline = useMemo(() => WORK_TIMELINE, []);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(timeline.map(p => p.point), false), [timeline]);
  const curvePoints = useMemo(() => curve.getPoints(500), [curve]);
  const visibleCurvePoints = useMemo(() => curvePoints.slice(0, Math.max(1, Math.ceil(progress * curvePoints.length))), [curvePoints, progress]);
  const visibleTimelinePoints = useMemo(() => timeline.slice(0, Math.max(1, Math.round(progress * (timeline.length - 1) + 1))), [timeline, progress]);

  const [visibleDashedCurvePoints, setVisibleDashedCurvePoints] = useState<THREE.Vector3[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useFrame((_, delta) => {
    if (isActive) {
      const t = Math.min(progress, 0.99);
      const position = curve.getPoint(t);

      // Look slightly ahead on the curve for anticipation
      const lookAhead = curve.getPoint(Math.min(t + 0.04, 1));

      // The Experience group is rotated: local Y → world -Z, local Z → world Y
      // Original working mapping preserved with smooth anticipation offset
      const anticipationX = (lookAhead.x - position.x) * 0.3;
      const anticipationY = (lookAhead.z - position.z) * 0.3;

      camera.position.x = THREE.MathUtils.damp(camera.position.x, (isMobile ? -1 : -2) + position.x + anticipationX, 4, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, -39 + position.z + anticipationY, 4, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 13 - position.y, 4, delta);
    }
  });

  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    if (groupRef.current) {
      tl.to(groupRef.current.scale, {
        x: isActive ? 1 : 0,
        y: isActive ? 1 : 0,
        z: isActive ? 1 : 0,
        duration: 1,
        delay: isActive ? 0.4 : 0,
      });
      tl.to(groupRef.current.position, {
        y: isActive ? 0 : -2,
        duration: 1,
        delay: isActive ? 0.4 : 0,
      }, 0);
    }

    if (isActive) {
      let i = 0;
      clearInterval(intervalRef.current!);
      setTimeout(() => {
        intervalRef.current = setInterval(() => {
          const p = i++ / 100;
          setVisibleDashedCurvePoints(curvePoints.slice(0, Math.max(1, Math.ceil(p * curvePoints.length))));
          if (i > 100 && intervalRef.current) clearInterval(intervalRef.current);
        }, 10);
      }, 1000);
    } else {
      setVisibleDashedCurvePoints([]);
      clearInterval(intervalRef.current!);
    }

    return () => clearInterval(intervalRef.current!);
  }, [isActive]);

  return (
    <group position={[0, -0.1, -0.1]}>
      <Line points={visibleCurvePoints} color="#00e5ff" lineWidth={2} transparent opacity={0.3} />
      {visibleDashedCurvePoints.length > 0 && (
        <Line
          points={visibleDashedCurvePoints}
          color="#ffffff"
          lineWidth={1.5}
          dashed
          dashSize={0.4}
          gapSize={0.2}
          transparent
          opacity={0.8}
        />
      )}
      <group ref={groupRef}>
        {visibleTimelinePoints.map((point, i) => {
          const diff = Math.min(2 * Math.max(i - (progress * (timeline.length - 1)), 0), 1);
          return <TimelinePoint point={point} key={i} diff={diff} />;
        })}
      </group>
    </group>
  );
};

export default Timeline;
