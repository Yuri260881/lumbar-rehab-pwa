import type { SketchHighlight, SketchPose } from '../types';

/**
 * Original, minimal line-art anatomical sketches.
 *
 * Every drawing is generated here from simple geometry — no stock imagery, no
 * third-party assets, so there are no licensing questions and the whole set
 * stays visually consistent. Gold = body, teal = the structures this exercise
 * is aimed at.
 */

const W = 200;
const H = 120;
const FLOOR = 104;

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
  className = '',
}: {
  pose: SketchPose;
  highlight: SketchHighlight[];
  title: string;
  className?: string;
}) {
  const geometry = POSES[pose];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label={title}
      focusable="false"
    >
      <title>{title}</title>
      <rect x="0" y="0" width={W} height={H} rx="14" fill="#11161d" />
      <line
        x1="16"
        y1={FLOOR}
        x2={W - 16}
        y2={FLOOR}
        stroke="#2a3441"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {geometry.props === 'mat' ? (
        <rect x="20" y={FLOOR - 3} width={W - 40} height="6" rx="3" fill="#1b222c" />
      ) : null}
      {geometry.props === 'block' ? (
        <rect x="46" y="80" width="72" height="22" rx="6" fill="#1b222c" stroke="#2a3441" />
      ) : null}

      {/* Body */}
      <g stroke="#e8cd94" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <polyline points={geometry.trunk} />
        {geometry.legs.map((points) => (
          <polyline key={`leg-${points}`} points={points} />
        ))}
        {geometry.arms?.map((points) => (
          <polyline key={`arm-${points}`} points={points} strokeWidth="5" />
        ))}
      </g>
      <circle
        cx={geometry.head.cx}
        cy={geometry.head.cy}
        r={geometry.head.r}
        fill="none"
        stroke="#e8cd94"
        strokeWidth="6"
      />

      {/* Targeted structures */}
      <g
        stroke="#4fbfa9"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      >
        {highlight.map((key) => (
          <path key={key} d={HIGHLIGHTS[key][pose]} />
        ))}
      </g>
    </svg>
  );
}
