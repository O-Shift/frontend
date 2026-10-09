"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowDown,
  AudioLines,
  Globe2,
  MessageSquare,
  Play,
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
import HeroMascotStage from "./hero-mascot-stage";

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
    "OShift collects public competitor activity across web, ads, video, social, and reviews, connects the hidden patterns, and turns them into scored opportunities with verifiable evidence attached.",
  ],
  [
    "How is this different from social listening?",
    "Listening tells you what was mentioned. OShift analyzes multi-modal signals to deduce what it means and what you can do next, with confidence ratings, strategic priorities, and direct source citations.",
  ],
  [
    "Where do the signals come from?",
    "The open web (DOM diffs), social platforms, video transcripts, public ad libraries (Meta & Google), industry news, and verified reviews. Every finding traces back to raw source captures.",
  ],
  [
    "Is it built for in-house teams or agencies?",
    "Both. Marketing teams keep a continuous standing watch on category rivals. Agencies and strategists use client workspace separation to generate pitch-ready research, battlecards, and client briefs.",
  ],
  [
    "Can I check the evidence behind an opportunity?",
    "Yes. Zero ungrounded AI hallucinations. Every single finding displays its raw citations, crawler timestamps, and confidence score so you can inspect the receipts yourself.",
  ],
  [
    "Do you offer a free trial?",
    "Yes. All plans include a 14-day full-access free trial with no credit card required to start. Setup takes under 2 minutes.",
  ],
];

interface TeamMember {
  name: string;
  role: string;
  linkedin: string;
  initials: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Ahmed Anan",
    role: "Founder & CTO",
    linkedin: "https://www.linkedin.com/in/ahmed-anan-b5431b384/",
    initials: "AA",
  },
  {
    name: "Mohamed Sheref",
    role: "Co-Founder",
    linkedin: "https://www.linkedin.com/in/mohamed-sheref-elezaly/",
    initials: "MS",
  },
  {
    name: "Noureldin Islam",
    role: "Co-Founder",
    linkedin: "https://www.linkedin.com/in/noureldinislam/",
    initials: "NI",
  },
  {
    name: "Bassel Mostafa",
    role: "Co-Founder",
    linkedin: "https://www.linkedin.com/in/bassel-gawdat/",
    initials: "BM",
  },
  {
    name: "Hend Aboelouon",
    role: "Co-Founder",
    linkedin: "https://www.linkedin.com/in/hend-abo-elouon-968995232/",
    initials: "HA",
  },
  {
    name: "Mahmoud Zahran",
    role: "Co-Founder",
    linkedin: "https://www.linkedin.com/in/mm-zahran/",
    initials: "MZ",
  },
  {
    name: "Fady Nasser",
    role: "Co-Founder",
    linkedin: "https://www.linkedin.com/in/fady-nasser-aziz/",
    initials: "FN",
  },
];

function LinkedinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28" />
    </svg>
  );
}

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
  const [annual, setAnnual] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showEvidence, setShowEvidence] = useState(false);
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();

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

      {/* Main Navigation */}
      <nav className="shift-nav" aria-label="Main navigation">
        <Brand />
        <div className="nav-center">
          <a href="#product">The product</a>
          <a href="#clues">The clue lens</a>
          <a href="#about">About us</a>
          <a href="#pricing">Pricing</a>
          <a href="#questions">FAQ</a>
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

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-navigation" id="mobile-navigation">
          <a onClick={() => setMenuOpen(false)} href="#product">
            The product <ArrowUpRight />
          </a>
          <a onClick={() => setMenuOpen(false)} href="#clues">
            The clue lens <ArrowUpRight />
          </a>
          <a onClick={() => setMenuOpen(false)} href="#about">
            About us <ArrowUpRight />
          </a>
          <a onClick={() => setMenuOpen(false)} href="#pricing">
            Pricing <ArrowUpRight />
          </a>
          <a onClick={() => setMenuOpen(false)} href="#questions">
            FAQ <ArrowUpRight />
          </a>
          <a href="/login">
            Log in <ArrowUpRight />
          </a>
        </div>
      )}

      {/* Hero Section: Editorial Headline + Investigator Mascot */}
      <header className="shift-hero" ref={heroRef} id="hero">
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
              <a className="text-button" href="#clues">
                Inspect the clues{" "}
                <span>
                  <ArrowDown size={16} />
                </span>
              </a>
            </div>
          </div>

          {/* Mascot Artwork with 6 Orbiting Source Chips & Magnifying Glass */}
          <HeroMascotStage paused={paused || !!reduced} />
        </div>

        {/* The Interactive Clue Lens Centerpiece */}
        <div className="hero-lens-stage" id="clues">
          <ClueLens paused={paused || !!reduced} />
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

      {/* Source Coverage Ribbon */}
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

      {/* Product Section */}
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

      {/* Target Audiences */}
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

      {/* Evidence & Verification Section */}
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

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="about-container" data-reveal>
          <div className="about-header">
            <span className="section-eyebrow">WHO WE ARE</span>
            <h2>
              Built for teams who
              <br />
              refuse to be <em>surprised.</em>
            </h2>
            <p className="about-lead">
              Markets don’t wait for quarterly business reviews. Your rivals test new landing pages at 2 a.m.,
              launch stealth ad campaigns on weekends, and tweak their pricing unannounced. We built OrangeShift
              to give you continuous 360° foresight—with the receipts attached.
            </p>
          </div>

          <div className="about-grid">
            <div className="about-card story-card">
              <span className="about-card-badge">THE MISSION</span>
              <h3>The Anti-Dashboard Philosophy</h3>
              <p>
                Traditional competitive intelligence is trapped between two flawed extremes:
              </p>
              <ul className="about-flaws-list">
                <li>
                  <strong>The $50,000 Slide Deck:</strong> High-priced consultants who deliver a 60-page PDF three months after your competitor has already moved on.
                </li>
                <li>
                  <strong>The Social Listening Firehose:</strong> Dashboards that dump 20,000 unranked mentions and noisy keyword alerts without a single strategic conclusion.
                </li>
              </ul>
              <p>
                OrangeShift bridges that gap. We combine autonomous 24/7 multi-modal ingestion with deep strategic reasoning. You don’t get noise; you get scored moves with direct source links.
              </p>
            </div>

            <div className="about-card principles-card">
              <span className="about-card-badge">OUR PRINCIPLES</span>
              <h3>How We Think</h3>
              <div className="principles-list">
                <div className="principle-item">
                  <div className="principle-num">01</div>
                  <div>
                    <h4>Receipts Over Rumors</h4>
                    <p>Every opportunity, battlecard, and brief links directly to raw captures (ad libraries, cached DOM diffs, video transcripts, verified reviews). Zero ungrounded AI hallucinations.</p>
                  </div>
                </div>
                <div className="principle-item">
                  <div className="principle-num">02</div>
                  <div>
                    <h4>Continuous Watch, Not Quarterly Panic</h4>
                    <p>Automated background crawlers monitor competitors around the clock. You spot moves while there is still time to prepare your counter-move.</p>
                  </div>
                </div>
                <div className="principle-item">
                  <div className="principle-num">03</div>
                  <div>
                    <h4>Strategic Playbooks, Not Vanity Mentions</h4>
                    <p>We don’t care how many times a competitor was mentioned on Twitter. We care what their product, pricing, and campaign roadmap looks like—and what you should do next.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Founding Team Grid */}
          <div className="about-team-section">
            <div className="team-header">
              <div>
                <span className="about-card-badge">THE TEAM</span>
                <h3 className="team-title">
                  The builders behind <em>OrangeShift.</em>
                </h3>
              </div>
              <p className="team-intro">
                Founders and engineers building autonomous multi-modal intelligence to uncover competitive moves before they become obvious.
              </p>
            </div>

            <div className="team-grid">
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  className={`team-card ${member.role.includes("CTO") ? "team-card-founder" : ""}`}
                >
                  <div className="team-card-top">
                    <div className="team-avatar">
                      <span>{member.initials}</span>
                    </div>
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="team-linkedin-btn"
                      aria-label={`${member.name} on LinkedIn`}
                    >
                      <LinkedinIcon />
                      <ArrowUpRight size={13} />
                    </a>
                  </div>
                  <div className="team-card-info">
                    <h4 className="team-member-name">{member.name}</h4>
                    <span className="team-member-role">{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="about-origin-strip">
            <div className="origin-badge">
              <Globe2 size={16} />
              <span>Smart Village, Giza</span>
            </div>
            <p>
              Engineering autonomous competitive intelligence engines for high-velocity marketing teams and strategists worldwide.
            </p>
            <CTA light>Join forward-looking teams</CTA>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="pricing-container" data-reveal>
          <div className="pricing-header">
            <span className="section-eyebrow">TRANSPARENT PLANS</span>
            <h2>
              Predictable investment.
              <br />
              <em>Decisive edge.</em>
            </h2>
            <p>
              Every plan includes a 14-day free trial. Start watching in under 2 minutes.
            </p>
            <div className="billing-toggle-wrapper">
              <span className={!annual ? "active-cycle" : ""}>Monthly</span>
              <button
                type="button"
                className="billing-switch"
                onClick={() => setAnnual(!annual)}
                aria-label="Toggle annual or monthly billing"
                aria-pressed={annual}
              >
                <span className={`switch-thumb ${annual ? "thumb-annual" : ""}`} />
              </button>
              <span className={annual ? "active-cycle" : ""}>
                Annual <span className="discount-pill">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="pricing-grid">
            {/* Tier 1: Scout */}
            <div className="pricing-card">
              <div className="card-top">
                <span className="tier-name">Scout</span>
                <p className="tier-desc">For solo strategists, consultants, and early-stage challengers.</p>
                <div className="price-tag">
                  <span className="currency">$</span>
                  <span className="amount">{annual ? "39" : "49"}</span>
                  <span className="period">/ month</span>
                </div>
                <small className="billing-note">{annual ? "Billed annually ($468/yr)" : "Billed monthly"}</small>
              </div>
              <ul className="tier-features">
                <li><Check size={16} /> Track up to <strong>3 competitors</strong></li>
                <li><Check size={16} /> Weekly automated AI Intelligence Brief</li>
                <li><Check size={16} /> Website change detection & DOM diffs</li>
                <li><Check size={16} /> Meta & Google Ad Library tracking</li>
                <li><Check size={16} /> 30-day historical signal archive</li>
                <li><Check size={16} /> Instant email threat alerts</li>
              </ul>
              <div className="card-cta">
                <a href="/start" className="pricing-btn">
                  <span>Start with Scout</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>

            {/* Tier 2: Intelligence (Popular) */}
            <div className="pricing-card featured-tier">
              <div className="featured-badge">MOST POPULAR</div>
              <div className="card-top">
                <span className="tier-name">Intelligence</span>
                <p className="tier-desc">For high-growth marketing teams that need to outmaneuver rivals.</p>
                <div className="price-tag">
                  <span className="currency">$</span>
                  <span className="amount">{annual ? "119" : "149"}</span>
                  <span className="period">/ month</span>
                </div>
                <small className="billing-note">{annual ? "Billed annually ($1,428/yr)" : "Billed monthly"}</small>
              </div>
              <ul className="tier-features">
                <li><Check size={16} /> Track up to <strong>10 competitors</strong></li>
                <li><Check size={16} /> <strong>24/7 multi-modal signal stream</strong></li>
                <li><Check size={16} /> Video transcription & sentiment shifts</li>
                <li><Check size={16} /> AI Scored Opportunities & Positioning Gaps</li>
                <li><Check size={16} /> Early crisis & creator partnership warnings</li>
                <li><Check size={16} /> Hermès Conversational AI Agent (streaming RAG)</li>
                <li><Check size={16} /> Unlimited Battlecard & Brief exports</li>
              </ul>
              <div className="card-cta">
                <a href="/start" className="pricing-btn featured-btn">
                  <span>Start 14-day free trial</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>

            {/* Tier 3: Agency & Enterprise */}
            <div className="pricing-card">
              <div className="card-top">
                <span className="tier-name">Agency & Enterprise</span>
                <p className="tier-desc">For agencies managing multiple clients and category leaders.</p>
                <div className="price-tag">
                  <span className="currency">$</span>
                  <span className="amount">{annual ? "319" : "399"}</span>
                  <span className="period">/ month</span>
                </div>
                <small className="billing-note">{annual ? "Billed annually ($3,828/yr)" : "Billed monthly"}</small>
              </div>
              <ul className="tier-features">
                <li><Check size={16} /> Track up to <strong>30 competitors</strong> (expandable)</li>
                <li><Check size={16} /> <strong>Multi-workspace tenant isolation</strong> per client</li>
                <li><Check size={16} /> White-label branded client reports & decks</li>
                <li><Check size={16} /> Priority Inngest crawler pipelines & SLA</li>
                <li><Check size={16} /> Custom data sources & bespoke competitor onboarding</li>
                <li><Check size={16} /> Full REST API & Webhook signal access</li>
                <li><Check size={16} /> Dedicated Intelligence Strategist & Slack channel</li>
              </ul>
              <div className="card-cta">
                <a href="/start" className="pricing-btn">
                  <span>Contact Enterprise</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>

          <div className="pricing-trust-bar">
            <span><Check size={14} /> 14-day free trial</span>
            <span><Check size={14} /> No credit card required</span>
            <span><Check size={14} /> Instant setup in &lt; 2 minutes</span>
            <span><Check size={14} /> SOC2-grade tenant isolation</span>
          </div>
        </div>
      </section>

      {/* Questions / FAQ */}
      <section id="questions" className="questions-section">
        <div data-reveal>
          <span className="section-eyebrow">FREQUENTLY ASKED</span>
          <h2>
            Good questions.
            <br />
            <em>Clear answers.</em>
          </h2>
          <p>Everything you need to know about our intelligence engine.</p>
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

      {/* Final Call to Action */}
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

      {/* Footer */}
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
          <a href="#clues">Clue Lens</a>
          <a href="#about">About</a>
          <a href="#pricing">Pricing</a>
          <a href="#questions">FAQ</a>
          <a href="/login">
            Log in <ArrowUpRight size={13} />
          </a>
          <a
            className="footer-social"
            href="https://www.linkedin.com/in/orange-shift-185b3b441"
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
