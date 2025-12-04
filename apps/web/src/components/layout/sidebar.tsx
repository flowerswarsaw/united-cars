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
  Activity,
  LifeBuoy,
  UsersRound,
  User,
  Zap,
  Ticket,
  Phone
} from 'lucide-react'
import { ThemeToggleCompact } from '@/components/ui/theme-toggle'
import { RealTimeStatus } from '@/components/ui/real-time-notifications'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  children?: NavItem[]
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
        {
          label: 'Deals',
          href: '/crm/deals/kanban',
          icon: TrendingUp,
          children: [
            { label: 'Kanban', href: '/crm/deals/kanban', icon: TrendingUp },
            { label: 'Recovery', href: '/crm/deals/recovery', icon: LifeBuoy }
          ]
        },
        { label: 'Leads', href: '/crm/leads', icon: Users },
        { label: 'Tasks', href: '/crm/tasks', icon: CheckSquare },
        { label: 'Calls', href: '/crm/calls', icon: Phone },
        { label: 'Tickets', href: '/crm/tickets', icon: Ticket },
        { label: 'Contracts', href: '/crm/contracts', icon: FileText },
        {
          label: 'Settings',
          href: '/crm/settings/general',
          icon: Settings,
          children: [
            { label: 'General', href: '/crm/settings/general', icon: User },
            { label: 'Users', href: '/crm/settings/users', icon: UsersRound },
            { label: 'Pipelines', href: '/crm/settings/pipelines', icon: GitBranch },
            { label: 'Automations', href: '/crm/settings/automations', icon: Zap }
          ]
        },
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
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({})
  const navRef = useRef<HTMLDivElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  const scrollLockRef = useRef(false)
  const scrollPositionRef = useRef<number>(0)
  const { user: authUser, isAuthenticated } = useAuth()

  // Use auth context user if no prop user provided
  const user = userProp || authUser
  const userRoles = user?.roles || []
  const navigation = getNavigation(userRoles)

  // Ref callback to set scroll immediately when element is attached
  const navRefCallback = (node: HTMLDivElement | null) => {
    if (node) {
      navRef.current = node
      // Set scroll position immediately, before any paint
      const savedScroll = localStorage.getItem('sidebar-scroll-position')
      if (savedScroll) {
        node.scrollTop = parseInt(savedScroll, 10)
        scrollPositionRef.current = parseInt(savedScroll, 10)
      }
    }
  }
  
  const filteredNavigation = navigation.filter(section => {
    if (!section.roles) return true
    return section.roles.some(role => userRoles.includes(role))
  })

  // Initialize client-side and restore scroll position and collapsed sections
  useEffect(() => {
    setIsClient(true)

    // Restore collapsed sections state
    try {
      const savedCollapsedSections = localStorage.getItem('sidebar-collapsed-sections')
      if (savedCollapsedSections) {
        setCollapsedSections(JSON.parse(savedCollapsedSections))
      }
    } catch (error) {
      console.error('Error loading collapsed sections from localStorage:', error)
    }

    // Restore collapsed items state
    try {
      const savedCollapsedItems = localStorage.getItem('sidebar-collapsed-items')
      if (savedCollapsedItems) {
        setCollapsedItems(JSON.parse(savedCollapsedItems))
      }
    } catch (error) {
      console.error('Error loading collapsed items from localStorage:', error)
    }
  }, [])

  // Save scroll position when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current && !scrollLockRef.current) {
        const scrollTop = navRef.current.scrollTop
        scrollPositionRef.current = scrollTop
        localStorage.setItem('sidebar-scroll-position', scrollTop.toString())
      }
    }

    const navElement = navRef.current
    if (navElement) {
      navElement.addEventListener('scroll', handleScroll, { passive: true })
      return () => navElement.removeEventListener('scroll', handleScroll)
    }
  }, [isClient])

  // Backup restoration on pathname change - ref callback should handle it first
  useLayoutEffect(() => {
    // The ref callback already set the scroll position, this is just a safety net
    if (navRef.current && scrollPositionRef.current > 0) {
      if (navRef.current.scrollTop !== scrollPositionRef.current) {
        navRef.current.scrollTop = scrollPositionRef.current
      }
    }
  }, [pathname])

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

  const toggleItemCollapse = (itemHref: string) => {
    const newCollapsedItems = {
      ...collapsedItems,
      [itemHref]: !collapsedItems[itemHref]
    }
    setCollapsedItems(newCollapsedItems)

    // Save to localStorage
    try {
      localStorage.setItem('sidebar-collapsed-items', JSON.stringify(newCollapsedItems))
    } catch (error) {
      console.error('Error saving collapsed items to localStorage:', error)
    }
  }

  const handleLinkClick = () => {
    // Save current scroll position before navigation
    if (navRef.current) {
      const scrollTop = navRef.current.scrollTop
      scrollPositionRef.current = scrollTop
      localStorage.setItem('sidebar-scroll-position', scrollTop.toString())
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
        ref={navRefCallback}
        className={clsx(
          "flex-1 overflow-y-auto",
          collapsed ? "px-2 py-3 space-y-2" : "px-3 py-4 space-y-6"
        )}
        style={{
          overflowAnchor: 'none',
          scrollBehavior: 'auto',
          contain: 'layout style paint',
          willChange: 'scroll-position',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
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
                    const hasChildren = item.children && item.children.length > 0
                    const isItemCollapsed = collapsedItems[item.href]

                    return (
                      <div key={item.href}>
                        {hasChildren ? (
                          <div
                            className={clsx(
                              'group flex items-center text-sm font-medium rounded-lg relative  cursor-pointer',
                              collapsed
                                ? 'p-3 justify-center'
                                : 'px-3 py-2',
                              isActive
                                ? collapsed
                                  ? 'bg-primary/10 text-primary shadow-sm'
                                  : 'bg-primary/5 text-primary border-l-2 border-primary'
                                : 'text-text-secondary hover:bg-hover-overlay hover:text-foreground'
                            )}
                            onClick={(e) => {
                              e.preventDefault()
                              toggleItemCollapse(item.href)
                            }}
                            title={collapsed ? item.label : undefined}
                          >
                            <Icon
                              className={clsx(
                                'h-5 w-5  flex-shrink-0',
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
                                <div className="ml-auto">
                                  {isItemCollapsed ? (
                                    <ChevronRight className="h-4 w-4 text-text-tertiary flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-text-tertiary flex-shrink-0" />
                                  )}
                                </div>
                              </>
                            )}
                            {collapsed && isActive && (
                              <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                            )}
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            prefetch={true}
                            className={clsx(
                              'group flex items-center text-sm font-medium rounded-lg  relative ',
                              collapsed
                                ? 'p-3 justify-center'
                                : 'px-3 py-2',
                              isActive
                                ? collapsed
                                  ? 'bg-primary/10 text-primary shadow-sm'
                                  : 'bg-primary/5 text-primary border-l-2 border-primary'
                                : 'text-text-secondary hover:bg-hover-overlay hover:text-foreground'
                            )}
                            onClick={() => {
                              handleLinkClick()
                              setIsMobileMenuOpen(false)
                            }}
                            title={collapsed ? item.label : undefined}
                          >
                            <Icon
                              className={clsx(
                                'h-5 w-5  flex-shrink-0',
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
                        )}

                        {/* Render child items */}
                        {!collapsed && hasChildren && !isItemCollapsed && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon
                              const isChildActive = isActiveRoute(child.href)

                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  prefetch={true}
                                  className={clsx(
                                    'group flex items-center text-sm font-medium rounded-lg  px-3 py-1.5',
                                    isChildActive
                                      ? 'bg-primary/5 text-primary border-l-2 border-primary'
                                      : 'text-text-secondary hover:bg-hover-overlay hover:text-foreground'
                                  )}
                                  onClick={() => {
                                    handleLinkClick()
                                    setIsMobileMenuOpen(false)
                                  }}
                                >
                                  <ChildIcon
                                    className={clsx(
                                      'h-4 w-4 mr-3  flex-shrink-0',
                                      isChildActive
                                        ? 'text-primary'
                                        : 'text-text-tertiary group-hover:text-foreground'
                                    )}
                                  />
                                  {child.label}
                                  {isChildActive && (
                                    <ChevronRight className="ml-auto h-3 w-3 text-primary flex-shrink-0" />
                                  )}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
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
                          'group flex items-center text-sm font-medium rounded-lg  relative ',
                          'p-3 justify-center',
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-text-secondary hover:bg-hover-overlay hover:text-foreground'
                        )}
                        onClick={() => {
                          handleLinkClick()
                          setIsMobileMenuOpen(false)
                        }}
                        title={item.label}
                      >
                        <Icon
                          className={clsx(
                            'h-5 w-5  flex-shrink-0',
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
        <div
          className={clsx(
            "flex flex-col border-r border-border bg-background transition-all duration-200 h-full",
            isCollapsed ? "w-16" : "w-56"
          )}
          style={{
            transform: 'translateZ(0)',
            willChange: 'width'
          }}
        >
          <NavContent collapsed={isCollapsed} navRef={navRef} />
        </div>
      </div>
    </>
  )
}