import React from 'react';
import { cn } from '../lib/utils';
import { CrmBadge } from './CrmBadge';
import type { CrmEntityKind, OrgType, DealState } from '../theme/crmColors';

export interface CrmLegendProps {
  entities?: CrmEntityKind[];
  organizationTypes?: OrgType[];
  dealStates?: DealState[];
  variant?: 'soft' | 'solid' | 'outline' | 'dot';
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical' | 'grid';
  className?: string;
  showTitle?: boolean;
  title?: string;
}

const defaultOrganizationTypes: OrgType[] = ['customer', 'dealer', 'supplier', 'partner'];
const defaultDealStates: DealState[] = ['open', 'in_progress', 'closed_won', 'closed_lost'];

export function CrmLegend({
  entities = ['contact', 'org', 'deal'],
  organizationTypes = defaultOrganizationTypes,
  dealStates = defaultDealStates,
  variant = 'soft',
  size = 'sm',
  layout = 'horizontal',
  className,
  showTitle = true,
  title = 'Entity Types'
}: CrmLegendProps) {
  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 gap-2'
  };

  const renderEntitySection = (entityKind: CrmEntityKind) => {
    switch (entityKind) {
      case 'contact':
        return (
          <div key="contact" className="flex items-center gap-1">
            <CrmBadge entity={{ kind: 'contact' }} variant={variant} size={size} />
          </div>
        );

      case 'org':
        return (
          <div key="org" className="flex items-center gap-1">
            {organizationTypes.map(type => (
              <CrmBadge
                key={type}
                entity={{ kind: 'org', type }}
                variant={variant}
                size={size}
              />
            ))}
          </div>
        );

      case 'deal':
        return (
          <div key="deal" className="flex items-center gap-1">
            {dealStates.map(state => (
              <CrmBadge
                key={state}
                entity={{ kind: 'deal', state }}
                variant={variant}
                size={size}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const sections = entities.map(renderEntitySection).filter(Boolean);

  if (layout === 'horizontal') {
    return (
      <div className={cn('space-y-2', className)}>
        {showTitle && (
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        )}
        <div className="flex flex-wrap gap-2">
          {sections.map((section, index) => (
            <React.Fragment key={index}>
              {section}
              {index < sections.length - 1 && (
                <div className="w-px h-6 bg-gray-200 mx-1" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className={cn('space-y-3', className)}>
        {showTitle && (
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        )}
        <div className="space-y-2">
          {entities.includes('contact') && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Contacts</div>
              <CrmBadge entity={{ kind: 'contact' }} variant={variant} size={size} />
            </div>
          )}
          {entities.includes('org') && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Organizations</div>
              <div className="flex flex-wrap gap-1">
                {organizationTypes.map(type => (
                  <CrmBadge
                    key={type}
                    entity={{ kind: 'org', type }}
                    variant={variant}
                    size={size}
                  />
                ))}
              </div>
            </div>
          )}
          {entities.includes('deal') && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Deals</div>
              <div className="flex flex-wrap gap-1">
                {dealStates.map(state => (
                  <CrmBadge
                    key={state}
                    entity={{ kind: 'deal', state }}
                    variant={variant}
                    size={size}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div className={cn('space-y-2', className)}>
      {showTitle && (
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      )}
      <div className="grid grid-cols-2 gap-3">
        {entities.includes('contact') && (
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Contacts</div>
            <CrmBadge entity={{ kind: 'contact' }} variant={variant} size={size} />
          </div>
        )}
        {entities.includes('org') && (
          <div className="col-span-2">
            <div className="text-xs font-medium text-gray-500 mb-1">Organizations</div>
            <div className="grid grid-cols-2 gap-1">
              {organizationTypes.map(type => (
                <CrmBadge
                  key={type}
                  entity={{ kind: 'org', type }}
                  variant={variant}
                  size={size}
                />
              ))}
            </div>
          </div>
        )}
        {entities.includes('deal') && (
          <div className="col-span-2">
            <div className="text-xs font-medium text-gray-500 mb-1">Deals</div>
            <div className="grid grid-cols-2 gap-1">
              {dealStates.map(state => (
                <CrmBadge
                  key={state}
                  entity={{ kind: 'deal', state }}
                  variant={variant}
                  size={size}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized legend components for common use cases

export function ContactLegend(props: Omit<CrmLegendProps, 'entities'>) {
  return <CrmLegend {...props} entities={['contact']} title="Contacts" />;
}

export function OrganizationLegend(props: Omit<CrmLegendProps, 'entities'>) {
  return <CrmLegend {...props} entities={['org']} title="Organization Types" />;
}

export function DealLegend(props: Omit<CrmLegendProps, 'entities'>) {
  return <CrmLegend {...props} entities={['deal']} title="Deal States" />;
}

export default CrmLegend;