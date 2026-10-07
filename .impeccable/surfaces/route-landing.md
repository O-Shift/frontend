---
version: 1
slug: "route-landing"
primary_target: "route:/landing"
related_targets: ["src/app/landing/page.tsx", "src/app/landing/landing.css", "src/app/landing/signal-lens.tsx", "src/app/landing/layout.tsx", "src/app/landing/clue-lens.tsx"]
---

# Landing surface brief

The landing experience is published at the public hostname's `/`, with `/landing` retained as a development alias and redirected to the canonical homepage on production hosts. Visitors are marketing teams and agencies arriving to understand OShift and begin watching competitors. The page explains the passage from public activity to scored opportunities with evidence. Primary actions use `/start`, which routes to signup, login, or workspace selection on app.orangeshift.net according to a verified session and returning-browser preference. Explicit login links remain login actions. Deployment requirements are in docs/landing-domain-launch.md.

The first viewport pairs the authentic “Always one step ahead.” slogan and signup action with `/investigator_mascot.png`. Navigation and footer use `/orange logo.png`; the product processor uses `/mascot.png`. Brand orange is #ff5a00. Source chips and a pale finding accompany the investigator; the optical lens is subdued behind it. The memorable interaction is a real Three.js sculpture with mouse perspective and keyboard range rotation, an explicit pause control, offscreen/document visibility gating, reduced-motion support, and a CSS fallback. The experience retains native scrolling; masked headline entrances and supported CSS view-timeline reveals pace the chapters.

The sequence is hero, source ribbon, interactive clue board, interactive product explanation, both audience use cases, evidence chapter, FAQ, final action, and footer. The clue board presents explicitly fictional ad, website, and social artifacts. A true Three.js cursor magnifier reveals the shared language, timing, and campaign direction through a mouse-following aperture on fine-pointer desktop devices. The “Reveal the connections” control exposes the full explanation for touch and keyboard users. Landing-scoped html/body :has(.shift-landing) overrides release the root application body scroll lock without changing other routes. Three product tabs show illustrative campaign, positioning, and partnership findings. Evidence disclosure explains their sample inputs; scores are examples, not measured commercial proof. No customer counts, invented testimonials, or pricing have been supplied.

Authority is code-led: the current route implementation and the confirmed signal-lens direction. `seed4c75ee8c` was exploratory FORM output; no catalog world or approved comp was adopted. There is no approved-card or measured-comp contract to fabricate.

Finish review corrections are incorporated: stronger paper text contrast, removed hero-topline eyebrow, removed audience numbers, and hero tracking restored to -0.04em. The final revision passed production build, TypeScript, targeted ESLint, and diff whitespace checks. The existing 80 tests passed during the redesign. Native wheel scrolling was verified down and up on desktop and down at mobile width; the mobile reveal control was verified with Enter, with no horizontal document overflow. Current branded hero and lens screenshots are saved under .impeccable/review. Reduced-motion behavior is source-reviewed, not browser-emulated.

The design does not replace the application shell, global tokens, authentication UI, or other routes. Future changes should retain the explicit illustrative boundary and route scope. No unresolved visual-world or comp approval decision is implied by this record.
