'use client'

import { ReactNode } from 'react'
import ReactQueryProvider from '@/lib/react-query'
import { ThemeProvider } from '@/contexts/theme-context'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="united-cars-theme">
      <ReactQueryProvider>
        {children}
      </ReactQueryProvider>
    </ThemeProvider>
  )
}