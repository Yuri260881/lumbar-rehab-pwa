/** Minimal 24px line icons, drawn inline (no icon library, no network). */

interface IconProps {
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export function IconDashboard({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="7.5" height="8.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="2" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="2" />
      <rect x="13.5" y="11" width="7.5" height="10" rx="2" />
    </svg>
  );
}

export function IconLibrary({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9v16H5.5A1.5 1.5 0 0 1 4 18.5Z" />
      <path d="M9 4h5.5A1.5 1.5 0 0 1 16 5.5v13A1.5 1.5 0 0 1 14.5 20H9" />
      <path d="M19 6.5 21 19" />
    </svg>
  );
}

export function IconTimer({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 2" />
      <path d="M9.5 2.5h5" />
    </svg>
  );
}

export function IconDiary({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 4.5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2Z" />
      <path d="M5 17.5h13" />
      <path d="M9 8h6M9 11.5h4" />
    </svg>
  );
}

export function IconSettings({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
    </svg>
  );
}

export function IconBell({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconInversion({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 19.5h16" />
      <path d="M7 19.5 12 6l5 13.5" />
      <path d="M9.5 12.5h5" />
      <circle cx="12" cy="4" r="1.6" />
    </svg>
  );
}

export function IconGuide({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v13H6.5A2.5 2.5 0 0 0 4 19.5Z" />
      <path d="M8 8h7M8 11.5h5" />
    </svg>
  );
}

export function IconAlert({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4.5 3 19.5h18Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function IconPlay({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 5.5 18 12 8 18.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPause({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="7" y="5" width="3.5" height="14" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconReset({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
      <path d="M4.5 4.5V9H9" />
    </svg>
  );
}

export function IconNext({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l7 6-7 6Z" fill="currentColor" stroke="none" />
      <path d="M17 5.5v13" />
    </svg>
  );
}

export function IconCheck({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12.5 10 17.5 19 7" />
    </svg>
  );
}

export function IconBack({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function IconDownload({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 4v10" />
      <path d="M8 10.5 12 14.5l4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function IconTrash({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 7h14" />
      <path d="M9 7V5h6v2" />
      <path d="M6.5 7l1 12.5h9L17.5 7" />
    </svg>
  );
}

export function IconShield({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 5 6v6c0 4.2 3 7.3 7 8.5 4-1.2 7-4.3 7-8.5V6Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function IconWalk({ className = 'h-6 w-6' }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="13" cy="4.5" r="1.8" />
      <path d="M11 21l1.5-5.5L10 13l1-4.5 3 2 2.5 1" />
      <path d="M12.5 15.5 15.5 21" />
      <path d="M11 8.5 7.5 11" />
    </svg>
  );
}
