'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import './landing.css';
import { useLandingFx } from './use-landing-fx';

/* ──────────────────────────────────────────────────────────────────────────
   Hero signal field. Canvas 2D rather than WebGL: this runs behind text on
   whatever machine a visitor brings, and a few dozen points with proximity
   links costs a fraction of a three.js scene. Pauses when scrolled away.
   ────────────────────────────────────────────────────────────────────────── */
function SignalField() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let w = 0;
        let h = 0;
        let raf = 0;
        let visible = true;

        type P = { x: number; y: number; vx: number; vy: number; r: number };
        let pts: P[] = [];

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Scale point count to area so a phone doesn't render a desktop field.
            const n = Math.max(22, Math.min(52, Math.round((w * h) / 26000)));
            pts = Array.from({ length: n }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.14,
                vy: (Math.random() - 0.5) * 0.14,
                r: Math.random() * 1.3 + 0.5,
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, w, h);

            for (const p of pts) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            }

            // Proximity links. O(n²) is fine at n ≤ 52.
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 > 21000) continue;
                    ctx.strokeStyle = `rgba(255,255,255,${0.13 * (1 - d2 / 21000)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(pts[i].x, pts[i].y);
                    ctx.lineTo(pts[j].x, pts[j].y);
                    ctx.stroke();
                }
            }

            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                // Every seventh point burns accent — a "live signal" in the field.
                ctx.fillStyle = i % 7 === 0 ? 'rgba(255,90,0,0.85)' : 'rgba(255,255,255,0.42)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            raf = requestAnimationFrame(draw);
        };

        resize();
        raf = requestAnimationFrame(draw);
        window.addEventListener('resize', resize);

        // Stop the loop entirely once the hero leaves the viewport.
        const io = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting === visible) return;
                visible = e.isIntersecting;
                if (visible) raf = requestAnimationFrame(draw);
                else cancelAnimationFrame(raf);
            },
            { threshold: 0 },
        );
        io.observe(canvas);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
            io.disconnect();
        };
    }, []);

    return <canvas ref={ref} className="lp-hero-canvas" aria-hidden="true" />;
}

/* ── Content ─────────────────────────────────────────────────────────────── */

const PIPELINE = [
    {
        k: 'Collect',
        h: 'Watch everything they ship',
        p: 'Collectors run continuously across the open web, social, video, paid ads, news, and review platforms. Every competitor you name becomes a standing watch — no dashboards to refresh, no alerts to configure.',
        tags: ['web', 'social', 'video', 'ads', 'reviews', 'news'],
    },
    {
        k: 'Normalize',
        h: 'One shape for every source',
        p: 'Raw captures land in a normalizer that resolves entities, strips duplicates across platforms, and reduces everything to a single canonical signal record. A press mention and a Reddit thread end up comparable.',
        tags: ['entity resolution', 'dedupe', 'canonical signals'],
    },
    {
        k: 'Analyze',
        h: 'Read the pattern, not the post',
        p: 'Dedicated analyzers look for the things that actually move a market: coordinated campaigns, positioning gaps, brewing crises, partnership motions, and the psychology underneath negative sentiment.',
        tags: ['campaigns', 'gaps', 'crises', 'deals', 'sentiment', 'trends'],
    },
    {
        k: 'Score',
        h: 'Rank by consequence',
        p: 'Every finding carries a confidence value and a priority score derived from the evidence behind it. Layers separate what is merely interesting from what needs an answer this week.',
        tags: ['confidence', 'priority', 'gap · act now · alarm'],
    },
    {
        k: 'Surface',
        h: 'Findings become moves',
        p: 'Scored signals resolve into opportunities with a stated impact, an effort estimate, and the reasoning that produced them. Each one traces back to the source captures it was built from.',
        tags: ['impact', 'effort', 'reasoning', 'citations'],
    },
    {
        k: 'Act',
        h: 'Out of the tool, into the work',
        p: 'Briefs, exports, and alerts push conclusions where your team already works. Automation runs the whole loop on a schedule so the intelligence arrives before anyone thinks to ask for it.',
        tags: ['briefs', 'exports', 'alerts', 'automation'],
    },
];

const FAQ = [
    {
        q: 'How is this different from a social listening tool?',
        a: 'Listening tools return volume — mentions, reach, share of voice. OShift returns conclusions. The pipeline reduces raw captures to scored opportunities with stated impact, effort, and the citations behind them. You are reading a decision, not a chart.',
    },
    {
        q: 'Where does the data actually come from?',
        a: 'Public sources only: the open web, social platforms, video, paid ad libraries, news, and public review platforms. Nothing is scraped from behind a login, and every finding links back to the captures it was built from so you can check the work.',
    },
    {
        q: 'What happens when the model is not confident?',
        a: 'It says so. Every gap, campaign, and opportunity carries an explicit confidence value, and low-confidence findings are ranked accordingly rather than quietly presented as fact. Anything with no evidence behind it does not ship.',
    },
    {
        q: 'How long until it is useful?',
        a: 'Name your competitors and the first collection pass begins immediately. Early signals appear within the hour; the pattern analyzers need a few days of history before campaign and trend detection carry real weight.',
    },
    {
        q: 'Is my workspace data isolated?',
        a: 'Yes. Every row is scoped to a workspace and enforced at the database level with row-level security, not just in application code. A query from one workspace cannot return another workspace’s rows even if the application layer is wrong.',
    },
];

export default function LandingPage() {
    const rootRef = useRef<HTMLDivElement>(null);
    useLandingFx(rootRef);

    // Six nodes on a circle, r=118 about (200,200), starting at 12 o’clock.
    const nodes = [
        [200, 82],
        [302.2, 141],
        [302.2, 259],
        [200, 318],
        [97.8, 259],
        [97.8, 141],
    ];
    const caps = [
        [200, 45],
        [334, 120],
        [334, 282],
        [200, 357],
        [66, 282],
        [66, 120],
    ];

    return (
        <div className="lp" ref={rootRef}>
            <div className="lp-progress" />

            {/* Custom cursor. aria-hidden — it is pure decoration over the real one. */}
            <div className="lp-cur lp-cur-ring" aria-hidden="true" />
            <div className="lp-cur lp-cur-dot" aria-hidden="true" />
            <div className="lp-cur-label" aria-hidden="true" />

            {/* ── Nav ─────────────────────────────────────────────────────── */}
            <nav className="lp-nav" data-stuck="0">
                <div className="lp-shell lp-nav-in">
                    <Link href="/landing" className="lp-brand">
                        <i />
                        OShift
                    </Link>
                    <div className="lp-nav-links">
                        <a className="lp-nav-link" href="#pipeline">Pipeline</a>
                        <a className="lp-nav-link" href="#surface">Surface</a>
                        <a className="lp-nav-link" href="#proof">Proof</a>
                        <a className="lp-nav-link" href="#faq">FAQ</a>
                    </div>
                    <div className="lp-nav-cta">
                        <Link href="/login" className="lp-btn lp-btn-ghost">Sign in</Link>
                        <Link
                            href="/signup"
                            className="lp-btn lp-btn-solid"
                            data-magnet
                            data-cursor-label="Go"
                        >
                            Start watching
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero ────────────────────────────────────────────────────── */}
            <header className="lp-hero">
                <div className="lp-hero-glow" />
                <SignalField />
                <div className="lp-grid-lines" aria-hidden="true">
                    <span /><span /><span /><span />
                </div>

                <div className="lp-shell" style={{ position: 'relative' }}>
                    <div className="lp-rv" style={{ ['--rv-y' as string]: '10px' }}>
                        <span className="lp-eyebrow">
                            <b>●</b> Competitive intelligence, continuously
                        </span>
                    </div>

                    <h1 className="lp-display lp-hero-head">
                        <span className="lp-mask"><span>Your competitors</span></span>
                        <span className="lp-mask" style={{ ['--rv-d' as string]: '90ms' }}>
                            <span>are telling you</span>
                        </span>
                        <span className="lp-mask" style={{ ['--rv-d' as string]: '180ms' }}>
                            <span>
                                <em style={{ fontStyle: 'normal' }} className="lp-accent">everything.</em>
                            </span>
                        </span>
                    </h1>

                    <div className="lp-rv" style={{ ['--rv-d' as string]: '300ms' }}>
                        <p className="lp-lede">
                            Every launch, every price change, every angry review is public. The problem was
                            never access — it was that reading all of it, every day, across every platform,
                            is not a job a person can hold. OShift holds it.
                        </p>
                    </div>

                    <div className="lp-rv lp-hero-foot" style={{ ['--rv-d' as string]: '400ms' }}>
                        <Link
                            href="/signup"
                            className="lp-btn lp-btn-solid lp-btn-lg"
                            data-magnet
                            data-cursor-label="Start"
                        >
                            Start watching
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                        <a href="#pipeline" className="lp-btn lp-btn-ghost lp-btn-lg">
                            See how it works
                        </a>
                    </div>

                    <dl className="lp-rv lp-hero-meta" style={{ ['--rv-d' as string]: '520ms' }}>
                        <div>
                            <dt>Sources</dt>
                            <dd>Web, social, video, paid ads, news, reviews</dd>
                        </div>
                        <div>
                            <dt>Output</dt>
                            <dd>Scored opportunities, not raw mentions</dd>
                        </div>
                        <div>
                            <dt>Cadence</dt>
                            <dd>Continuous collection, scheduled briefs</dd>
                        </div>
                        <div>
                            <dt>Evidence</dt>
                            <dd>Every claim cites the capture behind it</dd>
                        </div>
                    </dl>
                </div>
            </header>

            {/* ── Marquee ─────────────────────────────────────────────────── */}
            <div className="lp-marquee" aria-hidden="true">
                {[0, 1].map((dup) => (
                    <div className="lp-marquee-track" key={dup}>
                        {[
                            'Positioning gaps', 'Coordinated campaigns', 'Price moves', 'Crisis signals',
                            'Partnership motions', 'Review sentiment', 'Ad creative shifts', 'Launch detection',
                            'Narrative drift', 'Share-of-voice swings',
                        ].map((t) => (
                            <span className="lp-marquee-item" key={t}><s />{t}</span>
                        ))}
                    </div>
                ))}
            </div>

            {/* ── Pipeline ────────────────────────────────────────────────── */}
            <section className="lp-section" id="pipeline">
                <div className="lp-grid-lines" aria-hidden="true">
                    <span /><span /><span /><span />
                </div>
                <div className="lp-shell" style={{ position: 'relative' }}>
                    <div className="lp-head">
                        <div className="lp-head-t">
                            <span className="lp-eyebrow lp-rv">01 — The pipeline</span>
                            <h2 className="lp-h2">
                                <span className="lp-mask"><span>Six stages between</span></span>
                                <span className="lp-mask" style={{ ['--rv-d' as string]: '80ms' }}>
                                    <span>noise and a decision.</span>
                                </span>
                            </h2>
                        </div>
                        <div className="lp-rv" style={{ ['--rv-d' as string]: '160ms' }}>
                            <p className="lp-body">
                                Most tools stop at stage one and hand you a firehose. The work that matters
                                is everything after it — and it is the part nobody wants to do by hand.
                            </p>
                        </div>
                    </div>

                    <div className="lp-pipe">
                        <div className="lp-pipe-sticky">
                            <div className="lp-pipe-stage lp-rv">
                                <svg viewBox="0 0 400 400" aria-hidden="true">
                                    <circle className="lp-pipe-ring" cx="200" cy="200" r="118" />
                                    <circle className="lp-pipe-ring" cx="200" cy="200" r="76" opacity="0.55" />
                                    <circle className="lp-pipe-ring" cx="200" cy="200" r="34" opacity="0.3" />

                                    {nodes.slice(0, -1).map((n, i) => {
                                        const next = nodes[i + 1];
                                        return (
                                            <path
                                                key={`l${i}`}
                                                data-link=""
                                                data-on="0"
                                                className="lp-pipe-link"
                                                fill="none"
                                                d={`M ${n[0]} ${n[1]} A 118 118 0 0 1 ${next[0]} ${next[1]}`}
                                            />
                                        );
                                    })}

                                    {nodes.map((n, i) => (
                                        <circle
                                            key={`n${i}`}
                                            data-node=""
                                            data-on="0"
                                            className="lp-pipe-node"
                                            cx={n[0]}
                                            cy={n[1]}
                                            r="9"
                                        />
                                    ))}

                                    {caps.map((c, i) => (
                                        <text
                                            key={`c${i}`}
                                            data-cap=""
                                            data-on="0"
                                            className="lp-pipe-cap"
                                            x={c[0]}
                                            y={c[1]}
                                            textAnchor="middle"
                                        >
                                            {PIPELINE[i].k}
                                        </text>
                                    ))}

                                    <text
                                        x="200"
                                        y="196"
                                        textAnchor="middle"
                                        fill="currentColor"
                                        style={{ fontSize: 11, opacity: 0.5, letterSpacing: '0.14em' }}
                                    >
                                        OSHIFT
                                    </text>
                                    <text
                                        x="200"
                                        y="212"
                                        textAnchor="middle"
                                        fill="currentColor"
                                        style={{ fontSize: 8.5, opacity: 0.3, letterSpacing: '0.1em' }}
                                    >
                                        PIPELINE v1
                                    </text>
                                </svg>
                            </div>
                        </div>

                        <div className="lp-pipe-steps">
                            {PIPELINE.map((s, i) => (
                                <article className="lp-step" data-on="0" key={s.k}>
                                    <div className="lp-step-n">{String(i + 1).padStart(2, '0')}</div>
                                    <div className="lp-step-b">
                                        <h3>{s.h}</h3>
                                        <p>{s.p}</p>
                                        <div className="lp-step-tags">
                                            {s.tags.map((t) => (
                                                <span className="lp-tag" key={t}>{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Surface / bento ─────────────────────────────────────────── */}
            <section className="lp-section" id="surface">
                <div className="lp-shell">
                    <div className="lp-head">
                        <div className="lp-head-t">
                            <span className="lp-eyebrow lp-rv">02 — What you get</span>
                            <h2 className="lp-h2">
                                <span className="lp-mask"><span>Answers with</span></span>
                                <span className="lp-mask" style={{ ['--rv-d' as string]: '80ms' }}>
                                    <span>receipts attached.</span>
                                </span>
                            </h2>
                        </div>
                        <div className="lp-rv" style={{ ['--rv-d' as string]: '160ms' }}>
                            <p className="lp-body">
                                Nothing here is a vibe. Every card in the product traces to captures with
                                timestamps, and anything the pipeline cannot support with evidence is
                                labelled rather than dressed up.
                            </p>
                        </div>
                    </div>

                    <div className="lp-bento">
                        <div className="lp-card lp-rv" data-span="4">
                            <div className="lp-card-i">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 16 16 12 12 8" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                </svg>
                            </div>
                            <h3>Ranked opportunities</h3>
                            <p>
                                Scored by priority, tagged with impact and effort, and carrying the
                                reasoning that produced them. Sorted so the top of the list is the thing
                                to do next.
                            </p>
                            <div className="lp-bars">
                                {[38, 52, 44, 71, 63, 88, 74, 96, 82, 58, 47, 35].map((v, i) => (
                                    <i
                                        key={i}
                                        data-hi={v > 80 ? '1' : '0'}
                                        style={{ height: `${v}%`, ['--bd' as string]: `${i * 48}ms` }}
                                    />
                                ))}
                            </div>
                            <div className="lp-card-foot">
                                <span className="lp-mono">PRIORITY DISTRIBUTION</span>
                                <span className="lp-mono lp-accent">HIGH · 4</span>
                            </div>
                        </div>

                        <div className="lp-card lp-rv" data-span="2" style={{ ['--rv-d' as string]: '80ms' }}>
                            <div className="lp-card-i">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2 2 7l10 5 10-5-10-5z" />
                                    <polyline points="2 17 12 22 22 17" />
                                    <polyline points="2 12 12 17 22 12" />
                                </svg>
                            </div>
                            <h3>Positioning gaps</h3>
                            <p>
                                Where the market is asking for something nobody is answering — separated
                                into what to watch and what to act on now.
                            </p>
                            <div className="lp-card-foot">
                                <span className="lp-mono">3 LAYERS</span>
                                <span className="lp-mono">GAP · ACT · ALARM</span>
                            </div>
                        </div>

                        <div className="lp-card lp-rv" data-span="2" style={{ ['--rv-d' as string]: '40ms' }}>
                            <div className="lp-card-i">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <h3>Review sentiment</h3>
                            <p>
                                Aggregate rating movement across platforms, plus the specific complaints
                                driving it.
                            </p>
                            <div className="lp-meter">
                                <i style={{ width: '58%', background: '#22c55e', ['--bd' as string]: '0ms' }} />
                                <i style={{ width: '24%', background: '#8b8b93', ['--bd' as string]: '120ms' }} />
                                <i style={{ width: '18%', background: '#ff5a00', ['--bd' as string]: '240ms' }} />
                            </div>
                            <div className="lp-card-foot">
                                <span className="lp-mono">POSITIVE 58%</span>
                                <span className="lp-mono">CRITICAL 18%</span>
                            </div>
                        </div>

                        <div className="lp-card lp-rv" data-span="4" style={{ ['--rv-d' as string]: '120ms' }}>
                            <div className="lp-card-i">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="6" />
                                    <circle cx="12" cy="12" r="2" />
                                </svg>
                            </div>
                            <h3>Detected campaigns</h3>
                            <p>
                                Clusters of coordinated activity assembled from individual posts — themes,
                                date range, and every capture that supports the read.
                            </p>
                            <div className="lp-rows">
                                {[
                                    ['#22c55e', 'Enterprise pivot messaging', '14 posts'],
                                    ['#ff5a00', 'Aggressive pricing push', '31 posts'],
                                    ['#8b8b93', 'Developer community play', '9 posts'],
                                ].map(([c, t, n]) => (
                                    <div className="lp-row" key={t}>
                                        <span className="lp-dot" style={{ background: c }} />
                                        {t}
                                        <b>{n}</b>
                                    </div>
                                ))}
                            </div>
                            <div className="lp-card-foot">
                                <span className="lp-mono">CONFIDENCE-WEIGHTED</span>
                                <span className="lp-mono lp-accent">LIVE</span>
                            </div>
                        </div>

                        <div className="lp-card lp-rv" data-span="3" style={{ ['--rv-d' as string]: '60ms' }}>
                            <div className="lp-card-i">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                    <polyline points="16 6 12 2 8 6" />
                                    <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                            </div>
                            <h3>Briefs, exports, alerts</h3>
                            <p>
                                Conclusions arrive where your team already works, on a schedule you set.
                                Nobody has to remember to open a dashboard.
                            </p>
                            <div className="lp-card-foot">
                                <span className="lp-mono">SCHEDULED</span>
                                <span className="lp-mono">AUTOMATION v1</span>
                            </div>
                        </div>

                        <div className="lp-card lp-rv" data-span="3" style={{ ['--rv-d' as string]: '100ms' }}>
                            <div className="lp-card-i">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h3>Workspace isolation</h3>
                            <p>
                                Row-level security enforced in the database, not just the application
                                layer. One workspace cannot read another’s rows.
                            </p>
                            <div className="lp-card-foot">
                                <span className="lp-mono">POSTGRES RLS</span>
                                <span className="lp-mono">TENANT-SCOPED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Proof / numbers ─────────────────────────────────────────── */}
            <section className="lp-section" id="proof">
                <div className="lp-shell">
                    <div className="lp-nums lp-rv">
                        {[
                            { v: '6', d: 0, s: '', l: 'Source classes collected continuously — web, social, video, ads, news, reviews.' },
                            { v: '17', d: 0, s: '', l: 'Analysis services running over every normalized signal.' },
                            { v: '100', d: 0, s: '%', l: 'Findings carrying an explicit confidence value and source citations.' },
                            { v: '0', d: 0, s: '', l: 'Conclusions shipped without evidence behind them.' },
                        ].map((n) => (
                            <div className="lp-num" key={n.l}>
                                <div className="lp-num-v">
                                    <span data-count={n.v} data-count-decimals={n.d}>0</span>
                                    {n.s && <s>{n.s}</s>}
                                </div>
                                <div className="lp-num-l">{n.l}</div>
                            </div>
                        ))}
                    </div>

                    <div className="lp-split" style={{ marginTop: 'clamp(48px, 7vw, 96px)' }}>
                        <div className="lp-rv">
                            <span className="lp-eyebrow" style={{ marginBottom: 20, display: 'inline-flex' }}>
                                03 — The principle
                            </span>
                            <h2 className="lp-h2" style={{ marginBottom: 24 }}>
                                We would rather say
                                <br />
                                <span className="lp-accent">“we don’t know”</span> than guess.
                            </h2>
                            <p className="lp-body" style={{ maxWidth: '46ch', marginBottom: 18 }}>
                                It is trivial to build a tool that always has an answer. Generate a
                                confident paragraph, attach a number that looks precise, and ship it. Most
                                of this category works exactly that way, and the output is unfalsifiable.
                            </p>
                            <p className="lp-body" style={{ maxWidth: '46ch' }}>
                                We took the harder position. If the pipeline has no evidence for a claim,
                                the claim does not appear. If a metric has no source in the data, the
                                interface says so plainly instead of inventing a plausible number. You can
                                check every conclusion against the captures it came from — which means you
                                can catch us being wrong.
                            </p>
                        </div>

                        <div className="lp-quote lp-rv" style={{ ['--rv-d' as string]: '120ms' }}>
                            <blockquote>
                                “The competitive review used to take a full day every month, and it was
                                stale by the time it was written. Now the argument in the room is about
                                what to do — not about what happened.”
                            </blockquote>
                            <div className="lp-quote-by">
                                <span className="lp-avatar">M</span>
                                <div>
                                    <strong>Head of Product Marketing</strong>
                                    <span>Early access · B2B SaaS</span>
                                </div>
                            </div>
                            <p className="lp-mono" style={{ marginTop: 22, opacity: 0.65 }}>
                                Early-access feedback. Named references available on request.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ─────────────────────────────────────────────────────── */}
            <section className="lp-section" id="faq">
                <div className="lp-shell">
                    <div className="lp-head">
                        <div className="lp-head-t">
                            <span className="lp-eyebrow lp-rv">04 — Questions</span>
                            <h2 className="lp-h2">
                                <span className="lp-mask"><span>The things people</span></span>
                                <span className="lp-mask" style={{ ['--rv-d' as string]: '80ms' }}>
                                    <span>actually ask.</span>
                                </span>
                            </h2>
                        </div>
                    </div>

                    <div className="lp-faq lp-rv">
                        {FAQ.map((f) => (
                            <details key={f.q}>
                                <summary>
                                    {f.q}
                                    <span className="lp-faq-x" aria-hidden="true" />
                                </summary>
                                <p className="lp-faq-a">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Closing CTA ─────────────────────────────────────────────── */}
            <section className="lp-cta">
                <div className="lp-shell">
                    <h2 className="lp-display lp-rv">
                        Stop finding out
                        <br />
                        <span className="lp-accent">second.</span>
                    </h2>
                    <div className="lp-rv" style={{ ['--rv-d' as string]: '120ms' }}>
                        <p className="lp-lede" style={{ margin: '26px auto 0', textAlign: 'center' }}>
                            Name your competitors. Collection starts immediately.
                        </p>
                    </div>
                    <div className="lp-cta-row lp-rv" style={{ ['--rv-d' as string]: '200ms' }}>
                        <Link
                            href="/signup"
                            className="lp-btn lp-btn-solid lp-btn-lg"
                            data-magnet
                            data-cursor-label="Start"
                        >
                            Start watching
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                        <Link href="/login" className="lp-btn lp-btn-ghost lp-btn-lg">
                            Sign in
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <footer className="lp-foot">
                <div className="lp-shell">
                    <div className="lp-foot-top">
                        <div>
                            <Link href="/landing" className="lp-brand" style={{ marginBottom: 14 }}>
                                <i />
                                OShift
                            </Link>
                            <p className="lp-body" style={{ maxWidth: '30ch', fontSize: 13.5 }}>
                                Competitive intelligence that reads the whole market so your team can read
                                one page.
                            </p>
                        </div>
                        <div>
                            <h4>Product</h4>
                            <ul>
                                <li><a href="#pipeline">Pipeline</a></li>
                                <li><a href="#surface">Capabilities</a></li>
                                <li><a href="#proof">Principles</a></li>
                                <li><a href="#faq">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Account</h4>
                            <ul>
                                <li><Link href="/login">Sign in</Link></li>
                                <li><Link href="/signup">Create account</Link></li>
                                <li><Link href="/forgot-password">Reset password</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4>Company</h4>
                            <ul>
                                <li><a href="mailto:hello@oshift.app">Contact</a></li>
                                <li><a href="#faq">Data sources</a></li>
                                <li><a href="#proof">Security</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="lp-foot-bot">
                        <span className="lp-mono">© {new Date().getFullYear()} OSHIFT — ALL RIGHTS RESERVED</span>
                        <span className="lp-mono">BUILT FOR TEAMS WHO REFUSE TO BE SURPRISED</span>
                    </div>

                    <span className="lp-wordmark" aria-hidden="true">OSHIFT</span>
                </div>
            </footer>
        </div>
    );
}
