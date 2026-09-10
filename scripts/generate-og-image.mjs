// Generates the static Open Graph preview card at public/og.png.
//
// The card is committed as a static file rather than generated at request time
// by an `app/opengraph-image.tsx` route because of src/proxy.ts: that matcher
// only exempts paths ending in an image extension, and the file-convention route
// is served from an extensionless URL. An anonymous social crawler fetching it
// would be redirected to /login and the preview would render without an image.
// A real file under public/ ends in .png, so it passes the matcher untouched.
//
// Re-run with:  node scripts/generate-og-image.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createElement as h } from 'react';

// `next/og` is only resolvable through Next's own bundler; a plain ESM import
// cannot see the extensionless subpath, so load it through CJS resolution.
const require = createRequire(import.meta.url);
const { ImageResponse } = require('next/og');

const WIDTH = 1200;
const HEIGHT = 630;

const BACKGROUND = '#0B0B0E';
const ACCENT = '#FF5A00';
const MUTED = '#A1A1AA';

const root = process.cwd();

const wordmark = await readFile(join(root, 'public', 'orange logo.png'), 'base64');

const card = new ImageResponse(
  h(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BACKGROUND,
        // Soft accent wash so the card does not read as a flat black rectangle
        // in the timeline, without competing with the wordmark.
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(255,90,0,0.28) 0%, rgba(255,90,0,0) 62%)',
      },
    },
    h('img', {
      src: `data:image/png;base64,${wordmark}`,
      alt: 'OShift',
      width: 520,
      height: 172,
    }),
    h(
      'div',
      {
        style: {
          marginTop: 44,
          display: 'flex',
          fontSize: 38,
          letterSpacing: -0.5,
          color: MUTED,
        },
      },
      'Competitive intelligence, continuously'
    ),
    h('div', {
      style: {
        marginTop: 54,
        display: 'flex',
        width: 96,
        height: 6,
        borderRadius: 3,
        backgroundColor: ACCENT,
      },
    })
  ),
  { width: WIDTH, height: HEIGHT }
);

const buffer = Buffer.from(await card.arrayBuffer());
const out = join(root, 'public', 'og.png');
await writeFile(out, buffer);

console.log(`wrote ${out} (${buffer.length} bytes, ${WIDTH}x${HEIGHT})`);
