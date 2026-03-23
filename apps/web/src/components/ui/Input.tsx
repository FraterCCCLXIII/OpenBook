import { type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={[
        'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'transition-colors',
        'focus:outline-none focus:ring-2 focus:border-transparent',
        hasError
          ? 'border-red-400 focus:ring-red-400'
          : 'border-slate-300 focus:ring-brand',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
