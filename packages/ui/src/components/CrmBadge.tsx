import React from 'react';
import { cn } from '../lib/utils';
import {
  getEntityColor,
  type CrmEntityKind,
  type OrgType,
  type DealState,
  normalizeOrgType,
  normalizeDealState
} from '../theme/crmColors';

export interface CrmBadgeProps {
  entity:
    | { kind: 'contact'; label?: string }
    | { kind: 'org'; type?: string | null; label?: string }
    | { kind: 'deal'; state: string | null; label?: string };

  variant?: 'solid' | 'soft' | 'outline' | 'dot';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base'
};

const iconSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3'
};

function getEntityIcon(kind: CrmEntityKind) {
  switch (kind) {
    case 'contact':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
        </svg>
      );
    case 'org':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4Zm2 3a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2H7Z" clipRule="evenodd" />
        </svg>
      );
    case 'deal':
      return (
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-6-3.5a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v.5a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-.5ZM7 7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H7Z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
}

function getDisplayLabel(entity: CrmBadgeProps['entity']): string {
  if (entity.label) return entity.label;

  switch (entity.kind) {
    case 'contact':
      return 'Contact';
    case 'org':
      if (entity.type) {
        const normalized = normalizeOrgType(entity.type);
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      }
      return 'Organization';
    case 'deal':
      if (entity.state) {
        const normalized = normalizeDealState(entity.state);
        if (normalized) {
          return normalized.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      return 'Deal';
    default:
      return 'Unknown';
  }
}

export function CrmBadge({
  entity,
  variant = 'soft',
  size = 'md',
  className,
  showIcon = false
}: CrmBadgeProps) {
  const colorToken = React.useMemo(() => {
    try {
      switch (entity.kind) {
        case 'contact':
          return getEntityColor({ kind: 'contact' });
        case 'org':
          const orgType = normalizeOrgType(entity.type);
          return getEntityColor({ kind: 'org', type: orgType });
        case 'deal':
          const dealState = normalizeDealState(entity.state);
          if (!dealState) {
            return getEntityColor({ kind: 'deal', state: 'open' });
          }
          return getEntityColor({ kind: 'deal', state: dealState });
        default:
          return getEntityColor({ kind: 'contact' });
      }
    } catch (error) {
      console.warn('CrmBadge: Failed to get entity color, falling back to contact color', error);
      return getEntityColor({ kind: 'contact' });
    }
  }, [entity]);

  const label = getDisplayLabel(entity);

  const variantClasses = React.useMemo(() => {
    switch (variant) {
      case 'solid':
        return `${colorToken.tailwind.dot} text-white`;
      case 'soft':
        return `${colorToken.tailwind.softBg} ${colorToken.tailwind.fg}`;
      case 'outline':
        return `border ${colorToken.tailwind.ring} ${colorToken.tailwind.fg} bg-transparent`;
      case 'dot':
        return `bg-gray-100 text-gray-700 ${colorToken.tailwind.fg}`;
      default:
        return `${colorToken.tailwind.softBg} ${colorToken.tailwind.fg}`;
    }
  }, [variant, colorToken]);

  const icon = showIcon ? getEntityIcon(entity.kind) : null;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizeClasses[size],
        variantClasses,
        className
      )}
      data-testid={`crm-badge-${entity.kind}`}
    >
      {icon && (
        <span className={cn('mr-1', iconSizeClasses[size])}>
          {icon}
        </span>
      )}
      {variant === 'dot' && (
        <span
          className={cn(
            'rounded-full mr-1.5',
            colorToken.tailwind.dot,
            size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2'
          )}
        />
      )}
      {label}
    </span>
  );
}

export default CrmBadge;