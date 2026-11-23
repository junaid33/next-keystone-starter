'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

/** Password field with an inline show/hide toggle. */
export function PasswordInput(props: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="h-9 pr-9" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 grid w-9 place-items-center rounded-r-[8px] text-[var(--ks-label)] hover:text-[var(--ks-ink)] focus-visible:outline-none focus-visible:text-[var(--ks-ink)]"
      >
        {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </button>
    </div>
  )
}
