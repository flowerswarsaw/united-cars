# United Cars - Database Schema Documentation

## Overview
This document provides comprehensive documentation of the United Cars database schema, designed for easy migration from mock data to a real production database.

## Core Data Models

### 1. Organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type ENUM('auction', 'dealer', 'processor') NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Vehicles
```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin VARCHAR(17) UNIQUE NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  body_type VARCHAR(50),
  engine VARCHAR(100),
  color VARCHAR(50),
  mileage INTEGER,
  condition VARCHAR(50),
  
  -- Auction details
  lot_number VARCHAR(50),
  sale_date DATE,
  purchase_price DECIMAL(12,2),
  
  -- Organization relationship
  org_id UUID REFERENCES organizations(id),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  
  -- Search optimization
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(vin, '') || ' ' || COALESCE(make, '') || ' ' || 
                COALESCE(model, '') || ' ' || COALESCE(CAST(year AS TEXT), ''))
  ) STORED
);

-- Indexes
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_org_id ON vehicles(org_id);
CREATE INDEX idx_vehicles_search ON vehicles USING gin(search_vector);
```

### 3. Titles
```sql
CREATE TABLE titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Title Information
  title_number VARCHAR(100),
  title_type ENUM(
    'clean', 'salvage', 'rebuilt', 'flood', 'lemon', 'junk', 
    'export', 'bonded', 'duplicate', 'lost', 'abandoned', 'repossessed'
  ) NOT NULL,
  issuing_state VARCHAR(2) NOT NULL,
  issuing_country VARCHAR(2) DEFAULT 'US',
  
  -- Vehicle relationship
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Status (computed dynamically from packages)
  -- NOTE: status is computed at runtime based on latest package
  
  -- Priority
  priority ENUM('low', 'normal', 'high', 'rush', 'emergency') DEFAULT 'normal',
  
  -- Dates
  received_date TIMESTAMP,
  processed_date TIMESTAMP,
  expected_completion_date TIMESTAMP,
  actual_completion_date TIMESTAMP,
  
  -- Assignment
  assigned_to UUID,
  location VARCHAR(255),
  
  -- Financial
  processing_fee DECIMAL(8,2),
  rush_fee DECIMAL(8,2),
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  tags TEXT[], -- PostgreSQL array for searchable tags
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL
);

-- Indexes
CREATE INDEX idx_titles_vehicle_id ON titles(vehicle_id);
CREATE INDEX idx_titles_title_type ON titles(title_type);
CREATE INDEX idx_titles_issuing_state ON titles(issuing_state);
CREATE INDEX idx_titles_assigned_to ON titles(assigned_to);
CREATE INDEX idx_titles_tags ON titles USING gin(tags);
```

### 4. Packages
```sql
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Shipping details
  tracking_number VARCHAR(100),
  provider VARCHAR(50), -- 'FedEx', 'UPS', 'USPS', etc.
  
  -- Package status
  status ENUM('packed', 'sent', 'delivered') NOT NULL,
  priority ENUM('standard', 'express', 'overnight', 'same_day') DEFAULT 'standard',
  
  -- Route information
  sender_org_id UUID REFERENCES organizations(id) NOT NULL,
  recipient_org_id UUID REFERENCES organizations(id) NOT NULL,
  
  -- Physical details
  weight DECIMAL(8,2), -- in pounds
  length DECIMAL(8,2), -- in inches
  width DECIMAL(8,2),  -- in inches
  height DECIMAL(8,2), -- in inches
  
  -- Dates
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  
  -- Financial
  insurance_value DECIMAL(12,2),
  shipping_cost DECIMAL(8,2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL
);

-- Indexes
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_tracking_number ON packages(tracking_number);
CREATE INDEX idx_packages_sender_org ON packages(sender_org_id);
CREATE INDEX idx_packages_recipient_org ON packages(recipient_org_id);
```

### 5. Title-Package Relationships (Many-to-Many)
```sql
CREATE TABLE title_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID REFERENCES titles(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  
  -- When this relationship was created
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL,
  
  -- Unique constraint to prevent duplicates
  UNIQUE(title_id, package_id)
);

-- Indexes
CREATE INDEX idx_title_packages_title_id ON title_packages(title_id);
CREATE INDEX idx_title_packages_package_id ON title_packages(package_id);
```

### 6. Documents
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Polymorphic relationship (can belong to titles or packages)
  documentable_type ENUM('title', 'package') NOT NULL,
  documentable_id UUID NOT NULL,
  
  -- Document information
  type ENUM(
    'original_title', 'title_application', 'bill_of_sale', 'power_of_attorney',
    'odometer_disclosure', 'lien_release', 'inspection_report', 'insurance_docs',
    'dmv_forms', 'correspondence', 'photos', 'scan', 
    'shipping_label', 'packing_list', 'customs_form', 'receipt', 'tracking_info', 'other'
  ) NOT NULL,
  
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Verification info
  verified_at TIMESTAMP,
  verified_by UUID,
  
  -- Upload info
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by UUID NOT NULL
);

-- Indexes
CREATE INDEX idx_documents_documentable ON documents(documentable_type, documentable_id);
CREATE INDEX idx_documents_type ON documents(type);
```

### 7. Status History
```sql
CREATE TABLE title_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID REFERENCES titles(id) ON DELETE CASCADE,
  
  from_status VARCHAR(50), -- Dynamic status
  to_status VARCHAR(50) NOT NULL, -- Dynamic status
  
  -- Change details
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by UUID NOT NULL,
  reason VARCHAR(255),
  notes TEXT,
  automatic_change BOOLEAN DEFAULT false,
  
  -- Package that caused the change
  package_id UUID REFERENCES packages(id)
);

-- Indexes
CREATE INDEX idx_title_status_history_title_id ON title_status_history(title_id);
CREATE INDEX idx_title_status_history_changed_at ON title_status_history(changed_at);
```

### 8. Activity Logs
```sql
CREATE TABLE title_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID REFERENCES titles(id) ON DELETE CASCADE,
  
  action ENUM(
    'created', 'status_changed', 'assigned', 'unassigned', 'notes_updated',
    'document_uploaded', 'document_verified', 'package_assigned', 
    'bulk_imported', 'priority_changed', 'dates_updated', 'deleted', 'exported'
  ) NOT NULL,
  
  description TEXT NOT NULL,
  metadata JSONB, -- Flexible metadata for different action types
  
  -- Actor information
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  performed_by UUID NOT NULL,
  ip_address INET,
  user_agent TEXT
);

-- Indexes
CREATE INDEX idx_title_activity_logs_title_id ON title_activity_logs(title_id);
CREATE INDEX idx_title_activity_logs_action ON title_activity_logs(action);
CREATE INDEX idx_title_activity_logs_performed_at ON title_activity_logs(performed_at);
CREATE INDEX idx_title_activity_logs_metadata ON title_activity_logs USING gin(metadata);
```

## Dynamic Status Calculation

### Title Status Logic
Title status is **computed dynamically** based on the latest package containing the title:

```sql
-- Function to calculate dynamic title status
CREATE OR REPLACE FUNCTION calculate_title_status(title_uuid UUID) 
RETURNS TABLE(
  status VARCHAR(50),
  display_text VARCHAR(255),
  organization_name VARCHAR(255),
  package_id UUID,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_package AS (
    SELECT p.*
    FROM packages p
    JOIN title_packages tp ON tp.package_id = p.id
    WHERE tp.title_id = title_uuid
    ORDER BY p.updated_at DESC, p.created_at DESC
    LIMIT 1
  )
  SELECT 
    CASE 
      WHEN lp.status IS NULL THEN 'pending'
      WHEN lp.status = 'packed' THEN 'packed'
      WHEN lp.status = 'sent' THEN 'sent_to'
      WHEN lp.status = 'delivered' THEN 'received_by'
    END::VARCHAR(50),
    
    CASE 
      WHEN lp.status IS NULL THEN 'Pending'
      WHEN lp.status = 'packed' THEN 'Packed'
      WHEN lp.status = 'sent' THEN 'Sent to ' || ro.name
      WHEN lp.status = 'delivered' THEN 'Received by ' || ro.name
    END::VARCHAR(255),
    
    CASE 
      WHEN lp.status IN ('sent', 'delivered') THEN ro.name
      ELSE NULL
    END::VARCHAR(255),
    
    lp.id,
    lp.updated_at
    
  FROM latest_package lp
  LEFT JOIN organizations ro ON ro.id = lp.recipient_org_id;
END;
$$ LANGUAGE plpgsql;
```

### Status Mapping
- **pending**: No packages or no packages found
- **packed**: Latest package status = 'packed'
- **sent_to**: Latest package status = 'sent' → "Sent to [Recipient Org]"
- **received_by**: Latest package status = 'delivered' → "Received by [Recipient Org]"

## Mock Data Structure

### Current TypeScript Interfaces

```typescript
// Core title interface with enhanced fields
export interface EnhancedTitle {
  id: string
  
  // Basic Title Information
  titleNumber: string | null
  titleType: TitleType
  issuingState: string
  issuingCountry: string
  
  // Vehicle Connection
  vehicle: {
    id: string
    vin: string
    make: string | null
    model: string | null
    year: number | null
    org: {
      id: string
      name: string
    }
  }
  
  // Package/Shipping Integration (Many-to-Many)
  packageIds: string[] // IDs of packages this title is assigned to
  packages: {
    id: string
    trackingNumber: string | null
    provider: string | null
    type: 'RECEIVING' | 'SENDING'
    status: string
  }[]
  
  // Dynamic status (computed)
  dynamicStatus?: DynamicTitleStatus
  
  // ... other fields
}

export interface DynamicTitleStatus {
  status: TitleStatus // 'pending' | 'packed' | 'sent_to' | 'received_by'
  displayText: string // e.g., "Sent to Copart", "Received by United Cars"
  organizationName: string | null
  packageId: string | null
  updatedAt: string | null
}
```

## Migration Notes

### From Mock Data to Production Database

1. **Data Transfer**:
   - Export all mock data to JSON
   - Transform JSON to SQL INSERTs
   - Handle UUID generation consistently
   - Maintain referential integrity

2. **Key Transformations**:
   ```javascript
   // Mock data relationship
   title.packageIds = ['pkg-1', 'pkg-2']
   
   // Database relationship
   INSERT INTO title_packages (title_id, package_id) VALUES 
   ('title-uuid', 'pkg-1-uuid'),
   ('title-uuid', 'pkg-2-uuid');
   ```

3. **Status Migration**:
   - Remove static `status` field from titles table
   - Implement dynamic status calculation function
   - Create indexes for performance

4. **File Storage**:
   - Move from mock URLs to real file storage (S3, etc.)
   - Update document URLs in database
   - Implement proper file upload/download

## Performance Considerations

### Indexes
- All foreign keys are indexed
- Search vectors for full-text search
- GIN indexes for array and JSONB fields
- Composite indexes for common query patterns

### Caching Strategy
- Cache dynamic status calculations
- Use Redis for frequently accessed data
- Implement cache invalidation on package updates

### Query Optimization
- Use CTEs for complex status calculations
- Batch operations for bulk updates
- Consider materialized views for analytics

## Security & Data Integrity

### Constraints
- Foreign key constraints maintain referential integrity
- Check constraints validate enum values
- Unique constraints prevent duplicates
- NOT NULL constraints ensure required data

### Audit Trail
- All changes logged in activity tables
- Timestamps on all records
- User tracking for all modifications
- IP and user agent logging

### Data Privacy
- Sensitive information in separate tables
- Encrypted storage for PII
- Role-based access control
- Audit logging for compliance

## Future Enhancements

### Planned Features
1. **Real-time notifications** when package status changes
2. **Advanced analytics** with time-series data
3. **Document versioning** system
4. **Workflow automation** based on status changes
5. **API rate limiting** and authentication
6. **Multi-tenant architecture** for different organizations

### Scalability Considerations
- Partition large tables by date
- Read replicas for analytics
- Horizontal scaling for high-traffic scenarios
- Event-driven architecture for status updates