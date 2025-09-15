"use client";

import { ReactNode } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CRMPageLayoutProps {
  user: any;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  loadingText?: string;
  children: ReactNode;
  className?: string;
}

export function CRMPageLayout({
  user,
  title,
  description,
  breadcrumbs = [],
  loading = false,
  error = null,
  onRetry,
  loadingText = 'Loading...',
  children,
  className = ''
}: CRMPageLayoutProps) {
  // Default breadcrumbs include CRM
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'CRM', href: '/crm' },
    ...breadcrumbs
  ];

  return (
    <AppLayout user={user}>
      <PageHeader 
        title={title}
        description={description}
        breadcrumbs={defaultBreadcrumbs}
      />
      
      <div className={`flex-1 overflow-y-auto ${className}`}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingState text={loadingText} />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Error Loading Data
              </h3>
              <p className="text-red-600 text-sm mb-4">
                {error.message || 'There was an issue loading the data. Please try again.'}
              </p>
              {onRetry && (
                <Button onClick={onRetry} size="sm" className="bg-red-600 hover:bg-red-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && children}
        </div>
      </div>
    </AppLayout>
  );
}