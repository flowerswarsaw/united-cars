'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import { Users, Eye, Search, ChevronUp, ChevronDown, UserPlus, Mail, Shield, Building } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  roles: string[]
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  emailVerified: boolean
  lastLoginAt: string | null
  createdAt: string
  org: {
    id: string
    name: string
    type: string
  } | null
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [allUsers] = useState<User[]>([
    {
      id: 'user-1',
      name: 'John Smith',
      email: 'john.smith@dealership.com',
      phone: '+1-555-0101',
      roles: ['DEALER'],
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: '2024-03-15T14:30:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      org: {
        id: 'org-1',
        name: 'Premium Auto Dealers',
        type: 'DEALER'
      }
    },
    {
      id: 'user-2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@unitedcars.com',
      phone: '+1-555-0102',
      roles: ['ADMIN'],
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: '2024-03-15T16:45:00Z',
      createdAt: '2024-01-10T09:00:00Z',
      org: {
        id: 'org-internal',
        name: 'United Cars',
        type: 'INTERNAL'
      }
    },
    {
      id: 'user-3',
      name: 'Mike Rodriguez',
      email: 'mike.rodriguez@operations.com',
      phone: '+1-555-0103',
      roles: ['OPS'],
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: '2024-03-15T12:20:00Z',
      createdAt: '2024-01-20T11:30:00Z',
      org: {
        id: 'org-ops',
        name: 'Operations Team',
        type: 'INTERNAL'
      }
    },
    {
      id: 'user-4',
      name: 'Lisa Chen',
      email: 'lisa.chen@autoworld.com',
      phone: null,
      roles: ['DEALER'],
      status: 'INACTIVE',
      emailVerified: false,
      lastLoginAt: null,
      createdAt: '2024-03-01T14:00:00Z',
      org: {
        id: 'org-2',
        name: 'Auto World LLC',
        type: 'DEALER'
      }
    },
    {
      id: 'user-5',
      name: 'David Brown',
      email: 'david.brown@suspended.com',
      phone: '+1-555-0105',
      roles: ['DEALER'],
      status: 'SUSPENDED',
      emailVerified: true,
      lastLoginAt: '2024-02-28T10:15:00Z',
      createdAt: '2024-01-25T16:20:00Z',
      org: {
        id: 'org-3',
        name: 'Suspended Dealer Co',
        type: 'DEALER'
      }
    },
    {
      id: 'user-6',
      name: 'Emma Wilson',
      email: 'emma.wilson@newuser.com',
      phone: '+1-555-0106',
      roles: ['SUPPORT'],
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: '2024-03-14T18:30:00Z',
      createdAt: '2024-03-10T12:45:00Z',
      org: null
    },
    {
      id: 'user-7',
      name: 'Rachel Green',
      email: 'rachel.green@accounting.com',
      phone: '+1-555-0107',
      roles: ['ACCOUNTING'],
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: '2024-03-15T09:45:00Z',
      createdAt: '2024-02-01T08:30:00Z',
      org: {
        id: 'org-internal',
        name: 'United Cars',
        type: 'INTERNAL'
      }
    },
    {
      id: 'user-8',
      name: 'Tom Anderson',
      email: 'tom.anderson@claims.com',
      phone: '+1-555-0108',
      roles: ['CLAIMS'],
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: '2024-03-14T15:20:00Z',
      createdAt: '2024-01-28T10:15:00Z',
      org: {
        id: 'org-internal',
        name: 'United Cars',
        type: 'INTERNAL'
      }
    },
    {
      id: 'user-9',
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@dispatch.com',
      phone: '+1-555-0109',
      roles: ['DISPATCH'],
      status: 'ACTIVE',
      emailVerified: true,
      lastLoginAt: '2024-03-15T07:30:00Z',
      createdAt: '2024-02-05T12:00:00Z',
      org: {
        id: 'org-internal',
        name: 'United Cars',
        type: 'INTERNAL'
      }
    },
    {
      id: 'user-10',
      name: 'James Wilson',
      email: 'james.wilson@retail.com',
      phone: '+1-555-0110',
      roles: ['RETAIL'],
      status: 'ACTIVE',
      emailVerified: false,
      lastLoginAt: '2024-03-10T14:15:00Z',
      createdAt: '2024-03-10T14:00:00Z',
      org: null
    }
  ])
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [orgFilter, setOrgFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortField, setSortField] = useState<'name' | 'email' | 'roles' | 'org' | 'status' | 'lastLoginAt' | 'createdAt'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    ACTIVE: 0,
    INACTIVE: 0,
    SUSPENDED: 0
  })
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN')) {
        router.push('/calculator')
        return
      }
      fetchUsers()
    }
  }, [user, sessionLoading])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, statusFilter, roleFilter, orgFilter, dateFilter, sortField, sortDirection])

  const fetchUsers = async () => {
    try {
      // In production, this would fetch from /api/admin/users
      setUsers(allUsers)
      setStatusCounts({
        all: allUsers.length,
        ACTIVE: allUsers.filter(u => u.status === 'ACTIVE').length,
        INACTIVE: allUsers.filter(u => u.status === 'INACTIVE').length,
        SUSPENDED: allUsers.filter(u => u.status === 'SUSPENDED').length,
      })
    } catch (error) {
      toast.error('Error fetching users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phone?.toLowerCase().includes(search) ||
        user.org?.name?.toLowerCase().includes(search) ||
        user.roles.some(role => role.toLowerCase().includes(search))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.roles.includes(roleFilter))
    }

    // Organization filter
    if (orgFilter !== 'all') {
      if (orgFilter === 'no-org') {
        filtered = filtered.filter(user => !user.org)
      } else if (orgFilter === 'internal') {
        filtered = filtered.filter(user => user.org?.type === 'INTERNAL')
      } else if (orgFilter === 'dealer') {
        filtered = filtered.filter(user => user.org?.type === 'DEALER')
      }
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      
      filtered = filtered.filter(user => {
        const userDate = new Date(user.createdAt)
        
        switch (dateFilter) {
          case 'today':
            return userDate >= startOfDay
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7))
            return userDate >= weekAgo
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
            return userDate >= monthAgo
          default:
            return true
        }
      })
    }

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'roles':
          aValue = a.roles.join(', ')
          bValue = b.roles.join(', ')
          break
        case 'org':
          aValue = a.org?.name || ''
          bValue = b.org?.name || ''
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'lastLoginAt':
          aValue = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0
          bValue = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          return 0
      }

      if (sortField === 'createdAt' || sortField === 'lastLoginAt') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      } else {
        const comparison = String(aValue).localeCompare(String(bValue))
        return sortDirection === 'asc' ? comparison : -comparison
      }
    })

    setFilteredUsers(sorted)
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const handleViewUser = (userId: string) => {
    router.push(`/admin/users/${userId}`)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'OPS': return 'bg-blue-100 text-blue-800'
      case 'DEALER': return 'bg-green-100 text-green-800'
      case 'ACCOUNTING': return 'bg-purple-100 text-purple-800'
      case 'CLAIMS': return 'bg-orange-100 text-orange-800'
      case 'SUPPORT': return 'bg-cyan-100 text-cyan-800'
      case 'DISPATCH': return 'bg-pink-100 text-pink-800'
      case 'RETAIL': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'INACTIVE': return 'warning'
      case 'SUSPENDED': return 'error'
      default: return 'neutral'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading users..." />
        </div>
      </AppLayout>
    )
  }

  if (!user || !user.roles?.includes('ADMIN')) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">You need admin privileges to view this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="User Management"
        description="Manage user accounts, roles, and permissions"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Search by name, email, organization..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="sr-only">Status</label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="ACTIVE">Active ({statusCounts.ACTIVE})</option>
                <option value="INACTIVE">Inactive ({statusCounts.INACTIVE})</option>
                <option value="SUSPENDED">Suspended ({statusCounts.SUSPENDED})</option>
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <label htmlFor="role" className="sr-only">Role</label>
              <select
                id="role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="OPS">Operations</option>
                <option value="DEALER">Dealer</option>
                <option value="ACCOUNTING">Accounting</option>
                <option value="CLAIMS">Claims</option>
                <option value="SUPPORT">Support</option>
                <option value="DISPATCH">Dispatch</option>
                <option value="RETAIL">Retail</option>
              </select>
            </div>

            {/* Organization Filter */}
            <div>
              <label htmlFor="org" className="sr-only">Organization</label>
              <select
                id="org"
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="all">All Organizations</option>
                <option value="internal">Internal Teams</option>
                <option value="dealer">Dealer Organizations</option>
                <option value="no-org">No Organization</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label htmlFor="date" className="sr-only">Date Range</label>
              <select
                id="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 rounded-md"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                User Management
              </h2>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
                </span>
                <button 
                  onClick={() => router.push('/admin/users/new')}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  New User
                </button>
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No users found"
                description={searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || orgFilter !== 'all' || dateFilter !== 'all' 
                  ? "No users match your filters. Try adjusting your search criteria."
                  : "No users have been created yet."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>User</span>
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Email</span>
                        {getSortIcon('email')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('roles')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Roles</span>
                        {getSortIcon('roles')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('org')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Organization</span>
                        {getSortIcon('org')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('lastLoginAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Last Login</span>
                        {getSortIcon('lastLoginAt')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((userData) => (
                    <tr 
                      key={userData.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleViewUser(userData.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                            <div className="flex items-center text-xs text-gray-500">
                              {userData.emailVerified && (
                                <span className="mr-2">✓ Verified</span>
                              )}
                              {userData.phone && (
                                <span>{userData.phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          {userData.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {userData.roles.slice(0, 2).map(role => (
                            <span
                              key={role}
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}
                            >
                              {role}
                            </span>
                          ))}
                          {userData.roles.length > 2 && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              +{userData.roles.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building className="h-3 w-3 mr-1 text-gray-400" />
                          {userData.org ? (
                            <div>
                              <div>{userData.org.name}</div>
                              <div className="text-xs text-gray-500">{userData.org.type}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">No Organization</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={getStatusColor(userData.status)} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(userData.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(userData.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewUser(userData.id)
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center ml-auto"
                        >
                          <span className="mr-1">Edit</span>
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Results Summary */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
                <span className="font-medium">{users.length}</span> users
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}