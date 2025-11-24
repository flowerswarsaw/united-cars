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
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  Users,
  Mail,
  Phone,
  Building2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Import,
  Export,
  Link as LinkIcon,
  Save,
  X,
  Eye,
  Copy,
  UserPlus,
  Merge,
  Zap,
  Filter
} from 'lucide-react'
import { Contact, Organisation, ContactMethodType } from '@united-cars/crm-core'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Enhanced contact interface for admin panel
interface EnhancedContact extends Contact {
  organizationName?: string
  duplicateScore?: number
  validationIssues?: string[]
  lastActivity?: Date
  relationshipStrength?: 'weak' | 'medium' | 'strong'
}

// Mock contact data with realistic scenarios
const mockContacts: EnhancedContact[] = [
  {
    id: 'contact-1',
    tenantId: 'tenant-1',
    firstName: 'John',
    lastName: 'Thompson',
    email: 'john.thompson@autodeal.com',
    phone: '+1-555-0123',
    organisationId: 'org-1',
    organizationName: 'AutoDeal Partners',
    jobTitle: 'Sales Manager',
    contactMethods: [
      {
        id: 'cm-1',
        type: ContactMethodType.EMAIL,
        value: 'john.thompson@autodeal.com',
        isPrimary: true,
        label: 'Work Email'
      },
      {
        id: 'cm-2',
        type: ContactMethodType.PHONE,
        value: '+1-555-0123',
        isPrimary: false,
        label: 'Mobile'
      }
    ],
    socialMediaLinks: [
      {
        id: 'sm-1',
        platform: 'LINKEDIN',
        url: 'https://linkedin.com/in/john-thompson',
        handle: '@john-thompson'
      }
    ],
    notes: 'Primary contact for Texas region deals. Handles high-value transactions.',
    tags: ['Primary Contact', 'Texas', 'High Value'],
    customFields: {},
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-09-05'),
    lastActivity: new Date('2024-09-05'),
    relationshipStrength: 'strong',
    validationIssues: []
  },
  {
    id: 'contact-2',
    tenantId: 'tenant-1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@copart.com',
    phone: '+1-555-0456',
    organisationId: 'org-2',
    organizationName: 'Copart Houston',
    jobTitle: 'Auction Coordinator',
    contactMethods: [
      {
        id: 'cm-3',
        type: ContactMethodType.EMAIL,
        value: 'sarah.chen@copart.com',
        isPrimary: true,
        label: 'Work Email'
      },
      {
        id: 'cm-4',
        type: ContactMethodType.PHONE,
        value: '+1-555-0456',
        isPrimary: true,
        label: 'Office Direct'
      }
    ],
    notes: 'Handles auction scheduling and coordination. Very responsive.',
    tags: ['Coordinator', 'Responsive', 'Houston'],
    customFields: {},
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-09-01'),
    lastActivity: new Date('2024-09-01'),
    relationshipStrength: 'strong',
    validationIssues: []
  },
  {
    id: 'contact-3',
    tenantId: 'tenant-1',
    firstName: 'Mike',
    lastName: 'Rodriguez',
    email: 'mike@swift-transport.com',
    phone: '+1-555-0789',
    organisationId: 'org-3',
    organizationName: 'Swift Transport Solutions',
    jobTitle: 'Dispatch Manager',
    contactMethods: [
      {
        id: 'cm-5',
        type: ContactMethodType.EMAIL,
        value: 'mike@swift-transport.com',
        isPrimary: true,
        label: 'Work Email'
      },
      {
        id: 'cm-6',
        type: ContactMethodType.EMAIL,
        value: 'mike.rodriguez@swift-transport.com',
        isPrimary: false,
        label: 'Alternative Email'
      }
    ],
    notes: 'Handles transport scheduling. Prefers email communication.',
    tags: ['Dispatch', 'Email Preferred'],
    customFields: {},
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-08-20'),
    lastActivity: new Date('2024-08-20'),
    relationshipStrength: 'medium',
    validationIssues: ['Multiple work emails - needs verification']
  },
  {
    id: 'contact-4',
    tenantId: 'tenant-1',
    firstName: 'John',
    lastName: 'Thompson',
    email: 'j.thompson@autodeal.com',
    phone: '+1-555-0123',
    organisationId: 'org-1',
    organizationName: 'AutoDeal Partners',
    jobTitle: 'Sales Representative',
    contactMethods: [
      {
        id: 'cm-7',
        type: ContactMethodType.EMAIL,
        value: 'j.thompson@autodeal.com',
        isPrimary: true,
        label: 'Work Email'
      }
    ],
    notes: 'New sales rep - might be duplicate of John Thompson (Sales Manager)',
    tags: ['New Hire', 'Potential Duplicate'],
    customFields: {},
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-08-01'),
    lastActivity: new Date('2024-08-01'),
    relationshipStrength: 'weak',
    duplicateScore: 85,
    validationIssues: ['Potential duplicate of contact-1', 'Similar name and phone number']
  }
]

interface ContactFormData {
  firstName: string
  lastName: string
  jobTitle: string
  organisationId: string
  email: string
  phone: string
  contactMethods: Array<{
    type: ContactMethodType
    value: string
    isPrimary: boolean
    label: string
  }>
  socialMediaLinks: Array<{
    platform: string
    url: string
    handle: string
  }>
  notes: string
  tags: string[]
}

// Mock organizations for dropdown
const mockOrganizations = [
  { id: 'org-1', name: 'AutoDeal Partners' },
  { id: 'org-2', name: 'Copart Houston' },
  { id: 'org-3', name: 'Swift Transport Solutions' }
]

export default function ContactManagementPage() {
  const [contacts, setContacts] = useState<EnhancedContact[]>(mockContacts)
  const [filteredContacts, setFilteredContacts] = useState<EnhancedContact[]>(mockContacts)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOrg, setFilterOrg] = useState<string>('all')
  const [filterIssues, setFilterIssues] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<EnhancedContact | null>(null)
  const [duplicatePairs, setDuplicatePairs] = useState<EnhancedContact[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    jobTitle: '',
    organisationId: '',
    email: '',
    phone: '',
    contactMethods: [
      {
        type: ContactMethodType.EMAIL,
        value: '',
        isPrimary: true,
        label: 'Primary Email'
      }
    ],
    socialMediaLinks: [],
    notes: '',
    tags: []
  })

  // Filter contacts based on search and filters
  useEffect(() => {
    let filtered = contacts

    if (searchTerm) {
      filtered = filtered.filter(contact => 
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone?.includes(searchTerm) ||
        contact.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterOrg !== 'all') {
      filtered = filtered.filter(contact => contact.organisationId === filterOrg)
    }

    if (filterIssues === 'has_issues') {
      filtered = filtered.filter(contact => (contact.validationIssues?.length || 0) > 0 || (contact.duplicateScore || 0) > 70)
    } else if (filterIssues === 'no_issues') {
      filtered = filtered.filter(contact => (!contact.validationIssues || contact.validationIssues.length === 0) && (!contact.duplicateScore || contact.duplicateScore < 70))
    }

    setFilteredContacts(filtered)
  }, [contacts, searchTerm, filterOrg, filterIssues])

  const handleCreateContact = async () => {
    setIsLoading(true)
    
    // Mock creation with validation check
    const newContact: EnhancedContact = {
      id: `contact-${Date.now()}`,
      tenantId: 'tenant-1',
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      organisationId: formData.organisationId,
      organizationName: mockOrganizations.find(org => org.id === formData.organisationId)?.name,
      jobTitle: formData.jobTitle,
      contactMethods: formData.contactMethods.map((cm, index) => ({
        ...cm,
        id: `cm-${Date.now()}-${index}`
      })),
      socialMediaLinks: formData.socialMediaLinks.map((sm, index) => ({
        ...sm,
        id: `sm-${Date.now()}-${index}`
      })),
      notes: formData.notes,
      tags: formData.tags,
      customFields: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
      relationshipStrength: 'weak',
      validationIssues: []
    }

    // Check for potential duplicates
    const duplicateScore = calculateDuplicateScore(newContact, contacts)
    if (duplicateScore > 70) {
      newContact.duplicateScore = duplicateScore
      newContact.validationIssues = [`Potential duplicate (${duplicateScore}% match)`]
    }

    setContacts(prev => [...prev, newContact])
    setIsCreateDialogOpen(false)
    resetForm()
    setIsLoading(false)
  }

  const handleUpdateContact = async () => {
    if (!selectedContact) return
    
    setIsLoading(true)
    
    const updatedContact: EnhancedContact = {
      ...selectedContact,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      organisationId: formData.organisationId,
      organizationName: mockOrganizations.find(org => org.id === formData.organisationId)?.name,
      jobTitle: formData.jobTitle,
      contactMethods: formData.contactMethods.map((cm, index) => ({
        ...cm,
        id: cm.id || `cm-${Date.now()}-${index}`
      })),
      socialMediaLinks: formData.socialMediaLinks.map((sm, index) => ({
        ...sm,
        id: sm.id || `sm-${Date.now()}-${index}`
      })),
      notes: formData.notes,
      tags: formData.tags,
      updatedAt: new Date(),
      lastActivity: new Date()
    }

    setContacts(prev => 
      prev.map(contact => contact.id === selectedContact.id ? updatedContact : contact)
    )
    setIsEditDialogOpen(false)
    setSelectedContact(null)
    resetForm()
    setIsLoading(false)
  }

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return
    
    setContacts(prev => prev.filter(contact => contact.id !== id))
  }

  const handleMergeContacts = async (primaryId: string, duplicateId: string) => {
    const primary = contacts.find(c => c.id === primaryId)
    const duplicate = contacts.find(c => c.id === duplicateId)
    
    if (!primary || !duplicate) return

    // Merge contact data intelligently
    const mergedContact: EnhancedContact = {
      ...primary,
      contactMethods: [
        ...primary.contactMethods,
        ...duplicate.contactMethods.filter(cm => 
          !primary.contactMethods.some(pcm => pcm.value === cm.value)
        )
      ],
      socialMediaLinks: [
        ...(primary.socialMediaLinks || []),
        ...(duplicate.socialMediaLinks || []).filter(sm =>
          !(primary.socialMediaLinks || []).some(psm => psm.url === sm.url)
        )
      ],
      tags: [...new Set([...primary.tags, ...duplicate.tags])],
      notes: primary.notes + (duplicate.notes ? `\n\nMerged notes: ${duplicate.notes}` : ''),
      duplicateScore: undefined,
      validationIssues: [],
      updatedAt: new Date(),
      lastActivity: new Date()
    }

    setContacts(prev => 
      prev.filter(c => c.id !== duplicateId)
         .map(c => c.id === primaryId ? mergedContact : c)
    )
    setIsDuplicateDialogOpen(false)
  }

  const calculateDuplicateScore = (contact: EnhancedContact, existingContacts: EnhancedContact[]): number => {
    let maxScore = 0
    
    existingContacts.forEach(existing => {
      if (existing.id === contact.id) return
      
      let score = 0
      
      // Name similarity
      if (existing.firstName.toLowerCase() === contact.firstName.toLowerCase() &&
          existing.lastName.toLowerCase() === contact.lastName.toLowerCase()) {
        score += 50
      }
      
      // Email similarity
      if (existing.email === contact.email) {
        score += 40
      }
      
      // Phone similarity
      if (existing.phone === contact.phone) {
        score += 30
      }
      
      // Organization similarity
      if (existing.organisationId === contact.organisationId) {
        score += 20
      }
      
      maxScore = Math.max(maxScore, score)
    })
    
    return maxScore
  }

  const findDuplicates = () => {
    const duplicates: EnhancedContact[] = []
    
    contacts.forEach(contact => {
      if ((contact.duplicateScore || 0) > 70) {
        duplicates.push(contact)
      }
    })
    
    setDuplicatePairs(duplicates)
    setIsDuplicateDialogOpen(true)
  }

  const validateContact = (contact: EnhancedContact) => {
    const issues: string[] = []
    
    // Email validation
    if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      issues.push('Invalid email format')
    }
    
    // Phone validation
    if (!contact.phone || !/^\+?[\d\s\-\(\)]{10,}$/.test(contact.phone)) {
      issues.push('Invalid phone format')
    }
    
    // Required fields
    if (!contact.firstName || !contact.lastName) {
      issues.push('First and last name are required')
    }
    
    return issues
  }

  const runValidation = async () => {
    setIsLoading(true)
    
    const validatedContacts = contacts.map(contact => ({
      ...contact,
      validationIssues: validateContact(contact),
      duplicateScore: calculateDuplicateScore(contact, contacts)
    }))
    
    setContacts(validatedContacts)
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      jobTitle: '',
      organisationId: '',
      email: '',
      phone: '',
      contactMethods: [
        {
          type: ContactMethodType.EMAIL,
          value: '',
          isPrimary: true,
          label: 'Primary Email'
        }
      ],
      socialMediaLinks: [],
      notes: '',
      tags: []
    })
  }

  const populateFormFromContact = (contact: EnhancedContact) => {
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      jobTitle: contact.jobTitle || '',
      organisationId: contact.organisationId,
      email: contact.email || '',
      phone: contact.phone || '',
      contactMethods: contact.contactMethods || [],
      socialMediaLinks: contact.socialMediaLinks || [],
      notes: contact.notes || '',
      tags: contact.tags || []
    })
  }

  const getValidationBadge = (contact: EnhancedContact) => {
    const issueCount = (contact.validationIssues?.length || 0)
    const duplicateRisk = (contact.duplicateScore || 0) > 70
    
    if (issueCount > 0 || duplicateRisk) {
      return <Badge variant="destructive">{issueCount + (duplicateRisk ? 1 : 0)} Issues</Badge>
    }
    
    return <Badge variant="default">Valid</Badge>
  }

  const getRelationshipBadge = (strength?: string) => {
    const colors = {
      'strong': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'weak': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge variant="outline" className={colors[strength as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {strength || 'Unknown'}
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

  const updateContactMethod = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.map((cm, i) => 
        i === index ? { ...cm, [field]: value } : cm
      )
    }))
  }

  const removeContactMethod = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contact Management</h1>
          <p className="text-text-secondary mt-2">
            Advanced contact validation and relationship management
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={runValidation} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Validate All
          </Button>
          <Button variant="outline" size="sm" onClick={findDuplicates}>
            <Merge className="w-4 h-4 mr-2" />
            Find Duplicates
          </Button>
          <Button variant="outline" size="sm">
            <Import className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Contact
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
                <div className="text-sm font-medium text-text-secondary">Total Contacts</div>
                <div className="text-2xl font-bold">{contacts.length}</div>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Valid Contacts</div>
                <div className="text-2xl font-bold text-green-600">
                  {contacts.filter(c => (!c.validationIssues || c.validationIssues.length === 0) && (!c.duplicateScore || c.duplicateScore < 70)).length}
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
                <div className="text-sm font-medium text-text-secondary">Issues Found</div>
                <div className="text-2xl font-bold text-red-600">
                  {contacts.filter(c => (c.validationIssues?.length || 0) > 0 || (c.duplicateScore || 0) > 70).length}
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-text-secondary">Strong Relationships</div>
                <div className="text-2xl font-bold text-blue-600">
                  {contacts.filter(c => c.relationshipStrength === 'strong').length}
                </div>
              </div>
              <Zap className="w-8 h-8 text-blue-600" />
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
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterOrg} onValueChange={setFilterOrg}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {mockOrganizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterIssues} onValueChange={setFilterIssues}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by issues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="has_issues">Has Issues</SelectItem>
                <SelectItem value="no_issues">No Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                        <div className="text-sm text-text-secondary">{contact.jobTitle}</div>
                        {contact.duplicateScore && contact.duplicateScore > 70 && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Duplicate Risk: {contact.duplicateScore}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">{contact.organizationName || 'No Organization'}</div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {contact.email}
                        </div>
                        <div className="text-sm flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {contact.phone}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getRelationshipBadge(contact.relationshipStrength)}
                    </TableCell>
                    
                    <TableCell>
                      {getValidationBadge(contact)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {contact.lastActivity?.toLocaleDateString() || 'Never'}
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedContact(contact)
                            populateFormFromContact(contact)
                            setIsEditDialogOpen(true)
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {contact.duplicateScore && contact.duplicateScore > 70 && (
                            <DropdownMenuItem onClick={() => {
                              setDuplicatePairs([contact])
                              setIsDuplicateDialogOpen(true)
                            }}>
                              <Merge className="mr-2 h-4 w-4" />
                              Resolve Duplicate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDeleteContact(contact.id)}>
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
          setSelectedContact(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? 'Create Contact' : 'Edit Contact'}
            </DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen ? 
                'Add a new contact with validation and relationship management.' :
                'Update contact details and manage relationships.'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact Methods</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="notes">Notes & Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="Enter job title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organisation">Organization *</Label>
                  <Select value={formData.organisationId} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, organisationId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockOrganizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Primary Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Primary Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Additional Contact Methods</Label>
                <Button type="button" variant="outline" size="sm" onClick={addContactMethod}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Method
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

            <TabsContent value="social" className="space-y-4">
              <div className="text-sm text-text-secondary">
                Social media integration coming soon. This will allow tracking of LinkedIn, Twitter, and other social profiles.
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add notes about this contact..."
                    rows={4}
                  />
                </div>

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
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsEditDialogOpen(false)
                setSelectedContact(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isCreateDialogOpen ? handleCreateContact : handleUpdateContact}
              disabled={isLoading || !formData.firstName || !formData.lastName || !formData.organisationId}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isCreateDialogOpen ? 'Create' : 'Update'} Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Management Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Duplicate Contact Management</DialogTitle>
            <DialogDescription>
              Review and resolve potential duplicate contacts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {duplicatePairs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-600">No Duplicates Found</h3>
                <p className="text-text-secondary">All contacts appear to be unique</p>
              </div>
            ) : (
              duplicatePairs.map(duplicate => (
                <Card key={duplicate.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{duplicate.firstName} {duplicate.lastName}</h4>
                        <p className="text-sm text-text-secondary">{duplicate.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="destructive">
                            {duplicate.duplicateScore}% Match
                          </Badge>
                          <Badge variant="outline">{duplicate.organizationName}</Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedContact(duplicate)
                            populateFormFromContact(duplicate)
                            setIsDuplicateDialogOpen(false)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteContact(duplicate.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {duplicate.validationIssues && duplicate.validationIssues.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <div className="text-sm font-medium text-red-800">Issues Found:</div>
                        <ul className="text-sm text-red-700 mt-1">
                          {duplicate.validationIssues.map((issue, index) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}