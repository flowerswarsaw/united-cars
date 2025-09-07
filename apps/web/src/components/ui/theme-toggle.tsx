'use client'

import { Moon, Sun, Monitor, Palette } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './dropdown-menu'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown'
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
  align?: 'start' | 'center' | 'end'
}

export function ThemeToggle({ 
  variant = 'button', 
  size = 'default', 
  showLabel = false,
  align = 'end'
}: ThemeToggleProps) {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme()

  // Simple button toggle (light <-> dark)
  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        onClick={toggleTheme}
        className={cn(
          "transition-all duration-300 ease-in-out hover:scale-110 active:scale-95",
          showLabel && "gap-2"
        )}
        title={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        <div className="relative">
          {actualTheme === 'light' ? (
            <Sun className={cn(
              "transition-all duration-300 rotate-0 scale-100",
              size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
            )} />
          ) : (
            <Moon className={cn(
              "transition-all duration-300 rotate-0 scale-100",
              size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
            )} />
          )}
        </div>
        {showLabel && (
          <span className="text-sm font-medium">
            {actualTheme === 'light' ? 'Dark' : 'Light'}
          </span>
        )}
      </Button>
    )
  }

  // Dropdown with all options (light, dark, system)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
          className={cn(
            "transition-all duration-300 ease-in-out hover:scale-110 active:scale-95",
            showLabel && "gap-2"
          )}
          title="Change theme"
        >
          <div className="relative">
            {theme === 'system' ? (
              <Monitor className={cn(
                "transition-all duration-300",
                size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
              )} />
            ) : actualTheme === 'light' ? (
              <Sun className={cn(
                "transition-all duration-300 rotate-0 scale-100",
                size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
              )} />
            ) : (
              <Moon className={cn(
                "transition-all duration-300 rotate-0 scale-100",
                size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
              )} />
            )}
          </div>
          {showLabel && (
            <span className="text-sm font-medium capitalize">
              {theme === 'system' ? 'Auto' : theme}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-40">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {theme === 'system' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact version for tight spaces
export function ThemeToggleCompact({ className }: { className?: string }) {
  const { actualTheme, toggleTheme } = useTheme()
  
  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center rounded-md p-2 text-sm font-medium transition-all duration-300 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:scale-110 active:scale-95",
        className
      )}
      title={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {actualTheme === 'light' ? (
        <Sun className="h-4 w-4 transition-all duration-300" />
      ) : (
        <Moon className="h-4 w-4 transition-all duration-300" />
      )}
    </button>
  )
}