'use client'

import { Sidebar } from './sidebar'
import { Toaster } from 'react-hot-toast'
import { ReactNode, useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
  roles: string[]
  orgId: string
  orgName: string
  orgType: string
}

interface AppLayoutProps {
  children: ReactNode
  user?: User | null
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setIsSidebarCollapsed(JSON.parse(savedState))
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    // Persist to localStorage
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  // Prevent hydration mismatch by not rendering sidebar until client-side
  if (!isClient) {
    return (
      <div className="h-screen bg-background flex max-w-full overflow-hidden relative">
        <div className="fixed left-0 top-0 h-full z-40 w-64 border-r border-border bg-card" />
        <div 
          className="flex-1 flex flex-col min-w-0 max-w-full min-h-0 overflow-hidden"
          style={{ marginLeft: '256px' }}
        >
          <main className="flex-1 min-w-0 max-w-full overflow-auto flex flex-col">
            {children}
          </main>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: 'hsl(var(--success))',
                secondary: 'hsl(var(--success-foreground))',
              },
            },
            error: {
              iconTheme: {
                primary: 'hsl(var(--destructive))',
                secondary: 'hsl(var(--destructive-foreground))',
              },
            },
          }}
        />
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex max-w-full overflow-hidden relative">
      <div className="fixed left-0 top-0 h-full z-40">
        <Sidebar 
          user={user} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>
      <div 
        className="flex-1 flex flex-col min-w-0 max-w-full min-h-0 overflow-hidden transition-all duration-200"
        style={{ marginLeft: isSidebarCollapsed ? '80px' : '256px' }}
      >
        <main className="flex-1 min-w-0 max-w-full overflow-auto flex flex-col">
          {children}
        </main>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: 'hsl(var(--success))',
              secondary: 'hsl(var(--success-foreground))',
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