/**
 * Generates the PNG icons and the iOS splash image from the source SVG.
 *
 * Run with: npm run icons
 * Requires ImageMagick (`convert`) — no network access, no binary assets are
 * committed from third parties.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = resolve(root, 'public/icons');
mkdirSync(iconsDir, { recursive: true });

const source = resolve(iconsDir, 'icon.svg');

/** Maskable variant: the same mark on a full-bleed background with safe padding. */
const maskable = resolve(iconsDir, 'maskable.svg');
writeFileSync(
  maskable,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#06080b" />
  <g transform="translate(96 96) scale(0.625)">
    <path d="M256 96c44 34 44 78 0 112s-44 78 0 112 44 78 0 96"
          fill="none" stroke="#e8cd94" stroke-width="34" stroke-linecap="round" />
    <g stroke="#4fbfa9" stroke-width="20" stroke-linecap="round">
      <path d="M176 152h56" /><path d="M176 244h56" /><path d="M176 336h56" />
    </g>
    <circle cx="256" cy="244" r="26" fill="none" stroke="#4fbfa9" stroke-width="16" />
  </g>
</svg>`,
);

/** iOS splash screen: icon centred on the theme background (1290×2796, iPhone 15 Pro Max). */
const splash = resolve(iconsDir, 'splash.svg');
writeFileSync(
  splash,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1290 2796" width="1290" height="2796">
  <rect width="1290" height="2796" fill="#06080b" />
  <g transform="translate(389 1142) scale(1)">
    <path d="M256 96c44 34 44 78 0 112s-44 78 0 112 44 78 0 96"
          fill="none" stroke="#e8cd94" stroke-width="30" stroke-linecap="round" />
    <g stroke="#4fbfa9" stroke-width="18" stroke-linecap="round">
      <path d="M176 152h56" /><path d="M176 244h56" /><path d="M176 336h56" />
    </g>
    <circle cx="256" cy="244" r="22" fill="none" stroke="#4fbfa9" stroke-width="14" />
  </g>
</svg>`,
);

const targets = [
  { svg: source, out: 'icon-192.png', size: 192 },
  { svg: source, out: 'icon-512.png', size: 512 },
  { svg: source, out: 'apple-touch-icon.png', size: 180 },
  { svg: source, out: 'badge-72.png', size: 72 },
  { svg: maskable, out: 'maskable-512.png', size: 512 },
  { svg: splash, out: 'splash-1290.png', width: 1290, height: 2796 },
];

for (const target of targets) {
  const outPath = resolve(iconsDir, target.out);
  const geometry = target.width ? `${target.width}x${target.height}` : `${target.size}x${target.size}`;
  execFileSync('convert', [
    '-background',
    'none',
    '-density',
    '384',
    target.svg,
    '-resize',
    geometry,
    '-gravity',
    'center',
    '-extent',
    geometry,
    outPath,
  ]);
  console.log(`generated ${target.out} (${geometry})`);
}

// Keep the SVG favicon next to the raster icons.
copyFileSync(source, resolve(iconsDir, 'icon.svg'));
console.log('icons done');
