'use client';

import { useEffect } from 'react';

/**
 * All landing-page interactivity behind one requestAnimationFrame loop.
 *
 * Why one loop: a custom cursor, a pointer-tracked spotlight and a scroll
 * progress bar are three independent sources of high-frequency events. Given
 * their own listeners they each write to the DOM on every move/scroll, which
 * on a mid-range laptop turns into dropped frames. Here the listeners only
 * record numbers; a single rAF frame does the writing, and the loop parks
 * itself when nothing is moving.
 *
 * Reveals use IntersectionObserver rather than scroll math — no work on the
 * main thread until an element actually crosses the threshold.
 */
export function useLandingFx(rootRef: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const cleanups: Array<() => void> = [];

        /* ── Reveals ─────────────────────────────────────────────────────── */
        const revealTargets = root.querySelectorAll<HTMLElement>('.lp-rv, .lp-mask');
        if (reduced) {
            revealTargets.forEach((el) => el.setAttribute('data-in', '1'));
        } else {
            const io = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (!entry.isIntersecting) continue;
                        entry.target.setAttribute('data-in', '1');
                        io.unobserve(entry.target); // reveal once, then stop watching
                    }
                },
                { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
            );
            revealTargets.forEach((el) => io.observe(el));
            cleanups.push(() => io.disconnect());
        }

        /* ── Pipeline: which step is under the read-line ─────────────────── */
        const steps = Array.from(root.querySelectorAll<HTMLElement>('.lp-step'));
        const nodes = Array.from(root.querySelectorAll<SVGElement>('[data-node]'));
        const links = Array.from(root.querySelectorAll<SVGElement>('[data-link]'));
        const caps = Array.from(root.querySelectorAll<SVGElement>('[data-cap]'));
        let activeStep = -1;

        const setActiveStep = (i: number) => {
            if (i === activeStep) return;
            activeStep = i;
            steps.forEach((el, n) => el.setAttribute('data-on', n === i ? '1' : '0'));
            // Nodes/links/captions light up cumulatively — the packet has passed.
            nodes.forEach((el, n) => el.setAttribute('data-on', n <= i ? '1' : '0'));
            caps.forEach((el, n) => el.setAttribute('data-on', n <= i ? '1' : '0'));
            links.forEach((el, n) => el.setAttribute('data-on', n < i ? '1' : '0'));
        };

        if (steps.length) {
            const stepIo = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        if (!entry.isIntersecting) continue;
                        const i = steps.indexOf(entry.target as HTMLElement);
                        if (i >= 0) setActiveStep(i);
                    }
                },
                // Narrow band across the viewport middle acts as a read-head.
                { threshold: 0, rootMargin: '-42% 0px -42% 0px' },
            );
            steps.forEach((el) => stepIo.observe(el));
            cleanups.push(() => stepIo.disconnect());
            setActiveStep(0);
        }

        /* ── Shared rAF loop ─────────────────────────────────────────────── */
        const nav = root.querySelector<HTMLElement>('.lp-nav');
        const bar = root.querySelector<HTMLElement>('.lp-progress');
        const hero = root.querySelector<HTMLElement>('.lp-hero');
        const glow = root.querySelector<HTMLElement>('.lp-hero-glow');
        const dot = root.querySelector<HTMLElement>('.lp-cur-dot');
        const ring = root.querySelector<HTMLElement>('.lp-cur-ring');
        const label = root.querySelector<HTMLElement>('.lp-cur-label');

        // Pointer: target vs. rendered. The ring lerps toward the target,
        // which is what gives it weight instead of feeling glued to the dot.
        let tx = 0, ty = 0, rx = 0, ry = 0;
        let pointerDirty = false;
        let scrollDirty = true;
        let running = false;
        let raf = 0;

        const frame = () => {
            let alive = false;

            if (scrollDirty) {
                scrollDirty = false;
                const y = window.scrollY;
                const max = document.documentElement.scrollHeight - window.innerHeight;
                if (bar) bar.style.setProperty('--lp-p', String(max > 0 ? y / max : 0));
                if (nav) nav.setAttribute('data-stuck', y > 24 ? '1' : '0');
            }

            if (pointerDirty) {
                if (dot) dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;

                rx += (tx - rx) * 0.16;
                ry += (ty - ry) * 0.16;
                if (ring) ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
                if (label) label.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;

                // Keep animating until the ring has caught up.
                if (Math.abs(tx - rx) > 0.1 || Math.abs(ty - ry) > 0.1) alive = true;
                else pointerDirty = false;
            }

            if (alive || scrollDirty) {
                raf = requestAnimationFrame(frame);
            } else {
                running = false; // park the loop; no idle rAF churn
            }
        };

        const kick = () => {
            if (running) return;
            running = true;
            raf = requestAnimationFrame(frame);
        };

        const onScroll = () => {
            scrollDirty = true;
            kick();
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        cleanups.push(() => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        });
        kick();

        /* ── Cursor + spotlight (fine pointers only) ─────────────────────── */
        if (fine && !reduced) {
            root.classList.add('lp-cursor-on');

            const onMove = (e: PointerEvent) => {
                tx = e.clientX;
                ty = e.clientY;
                pointerDirty = true;
                kick();

                if (glow && hero) {
                    const r = hero.getBoundingClientRect();
                    // Only paint the spotlight while the hero is on screen.
                    if (r.bottom > 0 && r.top < window.innerHeight) {
                        glow.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
                        glow.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
                    }
                }
            };
            window.addEventListener('pointermove', onMove, { passive: true });
            cleanups.push(() => window.removeEventListener('pointermove', onMove));

            // Place the cursor before the first move so it doesn't flash at 0,0.
            tx = rx = window.innerWidth / 2;
            ty = ry = window.innerHeight / 2;
            pointerDirty = true;
            kick();

            // Hover state via delegation — one pair of listeners for the page.
            const onOver = (e: Event) => {
                const t = (e.target as HTMLElement | null)?.closest<HTMLElement>(
                    'a, button, summary, [data-cursor]',
                );
                if (!t || !ring) return;
                ring.setAttribute('data-state', t.dataset.cursor ?? 'link');
                const text = t.dataset.cursorLabel;
                if (label && text) {
                    label.textContent = text;
                    label.setAttribute('data-show', '1');
                }
            };
            const onOut = (e: Event) => {
                const t = (e.target as HTMLElement | null)?.closest<HTMLElement>(
                    'a, button, summary, [data-cursor]',
                );
                if (!t || !ring) return;
                ring.setAttribute('data-state', '');
                label?.setAttribute('data-show', '0');
            };
            root.addEventListener('pointerover', onOver);
            root.addEventListener('pointerout', onOut);
            cleanups.push(() => {
                root.removeEventListener('pointerover', onOver);
                root.removeEventListener('pointerout', onOut);
            });

            /* Per-card sheen — write CSS vars directly, no React state. */
            const cards = Array.from(root.querySelectorAll<HTMLElement>('.lp-card'));
            const onCardMove = (e: PointerEvent) => {
                const card = (e.target as HTMLElement | null)?.closest<HTMLElement>('.lp-card');
                if (!card) return;
                const r = card.getBoundingClientRect();
                card.style.setProperty('--cx', `${((e.clientX - r.left) / r.width) * 100}%`);
                card.style.setProperty('--cy', `${((e.clientY - r.top) / r.height) * 100}%`);
            };
            if (cards.length) {
                root.addEventListener('pointermove', onCardMove, { passive: true });
                cleanups.push(() => root.removeEventListener('pointermove', onCardMove));
            }

            /* Magnetic buttons — pull toward the pointer, spring back on exit. */
            const magnets = Array.from(root.querySelectorAll<HTMLElement>('[data-magnet]'));
            const magnetHandlers: Array<() => void> = [];
            for (const m of magnets) {
                const move = (e: PointerEvent) => {
                    const r = m.getBoundingClientRect();
                    const dx = e.clientX - (r.left + r.width / 2);
                    const dy = e.clientY - (r.top + r.height / 2);
                    m.style.transform = `translate3d(${dx * 0.22}px, ${dy * 0.3}px, 0)`;
                };
                const leave = () => {
                    m.style.transform = '';
                };
                m.addEventListener('pointermove', move);
                m.addEventListener('pointerleave', leave);
                magnetHandlers.push(() => {
                    m.removeEventListener('pointermove', move);
                    m.removeEventListener('pointerleave', leave);
                });
            }
            cleanups.push(() => magnetHandlers.forEach((fn) => fn()));
        }

        /* ── Count-up numbers ────────────────────────────────────────────── */
        const counters = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'));
        if (counters.length) {
            if (reduced) {
                counters.forEach((el) => {
                    el.textContent = el.dataset.count ?? '';
                });
            } else {
                const countIo = new IntersectionObserver(
                    (entries) => {
                        for (const entry of entries) {
                            if (!entry.isIntersecting) continue;
                            const el = entry.target as HTMLElement;
                            countIo.unobserve(el);
                            const to = Number(el.dataset.count ?? 0);
                            const decimals = Number(el.dataset.countDecimals ?? 0);
                            const start = performance.now();
                            const dur = 1500;
                            const tick = (now: number) => {
                                const p = Math.min(1, (now - start) / dur);
                                // easeOutExpo — fast out of the gate, long settle
                                const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
                                el.textContent = (to * eased).toFixed(decimals);
                                if (p < 1) requestAnimationFrame(tick);
                            };
                            requestAnimationFrame(tick);
                        }
                    },
                    { threshold: 0.5 },
                );
                counters.forEach((el) => countIo.observe(el));
                cleanups.push(() => countIo.disconnect());
            }
        }

        return () => {
            cancelAnimationFrame(raf);
            root.classList.remove('lp-cursor-on');
            cleanups.forEach((fn) => fn());
        };
    }, [rootRef]);
}
