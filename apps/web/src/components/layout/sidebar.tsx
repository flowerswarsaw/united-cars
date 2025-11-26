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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Inbox,
  DollarSign,
  UserCheck,
  Building2,
  TrendingUp,
  GitBranch,
  CheckSquare,
  Database,
  AlertTriangle,
  Activity
} from 'lucide-react'
import { ThemeToggleCompact } from '@/components/ui/theme-toggle'
import { RealTimeStatus } from '@/components/ui/real-time-notifications'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'

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

// Function to get navigation based on user roles
const getNavigation = (userRoles: string[] = []): NavSection[] => {
  const isDealer = userRoles.includes('DEALER')
  
  const baseNavigation: NavSection[] = [
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
        { label: 'Calculator', href: '/calculator', icon: Calculator },
        { label: 'Invoice Generator', href: '/operations/invoice-generator', icon: Receipt },
        { 
          label: isDealer ? 'My Invoices' : 'Invoices', 
          href: '/invoices', 
          icon: Receipt 
        },
        { 
          label: isDealer ? 'My Payments' : 'Payments', 
          href: '/payments', 
          icon: CreditCard 
        },
        { 
          label: isDealer ? 'My Balance' : 'Balance', 
          href: '/balance', 
          icon: DollarSign 
        },
      ]
    },
    {
      title: 'CRM',
      roles: ['ADMIN', 'OPS', 'SALES'],
      items: [
        { label: 'Dashboard', href: '/crm', icon: Home },
        { label: 'Organisations', href: '/crm/organisations', icon: Building2 },
        { label: 'Contacts', href: '/crm/contacts', icon: UserCheck },
        { label: 'Deals', href: '/crm/deals', icon: TrendingUp },
        { label: 'Leads', href: '/crm/leads', icon: Users },
        { label: 'Tasks', href: '/crm/tasks', icon: CheckSquare },
        { label: 'Pipelines', href: '/crm/pipelines', icon: GitBranch },
        { label: 'Administration', href: '/crm/admin', icon: Settings },
      ]
    },
    {
      title: 'Admin',
      roles: ['ADMIN', 'OPS'],
      items: [
        { label: 'Intake Review', href: '/admin/intake', icon: Inbox },
        { label: 'Services', href: '/admin/services', icon: Wrench },
        { label: 'Claims', href: '/admin/claims', icon: Shield },
        { label: 'Titles', href: '/admin/titles', icon: FileText },
        { label: 'Pricing', href: '/admin/pricing', icon: Settings },
        { label: 'Users', href: '/admin/users', icon: Users },
      ]
    },
    {
      title: 'Data Management',
      roles: ['ADMIN'],
      items: [
        { label: 'Organizations', href: '/admin/data/organizations', icon: Building2 },
        { label: 'Contacts', href: '/admin/data/contacts', icon: UserCheck },
        { label: 'System Health', href: '/admin/data/health', icon: Activity },
        { label: 'Data Integrity', href: '/admin/data/integrity', icon: AlertTriangle },
        { label: 'CRM Configuration', href: '/admin/data/crm-config', icon: Database },
      ]
    }
  ]
  
  return baseNavigation
}

interface SidebarProps {
  user?: {
    name?: string
    email?: string
    roles?: string[]
    orgName?: string
  }
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ user: userProp, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const navRef = useRef<HTMLDivElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const { user: authUser, isAuthenticated } = useAuth()
  
  // Use auth context user if no prop user provided
  const user = userProp || authUser
  const userRoles = user?.roles || []
  const navigation = getNavigation(userRoles)
  
  const filteredNavigation = navigation.filter(section => {
    if (!section.roles) return true
    return section.roles.some(role => userRoles.includes(role))
  })

  // Initialize client-side and restore scroll position and collapsed sections
  useEffect(() => {
    setIsClient(true)

    const restoreScrollPosition = () => {
      if (navRef.current) {
        const savedScrollPosition = localStorage.getItem('sidebar-scroll-position')
        if (savedScrollPosition) {
          navRef.current.scrollTop = parseInt(savedScrollPosition, 10)
        }
      }
    }

    // Restore collapsed sections state
    const restoreCollapsedSections = () => {
      try {
        const savedCollapsedSections = localStorage.getItem('sidebar-collapsed-sections')
        if (savedCollapsedSections) {
          setCollapsedSections(JSON.parse(savedCollapsedSections))
        }
      } catch (error) {
        console.error('Error loading collapsed sections from localStorage:', error)
      }
    }

    restoreCollapsedSections()
    // Restore scroll position after component mounts
    setTimeout(restoreScrollPosition, 100)
  }, [])

  // Save scroll position when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        localStorage.setItem('sidebar-scroll-position', navRef.current.scrollTop.toString())
      }
    }

    const navElement = navRef.current
    if (navElement) {
      navElement.addEventListener('scroll', handleScroll, { passive: true })
      return () => navElement.removeEventListener('scroll', handleScroll)
    }
  }, [isClient])

  // Restore scroll position after navigation
  useEffect(() => {
    if (isClient && navRef.current) {
      const savedScrollPosition = localStorage.getItem('sidebar-scroll-position')
      if (savedScrollPosition) {
        navRef.current.scrollTop = parseInt(savedScrollPosition, 10)
      }
    }
  }, [pathname, isClient])

  const isActiveRoute = (href: string) => {
    // Exact match for root dashboard
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    // Exact match for CRM dashboard - only active on exact /crm path
    if (href === '/crm') {
      return pathname === '/crm'
    }
    // For all other routes, use startsWith
    return pathname.startsWith(href)
  }

  const toggleSectionCollapse = (sectionTitle: string) => {
    const newCollapsedSections = {
      ...collapsedSections,
      [sectionTitle]: !collapsedSections[sectionTitle]
    }
    setCollapsedSections(newCollapsedSections)

    // Save to localStorage
    try {
      localStorage.setItem('sidebar-collapsed-sections', JSON.stringify(newCollapsedSections))
    } catch (error) {
      console.error('Error saving collapsed sections to localStorage:', error)
    }
  }

  const NavContent = ({ collapsed = false, navRef }: { collapsed?: boolean, navRef?: React.RefObject<HTMLDivElement> }) => (
    <>
      {/* Logo */}
      <div className={clsx(
        "flex items-center h-16 border-b border-border bg-background transition-all duration-200",
        collapsed ? "px-3 justify-center" : "px-3"
      )}>
        <Link href="/dashboard" className={clsx(
          "flex items-center transition-all duration-200",
          collapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-lg flex items-center justify-center transition-all duration-200 w-8 h-8">
            <Car className="text-primary-foreground transition-all duration-200 w-5 h-5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-foreground truncate">United Cars</span>
          )}
        </Link>
        {/* Desktop collapse toggle */}
        {!collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors ml-auto mr-1"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>


      {/* Expand button when collapsed */}
      {collapsed && onToggleCollapse && (
        <div className="px-3 py-2 border-b border-border">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center py-2 text-text-secondary hover:text-foreground hover:bg-hover-overlay rounded-lg transition-colors group"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav 
        {...(navRef ? { ref: navRef } : {})}
        className={clsx(
          "flex-1 overflow-y-auto transition-all duration-200 scroll-smooth",
          collapsed ? "px-2 py-3 space-y-2" : "px-3 py-4 space-y-6"
        )}
      >
        {filteredNavigation.map((section, sectionIndex) => {
          const isSectionCollapsed = collapsedSections[section.title]

          return (
            <div key={section.title}>
              {!collapsed && (
                <div
                  className="flex items-center justify-between px-3 py-1 cursor-pointer hover:bg-hover-overlay rounded-lg transition-colors group"
                  onClick={() => toggleSectionCollapse(section.title)}
                >
                  <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {isSectionCollapsed ? (
                      <ChevronDown className="h-3 w-3 text-text-tertiary" />
                    ) : (
                      <ChevronUp className="h-3 w-3 text-text-tertiary" />
                    )}
                  </div>
                </div>
              )}
              {collapsed && sectionIndex > 0 && (
                <div className="mx-3 mb-2 border-t border-border/50" />
              )}
              {(!collapsed && !isSectionCollapsed) && (
                <div className={clsx("space-y-1", !collapsed && "mt-2")}>
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = isActiveRoute(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        className={clsx(
                          'group flex items-center text-sm font-medium rounded-lg transition-colors duration-150 relative will-change-auto',
                          collapsed
                            ? 'p-3 justify-center'
                            : 'px-3 py-2',
                          isActive
                            ? collapsed
                              ? 'bg-primary/10 text-primary shadow-sm'
                              : 'bg-primary/5 text-primary border-l-2 border-primary'
                            : 'text-text-secondary hover:bg-hover-overlay hover:text-foreground'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon
                          className={clsx(
                            'h-5 w-5 transition-colors duration-150 flex-shrink-0',
                            !collapsed && 'mr-3',
                            isActive
                              ? 'text-primary'
                              : 'text-text-tertiary group-hover:text-foreground'
                          )}
                        />
                        {!collapsed && (
                          <>
                            {item.label}
                            {item.badge && (
                              <span className="ml-auto bg-primary/10 text-primary py-0.5 px-2 rounded-full text-xs font-medium">
                                {item.badge}
                              </span>
                            )}
                            {isActive && (
                              <ChevronRight className="ml-auto h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </>
                        )}
                        {collapsed && isActive && (
                          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
              {collapsed && (
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = isActiveRoute(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        className={clsx(
                          'group flex items-center text-sm font-medium rounded-lg transition-colors duration-150 relative will-change-auto',
                          'p-3 justify-center',
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-text-secondary hover:bg-hover-overlay hover:text-foreground'
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                        title={item.label}
                      >
                        <Icon
                          className={clsx(
                            'h-5 w-5 transition-colors duration-150 flex-shrink-0',
                            isActive
                              ? 'text-primary'
                              : 'text-text-tertiary group-hover:text-foreground'
                          )}
                        />
                        {isActive && (
                          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={clsx(
        "border-t border-border bg-muted/30",
        collapsed ? "p-2" : "p-4"
      )}>
        {collapsed ? (
          <div className="flex flex-col items-center space-y-2">
            {user && (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div title="Connection Status">
              <RealTimeStatus />
            </div>
            <ThemeToggleCompact className="hover:bg-muted" />
            <span className="text-xs text-muted-foreground font-mono">UC</span>
          </div>
        ) : (
          <div className="space-y-2">
            {user && (
              <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {user.name || 'User'}
                  </p>
                  <div className="flex items-center space-x-1">
                    {user.roles && user.roles.length > 0 && (
                      <span className="text-xs text-text-secondary">
                        {user.roles[0]}
                        {user.roles.length > 1 && ` +${user.roles.length - 1}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Connection</span>
              <RealTimeStatus />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ThemeToggleCompact className="hover:bg-muted" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>© 2024 United Cars</span>
              <span>v1.0.0</span>
            </div>
          </div>
        )}
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
            'relative flex-1 flex flex-col max-w-xs w-full bg-background transform transition-transform duration-300',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <NavContent collapsed={false} navRef={mobileNavRef} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 h-screen w-full">
        <div className={clsx(
          "flex flex-col border-r border-border bg-background transition-all duration-200 h-full",
          isCollapsed ? "w-16" : "w-56"
        )}>
          <NavContent collapsed={isCollapsed} navRef={navRef} />
        </div>
      </div>
    </>
  )
}