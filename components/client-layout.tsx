'use client'

import { GlobalHeader } from '@/components/global-header'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GlobalHeader />
      {children}
    </>
  )
}