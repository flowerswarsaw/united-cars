# CRM Module

A comprehensive Customer Relationship Management (CRM) system built with Next.js, TypeScript, and mock data repositories. The system is designed for easy migration to Prisma/PostgreSQL in the future.

## 🚀 Features

### Core Entities
- **Organisations**: Companies and business accounts
- **Contacts**: Individual people (can belong to organisations)
- **Leads**: Marketing prospects (convertible to deals when marked as target)
- **Deals**: Sales opportunities with multi-pipeline support
- **Pipelines & Stages**: Customizable sales workflows with drag-and-drop Kanban
- **Tasks**: Action items linked to any entity
- **Custom Fields**: Dynamic field definitions for all entities
- **Activity Log**: Comprehensive audit trail

### Business Logic
- **Lead → Deal Conversion**: Only target leads can be converted to deals
- **Dual Pipeline System**: 
  - **Dealer Pipeline**: Main sales process with stages from investigation to close won
  - **Integration Pipeline**: Auto-spawned after dealer close won for onboarding
- **Loss Management**: Requires loss reason when moving to lost stages
- **Kanban Interface**: Drag-and-drop deal management with stage transitions
- **Custom Fields**: Fully typed custom fields (text, number, date, boolean, select, multiselect, json)
- **Activity Tracking**: Automatic logging of entity changes and stage movements

## 📁 Project Structure

```
packages/
├── crm-core/              # Types, schemas, and interfaces
│   ├── src/
│   │   ├── types.ts       # TypeScript interfaces
│   │   ├── schemas.ts     # Zod validation schemas
│   │   ├── factories.ts   # Entity factory helpers
│   │   └── repositories.ts # Repository interfaces
│   └── package.json
├── crm-mocks/             # Mock data layer
│   ├── src/
│   │   ├── base-repository.ts    # Generic repository implementation
│   │   ├── repositories/         # Entity-specific repositories
│   │   ├── seeds.ts             # Test data and seeding
│   │   ├── persistence.ts       # JSON/localStorage adapters
│   │   └── __tests__/          # Unit tests
│   └── package.json
apps/web/
├── app/api/crm/           # REST API routes
│   ├── organisations/     # Organisation CRUD
│   ├── contacts/         # Contact CRUD
│   ├── leads/            # Lead CRUD + conversion
│   ├── deals/            # Deal CRUD + stage movement
│   ├── pipelines/        # Pipeline & stage management
│   ├── tasks/            # Task CRUD
│   ├── activities/       # Activity log
│   └── custom-fields/    # Custom field management
└── app/crm/              # UI components and pages
    ├── layout.tsx        # CRM shell with navigation
    ├── page.tsx          # Dashboard with stats
    ├── organisations/    # Organisation management
    ├── contacts/         # Contact management  
    ├── leads/            # Lead management + conversion
    ├── deals/            # Kanban board + deal management
    ├── tasks/            # Task management
    └── pipelines/        # Pipeline administration
```

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
# From project root
pnpm install
```

### 2. Start Development Server
```bash
# From project root
pnpm dev

# Or specifically for CRM
pnpm crm:dev
```

### 3. Access CRM Module
Navigate to `http://localhost:3000/crm`

### 4. Seed Data
The system automatically loads with sample data including:
- 5 Organisations (AutoMax, Premier Motors, etc.)
- 8 Contacts across organisations
- 6 Leads (3 marked as targets)
- 5 Deals in various pipeline stages
- Default Dealer & Integration pipelines
- Sample tasks and custom fields

## 🎯 Key Features Demo

### Lead Conversion
1. Go to `/crm/leads`
2. Toggle a lead to "Target" status (green toggle)
3. Click arrow button to convert to deal
4. Fill out deal details and select pipeline
5. Deal appears in Kanban board at first stage

### Kanban Deal Management
1. Go to `/crm/deals`
2. Switch between pipeline tabs (Dealer/Integration)
3. Drag deals between stages
4. Moving to "Close Won" auto-spawns Integration pipeline
5. Moving to "Lost" requires selecting loss reason

### Custom Fields
1. Go to any entity detail page
2. View custom fields section
3. Custom field definitions are fully typed
4. Values are stored per entity

## 🧪 Testing

### Run Unit Tests
```bash
cd packages/crm-mocks
pnpm test
```

### Test Coverage
- Lead conversion logic
- Deal stage movement
- Pipeline management
- Loss reason validation
- Activity logging

### Manual Testing Scenarios
1. **Lead Conversion Flow**:
   - Mark lead as target → Convert → Verify deal in pipeline
   - Try converting non-target lead → Should fail

2. **Deal Movement Flow**:
   - Drag deal through stages → Verify stage history
   - Move to Close Won → Verify Integration spawn
   - Move to Lost → Verify loss reason required

3. **Data Persistence**:
   - Create entities → Refresh page → Data persists
   - JSON file storage in `.crm-data/data.json`

## 🔄 Migration to Prisma

The system is designed for easy migration to a real database:

### 1. Database Schema
Convert TypeScript interfaces in `packages/crm-core/src/types.ts` to Prisma schema:

```prisma
model Organisation {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  email     String?
  // ... other fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  contacts Contact[]
  deals    Deal[]
}
```

### 2. Repository Implementation
Replace mock repositories with Prisma-based implementations:

```typescript
// packages/crm-db/src/organisation-repository.ts
export class PrismaOrganisationRepository implements Repository<Organisation> {
  async list(filter?: Partial<Organisation>): Promise<Organisation[]> {
    return prisma.organisation.findMany({
      where: filter
    });
  }
  // ... other methods
}
```

### 3. Dependency Injection
Update API routes to use new repositories:

```typescript
// Replace
import { organisationRepository } from '@united-cars/crm-mocks';

// With
import { organisationRepository } from '@united-cars/crm-db';
```

### 4. Migration Benefits
- **Same Interfaces**: Repository interfaces remain unchanged
- **Type Safety**: All TypeScript types are preserved
- **Business Logic**: Domain logic in repositories stays the same
- **API Compatibility**: REST API remains fully compatible
- **UI Unchanged**: Frontend requires no modifications

## 📊 Architecture Decisions

### Mock Data Strategy
- **In-Memory Storage**: Fast for development and testing
- **JSON Persistence**: Optional file-based persistence
- **LocalStorage**: Client-side caching for better UX
- **Seeded Data**: Realistic test scenarios

### Type Safety
- **Zod Validation**: Runtime validation on all API inputs
- **TypeScript**: Full type safety across all layers
- **Factory Helpers**: Consistent entity creation
- **Enum Management**: Centralized enums for consistency

### Business Rules
- **Lead Targeting**: Only target leads convert to deals
- **Pipeline Isolation**: Deals track current stage per pipeline
- **Auto-Spawning**: Dealer wins trigger Integration pipeline
- **Loss Tracking**: Required reasons for deal losses
- **Activity Logging**: Comprehensive audit trail

### UI/UX Patterns
- **Consistent Layouts**: Shared CRM shell with navigation
- **Table Views**: Standard list views for all entities
- **Modal Forms**: Create/edit in overlay dialogs
- **Drag & Drop**: Intuitive Kanban interface
- **Status Indicators**: Visual status representations

## 🚦 Production Readiness

### Ready Features
- ✅ Complete CRUD operations
- ✅ Business rule enforcement  
- ✅ Type-safe API layer
- ✅ Responsive UI components
- ✅ Activity logging
- ✅ Custom fields system
- ✅ Data validation
- ✅ Error handling

### Future Enhancements
- [ ] User authentication/authorization
- [ ] Real-time updates (WebSocket)
- [ ] Advanced filtering/search
- [ ] Bulk operations
- [ ] Email/SMS integration  
- [ ] Document management
- [ ] Reporting & analytics
- [ ] Mobile app support

## 🔐 Security Considerations

### Current Implementation
- Input validation with Zod schemas
- XSS protection through React
- Type safety prevents injection
- Tenant isolation ready

### Production Additions Needed
- Authentication middleware
- Authorization checks
- Rate limiting
- CSRF protection
- Data encryption
- Audit logging
- API key management

## 📈 Performance Characteristics

### Development Performance
- **Fast Startup**: In-memory data loads instantly
- **Quick Iterations**: No database setup required  
- **Predictable**: Deterministic mock data
- **Testable**: Easy unit testing

### Production Scaling
- **Database Required**: Replace mocks with Prisma
- **Caching Layer**: Add Redis for sessions/data
- **Search Engine**: Elasticsearch for advanced search
- **File Storage**: S3 for documents/images
- **CDN**: Asset optimization

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Update types in `crm-core` if needed
3. Implement repository logic in `crm-mocks`
4. Add API routes in `apps/web/app/api/crm`
5. Build UI components in `apps/web/app/crm`
6. Add tests for business logic
7. Update documentation

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Consistent naming (camelCase, PascalCase)
- Zod schemas for validation
- Repository pattern for data access
- Factory helpers for entity creation

---

This CRM module provides a solid foundation for customer relationship management with modern development practices and easy migration path to production databases.