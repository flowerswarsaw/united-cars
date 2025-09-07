'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Database, 
  Plus, 
  Settings, 
  Edit, 
  Trash2, 
  MoreVertical,
  GitBranch,
  Code,
  Layers,
  Zap,
  Save,
  X,
  Eye,
  Copy,
  ToggleLeft,
  Hash,
  Calendar,
  Type,
  List,
  CheckSquare,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  FileText
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Custom field types supported by the CRM system
enum CustomFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER', 
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  JSON = 'JSON',
  URL = 'URL',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE'
}

// Entity types that support custom fields
enum ConfigurableEntity {
  ORGANIZATION = 'ORGANIZATION',
  CONTACT = 'CONTACT', 
  DEAL = 'DEAL',
  LEAD = 'LEAD',
  TASK = 'TASK'
}

// Business rule types
enum BusinessRuleType {
  FIELD_VALIDATION = 'FIELD_VALIDATION',
  AUTO_ASSIGNMENT = 'AUTO_ASSIGNMENT',
  WORKFLOW_TRIGGER = 'WORKFLOW_TRIGGER',
  NOTIFICATION_RULE = 'NOTIFICATION_RULE',
  DATA_TRANSFORMATION = 'DATA_TRANSFORMATION'
}

interface CustomField {
  id: string
  name: string
  label: string
  type: CustomFieldType
  entityType: ConfigurableEntity
  isRequired: boolean
  isVisible: boolean
  isEditable: boolean
  defaultValue?: any
  options?: string[] // For SELECT and MULTI_SELECT types
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  metadata?: {
    group?: string
    order?: number
    description?: string
    helpText?: string
  }
  createdAt: Date
  updatedAt: Date
}

interface BusinessRule {
  id: string
  name: string
  description: string
  type: BusinessRuleType
  entityType: ConfigurableEntity
  isActive: boolean
  conditions: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
    value: any
  }[]
  actions: {
    type: 'set_field' | 'send_notification' | 'assign_user' | 'create_task' | 'run_webhook'
    params: Record<string, any>
  }[]
  createdAt: Date
  updatedAt: Date
}

interface Pipeline {
  id: string
  name: string
  entityType: 'DEAL' | 'LEAD'
  isDefault: boolean
  stages: {
    id: string
    name: string
    order: number
    probability?: number
    isClosedWon?: boolean
    isClosedLost?: boolean
  }[]
  createdAt: Date
  updatedAt: Date
}

// Mock data for custom fields
const mockCustomFields: CustomField[] = [
  {
    id: 'cf-1',
    name: 'deal_size_category',
    label: 'Deal Size Category',
    type: CustomFieldType.SELECT,
    entityType: ConfigurableEntity.DEAL,
    isRequired: false,
    isVisible: true,
    isEditable: true,
    options: ['Small (<$10k)', 'Medium ($10k-$50k)', 'Large ($50k-$100k)', 'Enterprise (>$100k)'],
    metadata: {
      group: 'Financial',
      order: 1,
      description: 'Categorizes deals by potential value',
      helpText: 'Used for reporting and commission calculations'
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-01')
  },
  {
    id: 'cf-2',
    name: 'vehicle_preference',
    label: 'Vehicle Type Preference',
    type: CustomFieldType.MULTI_SELECT,
    entityType: ConfigurableEntity.CONTACT,
    isRequired: false,
    isVisible: true,
    isEditable: true,
    options: ['Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible', 'Motorcycle'],
    metadata: {
      group: 'Preferences',
      order: 2,
      description: 'Contact vehicle type interests'
    },
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-08-15')
  },
  {
    id: 'cf-3',
    name: 'compliance_score',
    label: 'Compliance Score',
    type: CustomFieldType.NUMBER,
    entityType: ConfigurableEntity.ORGANIZATION,
    isRequired: true,
    isVisible: true,
    isEditable: false,
    validation: {
      min: 0,
      max: 100,
      message: 'Score must be between 0 and 100'
    },
    metadata: {
      group: 'Compliance',
      order: 1,
      description: 'Automated compliance rating',
      helpText: 'Updated automatically based on audit results'
    },
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-09-05')
  }
]

// Mock business rules
const mockBusinessRules: BusinessRule[] = [
  {
    id: 'br-1',
    name: 'High Value Deal Auto-Assignment',
    description: 'Automatically assign senior sales reps to deals over $50k',
    type: BusinessRuleType.AUTO_ASSIGNMENT,
    entityType: ConfigurableEntity.DEAL,
    isActive: true,
    conditions: [
      {
        field: 'value',
        operator: 'greater_than',
        value: 50000
      }
    ],
    actions: [
      {
        type: 'assign_user',
        params: { role: 'senior_sales', notify: true }
      }
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-08-10')
  },
  {
    id: 'br-2',
    name: 'Compliance Alert',
    description: 'Send notification when compliance score drops below 70',
    type: BusinessRuleType.NOTIFICATION_RULE,
    entityType: ConfigurableEntity.ORGANIZATION,
    isActive: true,
    conditions: [
      {
        field: 'compliance_score',
        operator: 'less_than',
        value: 70
      }
    ],
    actions: [
      {
        type: 'send_notification',
        params: { 
          recipients: ['compliance@company.com'], 
          template: 'compliance_alert',
          priority: 'high'
        }
      }
    ],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-09-01')
  }
]

// Mock pipelines
const mockPipelines: Pipeline[] = [
  {
    id: 'pipeline-1',
    name: 'Dealer Sales Pipeline',
    entityType: 'DEAL',
    isDefault: true,
    stages: [
      { id: 'stage-1', name: 'Qualification', order: 1, probability: 10 },
      { id: 'stage-2', name: 'Proposal', order: 2, probability: 25 },
      { id: 'stage-3', name: 'Negotiation', order: 3, probability: 50 },
      { id: 'stage-4', name: 'Closed Won', order: 4, probability: 100, isClosedWon: true },
      { id: 'stage-5', name: 'Closed Lost', order: 5, probability: 0, isClosedLost: true }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-08-15')
  },
  {
    id: 'pipeline-2',
    name: 'Lead Nurturing Pipeline',
    entityType: 'LEAD',
    isDefault: true,
    stages: [
      { id: 'stage-6', name: 'New Lead', order: 1 },
      { id: 'stage-7', name: 'Contacted', order: 2 },
      { id: 'stage-8', name: 'Qualified', order: 3 },
      { id: 'stage-9', name: 'Converted', order: 4 },
      { id: 'stage-10', name: 'Disqualified', order: 5 }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-07-20')
  }
]

interface CustomFieldFormData {
  name: string
  label: string
  type: CustomFieldType
  entityType: ConfigurableEntity
  isRequired: boolean
  isVisible: boolean
  isEditable: boolean
  defaultValue: string
  options: string[]
  validation: {
    min: string
    max: string
    pattern: string
    message: string
  }
  metadata: {
    group: string
    order: string
    description: string
    helpText: string
  }
}

interface BusinessRuleFormData {
  name: string
  description: string
  type: BusinessRuleType
  entityType: ConfigurableEntity
  isActive: boolean
  conditions: Array<{
    field: string
    operator: string
    value: string
  }>
  actions: Array<{
    type: string
    params: string // JSON string
  }>
}

export default function CrmConfigurationPage() {
  const [customFields, setCustomFields] = useState<CustomField[]>(mockCustomFields)
  const [businessRules, setBusinessRules] = useState<BusinessRule[]>(mockBusinessRules)
  const [pipelines, setPipelines] = useState<Pipeline[]>(mockPipelines)
  const [activeTab, setActiveTab] = useState('fields')
  
  // Dialog states
  const [isCustomFieldDialogOpen, setIsCustomFieldDialogOpen] = useState(false)
  const [isBusinessRuleDialogOpen, setIsBusinessRuleDialogOpen] = useState(false)
  const [isPipelineDialogOpen, setIsPipelineDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter states
  const [fieldFilter, setFieldFilter] = useState<string>('all')
  const [ruleFilter, setRuleFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Form data
  const [customFieldForm, setCustomFieldForm] = useState<CustomFieldFormData>({
    name: '',
    label: '',
    type: CustomFieldType.TEXT,
    entityType: ConfigurableEntity.CONTACT,
    isRequired: false,
    isVisible: true,
    isEditable: true,
    defaultValue: '',
    options: [],
    validation: { min: '', max: '', pattern: '', message: '' },
    metadata: { group: '', order: '', description: '', helpText: '' }
  })

  const [businessRuleForm, setBusinessRuleForm] = useState<BusinessRuleFormData>({
    name: '',
    description: '',
    type: BusinessRuleType.FIELD_VALIDATION,
    entityType: ConfigurableEntity.CONTACT,
    isActive: true,
    conditions: [{ field: '', operator: 'equals', value: '' }],
    actions: [{ type: 'set_field', params: '{}' }]
  })

  const handleCreateCustomField = async () => {
    setIsLoading(true)
    
    const newField: CustomField = {
      id: `cf-${Date.now()}`,
      name: customFieldForm.name,
      label: customFieldForm.label,
      type: customFieldForm.type,
      entityType: customFieldForm.entityType,
      isRequired: customFieldForm.isRequired,
      isVisible: customFieldForm.isVisible,
      isEditable: customFieldForm.isEditable,
      defaultValue: customFieldForm.defaultValue || undefined,
      options: customFieldForm.options.length > 0 ? customFieldForm.options : undefined,
      validation: customFieldForm.validation.min || customFieldForm.validation.max || customFieldForm.validation.pattern ? {
        min: customFieldForm.validation.min ? parseInt(customFieldForm.validation.min) : undefined,
        max: customFieldForm.validation.max ? parseInt(customFieldForm.validation.max) : undefined,
        pattern: customFieldForm.validation.pattern || undefined,
        message: customFieldForm.validation.message || undefined
      } : undefined,
      metadata: {
        group: customFieldForm.metadata.group || undefined,
        order: customFieldForm.metadata.order ? parseInt(customFieldForm.metadata.order) : undefined,
        description: customFieldForm.metadata.description || undefined,
        helpText: customFieldForm.metadata.helpText || undefined
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setCustomFields(prev => [...prev, newField])
    setIsCustomFieldDialogOpen(false)
    resetCustomFieldForm()
    setIsLoading(false)
  }

  const handleCreateBusinessRule = async () => {
    setIsLoading(true)
    
    const newRule: BusinessRule = {
      id: `br-${Date.now()}`,
      name: businessRuleForm.name,
      description: businessRuleForm.description,
      type: businessRuleForm.type,
      entityType: businessRuleForm.entityType,
      isActive: businessRuleForm.isActive,
      conditions: businessRuleForm.conditions.map(c => ({
        field: c.field,
        operator: c.operator as any,
        value: c.value
      })),
      actions: businessRuleForm.actions.map(a => ({
        type: a.type as any,
        params: JSON.parse(a.params || '{}')
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setBusinessRules(prev => [...prev, newRule])
    setIsBusinessRuleDialogOpen(false)
    resetBusinessRuleForm()
    setIsLoading(false)
  }

  const handleDeleteCustomField = (id: string) => {
    if (!confirm('Are you sure you want to delete this custom field?')) return
    setCustomFields(prev => prev.filter(f => f.id !== id))
  }

  const handleDeleteBusinessRule = (id: string) => {
    if (!confirm('Are you sure you want to delete this business rule?')) return
    setBusinessRules(prev => prev.filter(r => r.id !== id))
  }

  const toggleBusinessRule = (id: string) => {
    setBusinessRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive, updatedAt: new Date() } : rule
    ))
  }

  const resetCustomFieldForm = () => {
    setCustomFieldForm({
      name: '',
      label: '',
      type: CustomFieldType.TEXT,
      entityType: ConfigurableEntity.CONTACT,
      isRequired: false,
      isVisible: true,
      isEditable: true,
      defaultValue: '',
      options: [],
      validation: { min: '', max: '', pattern: '', message: '' },
      metadata: { group: '', order: '', description: '', helpText: '' }
    })
  }

  const resetBusinessRuleForm = () => {
    setBusinessRuleForm({
      name: '',
      description: '',
      type: BusinessRuleType.FIELD_VALIDATION,
      entityType: ConfigurableEntity.CONTACT,
      isActive: true,
      conditions: [{ field: '', operator: 'equals', value: '' }],
      actions: [{ type: 'set_field', params: '{}' }]
    })
  }

  const getFieldTypeIcon = (type: CustomFieldType) => {
    const icons = {
      [CustomFieldType.TEXT]: Type,
      [CustomFieldType.NUMBER]: Hash,
      [CustomFieldType.DATE]: Calendar,
      [CustomFieldType.BOOLEAN]: ToggleLeft,
      [CustomFieldType.SELECT]: List,
      [CustomFieldType.MULTI_SELECT]: CheckSquare,
      [CustomFieldType.JSON]: Code,
      [CustomFieldType.URL]: Copy,
      [CustomFieldType.EMAIL]: Copy,
      [CustomFieldType.PHONE]: Copy
    }
    
    const IconComponent = icons[type] || Type
    return <IconComponent className="w-4 h-4" />
  }

  const getRuleTypeColor = (type: BusinessRuleType) => {
    const colors = {
      [BusinessRuleType.FIELD_VALIDATION]: 'bg-blue-100 text-blue-800',
      [BusinessRuleType.AUTO_ASSIGNMENT]: 'bg-green-100 text-green-800',
      [BusinessRuleType.WORKFLOW_TRIGGER]: 'bg-purple-100 text-purple-800',
      [BusinessRuleType.NOTIFICATION_RULE]: 'bg-orange-100 text-orange-800',
      [BusinessRuleType.DATA_TRANSFORMATION]: 'bg-gray-100 text-gray-800'
    }
    
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const addCondition = () => {
    setBusinessRuleForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }]
    }))
  }

  const addAction = () => {
    setBusinessRuleForm(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'set_field', params: '{}' }]
    }))
  }

  const updateCondition = (index: number, field: string, value: any) => {
    setBusinessRuleForm(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? { ...c, [field]: value } : c)
    }))
  }

  const updateAction = (index: number, field: string, value: any) => {
    setBusinessRuleForm(prev => ({
      ...prev,
      actions: prev.actions.map((a, i) => i === index ? { ...a, [field]: value } : a)
    }))
  }

  const filteredCustomFields = customFields.filter(field => {
    const matchesEntity = fieldFilter === 'all' || field.entityType === fieldFilter
    const matchesSearch = searchTerm === '' || 
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.label.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesEntity && matchesSearch
  })

  const filteredBusinessRules = businessRules.filter(rule => {
    const matchesEntity = ruleFilter === 'all' || rule.entityType === ruleFilter
    const matchesSearch = searchTerm === '' ||
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesEntity && matchesSearch
  })

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
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Export Config
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Documentation
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Custom Fields</div>
                <div className="text-2xl font-bold">{customFields.length}</div>
              </div>
              <Layers className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Business Rules</div>
                <div className="text-2xl font-bold">{businessRules.length}</div>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Active Rules</div>
                <div className="text-2xl font-bold text-green-600">
                  {businessRules.filter(r => r.isActive).length}
                </div>
              </div>
              <CheckSquare className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Pipelines</div>
                <div className="text-2xl font-bold">{pipelines.length}</div>
              </div>
              <GitBranch className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fields">Custom Fields</TabsTrigger>
          <TabsTrigger value="rules">Business Rules</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
        </TabsList>

        {/* Custom Fields Tab */}
        <TabsContent value="fields" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                <Input
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={fieldFilter} onValueChange={setFieldFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="ORGANIZATION">Organizations</SelectItem>
                  <SelectItem value="CONTACT">Contacts</SelectItem>
                  <SelectItem value="DEAL">Deals</SelectItem>
                  <SelectItem value="LEAD">Leads</SelectItem>
                  <SelectItem value="TASK">Tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isCustomFieldDialogOpen} onOpenChange={setIsCustomFieldDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Field
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
              <CardDescription>
                {filteredCustomFields.length} field{filteredCustomFields.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomFields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{field.label}</div>
                            <div className="text-sm text-text-secondary">{field.name}</div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getFieldTypeIcon(field.type)}
                            <span className="text-sm">{field.type}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline">{field.entityType}</Badge>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={field.isRequired ? 'destructive' : 'secondary'}>
                            {field.isRequired ? 'Required' : 'Optional'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">{field.metadata?.group || 'None'}</div>
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteCustomField(field.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                <Input
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={ruleFilter} onValueChange={setRuleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="ORGANIZATION">Organizations</SelectItem>
                  <SelectItem value="CONTACT">Contacts</SelectItem>
                  <SelectItem value="DEAL">Deals</SelectItem>
                  <SelectItem value="LEAD">Leads</SelectItem>
                  <SelectItem value="TASK">Tasks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isBusinessRuleDialogOpen} onOpenChange={setIsBusinessRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Business Rule
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Business Rules</CardTitle>
              <CardDescription>
                {filteredBusinessRules.length} rule{filteredBusinessRules.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBusinessRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-text-secondary">{rule.description}</div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline" className={getRuleTypeColor(rule.type)}>
                            {rule.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline">{rule.entityType}</Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleBusinessRule(rule.id)}
                            >
                              <ToggleLeft className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteBusinessRule(rule.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipelines Tab */}
        <TabsContent value="pipelines" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pipeline Configuration</h3>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Pipeline
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pipelines.map((pipeline) => (
              <Card key={pipeline.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <CardDescription>
                        {pipeline.entityType} Pipeline • {pipeline.stages.length} stages
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {pipeline.isDefault && (
                        <Badge variant="default">Default</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Pipeline
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pipeline.stages.map((stage, index) => (
                      <div key={stage.id} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{stage.order}.</span>
                          <span className="text-sm">{stage.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {stage.probability !== undefined && (
                            <span className="text-xs text-text-secondary">{stage.probability}%</span>
                          )}
                          {stage.isClosedWon && (
                            <Badge variant="default" className="text-xs">Won</Badge>
                          )}
                          {stage.isClosedLost && (
                            <Badge variant="destructive" className="text-xs">Lost</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Field Dialog */}
      <Dialog open={isCustomFieldDialogOpen} onOpenChange={(open) => {
        setIsCustomFieldDialogOpen(open)
        if (!open) resetCustomFieldForm()
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Field</DialogTitle>
            <DialogDescription>
              Add a custom field to extend entity data structures
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="field-name">Field Name *</Label>
                <Input
                  id="field-name"
                  value={customFieldForm.name}
                  onChange={(e) => setCustomFieldForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., deal_size_category"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-label">Display Label *</Label>
                <Input
                  id="field-label"
                  value={customFieldForm.label}
                  onChange={(e) => setCustomFieldForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Deal Size Category"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-type">Field Type *</Label>
                <Select value={customFieldForm.type} onValueChange={(value) => 
                  setCustomFieldForm(prev => ({ ...prev, type: value as CustomFieldType }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CustomFieldType.TEXT}>Text</SelectItem>
                    <SelectItem value={CustomFieldType.NUMBER}>Number</SelectItem>
                    <SelectItem value={CustomFieldType.DATE}>Date</SelectItem>
                    <SelectItem value={CustomFieldType.BOOLEAN}>Boolean</SelectItem>
                    <SelectItem value={CustomFieldType.SELECT}>Select</SelectItem>
                    <SelectItem value={CustomFieldType.MULTI_SELECT}>Multi Select</SelectItem>
                    <SelectItem value={CustomFieldType.EMAIL}>Email</SelectItem>
                    <SelectItem value={CustomFieldType.PHONE}>Phone</SelectItem>
                    <SelectItem value={CustomFieldType.URL}>URL</SelectItem>
                    <SelectItem value={CustomFieldType.JSON}>JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity-type">Entity Type *</Label>
                <Select value={customFieldForm.entityType} onValueChange={(value) => 
                  setCustomFieldForm(prev => ({ ...prev, entityType: value as ConfigurableEntity }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ConfigurableEntity.ORGANIZATION}>Organization</SelectItem>
                    <SelectItem value={ConfigurableEntity.CONTACT}>Contact</SelectItem>
                    <SelectItem value={ConfigurableEntity.DEAL}>Deal</SelectItem>
                    <SelectItem value={ConfigurableEntity.LEAD}>Lead</SelectItem>
                    <SelectItem value={ConfigurableEntity.TASK}>Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field Options for Select types */}
              {(customFieldForm.type === CustomFieldType.SELECT || customFieldForm.type === CustomFieldType.MULTI_SELECT) && (
                <div className="space-y-2">
                  <Label htmlFor="options">Options (one per line)</Label>
                  <Textarea
                    id="options"
                    value={customFieldForm.options.join('\n')}
                    onChange={(e) => setCustomFieldForm(prev => ({ 
                      ...prev, 
                      options: e.target.value.split('\n').filter(o => o.trim()) 
                    }))}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                  />
                </div>
              )}
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Field Configuration</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-required"
                    checked={customFieldForm.isRequired}
                    onCheckedChange={(checked) => setCustomFieldForm(prev => ({ ...prev, isRequired: !!checked }))}
                  />
                  <Label htmlFor="is-required">Required field</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-visible"
                    checked={customFieldForm.isVisible}
                    onCheckedChange={(checked) => setCustomFieldForm(prev => ({ ...prev, isVisible: !!checked }))}
                  />
                  <Label htmlFor="is-visible">Visible in forms</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-editable"
                    checked={customFieldForm.isEditable}
                    onCheckedChange={(checked) => setCustomFieldForm(prev => ({ ...prev, isEditable: !!checked }))}
                  />
                  <Label htmlFor="is-editable">Editable by users</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-value">Default Value</Label>
                <Input
                  id="default-value"
                  value={customFieldForm.defaultValue}
                  onChange={(e) => setCustomFieldForm(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder="Optional default value"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-group">Field Group</Label>
                <Input
                  id="field-group"
                  value={customFieldForm.metadata.group}
                  onChange={(e) => setCustomFieldForm(prev => ({ 
                    ...prev, 
                    metadata: { ...prev.metadata, group: e.target.value } 
                  }))}
                  placeholder="e.g., Financial, Preferences"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={customFieldForm.metadata.description}
                  onChange={(e) => setCustomFieldForm(prev => ({ 
                    ...prev, 
                    metadata: { ...prev.metadata, description: e.target.value } 
                  }))}
                  placeholder="Brief description of this field"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomFieldDialogOpen(false)
                resetCustomFieldForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomField}
              disabled={isLoading || !customFieldForm.name || !customFieldForm.label}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Create Field
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Business Rule Dialog */}
      <Dialog open={isBusinessRuleDialogOpen} onOpenChange={(open) => {
        setIsBusinessRuleDialogOpen(open)
        if (!open) resetBusinessRuleForm()
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Business Rule</DialogTitle>
            <DialogDescription>
              Define automated business logic and workflows
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name *</Label>
                <Input
                  id="rule-name"
                  value={businessRuleForm.name}
                  onChange={(e) => setBusinessRuleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High Value Deal Auto-Assignment"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule-entity">Entity Type *</Label>
                <Select value={businessRuleForm.entityType} onValueChange={(value) => 
                  setBusinessRuleForm(prev => ({ ...prev, entityType: value as ConfigurableEntity }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ConfigurableEntity.ORGANIZATION}>Organization</SelectItem>
                    <SelectItem value={ConfigurableEntity.CONTACT}>Contact</SelectItem>
                    <SelectItem value={ConfigurableEntity.DEAL}>Deal</SelectItem>
                    <SelectItem value={ConfigurableEntity.LEAD}>Lead</SelectItem>
                    <SelectItem value={ConfigurableEntity.TASK}>Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="rule-description">Description</Label>
                <Textarea
                  id="rule-description"
                  value={businessRuleForm.description}
                  onChange={(e) => setBusinessRuleForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule does..."
                  rows={2}
                />
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Conditions (When)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </div>

              <div className="space-y-2">
                {businessRuleForm.conditions.map((condition, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 items-center">
                    <Input
                      placeholder="Field name"
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    />
                    <Select value={condition.operator} onValueChange={(value) => updateCondition(index, 'operator', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="is_empty">Is Empty</SelectItem>
                        <SelectItem value="is_not_empty">Is Not Empty</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Value"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      />
                      {businessRuleForm.conditions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBusinessRuleForm(prev => ({
                            ...prev,
                            conditions: prev.conditions.filter((_, i) => i !== index)
                          }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Actions (Then)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Action
                </Button>
              </div>

              <div className="space-y-2">
                {businessRuleForm.actions.map((action, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 items-center">
                    <Select value={action.type} onValueChange={(value) => updateAction(index, 'type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="set_field">Set Field</SelectItem>
                        <SelectItem value="send_notification">Send Notification</SelectItem>
                        <SelectItem value="assign_user">Assign User</SelectItem>
                        <SelectItem value="create_task">Create Task</SelectItem>
                        <SelectItem value="run_webhook">Run Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Textarea
                        placeholder='{"key": "value"}'
                        value={action.params}
                        onChange={(e) => updateAction(index, 'params', e.target.value)}
                        rows={2}
                      />
                      {businessRuleForm.actions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBusinessRuleForm(prev => ({
                            ...prev,
                            actions: prev.actions.filter((_, i) => i !== index)
                          }))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsBusinessRuleDialogOpen(false)
                resetBusinessRuleForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBusinessRule}
              disabled={isLoading || !businessRuleForm.name}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Create Rule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}