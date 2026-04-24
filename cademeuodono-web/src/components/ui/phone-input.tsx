'use client'

import { forwardRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { phoneMask } from '@/lib/utils'
import type React from 'react'

type InputProps = React.ComponentProps<typeof Input>

export const PhoneInput = forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, ...props }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = phoneMask(e.target.value)
        onChange?.(e)
      },
      [onChange],
    )

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        placeholder="(63) 99999-9999"
        onChange={handleChange}
        {...props}
      />
    )
  },
)
PhoneInput.displayName = 'PhoneInput'
