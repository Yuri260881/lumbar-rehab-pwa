import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg';
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const sizeClass = size === 'lg' ? 'min-h-[56px] text-lg px-6' : '';
  return (
    <button
      type={type}
      className={`${VARIANTS[variant]} ${sizeClass} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
