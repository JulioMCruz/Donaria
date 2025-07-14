'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PinInputProps {
  length?: number
  onComplete: (pin: string) => void
  onReset?: () => void
  loading?: boolean
  error?: string
  className?: string
}

export function PinInput({ 
  length = 4, 
  onComplete, 
  onReset,
  loading = false, 
  error,
  className 
}: PinInputProps) {
  const [pins, setPins] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return

    const newPins = [...pins]
    newPins[index] = value
    setPins(newPins)

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if PIN is complete
    if (newPins.every(pin => pin !== '') && newPins.join('').length === length) {
      onComplete(newPins.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!pins[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const reset = () => {
    setPins(Array(length).fill(''))
    inputRefs.current[0]?.focus()
    onReset?.()
  }

  useEffect(() => {
    if (error) {
      reset()
    }
  }, [error])

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="flex space-x-3">
        {pins.map((pin, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={pin}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            disabled={loading}
            className={cn(
              "w-14 h-14 text-center text-xl font-bold rounded-lg border-2 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error 
                ? "border-red-500 bg-red-50" 
                : "border-gray-300 hover:border-gray-400 focus:border-blue-500"
            )}
          />
        ))}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm text-center max-w-sm">{error}</p>
      )}
    </div>
  )
}