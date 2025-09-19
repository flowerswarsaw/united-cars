import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8" style={{ paddingTop: '11px', paddingBottom: '11px' }}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex mb-3" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                  <Home className="h-4 w-4" />
                </Link>
              </li>
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}