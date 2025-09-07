'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark' // The resolved theme (system -> light/dark)
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system', 
  storageKey = 'united-cars-theme' 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Resolve theme to actual theme
  const resolveTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
      return getSystemTheme()
    }
    return theme
  }

  // Apply theme to document
  const applyTheme = (resolvedTheme: 'light' | 'dark') => {
    if (typeof window === 'undefined') return
    
    const root = window.document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add new theme class
    root.classList.add(resolvedTheme)
    
    // Set data attribute for more specific styling if needed
    root.setAttribute('data-theme', resolvedTheme)
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'
      )
    }
  }

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true)
    
    // Try to get saved theme from localStorage
    const savedTheme = localStorage.getItem(storageKey) as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      // If no saved theme, detect system preference
      const systemTheme = getSystemTheme()
      setTheme('system')
      setActualTheme(systemTheme)
      applyTheme(systemTheme)
      return
    }
  }, [storageKey])

  // Update actual theme when theme changes
  useEffect(() => {
    if (!mounted) return
    
    const resolved = resolveTheme(theme)
    setActualTheme(resolved)
    applyTheme(resolved)
    
    // Save to localStorage
    localStorage.setItem(storageKey, theme)
  }, [theme, mounted, storageKey])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        const resolved = resolveTheme('system')
        setActualTheme(resolved)
        applyTheme(resolved)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  // Toggle between light and dark (skips system)
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('light')
    } else {
      // If system, toggle to opposite of current system theme
      const currentSystemTheme = getSystemTheme()
      setTheme(currentSystemTheme === 'light' ? 'dark' : 'light')
    }
  }

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Utility hook for theme-aware components
export const useThemeAware = () => {
  const { actualTheme } = useTheme()
  
  const isDark = actualTheme === 'dark'
  const isLight = actualTheme === 'light'
  
  return {
    isDark,
    isLight,
    theme: actualTheme
  }
}