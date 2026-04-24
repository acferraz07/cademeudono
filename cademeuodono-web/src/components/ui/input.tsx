import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded-xl border bg-white px-3 text-sm text-gray-900',
            'placeholder:text-gray-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            error
              ? 'border-rose-400 focus:ring-rose-500'
              : 'border-gray-300 hover:border-gray-400',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60',
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-10 w-full rounded-xl border bg-white px-3 text-sm text-gray-900',
            'transition-colors cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            error
              ? 'border-rose-400 focus:ring-rose-500'
              : 'border-gray-300 hover:border-gray-400',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const taId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={taId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          rows={3}
          className={cn(
            'w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-900',
            'placeholder:text-gray-400 resize-none transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            error
              ? 'border-rose-400 focus:ring-rose-500'
              : 'border-gray-300 hover:border-gray-400',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
