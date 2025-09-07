'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Settings, GitBranch, Plus } from 'lucide-react'

export default function CrmConfigurationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CRM Configuration</h1>
          <p className="text-text-secondary mt-2">
            Custom fields, business rules, and entity configurations
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <GitBranch className="w-4 h-4 mr-2" />
            Pipeline Config
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            CRM Configuration Panel will provide comprehensive system configuration tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-text-secondary">
              This panel will include:
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Custom Fields</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Dynamic field creation</li>
                  <li>• Field type management</li>
                  <li>• Validation rules</li>
                  <li>• Entity-specific fields</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Business Rules</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Automated workflows</li>
                  <li>• Pipeline configurations</li>
                  <li>• Stage management</li>
                  <li>• Business logic rules</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}