import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'accent' | 'danger' | 'warn';
}

const TONES: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'border-ink-650/80 bg-ink-850/80',
  accent: 'border-teal-600/60 bg-teal-700/10',
  danger: 'border-danger-600/70 bg-danger-700/15',
  warn: 'border-warn-600/60 bg-warn-600/10',
};

export function Card({ tone = 'default', className = '', children, ...rest }: CardProps) {
  return (
    <section
      className={`card ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  icon,
  children,
  level = 2,
}: {
  icon?: ReactNode;
  children: ReactNode;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <Heading className="flex items-center gap-2 text-base font-semibold text-ink-50 sm:text-lg">
      {icon ? <span aria-hidden="true" className="text-teal-400">{icon}</span> : null}
      {children}
    </Heading>
  );
}

export function Metric({
  label,
  value,
  caption,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  tone?: 'default' | 'accent' | 'danger' | 'warn';
}) {
  const valueTone = {
    default: 'text-ink-50',
    accent: 'text-teal-300',
    danger: 'text-danger-300',
    warn: 'text-warn-300',
  }[tone];
  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-900/60 p-3">
      <div className="text-xs uppercase tracking-wide text-ink-300">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${valueTone}`}>{value}</div>
      {caption ? <div className="mt-1 text-xs text-ink-300">{caption}</div> : null}
    </div>
  );
}
