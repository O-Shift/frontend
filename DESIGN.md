---
name: OShift Landing
description: The signal lens — public activity becomes a clear opportunity.
colors:
  ink: "#141413"
  paper: "#f2f0e9"
  orange: "#ff5a00"
  muted: "#a7a59d"
  line: "#353530"
  paper-caption: "#625c50"
  source-surface: "#faf8f1"
  opportunity-surface: "#e7e3d9"
typography:
  display:
    fontFamily: '"Shift Grotesk", var(--font-inter), sans-serif'
    fontSize: "clamp(70px, 7.35vw, 128px)"
    fontWeight: 400
    lineHeight: 1.01
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Shift Grotesk", var(--font-inter), sans-serif'
    fontSize: "clamp(40px, 4.6vw, 76px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  emphasis:
    fontFamily: '"Shift Serif", serif'
    fontWeight: 400
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Shift Grotesk", var(--font-inter), sans-serif'
    fontSize: "15px"
    lineHeight: 1.6
rounded:
  pill: "100px"
  source: "9px"
  opportunity: "12px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "15px 23px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "15px 23px"
  source-card:
    backgroundColor: "{colors.source-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.source}"
    padding: "19px 17px"
  opportunity-card:
    backgroundColor: "{colors.opportunity-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.opportunity}"
    padding: "27px 28px"
---

# Design System: OShift Landing

## Overview

**Creative North Star: "The signal lens"**

**Boundary: `/landing` only.** This records the implemented marketing route, not a replacement for the application's design system. The source of truth is `src/app/landing/landing.css`, `page.tsx`, `signal-lens.tsx`, `clue-lens.tsx`, and `layout.tsx`. Route-local properties live on `.shift-landing`; the enclosing layout pins the dark theme while the page itself alternates ink and paper chapters.

OShift’s authentic orange logo and investigator mascot own the identity. The hero states “Always one step ahead.” beside the supplied investigator artwork; a subdued optical scene supports it. Warm ink and paper chapters explain public clues becoming connected intelligence and scored opportunities. Product meaning remains readable independently of motion or WebGL.

**Key Characteristics:**

- Oversized regular grotesk with italic serif emphasis.
- Alternating dark and paper fields, with visible contrast for supporting text.
- Orange actions and optical material; fine dividers and modestly rounded evidence surfaces.
- Native scrolling, responsive layouts, and accessible interactive controls.

## Colors

### Primary

The existing brand orange connects the authentic logo, primary actions, and emphasized dark-field words. The Three.js lens has its own warm material shading. On paper, emphasized headings use a deeper orange treatment from the stylesheet for legibility.

### Neutral

Ink and warm paper alternate as background and foreground. Muted text and line belong to dark chapters; paper-caption belongs to the paper demo. Source-surface is the brighter layered input, while opportunity-surface differentiates the consolidated finding.

**The Field Contrast Rule.** Preserve the implemented paper-text contrast; do not transfer dark-field muted text onto paper.

## Typography

**Display and body:** Space Grotesk, locally loaded as Shift Grotesk (regular and bold), falling back to the application's Inter variable and sans-serif. **Emphasis:** Instrument Serif italic, locally loaded as Shift Serif, falling back to serif.

The grotesk supplies clear statements and operational UI; the serif changes the voice of selected headline words. Hero emphasis is larger than surrounding type (1.19em); body copy stays grotesk. The base type roles above describe desktop defaults, not a universal scale for other routes.

Hero copy uses a restrained tight tracking (-0.04em), a near-solid line height, and masked line entrances. At narrow phone widths, the hero switches to `clamp(53px, 13vw, 78px)` with line height (1.03); chapter headings use viewport sizing. Small source and score labels are informational UI, not an invitation to add decorative eyebrows.

## Layout

The desktop hero pairs the slogan and investigator mascot in a near-even grid (1.05fr / 1fr), within a maximum width (1920px). Navigation and hero use viewport gutters (4.5vw); later chapters generally use (6vw). The product explanation is a three-part source / processor / opportunity grid (1fr / 0.35fr / 1.1fr). Audience and evidence chapters use broad split compositions.

Breakpoints occur at (1100px), (800px), and (560px), with an expanded hero at (1700px). At the smallest breakpoint the hero and product flow stack, tabs wrap, audience and FAQ layouts become single columns, and the footer wraps. Contain the moving sculpture within its chapter so viewport width does not produce horizontal scrolling.

Landing-only `html:has(.shift-landing)` and `body:has(.shift-landing)` rules release the application body scroll lock. Native page scrolling drives the reading-progress bar and a modest hero sculpture translation/rotation. Where supported, CSS view timelines reveal chapter content during entry; unsupported browsers retain visible content. Reduced motion removes automatic animation and smooth scrolling.

## Elevation & Depth

Depth combines tonal surfaces, rotated overlapping input cards, fine orbital geometry, and a rendered physical lens. Shadows attach to floating source chips and findings rather than every section. Input cards use a soft diffuse shadow; the opportunity card relies on its paper tone. The lens fallback has inset and ambient shadows to preserve the optical metaphor until WebGL is ready.

## Shapes

Actions and story tabs are pills; source cards have softly rounded corners and the finding is slightly rounder. The authentic logo and mascot retain their original silhouettes; orbital rings and a torus sculpture supply a supporting optical motif. Section boundaries are fine rules and broad fields, without enclosing every chapter in a card.

## Components

### Buttons

Orange filled pills use ink text, a bold compact label, and a diagonal arrow. Hover lightens the fill, lifts the button (3px), and moves its arrow. The dark variant reverses the palette on paper. Focus uses an orange outline (2px) with offset (6px). Primary actions link to `/signup`.

### Navigation

The supplied `/orange logo.png` anchors the dark navigation band and footer. Do not reconstruct its wordmark or invent a replacement symbol. Desktop anchor links gain an orange underline on hover. At compact widths, a menu button exposes in-page chapter links and login; selection and Escape close it. Login links go to `/login`.

### Source chips and evidence cards

Floating dark source chips surround the hero investigator artwork and its supporting lens. In the product chapter, three pale source cards overlap at distinct angles, then feed a circular processor containing `/mascot.png` and a scored opportunity card. Findings contain a confidence value, explanatory copy, an evidence disclosure, and an explicit illustrative label. Keep the attached evidence contextual to the selected story.

### Story tabs, evidence, and FAQ

Selected story tabs use ink fill and paper text; unselected tabs are outlined on paper. Campaigns, positioning gaps, and partnerships update the shared tab panel. Evidence expands within the result card. FAQ rows expose answers with an expanded state and linked control/panel IDs; the first answer is initially open.

### Authentic brand assets

Use `/orange logo.png` for the navigation/footer logo, `/investigator_mascot.png` for the hero, and `/mascot.png` inside the processor. The investigator image uses contain sizing and a diffuse drop shadow. These supplied assets and “Always one step ahead.” replace the earlier invented mark and generic hero statement.

### Clue magnifier

The clue chapter lays out fictional ad, website, and social artifacts. On fine-pointer desktop devices, a real Three.js cursor magnifier follows the mouse and an aperture reveals their shared language, timing, and direction. A touch- and keyboard-accessible “Reveal the connections” button exposes the complete connected picture with an expanded state and controlled region. Fictional-campaign labeling remains visible. The cursor uses the thin, paused lens variant; the reveal is deliberate interaction rather than automatic animation.

### Optical signal lens

The dynamically imported client component renders an orange physical torus with orbiting points using Three.js. Mouse movement adds subtle perspective; a labeled range input gives keyboard rotation. A pause button stops time-based lens motion and repeating source/flow motion. The renderer parks offscreen and when the document is hidden, respects reduced motion, and disposes resources on unmount. Paused users can still deliberately adjust perspective. The decorative canvas is hidden from assistive technology; meaningful source and finding text remains in HTML.

## Do's and Don'ts

### Do:

- **Do** keep this system scoped to `/landing` and preserve the root app's incumbent tokens.
- **Do** preserve the authentic logo, mascot artwork, slogan, and supporting optical explanation.
- **Do** preserve readable paper text, explicit illustrative findings, visible keyboard focus, and motion controls.
- **Do** keep signup and login actions attached to their real routes.

### Don't:

- **Don't** invent commercial proof, testimonials, customer counts, pricing, or measured performance.
- **Don't** reintroduce the removed hero eyebrow, audience numbering, or tighter hero tracking.
- **Don't** treat an exploratory FORM seed, catalog card, or unapproved image as the authority for this implementation.
- **Don't** replace native scrolling with forced section navigation or hide essential content behind motion support.
