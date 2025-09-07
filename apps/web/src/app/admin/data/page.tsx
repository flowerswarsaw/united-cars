'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, UserCheck, Activity, AlertTriangle, Database, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const adminPanels = [
  {
    title: 'Organization Management',
    description: 'Manage organizations, relationships, and configurations',
    icon: Building2,
    href: '/admin/data/organizations',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: ['CRUD Operations', 'Field Configuration', 'Relationship Management']
  },
  {
    title: 'Contact Management',
    description: 'Advanced contact validation and relationship management',
    icon: UserCheck,
    href: '/admin/data/contacts',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: ['Contact Validation', 'Duplicate Detection', 'Bulk Operations']
  },
  {
    title: 'System Health',
    description: 'Real-time monitoring and system diagnostics',
    icon: Activity,
    href: '/admin/data/health',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: ['Performance Metrics', 'Service Health', 'Auto-Recovery']
  },
  {
    title: 'Data Integrity',
    description: 'Validate data consistency and automated repair tools',
    icon: AlertTriangle,
    href: '/admin/data/integrity',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    features: ['Integrity Validation', 'Automated Repairs', 'Backup Management']
  },
  {
    title: 'CRM Configuration',
    description: 'Custom fields, business rules, and entity configurations',
    icon: Database,
    href: '/admin/data/crm-config',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    features: ['Custom Fields', 'Business Rules', 'Pipeline Configuration']
  },
  {
    title: 'Activity Log',
    description: 'Comprehensive audit trail with visual timeline and analytics',
    icon: Activity,
    href: '/admin/data/activity-log',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    features: ['Visual Timeline', 'Activity Analytics', 'Audit Trail']
  }
]

export default function AdminDataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Management</h1>
        <p className="text-text-secondary mt-2">
          Comprehensive tools for managing CRM data, system health, and business configuration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminPanels.map((panel) => {
          const Icon = panel.icon
          
          return (
            <Card key={panel.href} className="group hover:shadow-lg transition-all duration-200 border-border">
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${panel.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${panel.color}`} />
                </div>
                <CardTitle className="text-lg font-semibold">{panel.title}</CardTitle>
                <CardDescription className="text-sm text-text-secondary">
                  {panel.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="space-y-1">
                    {panel.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-xs text-text-tertiary">
                        <div className="w-1.5 h-1.5 rounded-full bg-text-tertiary mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <Link href={panel.href}>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Open Panel
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Quick System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-sm text-text-secondary">Organization Types</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">98%</div>
              <div className="text-sm text-text-secondary">Data Integrity</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">Online</div>
              <div className="text-sm text-text-secondary">System Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}