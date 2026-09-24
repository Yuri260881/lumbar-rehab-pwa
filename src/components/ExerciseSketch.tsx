import type { SketchHighlight, SketchPose } from '../types';

/**
 * Soft cartoon-style exercise infographics.
 *
 * The figures stay code-generated so the whole library remains lightweight and
 * consistent. Each card combines the exercise geometry with a short instruction
 * taken directly from the exercise description.
 */

interface PoseGeometry {
  head: { cx: number; cy: number; r: number };
  /** Polyline points for the trunk. */
  trunk: string;
  /** Each leg is a polyline. */
  legs: string[];
  /** Each arm is a polyline (optional). */
  arms?: string[];
  /** Extra props such as a mat or a support block. */
  props?: 'mat' | 'block' | 'none';
}

const POSES: Record<SketchPose, PoseGeometry> = {
  supine: {
    head: { cx: 34, cy: 88, r: 11 },
    trunk: '44,92 96,92',
    legs: ['96,92 138,68 168,100'],
    props: 'mat',
  },
  'supine-knees': {
    head: { cx: 34, cy: 88, r: 11 },
    trunk: '44,92 92,92',
    legs: ['92,92 126,58 158,100'],
    props: 'mat',
  },
  prone: {
    head: { cx: 34, cy: 92, r: 11 },
    trunk: '45,92 100,92',
    legs: ['100,92 168,96'],
    props: 'mat',
  },
  'prone-pressup': {
    head: { cx: 46, cy: 60, r: 11 },
    trunk: '56,68 102,92',
    legs: ['102,92 170,96'],
    arms: ['62,80 64,100'],
    props: 'mat',
  },
  quadruped: {
    head: { cx: 42, cy: 40, r: 11 },
    trunk: '52,50 112,52',
    legs: ['112,52 112,100 128,100'],
    arms: ['56,52 56,100'],
    props: 'none',
  },
  'side-left': {
    head: { cx: 36, cy: 66, r: 11 },
    trunk: '46,72 98,60',
    legs: ['98,60 118,100 150,100'],
    arms: ['44,78 44,100 74,100'],
    props: 'none',
  },
  seated: {
    head: { cx: 62, cy: 26, r: 11 },
    trunk: '62,38 62,74',
    legs: ['62,74 112,74 112,100'],
    arms: ['62,48 84,68'],
    props: 'block',
  },
  standing: {
    head: { cx: 96, cy: 22, r: 11 },
    trunk: '96,34 96,72',
    legs: ['96,72 96,100'],
    props: 'none',
  },
  'standing-hinge': {
    head: { cx: 132, cy: 42, r: 11 },
    trunk: '124,50 96,72',
    legs: ['96,72 96,100'],
    arms: ['118,58 104,84'],
    props: 'none',
  },
  walking: {
    head: { cx: 96, cy: 22, r: 11 },
    trunk: '96,34 96,72',
    legs: ['96,72 76,100', '96,72 118,100'],
    arms: ['96,42 78,64', '96,42 114,62'],
    props: 'none',
  },
  breathing: {
    head: { cx: 56, cy: 34, r: 11 },
    trunk: '58,46 62,80',
    legs: ['62,80 104,80 104,100'],
    arms: ['60,56 44,72'],
    props: 'block',
  },
};

/** Teal overlays marking the structures the exercise targets. */
const HIGHLIGHTS: Record<SketchHighlight, Record<SketchPose, string>> = {
  lumbar: {
    supine: 'M 66 88 q 12 -12 26 0',
    'supine-knees': 'M 64 88 q 12 -12 24 0',
    prone: 'M 68 88 q 12 10 26 0',
    'prone-pressup': 'M 78 80 q 12 12 22 8',
    quadruped: 'M 78 48 q 12 12 24 0',
    'side-left': 'M 74 66 q 12 8 22 2',
    seated: 'M 58 62 q 10 8 6 14',
    standing: 'M 90 56 q 12 8 0 16',
    'standing-hinge': 'M 104 62 q 10 8 6 12',
    walking: 'M 90 56 q 12 8 0 16',
    breathing: 'M 56 66 q 10 8 6 12',
  },
  abdomen: {
    supine: 'M 66 84 h 26',
    'supine-knees': 'M 64 84 h 24',
    prone: 'M 68 98 h 26',
    'prone-pressup': 'M 76 86 l 18 10',
    quadruped: 'M 78 58 h 24',
    'side-left': 'M 74 74 h 22',
    seated: 'M 66 56 v 16',
    standing: 'M 102 48 v 18',
    'standing-hinge': 'M 108 56 l -10 12',
    walking: 'M 102 48 v 18',
    breathing: 'M 66 58 v 16',
  },
  glutes: {
    supine: 'M 92 86 q 8 6 12 12',
    'supine-knees': 'M 88 86 q 8 6 12 12',
    prone: 'M 98 86 q 8 6 12 8',
    'prone-pressup': 'M 100 86 q 8 6 12 8',
    quadruped: 'M 108 50 q 8 6 8 14',
    'side-left': 'M 96 58 q 8 6 10 14',
    seated: 'M 58 72 q 8 6 14 4',
    standing: 'M 90 66 q -6 8 -2 14',
    'standing-hinge': 'M 90 66 q -6 8 -2 14',
    walking: 'M 90 66 q -6 8 -2 14',
    breathing: 'M 58 74 q 8 6 14 4',
  },
  hamstrings: {
    supine: 'M 100 90 L 134 70',
    'supine-knees': 'M 96 90 L 124 62',
    prone: 'M 104 96 L 160 96',
    'prone-pressup': 'M 106 96 L 162 96',
    quadruped: 'M 112 60 L 112 92',
    'side-left': 'M 102 68 L 118 94',
    seated: 'M 66 70 L 108 70',
    standing: 'M 92 76 L 92 96',
    'standing-hinge': 'M 92 76 L 92 96',
    walking: 'M 92 76 L 80 96',
    breathing: 'M 66 76 L 100 76',
  },
  'hip-flexors': {
    supine: 'M 96 92 L 134 70',
    'supine-knees': 'M 92 92 L 122 60',
    prone: 'M 100 92 L 150 94',
    'prone-pressup': 'M 102 92 L 152 94',
    quadruped: 'M 112 56 L 112 92',
    'side-left': 'M 100 64 L 118 92',
    seated: 'M 62 74 L 104 74',
    standing: 'M 96 72 L 96 92',
    'standing-hinge': 'M 96 72 L 96 92',
    walking: 'M 96 72 L 112 96',
    breathing: 'M 62 80 L 96 80',
  },
  side: {
    supine: 'M 70 84 h 24',
    'supine-knees': 'M 70 84 h 22',
    prone: 'M 70 90 h 24',
    'prone-pressup': 'M 74 82 l 16 8',
    quadruped: 'M 76 46 h 26',
    'side-left': 'M 68 66 L 92 60',
    seated: 'M 56 52 v 18',
    standing: 'M 90 46 v 20',
    'standing-hinge': 'M 106 52 l -8 12',
    walking: 'M 90 46 v 20',
    breathing: 'M 52 54 v 18',
  },
  leg: {
    supine: 'M 100 90 L 136 68',
    'supine-knees': 'M 96 90 L 124 60',
    prone: 'M 104 94 L 164 96',
    'prone-pressup': 'M 106 94 L 166 96',
    quadruped: 'M 112 54 L 112 98',
    'side-left': 'M 102 66 L 118 98',
    seated: 'M 108 78 L 108 98',
    standing: 'M 96 74 L 96 98',
    'standing-hinge': 'M 96 74 L 96 98',
    walking: 'M 96 74 L 116 98',
    breathing: 'M 100 82 L 100 98',
  },
  arm: {
    supine: 'M 50 88 L 74 88',
    'supine-knees': 'M 50 88 L 74 88',
    prone: 'M 50 92 L 78 92',
    'prone-pressup': 'M 58 70 L 64 96',
    quadruped: 'M 54 48 L 56 96',
    'side-left': 'M 44 74 L 44 98',
    seated: 'M 64 48 L 84 66',
    standing: 'M 96 40 L 112 56',
    'standing-hinge': 'M 118 56 L 106 82',
    walking: 'M 96 42 L 112 60',
    breathing: 'M 58 52 L 44 70',
  },
  diaphragm: {
    supine: 'M 56 82 q 14 -14 28 0',
    'supine-knees': 'M 54 82 q 14 -14 28 0',
    prone: 'M 58 84 q 14 12 28 0',
    'prone-pressup': 'M 60 74 q 12 10 20 8',
    quadruped: 'M 66 44 q 14 12 28 0',
    'side-left': 'M 62 64 q 14 8 24 2',
    seated: 'M 52 46 q 12 10 20 2',
    standing: 'M 86 42 q 12 10 20 0',
    'standing-hinge': 'M 112 48 q 10 10 16 4',
    walking: 'M 86 42 q 12 10 20 0',
    breathing: 'M 48 50 q 12 12 20 2',
  },
  'whole-back': {
    supine: 'M 48 86 H 92',
    'supine-knees': 'M 48 86 H 88',
    prone: 'M 48 86 H 96',
    'prone-pressup': 'M 58 68 L 98 90',
    quadruped: 'M 54 44 H 110',
    'side-left': 'M 48 68 L 94 58',
    seated: 'M 54 40 V 72',
    standing: 'M 88 36 V 70',
    'standing-hinge': 'M 120 48 L 94 70',
    walking: 'M 88 36 V 70',
    breathing: 'M 50 48 L 56 78',
  },
};

export function ExerciseSketch({
  pose,
  highlight,
  title,
  exerciseId,
  startingPosition,
  steps,
  className = '',
}: {
  pose: SketchPose;
  highlight: SketchHighlight[];
  title: string;
  exerciseId?: string;
  startingPosition?: string;
  steps?: string[];
  className?: string;
}) {
  const geometry = POSES[pose];
  const instruction = steps?.[0] ?? startingPosition ?? 'Двигайтесь медленно и только в комфортной амплитуде.';
  const instructionLines = wrapInstruction(instruction, 34, 2);
  const motion = MOTION_PATHS[pose];
  if (exerciseId) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}exercises/${exerciseId}.png`}
        alt={title}
        className={`h-auto w-full rounded-2xl ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <svg
      viewBox="0 0 360 220"
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label={title}
      focusable="false"
    >
      <title>{title}</title>
      <rect x="0" y="0" width="360" height="220" rx="18" fill="#f8f1e8" />
      <rect x="14" y="14" width="332" height="34" rx="17" fill="#fffaf4" stroke="#ead9c2" />
      <text x="30" y="36" fill="#574d48" fontSize="12" fontWeight="700" letterSpacing="0.4">КАК ВЫПОЛНЯТЬ</text>
      <g transform="translate(284 22)">
        {[1, 2, 3].map((step) => (
          <g key={step} transform={`translate(${(step - 1) * 19} 0)`}>
            <circle cx="6" cy="6" r="7" fill={step === 1 ? '#4fbfa9' : '#e8cd94'} />
            <text x="6" y="9" textAnchor="middle" fill="#fffaf4" fontSize="8" fontWeight="700">{step}</text>
          </g>
        ))}
      </g>
      <line x1="24" y1="176" x2="226" y2="176" stroke="#dac8b7" strokeWidth="3" strokeLinecap="round" />
      {geometry.props === 'mat' ? (
        <rect x="26" y="170" width="194" height="12" rx="6" fill="#e5d6c7" />
      ) : null}
      {geometry.props === 'block' ? (
        <rect x="58" y="144" width="76" height="28" rx="8" fill="#f0c777" stroke="#9d7b45" strokeWidth="2" />
      ) : null}

      {/* Cartoon body with a dark outline and warm inner stroke. */}
      <g transform="translate(18 54) scale(1.05)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g stroke="#66564f" strokeWidth="12">
          <polyline points={geometry.trunk} />
          {geometry.legs.map((points) => <polyline key={`outline-leg-${points}`} points={points} />)}
          {geometry.arms?.map((points) => <polyline key={`outline-arm-${points}`} points={points} strokeWidth="10" />)}
        </g>
        <g stroke="#efc98f" strokeWidth="7">
          <polyline points={geometry.trunk} />
          {geometry.legs.map((points) => <polyline key={`leg-${points}`} points={points} />)}
          {geometry.arms?.map((points) => <polyline key={`arm-${points}`} points={points} strokeWidth="5" />)}
        </g>
        <circle cx={geometry.head.cx} cy={geometry.head.cy} r={geometry.head.r} fill="#efc98f" stroke="#66564f" strokeWidth="5" />
        <circle cx={geometry.head.cx + 4} cy={geometry.head.cy - 2} r="1.8" fill="#66564f" stroke="none" />
        <path d={`M ${geometry.head.cx + 4} ${geometry.head.cy + 4} q 4 3 7 0`} stroke="#66564f" strokeWidth="1.6" />
      </g>

      {/* Targeted area and movement cue. */}
      <g transform="translate(18 54) scale(1.05)" stroke="#4fbfa9" strokeLinecap="round" fill="none">
        {highlight.map((key) => <path key={key} d={HIGHLIGHTS[key][pose]} strokeWidth="9" opacity="0.16" />)}
        {highlight.map((key) => <path key={`accent-${key}`} d={HIGHLIGHTS[key][pose]} strokeWidth="4" opacity="0.95" />)}
      </g>
      <path d={motion.path} fill="none" stroke="#4fbfa9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={motion.arrow} fill="none" stroke="#4fbfa9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Description-derived instruction panel. */}
      <rect x="238" y="72" width="106" height="105" rx="14" fill="#fffaf4" stroke="#ead9c2" />
      <circle cx="258" cy="93" r="12" fill="#4fbfa9" />
      <text x="258" y="97" textAnchor="middle" fill="#fffaf4" fontSize="12" fontWeight="700">1</text>
      <text x="278" y="91" fill="#574d48" fontSize="10" fontWeight="700">Начните</text>
      {instructionLines.map((line, index) => (
        <text key={line} x="252" y={115 + index * 14} fill="#756962" fontSize="9">{line}</text>
      ))}
      <text x="252" y="158" fill="#4fbfa9" fontSize="9" fontWeight="700">Без рывков и боли</text>
      <circle cx="252" cy="169" r="3" fill="#e8cd94" />
      <circle cx="263" cy="169" r="3" fill="#e8cd94" />
      <circle cx="274" cy="169" r="3" fill="#e8cd94" />
    </svg>
  );
}

const MOTION_PATHS: Record<SketchPose, { path: string; arrow: string }> = {
  supine: { path: 'M 86 152 q 32 18 62 0', arrow: 'M 140 146 l 10 6 -10 6' },
  'supine-knees': { path: 'M 92 144 q 28 -28 54 0', arrow: 'M 138 122 l 10 4 -7 8' },
  prone: { path: 'M 84 156 q 30 -12 60 0', arrow: 'M 136 151 l 10 5 -10 5' },
  'prone-pressup': { path: 'M 78 130 q 20 -28 38 -4', arrow: 'M 108 120 l 8 8 -11 2' },
  quadruped: { path: 'M 80 116 q 26 -18 56 0', arrow: 'M 126 111 l 10 5 -9 7' },
  'side-left': { path: 'M 86 140 q 26 -18 50 0', arrow: 'M 124 134 l 10 6 -10 6' },
  seated: { path: 'M 92 122 q 10 -22 0 -42', arrow: 'M 86 90 l 6 -10 6 10' },
  standing: { path: 'M 136 138 q 10 -28 0 -52', arrow: 'M 130 94 l 6 -10 6 10' },
  'standing-hinge': { path: 'M 132 132 q -28 -18 -44 0', arrow: 'M 96 126 l -10 6 10 6' },
  walking: { path: 'M 76 142 q 28 -18 60 0', arrow: 'M 126 136 l 10 6 -10 6' },
  breathing: { path: 'M 82 128 q 22 -20 46 0', arrow: 'M 118 122 l 10 6 -10 6' },
};

function wrapInstruction(value: string, maxCharacters: number, maxLines: number) {
  const words = value.replace(/[.!,;:]/g, '').split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);
  return lines.slice(0, maxLines);
}
