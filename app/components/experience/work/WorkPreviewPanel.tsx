'use client';

import { usePortalStore, useScrollStore } from '@stores';
import { WORK_TIMELINE } from '@constants';
import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';

const WorkPreviewPanel = () => {
  const isActive = usePortalStore((s) => s.activePortalId === 'work');
  const scrollProgress = useScrollStore((s) => s.scrollProgress);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef<number>(0);

  // React state controls display + opacity so re-renders don't fight GSAP
  const [display, setDisplay] = useState<'none' | 'block'>('none');
  const [panelOpacity, setPanelOpacity] = useState(0);

  const activeIndex = useMemo(() => {
    const idx = Math.round(scrollProgress * (WORK_TIMELINE.length - 1));
    return Math.max(0, Math.min(idx, WORK_TIMELINE.length - 1));
  }, [scrollProgress]);

  const activeEntry = WORK_TIMELINE[activeIndex];

  useEffect(() => {
    if (!panelRef.current) return;
    gsap.killTweensOf(panelRef.current);

    if (isActive) {
      setDisplay('block');
      setPanelOpacity(0);
      requestAnimationFrame(() => {
        if (!panelRef.current) return;
        gsap.fromTo(
          panelRef.current,
          { x: -80 },
          {
            x: 0,
            duration: 0.8,
            delay: 0.6,
            ease: 'power3.out',
            onUpdate: function (this: gsap.core.Tween) {
              setPanelOpacity(this.progress());
            },
            onComplete: () => setPanelOpacity(1),
          }
        );
      });
    } else {
      gsap.to(panelRef.current, {
        x: -80,
        duration: 0.4,
        ease: 'power2.in',
        onUpdate: function (this: gsap.core.Tween) {
          setPanelOpacity(1 - this.progress());
        },
        onComplete: () => {
          setPanelOpacity(0);
          setDisplay('none');
        },
      });
    }
  }, [isActive]);

  useEffect(() => {
    if (!contentRef.current || !isActive) return;
    if (prevIndexRef.current !== activeIndex) {
      gsap.killTweensOf(contentRef.current);
      gsap.fromTo(
        contentRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }
      );
      prevIndexRef.current = activeIndex;
    }
  }, [activeIndex, isActive]);

  const progressPercent = Math.round(scrollProgress * 100);
  const isMobileWidth = typeof window !== 'undefined' && window.innerWidth < 768;

  // ALWAYS render the div (never return null) so panelRef is always attached
  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: isMobileWidth ? '12px' : '40px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        width: isMobileWidth ? 'calc(100vw - 24px)' : '340px',
        maxWidth: '92vw',
        display: display,
        opacity: panelOpacity,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(5,8,22,0.82) 0%, rgba(12,15,40,0.72) 100%)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid rgba(0,229,255,0.18)',
          borderRadius: '16px',
          padding: isMobileWidth ? '20px 18px' : '28px 28px 24px',
          boxShadow:
            '0 0 40px rgba(0,229,255,0.08), 0 0 80px rgba(124,77,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          overflow: 'hidden',
          position: 'relative' as const,
        }}
      >
        <div style={{ position: 'absolute' as const, top: 0, left: '20%', right: '20%', height: '1px', background: 'linear-gradient(90deg, transparent, #00e5ff, #7c4dff, transparent)' }} />
        <div style={{ position: 'absolute' as const, bottom: 0, left: 0, height: '2px', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #00e5ff, #7c4dff)', transition: 'width 0.3s ease-out', borderRadius: '0 2px 2px 0' }} />

        <div ref={contentRef}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            {WORK_TIMELINE.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === activeIndex ? '24px' : '8px',
                  height: '3px',
                  borderRadius: '2px',
                  background: i === activeIndex ? 'linear-gradient(90deg, #00e5ff, #7c4dff)' : 'rgba(255,255,255,0.15)',
                  transition: 'all 0.4s ease',
                }}
              />
            ))}
            <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '11px', color: 'rgba(0,229,255,0.5)', letterSpacing: '0.05em' }}>
              {String(activeIndex + 1).padStart(2, '0')}/{String(WORK_TIMELINE.length).padStart(2, '0')}
            </span>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: isMobileWidth ? '13px' : '14px', color: '#00e5ff', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '6px', textShadow: '0 0 12px rgba(0,229,255,0.4)' }}>
            {activeEntry.year}
          </div>

          <div style={{ fontSize: isMobileWidth ? '20px' : '24px', fontWeight: 700, color: '#ffffff', lineHeight: 1.25, marginBottom: '8px', letterSpacing: '-0.01em' }}>
            {activeEntry.title}
          </div>

          {activeEntry.subtitle && (
            <div style={{ fontSize: isMobileWidth ? '13px' : '14px', color: 'rgba(170,187,238,0.85)', lineHeight: 1.55, maxWidth: '300px' }}>
              {activeEntry.subtitle}
            </div>
          )}
        </div>

        <svg style={{ position: 'absolute' as const, top: '8px', left: '8px', opacity: 0.25 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M0 14V0H14" stroke="#00e5ff" strokeWidth="1.5" />
        </svg>
        <svg style={{ position: 'absolute' as const, bottom: '8px', right: '8px', opacity: 0.25 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M14 0V14H0" stroke="#7c4dff" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
};

export default WorkPreviewPanel;
