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
} from "lucide-react";

const CursorLens = dynamic(() => import("./signal-lens"), { ssr: false });

export default function ClueLens({ paused }: { paused: boolean }) {
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
  const sources = (
    <div className="clue-documents" aria-hidden={revealed}>
      <article className="clue-ad">
        <span>
          <ScanLine size={13} /> AD LIBRARY
        </span>
        <h3>
          Good things
          <br />
          are <em>coming.</em>
        </h3>
        <div className="ad-stripe" />
        <small>New creative. Same promise.</small>
      </article>
      <article className="clue-web">
        <span>
          <Globe2 size={13} /> WEBSITE UPDATE
        </span>
        <div className="clue-date">
          <b>24</b>
          <span>OCT</span>
        </div>
        <small>A new page. A date. No explanation.</small>
      </article>
      <article className="clue-post">
        <span>
          <MessageSquare size={13} /> SOCIAL POST
        </span>
        <div className="post-quote">
          <span>“</span>
          <h3>
            A new chapter.
            <br />
            Watch this space.
          </h3>
        </div>
        <small>Another teaser in the feed.</small>
      </article>
    </div>
  );
  const connections = (
    <>
      <div className="reveal-title">
        <ScanLine size={14} />
        <span>THE CONNECTED PICTURE</span>
        <span className="reveal-example-label">
          FICTIONAL CAMPAIGN · INTERACTIVE EXAMPLE
        </span>
      </div>
      <div className="revealed-documents">
        <article>
          <span>SHARED LANGUAGE</span>
          <h3>
            The same
            <br /> launch promise.
          </h3>
          <p>A repeated message across ad creative and social content.</p>
        </article>
        <article>
          <span>SHARED TIMING</span>
          <h3>
            A date that
            <br /> connects the dots.
          </h3>
          <p>The new landing page gives the teaser activity a deadline.</p>
        </article>
        <article>
          <span>SHARED DIRECTION</span>
          <h3>
            A coordinated
            <br /> campaign.
          </h3>
          <p>Separate channels. One product launch taking shape.</p>
        </article>
      </div>
      <div className="revealed-conclusion">
        <span>THE NEXT MOVE</span>
        <p>Prepare your response before the launch.</p>
        <ArrowUpRight size={25} />
      </div>
    </>
  );

  return (
    <section className="clue-section" aria-labelledby="clue-heading">
      <div className="clue-heading">
        <h2 id="clue-heading">
          There’s more
          <br />
          than <em>meets the eye.</em>
        </h2>
        <div>
          <p>
            Three ordinary updates.
            <br />
            One extraordinary connection.
          </p>
          <span>Move your lens across the clues.</span>
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
          <span>THE PUBLIC PICTURE</span>
          <span>FICTIONAL CAMPAIGN · INTERACTIVE EXAMPLE</span>
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
                <span>THE PUBLIC PICTURE</span>
                <span>FICTIONAL CAMPAIGN · INTERACTIVE EXAMPLE</span>
              </div>
              {sources}
              <div className="clue-revealed clue-optical-picture">
                {connections}
              </div>
            </motion.div>
          </div>
          <CursorLens paused rotation={0} variant="cursor" />
        </motion.div>
        {!active && !revealed && (
          <div className="clue-idle-hint" aria-hidden="true">
            <ScanLine size={22} />
            <span>Look closer.</span>
          </div>
        )}
      </div>
      <div className="clue-footer">
        <span>OShift sees the pattern behind the posts.</span>
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
