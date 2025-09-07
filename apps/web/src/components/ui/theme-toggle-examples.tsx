/**
 * Examples of how to use the ThemeToggle components throughout the app
 */

import { ThemeToggle, ThemeToggleCompact } from './theme-toggle'
import { useTheme, useThemeAware } from '@/contexts/theme-context'

// Example 1: Simple toggle button (switches between light/dark)
export function SimpleThemeToggle() {
  return (
    <ThemeToggle 
      variant="button" 
      size="default" 
      showLabel={false} 
    />
  )
}

// Example 2: Dropdown with all options (light, dark, system)
export function AdvancedThemeToggle() {
  return (
    <ThemeToggle 
      variant="dropdown" 
      size="default" 
      showLabel={true} 
      align="end" 
    />
  )
}

// Example 3: Compact version for tight spaces (like sidebar footer)
export function CompactThemeToggle() {
  return (
    <ThemeToggleCompact className="hover:bg-accent" />
  )
}

// Example 4: Using theme context directly
export function CustomThemeComponent() {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme()
  const { isDark, isLight } = useThemeAware()
  
  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="font-semibold mb-2">Theme Info</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Selected: {theme} | Active: {actualTheme} | 
        {isDark ? ' Dark mode' : ' Light mode'}
      </p>
      
      <div className="flex gap-2">
        <button 
          onClick={() => setTheme('light')}
          className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground"
        >
          Light
        </button>
        <button 
          onClick={() => setTheme('dark')}
          className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground"
        >
          Dark
        </button>
        <button 
          onClick={() => setTheme('system')}
          className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground"
        >
          System
        </button>
        <button 
          onClick={toggleTheme}
          className="px-3 py-1 text-sm rounded bg-secondary text-secondary-foreground"
        >
          Toggle
        </button>
      </div>
    </div>
  )
}

// Example 5: Theme-aware conditional rendering
export function ThemeAwareContent() {
  const { isDark } = useThemeAware()
  
  return (
    <div className="p-4">
      {isDark ? (
        <div className="text-yellow-400">
          🌙 Dark mode is active
        </div>
      ) : (
        <div className="text-yellow-600">
          ☀️ Light mode is active
        </div>
      )}
    </div>
  )
}

// Example 6: Header/Navigation usage
export function HeaderWithThemeToggle() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1 className="text-lg font-semibold">My App</h1>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Theme:</span>
        <ThemeToggle variant="dropdown" size="sm" align="end" />
      </div>
    </header>
  )
}

export default {
  SimpleThemeToggle,
  AdvancedThemeToggle,
  CompactThemeToggle,
  CustomThemeComponent,
  ThemeAwareContent,
  HeaderWithThemeToggle,
}