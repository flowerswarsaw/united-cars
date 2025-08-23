'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Home,
  Car,
  FileText,
  Package,
  Wrench,
  Shield,
  Receipt,
  CreditCard,
  Settings,
  Users,
  Calculator,
  Menu,
  X,
  ChevronRight,
  Inbox,
  DollarSign
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
  roles?: string[]
}

const navigation: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Intake', href: '/intake', icon: Inbox },
    ]
  },
  {
    title: 'Operations',
    items: [
      { label: 'Vehicles', href: '/vehicles', icon: Car },
      { label: 'Titles', href: '/titles', icon: FileText },
      { label: 'Services', href: '/services', icon: Wrench },
      { label: 'Claims', href: '/claims', icon: Shield },
    ]
  },
  {
    title: 'Finance',
    items: [
      { label: 'Invoices', href: '/invoices', icon: Receipt },
      { label: 'Payments', href: '/payments', icon: CreditCard },
      { label: 'Calculator', href: '/calculator', icon: Calculator },
      { label: 'Balance', href: '/balance', icon: DollarSign },
    ]
  },
  {
    title: 'Admin',
    roles: ['ADMIN', 'OPS'],
    items: [
      { label: 'Intake Review', href: '/admin/intake', icon: Inbox },
      { label: 'Services', href: '/admin/services', icon: Wrench },
      { label: 'Claims', href: '/admin/claims', icon: Shield },
      { label: 'Pricing', href: '/admin/pricing', icon: Settings },
      { label: 'Users', href: '/admin/users', icon: Users },
    ]
  }
]

interface SidebarProps {
  user?: {
    name?: string
    email?: string
    roles?: string[]
    orgName?: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const userRoles = user?.roles || []
  
  const filteredNavigation = navigation.filter(section => {
    if (!section.roles) return true
    return section.roles.some(role => userRoles.includes(role))
  })

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200 bg-white">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">United Cars</span>
        </Link>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="text-sm">
            <p className="font-medium text-gray-900">{user.name || 'User'}</p>
            <p className="text-gray-500">{user.email}</p>
            {user.orgName && (
              <p className="text-xs text-gray-400 mt-1">{user.orgName}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {filteredNavigation.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.href)
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon 
                      className={clsx(
                        'mr-3 h-5 w-5 transition-colors',
                        isActive
                          ? 'text-blue-600'
                          : 'text-gray-400 group-hover:text-gray-500'
                      )}
                    />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="ml-auto h-4 w-4 text-blue-600" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>© 2024 United Cars</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-white shadow-md text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile sidebar */}
      <div
        className={clsx(
          'lg:hidden fixed inset-0 z-40 flex transition-opacity duration-300',
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
        <div
          className={clsx(
            'relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <NavContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <NavContent />
        </div>
      </div>
    </>
  )
}