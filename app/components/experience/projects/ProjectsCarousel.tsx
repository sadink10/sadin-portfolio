import { useEffect, useMemo, useState } from "react";
import { isMobile } from "react-device-detect";
import ProjectTile from "./ProjectTile";

import { PROJECTS } from "@constants";
import { usePortalStore } from "@stores";
import { Project } from "@types";
import { DataCoreScene } from "../../models/DataCoreScene";

interface ProjectsCarouselProps {
  onHover: (project: Project | null) => void;
}

const ProjectsCarousel = ({ onHover }: ProjectsCarouselProps) => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const isActive = usePortalStore((state) => state.activePortalId === "projects");

  useEffect(() => {
    if (!isActive) {
      setActiveId(null);
      onHover(null);
    }
  }, [isActive]);

  const onClick = (id: number) => {
    if (!isMobile) return;
    setActiveId(id === activeId ? null : id);
  };

  const tiles = useMemo(() => {
    const fov = Math.PI;
    const distance = 13;
    const count = PROJECTS.length;

    return PROJECTS.map((project, i) => {
      const angle = (fov / count) * i;
      const z = -distance * Math.sin(angle);
      const x = -distance * Math.cos(angle);
      const rotY = Math.PI / 2 - angle;

      return (
        <ProjectTile
          key={i}
          project={project}
          index={i}
          position={[x, 1, z]}
          rotation={[0, rotY, 0]}
          activeId={activeId}
          onClick={() => onClick(i)}
          onHover={onHover}
        />
      );
    });
  }, [activeId, isActive, onHover]);

  return (
    <group rotation={[0, -Math.PI / 12, 0]}>
      <DataCoreScene />
      {tiles}
    </group>
  );
};

export default ProjectsCarousel;