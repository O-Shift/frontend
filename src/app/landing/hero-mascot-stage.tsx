"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  Globe2,
  MessageSquare,
  Play,
  ScanLine,
  FileText,
  Sparkles,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";

const CursorLens = dynamic(() => import("./signal-lens"), { ssr: false });

interface ChannelDef {
  id: string;
  label: string;
  icon: typeof Globe2;
  decodedTag: string;
  decodedHeadline: string;
  decodedIntel: string;
  radiusX: number;
  radiusY: number;
  tiltAngle: number; // degrees tilt of orbit plane
  speed: number; // radians/sec
  phase: number; // radians offset
}

const CHANNELS: ChannelDef[] = [
  {
    id: "web",
    label: "Web",
    icon: Globe2,
    decodedTag: "DOM DIFF",
    decodedHeadline: "Stealth /pricing edit",
    decodedIntel: "Hidden unlisted enterprise tier",
    radiusX: 215,
    radiusY: 95,
    tiltAngle: -18,
    speed: 0.22,
    phase: 0,
  },
  {
    id: "ads",
    label: "Paid ads",
    icon: ScanLine,
    decodedTag: "AD VAULT",
    decodedHeadline: "24 new ad creatives",
    decodedIntel: "A/B testing executive conquest ads",
    radiusX: 215,
    radiusY: 95,
    tiltAngle: -18,
    speed: 0.22,
    phase: Math.PI,
  },
  {
    id: "social",
    label: "Social",
    icon: MessageSquare,
    decodedTag: "SENTIMENT",
    decodedHeadline: "Executive leak detected",
    decodedIntel: "Stealth roadmap teaser in feed",
    radiusX: 245,
    radiusY: 115,
    tiltAngle: 20,
    speed: 0.17,
    phase: 1.15,
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: Sparkles,
    decodedTag: "CHURN SPIKE",
    decodedHeadline: "+42% switching intent",
    decodedIntel: "Backlash on forced contract minimums",
    radiusX: 245,
    radiusY: 115,
    tiltAngle: 20,
    speed: 0.17,
    phase: 1.15 + Math.PI,
  },
  {
    id: "video",
    label: "Video",
    icon: Play,
    decodedTag: "KEYNOTE RECON",
    decodedHeadline: "Sponsor drop detected",
    decodedIntel: "Top creator dropped competitor exclusivity",
    radiusX: 275,
    radiusY: 135,
    tiltAngle: -7,
    speed: 0.13,
    phase: 2.35,
  },
  {
    id: "news",
    label: "News",
    icon: FileText,
    decodedTag: "REGULATORY",
    decodedHeadline: "Stealth trademark filing",
    decodedIntel: "Unannounced subsidiary registered",
    radiusX: 275,
    radiusY: 135,
    tiltAngle: -7,
    speed: 0.13,
    phase: 2.35 + Math.PI,
  },
];

export default function HeroMascotStage({ paused }: { paused: boolean }) {
  const [active, setActive] = useState(false);
  const [pinnedDecode, setPinnedDecode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalChipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const decodedChipRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const constellationLineRefs = useRef<(SVGLineElement | null)[]>([]);

  // Dimensions of the stage container
  const stageWidth = useMotionValue(580);
  const stageHeight = useMotionValue(560);

  // Center coordinates of the stage
  const mouseX = useMotionValue(290);
  const mouseY = useMotionValue(280);

  // Lens cursor coordinate (offset by 112px so glass center matches cursor position)
  const cursorX = useTransform(mouseX, (v) => v - 112);
  const cursorY = useTransform(mouseY, (v) => v - 112);

  // Inside the 224px cursor, .hero-glass has inset: 18px.
  // To perfectly align the inner decoded world with the underlying stage:
  // Decoded world offset must be: -(cursorX + 18) = -(mouseX - 112 + 18) = 94 - mouseX.
  const decodedOffsetX = useTransform(mouseX, (v) => 94 - v);
  const decodedOffsetY = useTransform(mouseY, (v) => 94 - v);

  const measureStage = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      stageWidth.set(rect.width);
      stageHeight.set(rect.height);
      if (!active && !pinnedDecode) {
        mouseX.set(rect.width / 2);
        mouseY.set(rect.height / 2 - 20);
      }
    }
  }, [active, pinnedDecode, mouseX, mouseY, stageWidth, stageHeight]);

  useEffect(() => {
    measureStage();
    window.addEventListener("resize", measureStage);
    return () => window.removeEventListener("resize", measureStage);
  }, [measureStage]);

  // 60FPS continuous planetary orbital physics around the central mascot
  useEffect(() => {
    if (paused) return;
    let animId: number;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = (now - startTime) / 1000;
      const curW = stageWidth.get() || 580;
      const scaleFactor = Math.min(1, Math.max(0.68, curW / 580));

      CHANNELS.forEach((ch, i) => {
        const theta = (elapsed * ch.speed + ch.phase) % (Math.PI * 2);
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        // Elliptical planar coordinates scaled to responsive container
        const unrotatedX = cosT * ch.radiusX * scaleFactor;
        const unrotatedY = sinT * ch.radiusY * scaleFactor;

        // Apply orbit tilt angle
        const tiltRad = (ch.tiltAngle * Math.PI) / 180;
        const x = unrotatedX * Math.cos(tiltRad) - unrotatedY * Math.sin(tiltRad);
        const y = unrotatedX * Math.sin(tiltRad) + unrotatedY * Math.cos(tiltRad);

        // Depth sorting: sinT > 0 passes IN FRONT of the mascot, sinT <= 0 passes BEHIND
        const isFront = sinT > 0;
        const zIndex = isFront ? "4" : "1";
        const opacity = isFront ? "1" : "0.74";
        const scale = isFront ? "1" : "0.88";

        const transformStr = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0) scale(${scale})`;

        const normalEl = normalChipRefs.current[i];
        if (normalEl) {
          normalEl.style.transform = transformStr;
          normalEl.style.zIndex = zIndex;
          normalEl.style.opacity = opacity;
        }

        const decodedEl = decodedChipRefs.current[i];
        if (decodedEl) {
          decodedEl.style.transform = transformStr;
          decodedEl.style.zIndex = zIndex;
          decodedEl.style.opacity = opacity;
        }

        const lineEl = constellationLineRefs.current[i];
        if (lineEl) {
          lineEl.setAttribute("x2", (x / scaleFactor).toFixed(1));
          lineEl.setAttribute("y2", (y / scaleFactor).toFixed(1));
        }
      });

      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [paused, stageWidth]);

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      e.pointerType === "mouse" &&
      window.matchMedia("(min-width: 701px) and (hover: hover) and (pointer: fine)").matches
    ) {
      const rect = e.currentTarget.getBoundingClientRect();
      stageWidth.set(rect.width);
      stageHeight.set(rect.height);
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
      setActive(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      e.pointerType !== "mouse" ||
      !window.matchMedia("(min-width: 701px) and (hover: hover) and (pointer: fine)").matches
    )
      return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const isScanning = active || pinnedDecode;

  return (
    <div
      ref={containerRef}
      className="hero-mascot-stage"
      data-scanning={isScanning}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        if (!pinnedDecode) {
          setActive(false);
        }
      }}
    >
      {/* 3 Physical Orbit SVG Tracks (Planetary Gravitational Rings) */}
      <svg
        className="hero-orbit-svg"
        viewBox="-320 -200 640 400"
        aria-hidden="true"
      >
        <g transform="rotate(-18)">
          <ellipse cx="0" cy="0" rx="215" ry="95" className="orbit-track track-1" />
        </g>
        <g transform="rotate(20)">
          <ellipse cx="0" cy="0" rx="245" ry="115" className="orbit-track track-2" />
        </g>
        <g transform="rotate(-7)">
          <ellipse cx="0" cy="0" rx="275" ry="135" className="orbit-track track-3" />
        </g>
      </svg>

      {/* Surface Layer: 6 Raw Channels Revolving Around the Mascot */}
      {CHANNELS.map((ch, i) => {
        const Icon = ch.icon;
        return (
          <span
            key={ch.id}
            ref={(el) => {
              normalChipRefs.current[i] = el;
            }}
            className={`source-chip hero-orbit-chip chip-${ch.id}`}
          >
            <Icon size={13} />
            <span>{ch.label}</span>
          </span>
        );
      })}

      {/* Center Mascot Artwork (The Sun / Gravitational Core) */}
      <div className="hero-mascot-frame">
        <Image
          src="/investigator_mascot.png"
          alt="OShift investigator mascot analyzing competitive clues"
          width={520}
          height={780}
          className="hero-mascot-image"
          priority
          loading="eager"
        />
      </div>

      {/* Interactive Magnifying Glass: Reveals the DECODED INTEL LAYER */}
      <motion.div
        className="hero-lens-cursor"
        style={{ x: cursorX, y: cursorY }}
        data-active={isScanning}
        aria-hidden="true"
      >
        <div className="hero-glass">
          {/* Decoded Layer Viewport inside the Lens (Coordinates Aligned 1:1 with Stage) */}
          <motion.div
            className="hero-decoded-world"
            style={{
              width: stageWidth,
              height: stageHeight,
              x: decodedOffsetX,
              y: decodedOffsetY,
            }}
          >
            {/* Tactical Recon Grid Pattern */}
            <div className="decoded-hud-grid" />

            {/* Glowing Tactical Constellation Lines Connecting Mascot to Orbiting Clues */}
            <svg
              className="decoded-constellations-svg"
              viewBox="-320 -200 640 400"
              aria-hidden="true"
            >
              <circle cx="0" cy="-15" r="4" className="constellation-hub" />
              {CHANNELS.map((ch, i) => (
                <line
                  key={`line-${ch.id}`}
                  ref={(el) => {
                    constellationLineRefs.current[i] = el;
                  }}
                  x1="0"
                  y1="-15"
                  x2="0"
                  y2="0"
                  className="constellation-line"
                />
              ))}
            </svg>

            {/* Tactical Phosphor-Tinted Mascot Silhouette inside Lens */}
            <div className="hero-mascot-frame decoded-mascot-frame">
              <Image
                src="/investigator_mascot.png"
                alt=""
                width={520}
                height={780}
                className="hero-mascot-image decoded-mascot-image"
              />
            </div>

            {/* Decoded Orbiting Intel (Replaces Generic Names with Secret Tactical Insights) */}
            {CHANNELS.map((ch, i) => {
              const Icon = ch.icon;
              return (
                <span
                  key={`decoded-${ch.id}`}
                  ref={(el) => {
                    decodedChipRefs.current[i] = el;
                  }}
                  className={`source-chip hero-orbit-chip decoded-chip chip-${ch.id}`}
                >
                  <Icon size={12} className="decoded-icon" />
                  <div className="decoded-text-block">
                    <div className="decoded-header-line">
                      <strong className="decoded-tag">{ch.decodedTag}</strong>
                      <span className="decoded-headline">{ch.decodedHeadline}</span>
                    </div>
                    <span className="decoded-body">{ch.decodedIntel}</span>
                  </div>
                </span>
              );
            })}
          </motion.div>

          {/* Tactical HUD Reticle Overlay Locked to the Lens */}
          <div className="lens-hud-overlay">
            <span className="hud-corner hud-tl" />
            <span className="hud-corner hud-tr" />
            <span className="hud-corner hud-bl" />
            <span className="hud-corner hud-br" />
            <div className="hud-reticle-cross" />
            <span className="hud-tag">X-RAY INTEL DECODER</span>
          </div>
        </div>

        {/* 3D Realistic Magnifying Glass Ring & Handle */}
        <CursorLens paused={paused} rotation={0} variant="cursor" />
      </motion.div>

      {/* Interactive Controls & Exploration Hint */}
      <div className="hero-stage-controls">
        <button
          type="button"
          className={`hero-decode-pill ${pinnedDecode ? "is-pinned" : ""}`}
          onClick={() => {
            const next = !pinnedDecode;
            setPinnedDecode(next);
            if (next && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              stageWidth.set(rect.width);
              stageHeight.set(rect.height);
              mouseX.set(rect.width / 2);
              mouseY.set(rect.height / 2 - 25);
            }
          }}
          aria-pressed={pinnedDecode}
        >
          {pinnedDecode ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>{pinnedDecode ? "Hide decoded layer" : "Inspect decoded layer"}</span>
        </button>

        <span className="hero-lens-hint" aria-hidden="true">
          <Search size={12} />
          <span>Move magnifying glass across orbits to decode</span>
        </span>
      </div>
    </div>
  );
}
