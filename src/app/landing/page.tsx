"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowDown,
  AudioLines,
  Globe2,
  MessageSquare,
  Play,
  Pause,
  Plus,
  Minus,
  ScanLine,
  Sparkles,
  Menu,
  X,
  Check,
  FileText,
  Radio,
  CircleDot,
} from "lucide-react";
import "./landing.css";
import ClueLens from "./clue-lens";

const SignalLens = dynamic(() => import("./signal-lens"), {
  ssr: false,
  loading: () => (
    <div className="signal-lens" aria-hidden="true">
      <div className="lens-fallback" />
    </div>
  ),
});

const stories = [
  {
    label: "Campaigns",
    finding: "Your competitor is building toward a product launch.",
    description:
      "A new landing page. Three teaser ads. The same phrase appearing everywhere. Separate posts become one coordinated move.",
    sources: ["New product page", "Teaser ad creative", "Social announcement"],
    move: "Get your counter-campaign ready before launch day.",
    confidence: 94,
    tag: "Coordinated campaign",
    icon: Radio,
  },
  {
    label: "Positioning gaps",
    finding: "Customers want a simpler way to get started.",
    description:
      "Review after review points to complicated onboarding. OShift connects the complaints to a positioning opportunity you can actually use.",
    sources: [
      "Public customer reviews",
      "Competitor messaging",
      "Community discussion",
    ],
    move: "Make simple onboarding the center of your next campaign.",
    confidence: 89,
    tag: "Positioning opportunity",
    icon: ScanLine,
  },
  {
    label: "Partnerships",
    finding: "A creator partnership is taking shape.",
    description:
      "Recurring brand mentions. A shared audience. A change in content. See partnership patterns before the announcement makes them obvious.",
    sources: ["Creator content", "Brand mentions", "Campaign activity"],
    move: "Explore adjacent creators before the space gets crowded.",
    confidence: 87,
    tag: "Partnership signal",
    icon: CircleDot,
  },
];
const faqs = [
  [
    "What does OShift actually do?",
    "OShift collects public competitor activity, connects the patterns, and turns them into scored opportunities. Campaigns, positioning gaps, partnership motions, and emerging risks arrive with the evidence behind them.",
  ],
  [
    "How is this different from social listening?",
    "Listening tells you what was mentioned. OShift helps you understand what it means and what you can do next, with confidence, priority, and source citations attached.",
  ],
  [
    "Where do the signals come from?",
    "The open web, social platforms, video, public ad libraries, news, and public reviews. Findings trace back to the source captures they were built from.",
  ],
  [
    "Is it built for in-house teams or agencies?",
    "Both. Marketing teams can keep a standing watch on competitors. Agencies can turn the same evidence into sharper research, client briefs, and partnership strategy.",
  ],
  [
    "Can I check the evidence?",
    "Yes. Findings include source citations and confidence scores. You can follow the evidence and judge the conclusion for yourself.",
  ],
];
function Brand() {
  return (
    <Link className="shift-brand" href="/" aria-label="OShift home">
      <Image
        src="/orange logo.png"
        alt="OShift"
        width={160}
        height={53}
        preload
      />
    </Link>
  );
}
function CTA({
  children = "Start watching",
  light = false,
}: {
  children?: React.ReactNode;
  light?: boolean;
}) {
  return (
    <a href="/start" className={`shift-button ${light ? "button-dark" : ""}`}>
      <span>{children}</span>
      <ArrowUpRight size={19} aria-hidden="true" />
    </a>
  );
}
export default function LandingPage() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showEvidence, setShowEvidence] = useState(false);
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const sculptureY = useTransform(heroProgress, [0, 1], [0, 65]);
  const sculptureRotate = useTransform(heroProgress, [0, 1], [0, -9]);
  const story = stories[active];
  const StoryIcon = story.icon;
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);
  useEffect(() => {
    const sections = document.querySelectorAll(".shift-landing [data-reveal]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return (
    <main className="shift-landing" data-motion={paused ? "paused" : "playing"}>
      <a className="shift-skip" href="#product">
        Skip to product
      </a>
      <motion.div
        className="reading-progress"
        style={{ scaleX: scrollYProgress }}
        aria-hidden="true"
      />
      <nav className="shift-nav" aria-label="Main navigation">
        <Brand />
        <div className="nav-center">
          <a href="#product">The product</a>
          <a href="#possibilities">The possibilities</a>
          <a href="#questions">The questions</a>
        </div>
        <div className="nav-right">
          <a className="login-link" href="/login">
            Log in <ArrowUpRight size={14} />
          </a>
          <CTA />
          <button
            className="menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="mobile-navigation" id="mobile-navigation">
          <a onClick={() => setMenuOpen(false)} href="#product">
            The product <ArrowUpRight />
          </a>
          <a onClick={() => setMenuOpen(false)} href="#possibilities">
            The possibilities <ArrowUpRight />
          </a>
          <a onClick={() => setMenuOpen(false)} href="#questions">
            The questions <ArrowUpRight />
          </a>
          <a href="/login">
            Log in <ArrowUpRight />
          </a>
        </div>
      )}
      <header className="shift-hero" ref={heroRef}>
        <div className="hero-composition">
          <div className="hero-copy">
            <h1>
              <span className="type-mask">
                <span>Always</span>
              </span>
              <span className="type-mask">
                <span>one step</span>
              </span>
              <span className="type-mask">
                <span>
                  <em>ahead.</em>
                </span>
              </span>
            </h1>
            <p>
              Turn your competitors’ public signals
              <br />
              into actionable, evidence-backed intelligence.
            </p>
            <div className="hero-actions">
              <CTA>Find your next move</CTA>
              <a className="text-button" href="#product">
                Meet OShift{" "}
                <span>
                  <ArrowDown size={16} />
                </span>
              </a>
            </div>
          </div>
          <motion.div
            className="hero-sculpture"
            style={
              reduced || paused
                ? {}
                : { y: sculptureY, rotate: sculptureRotate }
            }
          >
            <div className="lens-orbit orbit-one" aria-hidden="true" />
            <div className="lens-orbit orbit-two" aria-hidden="true" />
            <SignalLens paused={paused || !!reduced} rotation={rotation} />
            <div className="hero-mascot">
              <Image
                src="/investigator_mascot.png"
                alt="OShift’s detective mascot connecting competitor clues"
                width={1024}
                height={1536}
                sizes="(max-width: 560px) 90vw, 42vw"
                preload
              />
            </div>
            <span className="source-chip source-web">
              <Globe2 size={14} /> Web
            </span>
            <span className="source-chip source-ads">
              <ScanLine size={14} /> Ads
            </span>
            <span className="source-chip source-social">
              <MessageSquare size={14} /> Social
            </span>
            <div className="hero-finding">
              <span className="finding-icon">
                <Sparkles size={17} />
              </span>
              <div>
                <small>THE DOTS, CONNECTED</small>
                <strong>Your next move, uncovered.</strong>
              </div>
              <ArrowUpRight size={17} />
            </div>
            <div className="lens-controls">
              <label htmlFor="lens-rotation">Explore the perspective</label>
              <input
                id="lens-rotation"
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                aria-label="Rotate the 3D signal lens"
              />
              <button
                onClick={() => setPaused(!paused)}
                aria-label={
                  paused ? "Play sculpture motion" : "Pause sculpture motion"
                }
                aria-pressed={paused}
              >
                {paused || reduced ? <Play size={13} /> : <Pause size={13} />}
              </button>
            </div>
          </motion.div>
        </div>
        <div className="hero-bottom">
          <span>
            Less noise.
            <br />
            <b>More next.</b>
          </span>
          <div className="hero-bottom-center">
            <span className="mini-signal">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>
              PUBLIC SIGNALS IN.
              <br />
              STRATEGIC OPPORTUNITIES OUT.
            </span>
          </div>
          <a href="#product" className="scroll-cue">
            Scroll to shift your perspective <ArrowDown size={16} />
          </a>
        </div>
      </header>
      <div className="source-ribbon">
        <span>THE WHOLE PICTURE.</span>
        <div>
          <Globe2 size={16} /> Web
        </div>
        <div>
          <MessageSquare size={16} /> Social
        </div>
        <div>
          <Play size={16} /> Video
        </div>
        <div>
          <ScanLine size={16} /> Paid ads
        </div>
        <div>
          <FileText size={16} /> News
        </div>
        <div>
          <Sparkles size={16} /> Reviews
        </div>
        <span>
          ONE CLEAR DIRECTION. <ArrowUpRight size={17} />
        </span>
      </div>
      <ClueLens paused={paused || !!reduced} />
      <section id="product" className="product-section">
        <div className="section-heading" data-reveal>
          <h2>
            They make noise.
            <br />
            You make <em>moves.</em>
          </h2>
          <p>
            From a thousand scattered signals to the one
            <br className="desktop-break" /> thing worth acting on. That’s the
            shift.
          </p>
        </div>
        <div
          className="story-tabs"
          role="tablist"
          aria-label="Explore example intelligence"
        >
          <span>Pick a perspective</span>
          {stories.map((item, i) => (
            <button
              key={item.label}
              role="tab"
              id={`story-tab-${i}`}
              aria-controls="story-panel"
              aria-selected={active === i}
              tabIndex={active === i ? 0 : -1}
              onClick={() => {
                setActive(i);
                setShowEvidence(false);
              }}
              onKeyDown={(e) => {
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                ) {
                  e.preventDefault();
                  const next =
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 2
                        : (i + (e.key === "ArrowRight" ? 1 : 2)) % 3;
                  setActive(next);
                  setShowEvidence(false);
                  document.getElementById(`story-tab-${next}`)?.focus();
                }
              }}
            >
              {item.label}
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
        <div
          className="story-stage"
          id="story-panel"
          role="tabpanel"
          aria-labelledby={`story-tab-${active}`}
        >
          <div className="signal-input">
            <div className="stage-label">
              <span className="status-dot" /> THE SIGNALS
            </div>
            <div className="input-stack" key={`input-${active}`}>
              {story.sources.map((source, i) => (
                <div className={`input-signal signal-${i}`} key={source}>
                  <span>
                    {i === 0 ? (
                      <Globe2 size={18} />
                    ) : i === 1 ? (
                      <ScanLine size={18} />
                    ) : (
                      <MessageSquare size={18} />
                    )}
                  </span>
                  <div>
                    <small>PUBLIC SOURCE</small>
                    <strong>{source}</strong>
                    <div className="signal-text-lines">
                      <i />
                      <i />
                    </div>
                  </div>
                  <Check size={13} />
                </div>
              ))}
            </div>
            <span className="input-caption">
              Scattered activity. Hidden context.
            </span>
          </div>
          <div className="shift-processor" aria-hidden="true">
            <div className="flow-line" />
            <div className="processor-symbol">
              <Image src="/mascot.png" alt="" width={38} height={45} />
            </div>
            <span>THE SHIFT</span>
            <div className="flow-line" />
          </div>
          <div className="signal-output" key={`output-${active}`}>
            <div className="stage-label">
              <Sparkles size={13} /> THE OPPORTUNITY
            </div>
            <div className="output-label">
              <StoryIcon size={15} />
              {story.tag}
              <span>{story.confidence}% confidence</span>
            </div>
            <h3>{story.finding}</h3>
            <p>{story.move}</p>
            <button
              className="evidence-button"
              onClick={() => setShowEvidence(!showEvidence)}
              aria-expanded={showEvidence}
            >
              <span>
                <FileText size={14} />
                {showEvidence ? "Hide evidence" : "Follow the evidence"}
              </span>
              {showEvidence ? <Minus size={16} /> : <Plus size={16} />}
            </button>
            {showEvidence && (
              <div className="evidence-details">
                <p>{story.description}</p>
                <ul>
                  {story.sources.map((source) => (
                    <li key={source}>
                      <Check size={12} />
                      {source}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <span className="illustrative-label">
              Illustrative example · not live intelligence
            </span>
          </div>
        </div>
        <div className="product-footer">
          <span>Collected. Connected. Prioritized.</span>
          <span>
            Every finding has a why. And the evidence to back it up.{" "}
            <ArrowUpRight size={15} />
          </span>
        </div>
      </section>
      <section id="possibilities" className="possibilities-section">
        <div className="possibilities-intro" data-reveal>
          <span className="crosshair" aria-hidden="true">
            <Plus size={26} />
          </span>
          <h2>
            A wider view.
            <br />A <em>sharper</em> edge.
          </h2>
          <p>
            For the people who need to know
            <br />
            what’s coming—and what to do about it.
          </p>
        </div>
        <div className="audience-list">
          <article>
            <div>
              <h3>Stay a move ahead.</h3>
              <p>
                Keep a standing watch on your competitive landscape. Spot
                campaigns, changing sentiment, and positioning gaps while
                there’s still time to act.
              </p>
              <span className="audience-tag">FOR MARKETING TEAMS</span>
            </div>
            <ArrowUpRight size={30} />
          </article>
          <article>
            <div>
              <h3>Bring a better brief.</h3>
              <p>
                Turn research into direction. Give clients a clear point of view
                on their market, emerging partnerships, and their next
                opportunity.
              </p>
              <span className="audience-tag">FOR AGENCIES & STRATEGISTS</span>
            </div>
            <ArrowUpRight size={30} />
          </article>
        </div>
      </section>
      <section className="evidence-section">
        <div className="evidence-art" aria-hidden="true">
          <div className="evidence-circle circle-a" />
          <div className="evidence-circle circle-b" />
          <div className="evidence-circle circle-c" />
          <ArrowUpRight className="evidence-arrow" strokeWidth={1} />
          <span>
            SEE THE SOURCE.
            <br />
            TRUST THE DIRECTION.
          </span>
        </div>
        <div className="evidence-copy" data-reveal>
          <h2>
            A point of view.
            <br />
            With <em>proof.</em>
          </h2>
          <p>
            Good intelligence isn’t a black box. Follow every finding back to
            its sources, see the confidence behind it, and decide your next move
            with clarity.
          </p>
          <div className="proof-details">
            <span>
              <Check size={17} /> Source citations
            </span>
            <span>
              <Check size={17} /> Confidence scores
            </span>
            <span>
              <Check size={17} /> Clear priorities
            </span>
          </div>
          <a href="#product" className="text-button">
            Explore an example{" "}
            <span>
              <ArrowUpRight size={16} />
            </span>
          </a>
        </div>
      </section>
      <section id="questions" className="questions-section">
        <div data-reveal>
          <h2>
            Good questions.
            <br />
            <em>Clear answers.</em>
          </h2>
          <p>A little more context, if you need it.</p>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer], i) => (
            <div className="faq-item" key={question}>
              <h3>
                <button
                  id={`faq-heading-${i}`}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {question}
                  <span>
                    {openFaq === i ? <Minus size={20} /> : <Plus size={20} />}
                  </span>
                </button>
              </h3>
              <div
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-heading-${i}`}
                hidden={openFaq !== i}
              >
                <p>{answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="final-cta">
        <span className="cta-star" aria-hidden="true">
          <AudioLines />
        </span>
        <h2 data-reveal>
          Your next move
          <br />
          starts with a <em>shift.</em>
        </h2>
        <CTA light>See what comes next</CTA>
        <p>Competitive intelligence for teams that look ahead.</p>
        <div className="cta-orbit" aria-hidden="true" />
      </section>
      <footer
        className="shift-footer"
        itemScope
        itemType="https://schema.org/Organization"
      >
        <div className="footer-brand">
          <Brand />
          <span>A different perspective changes everything.</span>
        </div>
        <div className="footer-business">
          <strong itemProp="name">OrangeShift</strong>
          <address
            itemProp="address"
            itemScope
            itemType="https://schema.org/PostalAddress"
          >
            <span itemProp="streetAddress">
              Smart Village, KM 28 Cairo-Alexandria Desert Road, Giza
            </span>
            <br />
            <span itemProp="addressLocality">El Sheikh Zayed</span>,{" "}
            <span itemProp="addressRegion">Giza</span>{" "}
            <span itemProp="postalCode">12577</span>
            <br />
            <span itemProp="addressCountry">Egypt</span>
          </address>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="#product">Product</a>
          <a href="#questions">Questions</a>
          <a href="/login">
            Log in <ArrowUpRight size={13} />
          </a>
          <a
            className="footer-social"
            href="https://www.linkedin.com/company/orangeshift/"
            itemProp="sameAs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="OrangeShift on LinkedIn (opens in a new tab)"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96C2 21.32 2.69 22 3.55 22h16.9c.86 0 1.55-.68 1.55-1.52V3.52C22 2.68 21.31 2 20.45 2ZM7.93 18.75H4.98V9.2h2.95v9.55ZM6.45 7.9a1.71 1.71 0 1 1 0-3.42 1.71 1.71 0 0 1 0 3.42Zm12.3 10.85H15.8V14.1c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.73H9.51V9.2h2.83v1.3h.04c.4-.75 1.36-1.55 2.79-1.55 2.98 0 3.58 1.96 3.58 4.5v5.3Z" />
            </svg>
            <span>LinkedIn</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </nav>
        <span className="footer-copyright">
          © {new Date().getFullYear()} OrangeShift
        </span>
      </footer>
    </main>
  );
}
