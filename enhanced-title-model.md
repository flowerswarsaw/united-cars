# Enhanced Title Management Data Model

Based on the analysis of title-tracker-2.0 reference project and current implementation gaps, here's the comprehensive enhanced data model:

## 1. Enhanced Title Model

```prisma
model Title {
  id                      String               @id @default(cuid())
  vehicleId               String               @map("vehicle_id")
  
  // Basic Title Information
  titleNumber             String?              @map("title_number")
  titleType               TitleType            @default(CLEAN)
  issuingState            String               @map("issuing_state")
  issuingCountry          String               @default("US") @map("issuing_country")
  
  // Status and Workflow
  status                  TitleStatus          @default(PENDING)
  priority                TitlePriority        @default(NORMAL)
  
  // Dates
  receivedDate            DateTime?            @map("received_date")
  processedDate           DateTime?            @map("processed_date")
  expectedCompletionDate  DateTime?            @map("expected_completion_date")
  actualCompletionDate    DateTime?            @map("actual_completion_date")
  
  // Assignment and Location
  assignedToId            String?              @map("assigned_to_id")
  location                String?              // Physical location of title
  packageId               String?              @map("package_id")
  
  // Financial
  processingFee           Decimal?             @map("processing_fee")
  rushFee                 Decimal?             @map("rush_fee")
  
  // Metadata
  notes                   String?
  internalNotes           String?              @map("internal_notes") // Admin only
  tags                    String[]             // Searchable tags
  
  // System fields
  createdAt               DateTime             @default(now()) @map("created_at")
  updatedAt               DateTime             @updatedAt @map("updated_at")
  createdById             String               @map("created_by_id")
  
  // Relationships
  vehicle                 Vehicle              @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  assignedTo              User?                @relation("TitleAssignee", fields: [assignedToId], references: [id])
  createdBy               User                 @relation("TitleCreator", fields: [createdById], references: [id])
  package                 Package?             @relation(fields: [packageId], references: [id])
  
  // New relationships for enhanced functionality
  documents               TitleDocument[]
  statusHistory           TitleStatusHistory[]
  activityLogs            TitleActivityLog[]
  
  @@map("titles")
  @@index([status])
  @@index([titleType])
  @@index([issuingState])
  @@index([assignedToId])
  @@index([createdAt])
}

// Enhanced Title Status with more granular states
enum TitleStatus {
  PENDING           // Initial status - waiting for title receipt
  RECEIVED          // Physical title received
  PROCESSING        // Being processed (DMV work, etc.)
  PENDING_DOCS      // Waiting for additional documentation
  ON_HOLD           // Temporarily stopped (legal issues, etc.)
  QUALITY_REVIEW    // Final review before completion
  PACKED            // Packaged for shipment
  SENT              // Sent to customer
  COMPLETED         // Process fully completed
  CANCELLED         // Cancelled by request
  REJECTED          // Rejected due to issues
}

// Comprehensive title types
enum TitleType {
  CLEAN             // Clear title
  SALVAGE           // Salvage title
  REBUILT           // Rebuilt/Reconstructed
  FLOOD             // Flood damaged
  LEMON             // Lemon law buyback
  JUNK              // Junk/Scrap title
  EXPORT            // Export only
  BONDED            // Bonded title
  DUPLICATE         // Duplicate title request
  LOST              // Lost title replacement
  ABANDONED         // Abandoned vehicle
  REPOSSESSED       // Repo title
}

enum TitlePriority {
  LOW
  NORMAL
  HIGH
  RUSH
  EMERGENCY
}
```

## 2. Status History Tracking

```prisma
model TitleStatusHistory {
  id              String       @id @default(cuid())
  titleId         String       @map("title_id")
  
  // Status change details
  fromStatus      TitleStatus? @map("from_status")
  toStatus        TitleStatus  @map("to_status")
  
  // Change metadata
  changedAt       DateTime     @default(now()) @map("changed_at")
  changedById     String       @map("changed_by_id")
  reason          String?      // Reason for status change
  notes           String?      // Additional notes
  
  // System fields
  automaticChange Boolean      @default(false) @map("automatic_change") // Was this an automated change?
  
  // Relationships
  title           Title        @relation(fields: [titleId], references: [id], onDelete: Cascade)
  changedBy       User         @relation(fields: [changedById], references: [id])
  
  @@map("title_status_history")
  @@index([titleId])
  @@index([changedAt])
}
```

## 3. Document Management System

```prisma
model TitleDocument {
  id              String            @id @default(cuid())
  titleId         String            @map("title_id")
  
  // Document details
  type            TitleDocumentType
  filename        String
  originalName    String            @map("original_name")
  mimeType        String            @map("mime_type")
  fileSize        Int               @map("file_size")
  fileUrl         String            @map("file_url")
  thumbnailUrl    String?           @map("thumbnail_url")
  
  // Document metadata
  description     String?
  isRequired      Boolean           @default(false) @map("is_required")
  isVerified      Boolean           @default(false) @map("is_verified")
  verifiedAt      DateTime?         @map("verified_at")
  verifiedById    String?           @map("verified_by_id")
  
  // System fields
  uploadedAt      DateTime          @default(now()) @map("uploaded_at")
  uploadedById    String            @map("uploaded_by_id")
  
  // Relationships
  title           Title             @relation(fields: [titleId], references: [id], onDelete: Cascade)
  uploadedBy      User              @relation("DocumentUploader", fields: [uploadedById], references: [id])
  verifiedBy      User?             @relation("DocumentVerifier", fields: [verifiedById], references: [id])
  
  @@map("title_documents")
  @@index([titleId])
  @@index([type])
}

enum TitleDocumentType {
  ORIGINAL_TITLE        // Original title document
  TITLE_APPLICATION     // Title application form
  BILL_OF_SALE         // Bill of sale
  POWER_OF_ATTORNEY    // POA document
  ODOMETER_DISCLOSURE  // Odometer disclosure
  LIEN_RELEASE         // Lien release document
  INSPECTION_REPORT    // Vehicle inspection report
  INSURANCE_DOCS       // Insurance documentation
  DMV_FORMS            // Various DMV forms
  CORRESPONDENCE       // Email/letter correspondence
  PHOTOS               // Title photos
  OTHER                // Other supporting documents
}
```

## 4. Activity Logging System

```prisma
model TitleActivityLog {
  id              String           @id @default(cuid())
  titleId         String           @map("title_id")
  
  // Activity details
  action          TitleAction
  description     String
  metadata        Json?            // Flexible metadata for different action types
  
  // Context
  performedAt     DateTime         @default(now()) @map("performed_at")
  performedById   String           @map("performed_by_id")
  ipAddress       String?          @map("ip_address")
  userAgent       String?          @map("user_agent")
  
  // Relationships
  title           Title            @relation(fields: [titleId], references: [id], onDelete: Cascade)
  performedBy     User             @relation("TitleActivityPerformer", fields: [performedById], references: [id])
  
  @@map("title_activity_logs")
  @@index([titleId])
  @@index([performedAt])
  @@index([action])
}

enum TitleAction {
  CREATED           // Title record created
  STATUS_CHANGED    // Status updated
  ASSIGNED          // Assigned to user
  UNASSIGNED        // Unassigned from user
  NOTES_UPDATED     // Notes modified
  DOCUMENT_UPLOADED // Document added
  DOCUMENT_VERIFIED // Document verified
  PACKAGE_ASSIGNED  // Assigned to package
  BULK_IMPORTED     // Created via bulk import
  PRIORITY_CHANGED  // Priority updated
  DATES_UPDATED     // Date fields updated
  DELETED           // Title deleted
  EXPORTED          // Data exported
}
```

## 5. Enhanced Package Integration

```prisma
// Enhanced Package model (extends existing)
model Package {
  id                    String              @id @default(cuid())
  type                  PackageType
  
  // Enhanced tracking
  trackingNumber        String?             @map("tracking_number")
  provider              String?
  estimatedDelivery     DateTime?           @map("estimated_delivery")
  actualDelivery        DateTime?           @map("actual_delivery")
  
  // Enhanced status
  status                PackageStatus       @default(PENDING)
  priority              PackagePriority     @default(NORMAL)
  
  // Contact information
  senderContactId       String?             @map("sender_contact_id")
  recipientContactId    String?             @map("recipient_contact_id")
  
  // Physical details
  weight                Decimal?
  dimensions            String?             // JSON: {length, width, height}
  insuranceValue        Decimal?            @map("insurance_value")
  
  // System fields
  createdAt             DateTime            @default(now()) @map("created_at")
  updatedAt             DateTime            @updatedAt @map("updated_at")
  
  // Relationships
  titles                Title[]
  documents             PackageDocument[]
  
  @@map("packages")
}

enum PackagePriority {
  STANDARD
  EXPRESS
  OVERNIGHT
  SAME_DAY
}
```

## 6. Bulk Import System

```prisma
model BulkImport {
  id              String           @id @default(cuid())
  
  // Import details
  filename        String
  totalRows       Int              @map("total_rows")
  successCount    Int              @default(0) @map("success_count")
  errorCount      Int              @default(0) @map("error_count")
  status          BulkImportStatus @default(PENDING)
  
  // Validation results
  errors          Json[]           // Array of error objects
  warnings        Json[]           // Array of warning objects
  
  // System fields
  createdAt       DateTime         @default(now()) @map("created_at")
  processedAt     DateTime?        @map("processed_at")
  createdById     String           @map("created_by_id")
  
  // Relationships
  createdBy       User             @relation(fields: [createdById], references: [id])
  createdTitles   Title[]          @relation("BulkImportedTitles")
  
  @@map("bulk_imports")
}

enum BulkImportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

## 7. Analytics and Reporting

```prisma
model TitleMetrics {
  id                    String    @id @default(cuid())
  
  // Time period
  date                  DateTime  @unique
  
  // Counts by status
  pendingCount          Int       @default(0) @map("pending_count")
  receivedCount         Int       @default(0) @map("received_count")
  processingCount       Int       @default(0) @map("processing_count")
  completedCount        Int       @default(0) @map("completed_count")
  
  // Performance metrics
  averageProcessingDays Decimal?  @map("average_processing_days")
  overdueCount          Int       @default(0) @map("overdue_count")
  rushJobsCount         Int       @default(0) @map("rush_jobs_count")
  
  // Efficiency metrics
  slaCompliance         Decimal?  @map("sla_compliance") // Percentage
  customerSatisfaction  Decimal?  @map("customer_satisfaction")
  
  @@map("title_metrics")
  @@index([date])
}
```

## 8. Implementation Strategy

### Phase 1: Core Enhancement
1. **Status History Tracking** - Complete audit trail
2. **Document Management** - PDF upload/preview system
3. **Enhanced Data Model** - Expand current Title model

### Phase 2: Advanced Features  
1. **Bulk Operations** - Multi-select and batch processing
2. **Inline Editing** - Click-to-edit functionality
3. **Advanced Filtering** - Real-time search with visual badges

### Phase 3: Sophisticated Features
1. **Bulk Import System** - VIN import with validation
2. **Analytics Dashboard** - Real-time statistics
3. **Activity Logging** - Complete operational audit

### Phase 4: Performance & Polish
1. **Performance Optimizations** - Debounced search, lookup maps
2. **UI/UX Enhancements** - Professional logistics interface
3. **Integration Testing** - End-to-end workflow validation

This enhanced model provides enterprise-grade title management with complete audit trails, sophisticated workflows, and professional user experience matching the reference project's capabilities while leveraging our existing infrastructure.