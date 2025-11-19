/**
 * CRM Entity Color System
 * Semantic colors for Contacts, Organizations, and Deals
 * Provides a single source of truth for entity visual distinction
 */

// Type definitions
export type CrmEntityKind = 'contact' | 'org' | 'deal';
export type OrgType = 'customer' | 'dealer' | 'supplier' | 'partner';
export type DealState = 'open' | 'in_progress' | 'closed_won' | 'closed_lost';

// Color token structure
export interface CrmColorToken {
  hex: string;
  tailwind: {
    bg: string;
    fg: string;
    ring: string;
    softBg: string;
    dot: string;
  };
  cssVars: {
    base: string;
  };
}

/**
 * Core color tokens for CRM entities
 * Blue = People (Contacts)
 * Green spectrum = Structure (Organizations)
 * Orange/Amber = Opportunity (Active Deals)
 * Green/Red = Outcomes (Won/Lost)
 */
export const crmColors = {
  contact: {
    hex: '#3B82F6',
    tailwind: {
      bg: 'bg-blue-100',
      fg: 'text-blue-700',
      ring: 'ring-blue-200',
      softBg: 'bg-blue-50',
      dot: 'bg-blue-500'
    },
    cssVars: { base: '--crm-contact' },
  },
  org: {
    customer: {
      hex: '#10B981',
      tailwind: {
        bg: 'bg-emerald-100',
        fg: 'text-emerald-700',
        ring: 'ring-emerald-200',
        softBg: 'bg-emerald-50',
        dot: 'bg-emerald-500'
      },
      cssVars: { base: '--crm-org-customer' }
    },
    dealer: {
      hex: '#14B8A6',
      tailwind: {
        bg: 'bg-teal-100',
        fg: 'text-teal-700',
        ring: 'ring-teal-200',
        softBg: 'bg-teal-50',
        dot: 'bg-teal-500'
      },
      cssVars: { base: '--crm-org-dealer' }
    },
    supplier: {
      hex: '#22C55E',
      tailwind: {
        bg: 'bg-green-100',
        fg: 'text-green-700',
        ring: 'ring-green-200',
        softBg: 'bg-green-50',
        dot: 'bg-green-500'
      },
      cssVars: { base: '--crm-org-supplier' }
    },
    partner: {
      hex: '#84CC16',
      tailwind: {
        bg: 'bg-lime-100',
        fg: 'text-lime-700',
        ring: 'ring-lime-200',
        softBg: 'bg-lime-50',
        dot: 'bg-lime-500'
      },
      cssVars: { base: '--crm-org-partner' }
    },
  },
  deal: {
    open: {
      hex: '#F97316',
      tailwind: {
        bg: 'bg-orange-100',
        fg: 'text-orange-700',
        ring: 'ring-orange-200',
        softBg: 'bg-orange-50',
        dot: 'bg-orange-500'
      },
      cssVars: { base: '--crm-deal-open' }
    },
    in_progress: {
      hex: '#F59E0B',
      tailwind: {
        bg: 'bg-amber-100',
        fg: 'text-amber-700',
        ring: 'ring-amber-200',
        softBg: 'bg-amber-50',
        dot: 'bg-amber-500'
      },
      cssVars: { base: '--crm-deal-in-progress' }
    },
    closed_won: {
      hex: '#16A34A',
      tailwind: {
        bg: 'bg-green-100',
        fg: 'text-green-700',
        ring: 'ring-green-200',
        softBg: 'bg-green-50',
        dot: 'bg-green-500'
      },
      cssVars: { base: '--crm-deal-closed-won' }
    },
    closed_lost: {
      hex: '#EF4444',
      tailwind: {
        bg: 'bg-red-100',
        fg: 'text-red-700',
        ring: 'ring-red-200',
        softBg: 'bg-red-50',
        dot: 'bg-red-500'
      },
      cssVars: { base: '--crm-deal-closed-lost' }
    },
  },
} as const;

/**
 * Get color token for Contact entities
 */
export function getContactColor(): CrmColorToken {
  return crmColors.contact;
}

/**
 * Get color token for Organization entities
 * @param type - Organization subtype (defaults to 'customer')
 */
export function getOrgColor(type: OrgType = 'customer'): CrmColorToken {
  return crmColors.org[type];
}

/**
 * Get color token for Deal entities based on state
 * @param state - Deal lifecycle state
 */
export function getDealColor(state: DealState): CrmColorToken {
  return crmColors.deal[state];
}

/**
 * Generic entity color getter with discriminated union
 */
export function getEntityColor(
  input:
    | { kind: 'contact' }
    | { kind: 'org'; type?: OrgType }
    | { kind: 'deal'; state: DealState }
): CrmColorToken {
  switch (input.kind) {
    case 'contact':
      return getContactColor();
    case 'org':
      return getOrgColor(input.type);
    case 'deal':
      return getDealColor(input.state);
    default:
      // Type guard - should never reach here
      const _exhaustive: never = input;
      throw new Error(`Unknown entity kind: ${JSON.stringify(_exhaustive)}`);
  }
}

/**
 * Map organization type strings from the database to our OrgType
 * Handles various formats (UPPERCASE, snake_case, etc.)
 */
export function normalizeOrgType(type?: string | null): OrgType {
  if (!type) return 'customer';

  const normalized = type.toLowerCase().replace(/_/g, '');

  switch (normalized) {
    case 'dealer':
    case 'dealership':
      return 'dealer';
    case 'supplier':
    case 'vendor':
      return 'supplier';
    case 'partner':
    case 'broker':
      return 'partner';
    case 'customer':
    case 'client':
    default:
      return 'customer';
  }
}

/**
 * Map deal status strings to our DealState
 */
export function normalizeDealState(status?: string | null): DealState | null {
  if (!status) return null;

  const normalized = status.toLowerCase().replace(/[_-]/g, '');

  switch (normalized) {
    case 'open':
    case 'new':
    case 'active':
      return 'open';
    case 'inprogress':
    case 'working':
    case 'negotiating':
      return 'in_progress';
    case 'won':
    case 'closedwon':
    case 'closed':
      return 'closed_won';
    case 'lost':
    case 'closedlost':
      return 'closed_lost';
    default:
      return 'open';
  }
}