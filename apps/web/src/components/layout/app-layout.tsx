'use client'

import { Sidebar } from './sidebar'
import { Toaster } from 'react-hot-toast'
import { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
  user?: {
    name?: string
    email?: string
    roles?: string[]
    orgName?: string
  }
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 lg:pl-0">
          {children}
        </main>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}