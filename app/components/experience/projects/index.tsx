import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import * as THREE from "three";
import { usePortalStore } from "@stores";
import { Project } from "@types";
import ProjectsCarousel from "./ProjectsCarousel";
import { TouchPanControls } from "./TouchPanControls";

// ─── SCREEN-SPACE DETAIL OVERLAY ───────────────────────────────────────
// Managed as a DOM element (same pattern as the close button in GridTile).

function createDetailPanel(): HTMLDivElement {
  const panel = document.createElement("div");
  panel.className = "data-core-detail-panel";
  panel.style.cssText = `
    position: fixed;
    bottom: 40px;
    right: 40px;
    width: 340px;
    padding: 28px 24px;
    background: rgba(8, 8, 30, 0.75);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(80, 130, 255, 0.15);
    border-radius: 16px;
    color: #fff;
    z-index: 20;
    pointer-events: none;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 0 40px rgba(34, 68, 170, 0.12), inset 0 0 30px rgba(34, 68, 170, 0.04);
  `;

  panel.innerHTML = `
    <div style="
      font-size: 10px;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: rgba(100, 160, 255, 0.7);
      margin-bottom: 8px;
      font-weight: 500;
    " data-date></div>
    <div style="
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      color: #e8eeff;
      line-height: 1.3;
    " data-title></div>
    <div style="
      font-size: 13px;
      line-height: 1.6;
      color: rgba(200, 210, 240, 0.7);
      margin-bottom: 16px;
    " data-desc></div>
    <div style="
      font-size: 11px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: rgba(0, 190, 220, 0.6);
    " data-cta></div>
  `;

  return panel;
}

function updateDetailPanel(panel: HTMLDivElement, project: Project | null) {
  if (!project) {
    panel.style.opacity = "0";
    panel.style.transform = "translateY(20px)";
    return;
  }

  const dateEl = panel.querySelector("[data-date]") as HTMLElement;
  const titleEl = panel.querySelector("[data-title]") as HTMLElement;
  const descEl = panel.querySelector("[data-desc]") as HTMLElement;
  const ctaEl = panel.querySelector("[data-cta]") as HTMLElement;

  dateEl.textContent = project.date.toUpperCase();
  titleEl.textContent = project.title;
  descEl.textContent = project.subtext;
  ctaEl.textContent = "";

  panel.style.opacity = "1";
  panel.style.transform = "translateY(0)";
}

// ─── PROJECTS COMPONENT ───────────────────────────────────────────────

const Projects = () => {
  const { camera } = useThree();
  const isActive = usePortalStore(
    (state) => state.activePortalId === "projects"
  );
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

  // ── Camera setup ──
  useEffect(() => {
    const data = document.querySelector(
      'div[style*="overflow"]'
    ) as HTMLElement | null;
    if (data) {
      data.style.overflow = isActive ? "hidden" : "auto";
    }

    if (isActive) {
      if (isMobile) {
        gsap.to(camera.position, { z: 11.5, y: -39, x: 1, duration: 1 });
      } else {
        gsap.to(camera.position, { y: -39, x: 2, duration: 1 });
      }
    }
  }, [isActive]);

  // ── Pointer-driven parallax ──
  useFrame((state, delta) => {
    if (isActive) {
      if (!isMobile) {
        camera.rotation.y = THREE.MathUtils.lerp(
          camera.rotation.y,
          -(state.pointer.x * Math.PI) / 4,
          0.03
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          11.5 - state.pointer.y,
          7,
          delta
        );
      }
    }
  });

  // ── Detail panel lifecycle ──
  useEffect(() => {
    if (isActive) {
      const panel = createDetailPanel();
      document.body.appendChild(panel);
      panelRef.current = panel;
    }

    return () => {
      if (panelRef.current) {
        panelRef.current.remove();
        panelRef.current = null;
      }
    };
  }, [isActive]);

  // ── Update panel content on hover change ──
  useEffect(() => {
    if (panelRef.current) {
      updateDetailPanel(panelRef.current, hoveredProject);
    }
  }, [hoveredProject]);

  // ── Clear hovered state when portal deactivates ──
  useEffect(() => {
    if (!isActive) {
      setHoveredProject(null);
    }
  }, [isActive]);

  const handleHover = useCallback((project: Project | null) => {
    setHoveredProject(project);
  }, []);

  return (
    <group>
      <ProjectsCarousel onHover={handleHover} />
      {isActive && isMobile && <TouchPanControls />}
    </group>
  );
};

export default Projects;
