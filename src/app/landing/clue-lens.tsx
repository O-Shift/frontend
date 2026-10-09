"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  ScanLine,
  Eye,
  EyeOff,
  Globe2,
  MessageSquare,
  Sparkles,
  FolderArchive,
  Check,
} from "lucide-react";

const CursorLens = dynamic(() => import("./signal-lens"), { ssr: false });

interface ClueSource {
  type: string;
  icon: "scan" | "globe" | "message";
  headline?: string;
  sub: string;
  date?: { day: string; month: string };
  quote?: string;
  hasStripe?: boolean;
}

interface ClueConnection {
  label: string;
  title: string;
  desc: string;
}

interface Dossier {
  id: string;
  tabLabel: string;
  caseCode: string;
  caseTitle: string;
  sources: ClueSource[];
  connections: ClueConnection[];
  conclusionMove: string;
}

const DOSSIERS: Dossier[] = [
  {
    id: "launch",
    tabLabel: "01 · Secret Launch",
    caseCode: "CASE #402",
    caseTitle: "The Unannounced Product Launch",
    sources: [
      {
        type: "AD LIBRARY",
        icon: "scan",
        headline: "Good things are coming.",
        sub: "New creative. Same promise.",
        hasStripe: true,
      },
      {
        type: "WEBSITE UPDATE",
        icon: "globe",
        date: { day: "24", month: "OCT" },
        sub: "A new page. A date. No explanation.",
      },
      {
        type: "SOCIAL POST",
        icon: "message",
        quote: "A new chapter. Watch this space.",
        sub: "Another teaser in the feed.",
      },
    ],
    connections: [
      {
        label: "SHARED LANGUAGE",
        title: "The same launch promise.",
        desc: "A repeated message across ad creative and executive channels.",
      },
      {
        label: "SHARED TIMING",
        title: "A date that connects the dots.",
        desc: "The unlisted landing page gives the teaser activity a hard deadline.",
      },
      {
        label: "SHARED DIRECTION",
        title: "A coordinated campaign.",
        desc: "Separate channels. One major product release taking shape.",
      },
    ],
    conclusionMove: "Prepare your counter-campaign 48 hours before their launch day.",
  },
  {
    id: "pricing",
    tabLabel: "02 · Stealth Price Hike",
    caseCode: "CASE #718",
    caseTitle: "The Upmarket Pricing Pivot",
    sources: [
      {
        type: "PRICING DIFF",
        icon: "scan",
        headline: "Free tier removed.",
        sub: "/pricing updated · 'Contact Sales' replaces starter.",
        hasStripe: true,
      },
      {
        type: "REVIEW SPIKE",
        icon: "globe",
        date: { day: "+42%", month: "CHURN" },
        sub: "G2 & Reddit complaints on forced contract minimums.",
      },
      {
        type: "EXECUTIVE WEBINAR",
        icon: "message",
        quote: "Enterprise-first focus.",
        sub: "CEO announces sunsetting legacy small accounts.",
      },
    ],
    connections: [
      {
        label: "SMB ABANDONMENT",
        title: "Vulnerable customer base.",
        desc: "Their pricing hike leaves thousands of mid-market accounts stranded.",
      },
      {
        label: "SWITCHING INTENT",
        title: "Search volume spike.",
        desc: "Alternative searches jump 3.8x as renewal notices go out.",
      },
      {
        label: "STRATEGIC OPENING",
        title: "Instant market acquisition.",
        desc: "A golden window to capture displaced accounts before contracts lock.",
      },
    ],
    conclusionMove: "Launch a targeted conquest campaign offering seamless 1-click migration.",
  },
  {
    id: "partnerships",
    tabLabel: "03 · Creator Poach",
    caseCode: "CASE #933",
    caseTitle: "The Covert Influencer Buyout",
    sources: [
      {
        type: "CREATOR VIDEO",
        icon: "scan",
        headline: "New setup sponsor.",
        sub: "Top category creator drops existing tool sponsor.",
        hasStripe: true,
      },
      {
        type: "API REGISTRY",
        icon: "globe",
        date: { day: "NEW", month: "OAUTH" },
        sub: "Subdomain /creators deployed with private invite tokens.",
      },
      {
        type: "AD WHITELIST",
        icon: "message",
        quote: "Why I made the switch.",
        sub: "Whitelisted creator ads running to 1.2M targeted viewers.",
      },
    ],
    connections: [
      {
        label: "CREATOR EXCLUSIVITY",
        title: "Contract lockout in progress.",
        desc: "Competitor is signing 6-month category exclusivity with top voices.",
      },
      {
        label: "BUDGET REALLOCATION",
        title: "Shift from search to trust.",
        desc: "Paid ad spend moving directly into high-authority influencer handles.",
      },
      {
        label: "AUDIENCE SATURATION",
        title: "High-affinity audience capture.",
        desc: "Targeting your exact demographic with social-proof endorsements.",
      },
    ],
    conclusionMove: "Engage adjacent rising creators before category sponsorship rates inflate.",
  },
];

export default function ClueLens({ paused }: { paused: boolean }) {
  const [activeDossierIndex, setActiveDossierIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const cursorX = useTransform(x, (value) => value - 112);
  const cursorY = useTransform(y, (value) => value - 112);
  const boardWidth = useMotionValue(0);
  const boardHeight = useMotionValue(0);
  const refractedX = useTransform(x, (value) => 94 - value * 1.16);
  const refractedY = useTransform(y, (value) => 94 - value * 1.16);

  const dossier = DOSSIERS[activeDossierIndex];

  const renderIcon = (type: "scan" | "globe" | "message") => {
    if (type === "scan") return <ScanLine size={13} />;
    if (type === "globe") return <Globe2 size={13} />;
    return <MessageSquare size={13} />;
  };

  const sources = (
    <div className="clue-documents" aria-hidden={revealed}>
      {dossier.sources.map((src, i) => (
        <article
          key={src.type}
          className={i === 0 ? "clue-ad" : i === 2 ? "clue-post" : "clue-web"}
        >
          <span>
            {renderIcon(src.icon)} {src.type}
          </span>
          {src.headline && (
            <h3>
              {src.headline.split(" ")[0]}{" "}
              <em>{src.headline.split(" ").slice(1).join(" ")}</em>
            </h3>
          )}
          {src.hasStripe && <div className="ad-stripe" />}
          {src.date && (
            <div className="clue-date">
              <b>{src.date.day}</b>
              <span>{src.date.month}</span>
            </div>
          )}
          {src.quote && (
            <div className="post-quote">
              <span>“</span>
              <h3>{src.quote}</h3>
            </div>
          )}
          <small>{src.sub}</small>
        </article>
      ))}
    </div>
  );

  const connections = (
    <>
      <div className="reveal-title">
        <ScanLine size={14} />
        <span>THE CONNECTED PICTURE · {dossier.caseTitle}</span>
        <span className="reveal-example-label">
          {dossier.caseCode} · INTERACTIVE LENS
        </span>
      </div>
      <div className="revealed-documents">
        {dossier.connections.map((conn) => (
          <article key={conn.label}>
            <span>{conn.label}</span>
            <h3>{conn.title}</h3>
            <p>{conn.desc}</p>
          </article>
        ))}
      </div>
      <div className="revealed-conclusion">
        <span>THE NEXT MOVE</span>
        <p>{dossier.conclusionMove}</p>
        <ArrowUpRight size={25} />
      </div>
    </>
  );

  return (
    <section className="clue-section" id="clues" aria-labelledby="clue-heading">
      <div className="clue-heading">
        <div>
          <span className="clue-eyebrow">
            <Sparkles size={13} /> INTERACTIVE INTELLIGENCE LENS
          </span>
          <h2 id="clue-heading">
            There’s more
            <br />
            than <em>meets the eye.</em>
          </h2>
        </div>
        <div className="clue-sub-container">
          <p>
            Three ordinary public updates.
            <br />
            One decisive competitive connection.
          </p>
          <span>Move your lens across the clues to reveal the pattern.</span>
        </div>
      </div>

      {/* Investigation Dossier Switcher */}
      <div className="dossier-selector-bar">
        <span className="dossier-label">
          <FolderArchive size={14} /> ACTIVE DOSSIER:
        </span>
        <div className="dossier-tabs" role="tablist" aria-label="Select investigation case">
          {DOSSIERS.map((d, idx) => (
            <button
              key={d.id}
              role="tab"
              aria-selected={activeDossierIndex === idx}
              className={`dossier-tab ${activeDossierIndex === idx ? "active-dossier" : ""}`}
              onClick={() => {
                setActiveDossierIndex(idx);
                setRevealed(false);
                setActive(false);
              }}
            >
              <span>{d.tabLabel}</span>
              {activeDossierIndex === idx && <Check size={13} />}
            </button>
          ))}
        </div>
      </div>

      <svg className="clue-filter-defs" aria-hidden="true" width="0" height="0">
        <defs>
          <filter
            id="clue-glass-refraction"
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.018"
              numOctaves="1"
              seed="7"
              result="lens-warp"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="lens-warp"
              scale="13"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="clue-board"
        data-scanning={active && !revealed ? "true" : "false"}
        data-revealed={revealed ? "true" : "false"}
        onPointerEnter={(e) => {
          if (
            e.pointerType === "mouse" &&
            window.matchMedia(
              "(min-width: 701px) and (hover: hover) and (pointer: fine)",
            ).matches
          ) {
            const r = e.currentTarget.getBoundingClientRect();
            boardWidth.set(e.currentTarget.clientWidth);
            boardHeight.set(e.currentTarget.clientHeight);
            x.set(e.clientX - r.left);
            y.set(e.clientY - r.top);
            setActive(true);
          }
        }}
        onPointerMove={(e) => {
          if (
            e.pointerType !== "mouse" ||
            !window.matchMedia(
              "(min-width: 701px) and (hover: hover) and (pointer: fine)",
            ).matches
          )
            return;
          const r = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - r.left);
          y.set(e.clientY - r.top);
        }}
        onPointerLeave={() => setActive(false)}
      >
        <div className="clue-board-top">
          <span>THE PUBLIC PICTURE · {dossier.caseTitle.toUpperCase()}</span>
          <span>{dossier.caseCode} · HOVER WITH LENS TO DECODE</span>
        </div>
        {sources}

        <motion.div
          id="clue-connections"
          className="clue-revealed"
          role="region"
          aria-label="The connected picture"
          style={{
            clipPath: revealed ? "inset(0)" : "circle(0px at 50% 50%)",
          }}
          aria-hidden={!revealed}
        >
          {connections}
        </motion.div>

        <motion.div
          className="clue-cursor"
          style={{ x: cursorX, y: cursorY }}
          data-active={active && !revealed}
          aria-hidden="true"
        >
          <div className="clue-glass">
            <motion.div
              className="clue-refraction"
              style={{
                width: boardWidth,
                height: boardHeight,
                x: refractedX,
                y: refractedY,
                scale: 1.16,
              }}
            >
              <div className="clue-board-top">
                <span>THE PUBLIC PICTURE · {dossier.caseTitle.toUpperCase()}</span>
                <span>{dossier.caseCode} · HOVER WITH LENS TO DECODE</span>
              </div>
              {sources}
              <div className="clue-revealed clue-optical-picture">
                {connections}
              </div>
            </motion.div>
          </div>
          <CursorLens paused={paused} rotation={0} variant="cursor" />
        </motion.div>

        {!active && !revealed && (
          <div className="clue-idle-hint" aria-hidden="true">
            <ScanLine size={22} />
            <span>Move cursor here to inspect clues.</span>
          </div>
        )}
      </div>

      <div className="clue-footer">
        <span>OShift connects disparate signals into actionable strategic foresight.</span>
        <button
          onClick={() => {
            setRevealed(!revealed);
            setActive(false);
          }}
          aria-expanded={revealed}
          aria-controls="clue-connections"
        >
          {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
          {revealed ? "Hide the connections" : "Reveal the connections"}
          <ArrowUpRight size={15} />
        </button>
      </div>
      <span className="clue-motion-note">
        {paused
          ? "Motion is paused. You can still explore or reveal the connections."
          : ""}
      </span>
    </section>
  );
}
