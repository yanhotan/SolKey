"use client"

import { useState, useEffect } from 'react'

export function useWalletAuthSkip() {
  const [hasSkipped, setHasSkipped] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wallet-auth-skipped') === 'true'
    }
    return false
  })

  useEffect(() => {
    if (hasSkipped) {
      localStorage.setItem('wallet-auth-skipped', 'true')
    }
  }, [hasSkipped])

  const skip = () => {
    setHasSkipped(true)
  }

  const reset = () => {
    setHasSkipped(false)
    localStorage.removeItem('wallet-auth-skipped')
  }

  return { hasSkipped, skip, reset }
}
