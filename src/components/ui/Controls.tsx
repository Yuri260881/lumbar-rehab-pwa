import { useId } from 'react';
import type { ReactNode } from 'react';

/** Accessible on/off switch rendered as a real checkbox. */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0">
        <label htmlFor={id} className="label block cursor-pointer">
          {label}
        </label>
        {description ? <p className="hint mt-0.5">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors
          ${checked ? 'border-teal-500 bg-teal-600/70' : 'border-ink-600 bg-ink-750'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-ink-50 shadow transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

/** Large, thumb-friendly numeric stepper. */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (next: number) => void;
}) {
  const id = useId();
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  return (
    <div className="rounded-xl border border-ink-700/70 bg-ink-900/50 p-3">
      <label htmlFor={id} className="label block">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary h-12 w-12 shrink-0 text-xl"
          aria-label={`Уменьшить: ${label}`}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          className="h-12 w-full min-w-0 rounded-xl border border-ink-700 bg-ink-850 px-2 text-center text-xl font-semibold tabular-nums text-ink-50"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10);
            if (Number.isFinite(next)) onChange(clamp(next));
          }}
        />
        <button
          type="button"
          className="btn-secondary h-12 w-12 shrink-0 text-xl"
          aria-label={`Увеличить: ${label}`}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
        >
          +
        </button>
        {unit ? <span className="w-16 shrink-0 text-sm text-ink-300">{unit}</span> : null}
      </div>
    </div>
  );
}

export function TimeField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-xl border border-ink-700 bg-ink-850 px-3 text-base text-ink-50"
      />
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  rows,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  const shared = {
    id,
    value,
    placeholder,
    maxLength,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    className:
      'mt-1 w-full rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-base text-ink-50 placeholder:text-ink-400',
  };
  return (
    <div>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      {rows ? <textarea rows={rows} {...shared} /> : <input type="text" {...shared} />}
      {hint ? <p className="hint mt-1">{hint}</p> : null}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  valueLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  valueLabel?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="label">
          {label}
        </label>
        <span className="text-sm font-semibold tabular-nums text-ink-100">
          {valueLabel ?? value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number.parseInt(event.target.value, 10))}
        className="mt-2 h-12 w-full cursor-pointer appearance-none rounded-full bg-ink-750 px-1"
      />
    </div>
  );
}

export function CheckboxRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: ReactNode;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3 py-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-6 w-6 shrink-0 rounded border-ink-600 bg-ink-800 accent-teal-500"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-base text-ink-100">
          {label}
        </label>
        {description ? <p className="hint mt-0.5">{description}</p> : null}
      </div>
    </div>
  );
}

export function Progress({
  value,
  max,
  label,
  tone = 'teal',
}: {
  value: number;
  max: number;
  label: string;
  tone?: 'teal' | 'gold';
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="text-ink-200">{label}</span>
        <span className="tabular-nums text-ink-100">{pct}%</span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-ink-750"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full ${tone === 'gold' ? 'bg-gold-400' : 'bg-teal-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'teal' | 'gold' | 'danger' | 'warn';
}) {
  const tones: Record<string, string> = {
    neutral: 'border-ink-600 text-ink-200',
    teal: 'border-teal-600/70 text-teal-100',
    gold: 'border-gold-600/70 text-gold-100',
    danger: 'border-danger-600/70 text-danger-100',
    warn: 'border-warn-600/70 text-warn-100',
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}
