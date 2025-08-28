# United Cars - API Documentation

## Overview
This document outlines the API structure and data models for the United Cars platform, designed for easy conversion from mock data to production APIs.

## Core API Endpoints

### Authentication
```typescript
// All API endpoints will require authentication in production
interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'readonly'
  orgId: string
}
```

## 1. Title Management API

### GET /api/titles
Get all titles with dynamic status calculation
```typescript
// Query Parameters
interface TitleQuery {
  search?: string           // Search VIN, make, model
  status?: TitleStatus     // Filter by dynamic status
  titleType?: TitleType    // Filter by title type
  issuingState?: string    // Filter by issuing state
  assignedTo?: string      // Filter by assigned user
  orgId?: string          // Filter by organization
  limit?: number          // Pagination limit (default: 50)
  offset?: number         // Pagination offset
  sortBy?: string         // Sort field
  sortOrder?: 'asc' | 'desc'
}

// Response
interface TitleListResponse {
  titles: (EnhancedTitle & { dynamicStatus: DynamicTitleStatus })[]
  total: number
  hasMore: boolean
  statusCounts: {
    pending: number
    packed: number
    sent_to: number
    received_by: number
  }
}
```

### GET /api/titles/:id
Get single title with full details
```typescript
// Response
interface TitleDetailResponse {
  title: EnhancedTitle & { dynamicStatus: DynamicTitleStatus }
  statusHistory: TitleStatusHistory[]
  activityLogs: TitleActivityLog[]
  documents: TitleDocument[]
  packages: EnhancedPackage[]
}
```

### POST /api/titles
Create new title
```typescript
// Request Body
interface CreateTitleRequest {
  titleNumber?: string
  titleType: TitleType
  issuingState: string
  issuingCountry?: string
  vehicleId: string
  priority?: TitlePriority
  receivedDate?: string
  expectedCompletionDate?: string
  assignedTo?: string
  location?: string
  processingFee?: number
  rushFee?: number
  notes?: string
  tags?: string[]
}

// Response
interface CreateTitleResponse {
  title: EnhancedTitle & { dynamicStatus: DynamicTitleStatus }
}
```

### PUT /api/titles/:id
Update title
```typescript
// Request Body (partial update)
interface UpdateTitleRequest {
  titleNumber?: string
  priority?: TitlePriority
  assignedTo?: string
  location?: string
  processingFee?: number
  rushFee?: number
  notes?: string
  tags?: string[]
}
```

### DELETE /api/titles/:id
Delete title (soft delete)

### POST /api/titles/:id/packages
Assign title to package
```typescript
// Request Body
interface AssignTitleToPackageRequest {
  packageId: string
}
```

### DELETE /api/titles/:id/packages/:packageId
Remove title from package

## 2. Package Management API

### GET /api/packages
Get all packages
```typescript
// Query Parameters
interface PackageQuery {
  status?: PackageStatus
  senderId?: string        // Filter by sender organization
  recipientId?: string     // Filter by recipient organization
  provider?: string        // Filter by shipping provider
  trackingNumber?: string  // Search by tracking number
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Response
interface PackageListResponse {
  packages: EnhancedPackage[]
  total: number
  hasMore: boolean
  statusCounts: {
    packed: number
    sent: number
    delivered: number
  }
}
```

### GET /api/packages/:id
Get single package with full details
```typescript
// Response
interface PackageDetailResponse {
  package: EnhancedPackage
  titles: (EnhancedTitle & { dynamicStatus: DynamicTitleStatus })[]
  documents: PackageDocument[]
  route: {
    sender: Organization
    recipient: Organization
  }
}
```

### POST /api/packages
Create new package
```typescript
// Request Body
interface CreatePackageRequest {
  senderOrgId: string
  recipientOrgId: string
  trackingNumber?: string
  provider?: string
  priority?: PackagePriority
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  estimatedDelivery?: string
  insuranceValue?: number
  titleIds?: string[]      // Initial titles to include
}
```

### PUT /api/packages/:id
Update package details
```typescript
// Request Body
interface UpdatePackageRequest {
  trackingNumber?: string
  provider?: string
  priority?: PackagePriority
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  estimatedDelivery?: string
  insuranceValue?: number
}
```

### PUT /api/packages/:id/status
Update package status (triggers title status recalculation and automatic status history logging)
```typescript
// Request Body
interface UpdatePackageStatusRequest {
  status: PackageStatus
  actualDelivery?: string  // Required when status = 'delivered'
  notes?: string
}

// Response includes affected titles
interface UpdatePackageStatusResponse {
  package: EnhancedPackage
  affectedTitles: {
    id: string
    oldStatus: DynamicTitleStatus
    newStatus: DynamicTitleStatus
    statusHistoryAdded: boolean  // Indicates if status history was automatically created
  }[]
}
```

**Note**: This endpoint automatically creates status history entries for all affected titles, including package context, timestamps, and system attribution.

### PUT /api/packages/:id/route
Update package route (sender/recipient)
```typescript
// Request Body
interface UpdatePackageRouteRequest {
  senderOrgId: string
  recipientOrgId: string
}
```

## 3. Organization API

### GET /api/organizations
Get all organizations
```typescript
// Response
interface OrganizationListResponse {
  organizations: Organization[]
}

interface Organization {
  id: string
  name: string
  type: 'auction' | 'dealer' | 'processor'
  email: string
  phone?: string
  address?: string
  active: boolean
  createdAt: string
  updatedAt: string
}
```

### POST /api/organizations
Create new organization
```typescript
// Request Body
interface CreateOrganizationRequest {
  name: string
  type: 'auction' | 'dealer' | 'processor'
  email: string
  phone?: string
  address?: string
}
```

## 4. Document Management API

### POST /api/titles/:id/documents
Upload document to title
```typescript
// Request: multipart/form-data
interface UploadTitleDocumentRequest {
  file: File
  type: TitleDocumentType
  description?: string
  isRequired?: boolean
}

// Response
interface UploadDocumentResponse {
  document: TitleDocument
}
```

### POST /api/packages/:id/documents
Upload document to package
```typescript
// Request: multipart/form-data
interface UploadPackageDocumentRequest {
  file: File
  type: 'shipping_label' | 'packing_list' | 'customs_form' | 'receipt' | 'tracking_info' | 'scan'
  description?: string
}
```

### GET /api/documents/:id
Get document metadata and download URL
```typescript
// Response
interface DocumentResponse {
  document: TitleDocument | PackageDocument
  downloadUrl: string
  thumbnailUrl?: string
}
```

### PUT /api/documents/:id/verify
Verify document
```typescript
// Request Body
interface VerifyDocumentRequest {
  verified: boolean
  notes?: string
}
```

### DELETE /api/documents/:id
Delete document

## 5. Status & Analytics API

### GET /api/dashboard/metrics
Get dashboard metrics
```typescript
// Response
interface DashboardMetrics {
  titleCounts: {
    total: number
    pending: number
    packed: number
    sent_to: number
    received_by: number
  }
  packageCounts: {
    total: number
    packed: number
    sent: number
    delivered: number
  }
  recentActivity: TitleActivityLog[]
  overdueCount: number
  rushJobsCount: number
  averageProcessingDays: number
}
```

### GET /api/titles/:id/status-history
Get title status history
```typescript
// Response
interface StatusHistoryResponse {
  history: TitleStatusHistory[]
}
```

### GET /api/titles/:id/activity
Get title activity log
```typescript
// Response
interface ActivityLogResponse {
  activities: TitleActivityLog[]
}
```

## 6. Bulk Operations API

### POST /api/titles/bulk-import
Bulk import titles from CSV/Excel
```typescript
// Request: multipart/form-data
interface BulkImportRequest {
  file: File  // CSV or Excel file
  options: {
    hasHeader: boolean
    skipValidation: boolean
    dryRun: boolean
  }
}

// Response
interface BulkImportResponse {
  importId: string
  totalRows: number
  validRows: number
  errors: BulkImportError[]
  warnings: BulkImportWarning[]
  previewData?: EnhancedTitle[]  // First 10 rows for preview
}
```

### GET /api/bulk-imports/:id
Get bulk import status
```typescript
// Response
interface BulkImportStatus {
  import: BulkImport
  progress: {
    processed: number
    successful: number
    failed: number
    percentage: number
  }
}
```

### POST /api/titles/bulk-assign
Bulk assign titles to package
```typescript
// Request Body
interface BulkAssignRequest {
  titleIds: string[]
  packageId: string
}
```

### POST /api/titles/bulk-update
Bulk update title properties
```typescript
// Request Body
interface BulkUpdateRequest {
  titleIds: string[]
  updates: {
    priority?: TitlePriority
    assignedTo?: string
    location?: string
    tags?: string[]
  }
}
```

## 7. VIN & Validation API

### POST /api/vin/validate
Validate VIN number
```typescript
// Request Body
interface VinValidationRequest {
  vin: string
}

// Response
interface VinValidationResponse {
  validation: VinValidation
}
```

### POST /api/vin/decode
Decode VIN to vehicle information
```typescript
// Request Body
interface VinDecodeRequest {
  vin: string
}

// Response
interface VinDecodeResponse {
  vin: string
  info: {
    year: number
    make: string
    model: string
    bodyType: string
    engine: string
    transmission: string
    driveType: string
  }
  isValid: boolean
  errors: string[]
}
```

## 8. Search API

### GET /api/search
Global search across titles, packages, and organizations
```typescript
// Query Parameters
interface GlobalSearchQuery {
  q: string              // Search query
  type?: 'titles' | 'packages' | 'organizations' | 'all'
  limit?: number
  offset?: number
}

// Response
interface GlobalSearchResponse {
  results: {
    titles: (EnhancedTitle & { dynamicStatus: DynamicTitleStatus })[]
    packages: EnhancedPackage[]
    organizations: Organization[]
  }
  total: number
  took: number  // Search time in milliseconds
}
```

## 9. WebSocket Events (Real-time Updates)

### Connection
```typescript
// WebSocket connection endpoint
const ws = new WebSocket('/api/ws?token=auth-token')

// Event types
interface WebSocketMessage {
  type: 'title_status_changed' | 'package_updated' | 'document_uploaded'
  data: any
  timestamp: string
}
```

### Title Status Changes
```typescript
interface TitleStatusChangedEvent {
  type: 'title_status_changed'
  data: {
    titleId: string
    oldStatus: DynamicTitleStatus
    newStatus: DynamicTitleStatus
    packageId: string
    changedBy: string
    timestamp: string
  }
}
```

### Package Updates
```typescript
interface PackageUpdatedEvent {
  type: 'package_updated'
  data: {
    packageId: string
    changes: Partial<EnhancedPackage>
    affectedTitleIds: string[]
    updatedBy: string
    timestamp: string
  }
}
```

## Authentication & Security

### JWT Token Structure
```typescript
interface JWTPayload {
  sub: string        // User ID
  email: string
  name: string
  role: string
  orgId: string
  iat: number       // Issued at
  exp: number       // Expires at
}
```

### API Rate Limiting
```typescript
// Rate limits per endpoint category
const rateLimits = {
  read: '1000 requests/hour',
  write: '500 requests/hour',
  upload: '100 requests/hour',
  bulk: '10 requests/hour'
}
```

### Error Response Format
```typescript
interface APIError {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
}

// Standard error codes
const errorCodes = {
  VALIDATION_ERROR: 'Invalid input data',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  RATE_LIMITED: 'Too many requests',
  SERVER_ERROR: 'Internal server error'
}
```

## Data Transformation Examples

### Mock to API Response
```typescript
// Mock data structure
const mockTitle = {
  id: 'title-123',
  titleType: 'clean',
  packageIds: ['pkg-1', 'pkg-2'],
  // ... other fields
}

// API response structure
const apiResponse = {
  id: 'title-123',
  titleType: 'clean',
  packages: [
    { id: 'pkg-1', status: 'sent', /* ... */ },
    { id: 'pkg-2', status: 'delivered', /* ... */ }
  ],
  dynamicStatus: {
    status: 'received_by',
    displayText: 'Received by United Cars',
    organizationName: 'United Cars',
    packageId: 'pkg-2',
    updatedAt: '2025-08-28T19:30:00Z'
  }
  // ... other fields
}
```

## Enhanced Status Management System

### **Read-Only Title Status Architecture**

The system enforces data integrity through a **package-driven status management** approach:

**🚫 No Direct Status Updates**
- Title status cannot be modified directly through PUT /api/titles/:id
- All status changes must originate from package operations
- Prevents manual status inconsistencies and data corruption

**📦 Package-Driven Status Flow**
1. **Adding Titles to Packages**: `POST /api/titles/:id/packages`
   - Automatically changes title status to "packed"
   - Creates status history entry with package context
   
2. **Updating Package Status**: `PUT /api/packages/:id/status`
   - Updates all associated title statuses based on package status:
     - `packed` → titles become "packed"
     - `sent` → titles become "sent_to [Organization]"
     - `delivered` → titles become "received_by [Organization]"
   - Automatically creates status history entries for all affected titles

**📋 Automatic Status History**
- Every status change creates detailed audit entries
- Includes timestamps, package references, organization context
- System attribution for all package-driven changes
- Complete traceability of title movements

**⚡ Dynamic Status Calculation**
- Status displayed is calculated in real-time from latest package relationship
- No stored status fields that can become outdated
- Always reflects current title location and shipping progress

### **Status Management Endpoints**

**Read Title Status**:
```typescript
GET /api/titles/:id
// Returns title with dynamically calculated status
{
  "title": {
    "id": "title-123",
    "dynamicStatus": {
      "status": "sent_to",
      "displayText": "Sent to Copart Dallas",
      "organizationName": "Copart Dallas",
      "packageId": "pkg-456",
      "updatedAt": "2025-08-28T19:30:00Z"
    }
  }
}
```

**Trigger Status Changes**:
```typescript
// Add title to package (changes status to "packed")
POST /api/titles/:id/packages
{ "packageId": "pkg-456" }

// Update package status (changes all title statuses)
PUT /api/packages/:id/status  
{ "status": "sent" }  // All titles become "sent_to [Organization]"
```

## Migration Notes

### From Mock Data to API
1. **Database Queries**: Replace mock database calls with SQL queries
2. **Status Calculation**: Implement dynamic status calculation in database functions
3. **File Storage**: Replace mock URLs with cloud storage URLs
4. **Authentication**: Add JWT validation to all endpoints
5. **Validation**: Add comprehensive input validation
6. **Caching**: Implement Redis caching for frequently accessed data
7. **Logging**: Add comprehensive API logging and metrics

### Performance Optimizations
1. **Pagination**: Implement cursor-based pagination for large datasets
2. **Caching**: Cache dynamic status calculations
3. **Indexes**: Create database indexes for common query patterns
4. **Connection Pooling**: Use database connection pooling
5. **CDN**: Serve static assets via CDN
6. **Compression**: Enable gzip compression for API responses

---

**API Version**: v1.0.0  
**Last Updated**: August 28, 2025  
**Status**: Ready for Implementation