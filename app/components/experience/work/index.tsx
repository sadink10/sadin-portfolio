import { ScrollControls } from "@react-three/drei";
import { usePortalStore, useScrollStore } from "@stores";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SpaceScene } from "../../models/SpaceScene";
import Timeline from "./Timeline";

const Work = () => {
  const isActive = usePortalStore((state) => state.activePortalId === 'work');
  const { scrollProgress, setScrollProgress } = useScrollStore();

  const scrollHandlerRef = useRef<((event: Event) => void) | null>(null);
  const innerScrollRef = useRef<HTMLElement | null>(null);
  const outerScrollRef = useRef<HTMLElement | null>(null);

  // Find the ScrollControls wrapper divs created by drei as siblings of the canvas element.
  // This is more robust than using CSS attribute substring selectors which can match
  // unrelated elements (e.g. GhostCursor, close button).
  const findScrollContainers = () => {
    // The canvas element may not have the 'base-canvas' class at runtime.
    // Find the R3F canvas by looking for any canvas element, then locate its parent.
    const allCanvases = document.querySelectorAll('canvas');
    let canvasParent: HTMLElement | null = null;
    
    // Find the canvas whose parent contains ScrollControls divs
    for (const canvas of allCanvases) {
      const parent = canvas.parentElement;
      if (!parent) continue;
      const hasSCDivs = Array.from(parent.children).some(
        (el) => el instanceof HTMLElement && el.tagName === 'DIV' && el.style.overflowY === 'auto'
      );
      if (hasSCDivs) { canvasParent = parent; break; }
    }
    if (!canvasParent) return { inner: null, outer: null };

    const siblings = Array.from(canvasParent.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.tagName === 'DIV'
    );

    // ScrollControls divs have position: absolute and overflow set
    const scrollDivs = siblings.filter(el =>
      el.style.position === 'absolute' &&
      (el.style.overflowY === 'auto' || el.style.overflowY === 'scroll' || el.style.overflow === 'auto')
    );

    const inner = scrollDivs.find(el => el.style.zIndex === '-1') || null;
    const outer = scrollDivs.find(el => el.style.zIndex === '1') || null;
    return { inner, outer };
  };

  // Hack: If the portal is active, add the scroll event listener to the scroll
  // wrapper div. If the portal is not active, remove the scroll event listener.
  // ScrollControls doesn't work out of the box, so we have to manually handle
  // the scroll event.
  useEffect(() => {
    if (isActive) {
      const { inner, outer } = findScrollContainers();
      if (!inner || !outer) return;

      innerScrollRef.current = inner;
      outerScrollRef.current = outer;

      const handler = (event: Event) => {
        const target = event.target as HTMLElement;
        const scrollTop = target.scrollTop;
        const scrollHeight = target.scrollHeight - target.clientHeight;
        const progress = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
        setScrollProgress(progress);
      };
      scrollHandlerRef.current = handler;

      setScrollProgress(0);
      // Reset scroll position to top so the timeline starts at the beginning
      inner.scrollTop = 0;
      inner.addEventListener('scroll', handler);
      inner.style.zIndex = '1';
      outer.style.zIndex = '-1';
    } else {
      const inner = innerScrollRef.current;
      const outer = outerScrollRef.current;

      if (inner && scrollHandlerRef.current) {
        inner.scrollTo({ top: 0, behavior: 'smooth' });
        setScrollProgress(0);
        inner.removeEventListener('scroll', scrollHandlerRef.current);
        inner.style.zIndex = '-1';
      }
      if (outer) {
        outer.style.zIndex = '1';
      }

      scrollHandlerRef.current = null;
      innerScrollRef.current = null;
      outerScrollRef.current = null;
    }
  }, [isActive]);

  return (
    <group>
      <mesh receiveShadow position={[0, 0, -5]}>
        <planeGeometry args={[10, 10, 1]} />
        <shadowMaterial opacity={0.1} />
      </mesh>
      <ScrollControls style={{ zIndex: -1}} pages={3} maxSpeed={0.4}>
        <SpaceScene />
        <Timeline progress={isActive ? scrollProgress : 0} />
      </ScrollControls>
    </group>
  );
};

export default Work;