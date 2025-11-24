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
  Building2, 
  Plus, 
  Settings, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  Filter,
  Import,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Tag,
  Link as LinkIcon,
  Save,
  X
} from 'lucide-react'
import { UnifiedOrganization, UnifiedOrganizationType, ContactMethodType } from '@united-cars/core'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { useSession } from '@/hooks/useSession'

// Mock data for development - in production this would come from API
const mockOrganizations: UnifiedOrganization[] = [
  {
    id: 'org-1',
    name: 'AutoDeal Partners',
    type: UnifiedOrganizationType.DEALER,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-08-20'),
    source: 'UNIFIED',
    syncStatus: 'SYNCED',
    extended: {
      contactMethods: [
        {
          id: 'cm-1',
          type: ContactMethodType.EMAIL,
          value: 'info@autodeal.com',
          isPrimary: true,
          label: 'Primary Email'
        },
        {
          id: 'cm-2',
          type: ContactMethodType.PHONE,
          value: '+1-555-0123',
          isPrimary: true,
          label: 'Main Office'
        }
      ],
      address: {
        address: '123 Commerce St',
        city: 'Houston',
        state: 'TX',
        country: 'USA',
        postalCode: '77001'
      },
      businessInfo: {
        industry: 'Automotive',
        website: 'https://autodeal.com',
        companyId: 'TX-AUTO-001'
      },
      tags: ['Premium', 'High Volume', 'Texas']
    }
  },
  {
    id: 'org-2',
    name: 'Copart Houston',
    type: UnifiedOrganizationType.AUCTION,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-09-05'),
    source: 'MAIN',
    syncStatus: 'SYNCED',
    extended: {
      contactMethods: [
        {
          id: 'cm-3',
          type: ContactMethodType.EMAIL,
          value: 'houston@copart.com',
          isPrimary: true
        }
      ],
      address: {
        address: '7940 Jade Stone Lane',
        city: 'Houston',
        state: 'TX',
        country: 'USA',
        postalCode: '77072'
      },
      businessInfo: {
        industry: 'Automotive Auction',
        website: 'https://copart.com'
      },
      tags: ['Major Auction', 'Houston']
    }
  },
  {
    id: 'org-3',
    name: 'Swift Transport Solutions',
    type: UnifiedOrganizationType.TRANSPORTER,
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-09-01'),
    source: 'CRM',
    syncStatus: 'PENDING',
    extended: {
      contactMethods: [
        {
          id: 'cm-4',
          type: ContactMethodType.EMAIL,
          value: 'dispatch@swift-transport.com',
          isPrimary: true
        }
      ],
      businessInfo: {
        industry: 'Transportation'
      },
      tags: ['Reliable', 'Fast Service']
    }
  }
]

const organizationTypes = [
  { value: UnifiedOrganizationType.DEALER, label: 'Dealer' },
  { value: UnifiedOrganizationType.AUCTION, label: 'Auction House' },
  { value: UnifiedOrganizationType.TRANSPORTER, label: 'Transporter' },
  { value: UnifiedOrganizationType.SHIPPER, label: 'Shipper' },
  { value: UnifiedOrganizationType.EXPEDITOR, label: 'Expeditor' },
  { value: UnifiedOrganizationType.PROCESSOR, label: 'Processor' },
  { value: UnifiedOrganizationType.RETAIL_CLIENT, label: 'Retail Client' },
  { value: UnifiedOrganizationType.ADMIN, label: 'Admin' }
]

interface OrganizationFormData {
  name: string
  type: UnifiedOrganizationType
  contactMethods: Array<{
    type: ContactMethodType
    value: string
    isPrimary: boolean
    label: string
  }>
  address: {
    address: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  businessInfo: {
    industry: string
    website: string
    companyId: string
  }
  tags: string[]
}

export default function OrganizationManagementPage() {
  const { user, loading: sessionLoading } = useSession()
  const [organizations, setOrganizations] = useState<UnifiedOrganization[]>(mockOrganizations)
  const [filteredOrganizations, setFilteredOrganizations] = useState<UnifiedOrganization[]>(mockOrganizations)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<UnifiedOrganization | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    type: UnifiedOrganizationType.DEALER,
    contactMethods: [
      {
        type: ContactMethodType.EMAIL,
        value: '',
        isPrimary: true,
        label: 'Primary Email'
      }
    ],
    address: {
      address: '',
      city: '',
      state: '',
      country: 'USA',
      postalCode: ''
    },
    businessInfo: {
      industry: '',
      website: '',
      companyId: ''
    },
    tags: []
  })

  // Filter organizations based on search and filters
  useEffect(() => {
    let filtered = organizations

    if (searchTerm) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.extended?.businessInfo?.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.extended?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(org => org.type === filterType)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(org => org.syncStatus === filterStatus)
    }

    setFilteredOrganizations(filtered)
  }, [organizations, searchTerm, filterType, filterStatus])

  const handleCreateOrganization = async () => {
    setIsLoading(true)
    
    // Mock creation - in production this would be an API call
    const newOrg: UnifiedOrganization = {
      id: `org-${Date.now()}`,
      name: formData.name,
      type: formData.type,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: 'UNIFIED',
      syncStatus: 'SYNCED',
      extended: {
        contactMethods: formData.contactMethods.map((cm, index) => ({
          ...cm,
          id: `cm-${Date.now()}-${index}`
        })),
        address: formData.address,
        businessInfo: formData.businessInfo,
        tags: formData.tags
      }
    }

    setOrganizations(prev => [...prev, newOrg])
    setIsCreateDialogOpen(false)
    resetForm()
    setIsLoading(false)
  }

  const handleUpdateOrganization = async () => {
    if (!selectedOrganization) return
    
    setIsLoading(true)
    
    // Mock update - in production this would be an API call
    const updatedOrg: UnifiedOrganization = {
      ...selectedOrganization,
      name: formData.name,
      type: formData.type,
      updatedAt: new Date(),
      extended: {
        ...selectedOrganization.extended,
        contactMethods: formData.contactMethods.map((cm, index) => ({
          ...cm,
          id: cm.id || `cm-${Date.now()}-${index}`
        })),
        address: formData.address,
        businessInfo: formData.businessInfo,
        tags: formData.tags
      }
    }

    setOrganizations(prev => 
      prev.map(org => org.id === selectedOrganization.id ? updatedOrg : org)
    )
    setIsEditDialogOpen(false)
    setSelectedOrganization(null)
    resetForm()
    setIsLoading(false)
  }

  const handleDeleteOrganization = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization?')) return
    
    // Mock deletion - in production this would be an API call
    setOrganizations(prev => prev.filter(org => org.id !== id))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: UnifiedOrganizationType.DEALER,
      contactMethods: [
        {
          type: ContactMethodType.EMAIL,
          value: '',
          isPrimary: true,
          label: 'Primary Email'
        }
      ],
      address: {
        address: '',
        city: '',
        state: '',
        country: 'USA',
        postalCode: ''
      },
      businessInfo: {
        industry: '',
        website: '',
        companyId: ''
      },
      tags: []
    })
  }

  const populateFormFromOrganization = (org: UnifiedOrganization) => {
    setFormData({
      name: org.name,
      type: org.type,
      contactMethods: org.extended?.contactMethods || [],
      address: org.extended?.address || {
        address: '',
        city: '',
        state: '',
        country: 'USA',
        postalCode: ''
      },
      businessInfo: org.extended?.businessInfo || {
        industry: '',
        website: '',
        companyId: ''
      },
      tags: org.extended?.tags || []
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'SYNCED': 'default',
      'PENDING': 'secondary', 
      'CONFLICT': 'destructive',
      'ERROR': 'destructive'
    } as const
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>
  }

  const getSourceBadge = (source: string) => {
    const colors = {
      'MAIN': 'text-blue-600 bg-blue-50',
      'CRM': 'text-green-600 bg-green-50',
      'UNIFIED': 'text-purple-600 bg-purple-50'
    } as const
    
    return (
      <Badge variant="outline" className={colors[source as keyof typeof colors] || ''}>
        {source}
      </Badge>
    )
  }

  const addContactMethod = () => {
    setFormData(prev => ({
      ...prev,
      contactMethods: [
        ...prev.contactMethods,
        {
          type: ContactMethodType.EMAIL,
          value: '',
          isPrimary: false,
          label: ''
        }
      ]
    }))
  }

  const removeContactMethod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.filter((_, i) => i !== index)
    }))
  }

  const updateContactMethod = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.map((cm, i) => 
        i === index ? { ...cm, [field]: value } : cm
      )
    }))
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Organization Management"
        description="Manage organizations, relationships, and field configurations"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Data' }, { label: 'Organizations' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Import className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Organization
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Total Organizations</div>
                <div className="text-2xl font-bold">{organizations.length}</div>
              </div>
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Synced</div>
                <div className="text-2xl font-bold text-green-600">
                  {organizations.filter(org => org.syncStatus === 'SYNCED').length}
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Pending Sync</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {organizations.filter(org => org.syncStatus === 'PENDING').length}
                </div>
              </div>
              <RefreshCw className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Conflicts</div>
                <div className="text-2xl font-bold text-red-600">
                  {organizations.filter(org => org.syncStatus === 'CONFLICT').length}
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {organizationTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="SYNCED">Synced</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFLICT">Conflict</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            {filteredOrganizations.length} organization{filteredOrganizations.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-text-secondary">
                          {org.extended?.businessInfo?.industry}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {org.type.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {org.extended?.contactMethods?.find(cm => cm.isPrimary)?.value || 'No contact'}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {org.extended?.address ? 
                          `${org.extended.address.city}, ${org.extended.address.state}` : 
                          'No address'
                        }
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getSourceBadge(org.source)}
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(org.syncStatus || 'UNKNOWN')}
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedOrganization(org)
                            populateFormFromOrganization(org)
                            setIsEditDialogOpen(true)
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteOrganization(org.id)}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedOrganization(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? 'Create Organization' : 'Edit Organization'}
            </DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen ? 
                'Add a new organization to the system with contact details and business information.' :
                'Update organization details and business information.'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter organization name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Organization Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, type: value as UnifiedOrganizationType }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Address</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Street Address"
                    value={formData.address.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, address: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="City"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="State"
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="Postal Code"
                    value={formData.address.postalCode}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, postalCode: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Contact Methods</Label>
                <Button type="button" variant="outline" size="sm" onClick={addContactMethod}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              <div className="space-y-4">
                {formData.contactMethods.map((contact, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select 
                            value={contact.type} 
                            onValueChange={(value) => updateContactMethod(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ContactMethodType.EMAIL}>Work Email</SelectItem>
                              <SelectItem value={ContactMethodType.EMAIL}>Personal Email</SelectItem>
                              <SelectItem value={ContactMethodType.PHONE}>Work Phone</SelectItem>
                              <SelectItem value={ContactMethodType.PHONE}>Mobile Phone</SelectItem>
                              <SelectItem value={ContactMethodType.PHONE}>Fax</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            value={contact.value}
                            onChange={(e) => updateContactMethod(index, 'value', e.target.value)}
                            placeholder="Enter contact value"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={contact.label}
                            onChange={(e) => updateContactMethod(index, 'label', e.target.value)}
                            placeholder="Optional label"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`primary-${index}`}
                            checked={contact.isPrimary}
                            onCheckedChange={(checked) => updateContactMethod(index, 'isPrimary', checked)}
                          />
                          <Label htmlFor={`primary-${index}`} className="text-sm">Primary</Label>
                          
                          {formData.contactMethods.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeContactMethod(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.businessInfo.industry}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      businessInfo: { ...prev.businessInfo, industry: e.target.value }
                    }))}
                    placeholder="e.g., Automotive, Transportation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.businessInfo.website}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      businessInfo: { ...prev.businessInfo, website: e.target.value }
                    }))}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyId">Company ID / License</Label>
                  <Input
                    id="companyId"
                    value={formData.businessInfo.companyId}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      businessInfo: { ...prev.businessInfo, companyId: e.target.value }
                    }))}
                    placeholder="Business registration or license number"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  }))}
                  placeholder="Enter tags separated by commas"
                />
                <div className="text-sm text-text-secondary">
                  Add tags to categorize and filter organizations (e.g., Premium, High Volume, Texas)
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            tags: prev.tags.filter((_, i) => i !== index)
                          }))}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsEditDialogOpen(false)
                setSelectedOrganization(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isCreateDialogOpen ? handleCreateOrganization : handleUpdateOrganization}
              disabled={isLoading || !formData.name}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isCreateDialogOpen ? 'Create' : 'Update'} Organization
            </Button>
          </div>
        </DialogContent>
        </Dialog>
        </div>
      </div>
    </AppLayout>
  )
}