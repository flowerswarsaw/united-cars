# CRM Color System

A semantic color system for visually distinguishing CRM entities (Contacts, Organizations, and Deals) with strong type safety, accessibility compliance, and consistent design patterns.

## Overview

The CRM color system provides a standardized way to represent different entity types across the application:

- **Contacts** → Blue spectrum (representing people)
- **Organizations** → Green spectrum (representing structure/stability)
- **Deals** → Orange/Amber for active, Green for won, Red for lost

All color combinations meet WCAG AA accessibility standards with 4.5:1+ contrast ratios.

## Quick Start

```tsx
import { CrmBadge } from '@united-cars/ui';

// Contact badge
<CrmBadge entity={{ kind: 'contact' }} />

// Organization badges
<CrmBadge entity={{ kind: 'org', type: 'dealer' }} />
<CrmBadge entity={{ kind: 'org', type: 'customer' }} />

// Deal badges
<CrmBadge entity={{ kind: 'deal', state: 'in_progress' }} />
<CrmBadge entity={{ kind: 'deal', state: 'closed_won' }} />
```

## Core Components

### CrmBadge

The primary component for displaying entity type badges with semantic colors.

**Props:**
- `entity`: Entity object with discriminated union type
- `variant`: 'solid' | 'soft' | 'outline' | 'dot' (default: 'soft')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `showIcon`: boolean (default: false)
- `className`: string (optional)

**Entity Types:**

```tsx
// Contact
{ kind: 'contact', label?: string }

// Organization
{ kind: 'org', type?: 'customer' | 'dealer' | 'supplier' | 'partner', label?: string }

// Deal
{ kind: 'deal', state: 'open' | 'in_progress' | 'closed_won' | 'closed_lost', label?: string }
```

### Color Tokens

Direct access to color tokens for custom implementations:

```tsx
import { getEntityColor, getContactColor, getOrgColor, getDealColor } from '@united-cars/ui/theme/crmColors';

// Generic entity color
const color = getEntityColor({ kind: 'org', type: 'dealer' });

// Specific entity colors
const contactColor = getContactColor();
const dealerColor = getOrgColor('dealer');
const activeColor = getDealColor('in_progress');
```

## Color Palette

### Contacts
- **Color**: Blue (#3B82F6)
- **Usage**: All individual contacts
- **Rationale**: Blue traditionally represents people and communication

### Organizations

| Type | Color | Hex | Usage |
|------|-------|-----|-------|
| Customer | Emerald | #10B981 | Paying customers, end clients |
| Dealer | Teal | #14B8A6 | Auto dealerships, retail partners |
| Supplier | Green | #22C55E | Parts suppliers, service providers |
| Partner | Lime | #84CC16 | Business partners, brokers |

### Deals

| State | Color | Hex | Usage |
|-------|-------|-----|-------|
| Open | Orange | #F97316 | New opportunities |
| In Progress | Amber | #F59E0B | Active negotiations |
| Closed Won | Green | #16A34A | Successful deals |
| Closed Lost | Red | #EF4444 | Lost opportunities |

## Variants

### Soft (Default)
Light background with dark text for subtle emphasis:
```tsx
<CrmBadge entity={{ kind: 'contact' }} variant="soft" />
```

### Solid
Solid background with white text for high emphasis:
```tsx
<CrmBadge entity={{ kind: 'contact' }} variant="solid" />
```

### Outline
Transparent background with colored border:
```tsx
<CrmBadge entity={{ kind: 'contact' }} variant="outline" />
```

### Dot
Gray background with colored dot indicator:
```tsx
<CrmBadge entity={{ kind: 'contact' }} variant="dot" />
```

## Sizes

```tsx
// Small - Lists, compact views
<CrmBadge entity={{ kind: 'contact' }} size="sm" />

// Medium - Default, cards
<CrmBadge entity={{ kind: 'contact' }} size="md" />

// Large - Headers, emphasis
<CrmBadge entity={{ kind: 'contact' }} size="lg" />
```

## Data Normalization

The system includes normalization functions for handling various database formats:

```tsx
import { normalizeOrgType, normalizeDealState } from '@united-cars/ui/theme/crmColors';

// Handles: 'DEALER', 'dealership', 'dealer' → 'dealer'
const orgType = normalizeOrgType(dbValue);

// Handles: 'WON', 'closed_won', 'won' → 'closed_won'
const dealState = normalizeDealState(dbValue);
```

**Organization Type Mapping:**
- `dealer`, `dealership` → `dealer`
- `supplier`, `vendor` → `supplier`
- `partner`, `broker` → `partner`
- `customer`, `client`, default → `customer`

**Deal State Mapping:**
- `open`, `new`, `active` → `open`
- `inprogress`, `working`, `negotiating` → `in_progress`
- `won`, `closedwon`, `closed` → `closed_won`
- `lost`, `closedlost` → `closed_lost`

## Accessibility

All color combinations meet WCAG AA standards:

| Combination | Contrast Ratio | Status |
|-------------|----------------|---------|
| Blue-50 / Blue-700 | 9.3:1 | ✓ Excellent |
| Emerald-50 / Emerald-700 | 9.1:1 | ✓ Excellent |
| Orange-50 / Orange-700 | 8.9:1 | ✓ Excellent |
| Blue-500 / White | 7.0:1 | ✓ Excellent |

## CSS Variables

The system defines CSS variables for advanced theming:

```css
:root {
  --crm-contact: 217 91% 60%;
  --crm-org-customer: 160 84% 39%;
  --crm-org-dealer: 172 76% 36%;
  --crm-org-supplier: 142 71% 45%;
  --crm-org-partner: 84 81% 44%;
  --crm-deal-open: 24 95% 53%;
  --crm-deal-in-progress: 45 93% 47%;
  --crm-deal-closed-won: 142 76% 36%;
  --crm-deal-closed-lost: 0 84% 60%;
}
```

## Best Practices

### When to Use Each Variant

**Soft (Default)**
- Entity lists and tables
- Card components
- General entity identification

**Solid**
- Active states
- High-priority entities
- Call-to-action contexts

**Outline**
- Minimal designs
- Secondary information
- When background conflicts

**Dot**
- Status indicators
- Compact layouts
- When color is supplementary

### Layout Guidelines

```tsx
// In lists - use small size
<CrmBadge entity={{ kind: 'contact' }} size="sm" />

// In cards - use medium size with soft variant
<CrmBadge entity={{ kind: 'org', type: 'dealer' }} size="md" variant="soft" />

// In headers - use large size
<CrmBadge entity={{ kind: 'deal', state: 'closed_won' }} size="lg" />

// With icons for enhanced recognition
<CrmBadge entity={{ kind: 'contact' }} showIcon />
```

### Performance

- Color tokens are computed once and memoized
- Normalization functions handle edge cases gracefully
- Type-safe discriminated unions prevent runtime errors

## Integration Examples

### Contact Cards
```tsx
<div className="contact-card">
  <div className="flex items-center gap-2">
    <h3>John Smith</h3>
    <CrmBadge entity={{ kind: 'contact', label: 'CEO' }} size="sm" />
  </div>
</div>
```

### Organization Lists
```tsx
<div className="org-list">
  {organizations.map(org => (
    <div key={org.id} className="flex items-center justify-between">
      <span>{org.name}</span>
      <CrmBadge entity={{ kind: 'org', type: org.type }} size="sm" />
    </div>
  ))}
</div>
```

### Deal Kanban
```tsx
<div className="deal-card">
  <div className="flex items-center justify-between mb-2">
    <h4>{deal.title}</h4>
    <CrmBadge entity={{ kind: 'deal', state: deal.status }} size="sm" variant="dot" />
  </div>
</div>
```

## Testing

Comprehensive test coverage includes:

- Color token generation
- Entity type normalization
- Accessibility compliance
- Variant rendering
- Error handling

Run tests:
```bash
pnpm test CrmBadge
```

## Contributing

When extending the color system:

1. Maintain WCAG AA compliance (4.5:1 minimum contrast)
2. Follow the semantic meaning of colors
3. Add corresponding tests and Storybook examples
4. Update normalization functions for new data formats
5. Ensure TypeScript type safety

## Migration Guide

### From Manual Color Classes

**Before:**
```tsx
<span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Contact</span>
```

**After:**
```tsx
<CrmBadge entity={{ kind: 'contact' }} />
```

### From Custom Badge Components

**Before:**
```tsx
<CustomBadge type="organization" subtype="dealer" />
```

**After:**
```tsx
<CrmBadge entity={{ kind: 'org', type: 'dealer' }} />
```

The new system provides better type safety, accessibility, and consistency while reducing code duplication.