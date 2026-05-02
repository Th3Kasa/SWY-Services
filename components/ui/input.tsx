'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-stone-700"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-rose-500">*</span>
            )}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            'h-11 w-full rounded-xl border border-stone-200 bg-white px-4 text-stone-900 placeholder:text-stone-400',
            'transition-all duration-200 outline-none',
            'focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
            error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-600 flex items-center gap-1">
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-stone-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-stone-700"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-rose-500">*</span>
            )}
          </label>
        )}
        <textarea
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400',
            'transition-all duration-200 outline-none resize-none',
            'focus:border-amber-400 focus:ring-2 focus:ring-amber-100',
            error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
            className
          )}
          ref={ref}
          rows={3}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-600 flex items-center gap-1">
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-stone-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea };
