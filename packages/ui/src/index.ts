export { Button, buttonVariants } from "./components/button";
export { CountrySelect } from "./components/country-select";
export { RegionSelect } from "./components/region-select";
export type { Country } from "./components/country-select";
export type { Region } from "./components/region-select";

// CRM Color System
export { CrmBadge } from "./components/CrmBadge";
export { CrmLegend, ContactLegend, OrganizationLegend, DealLegend } from "./components/CrmLegend";
export type { CrmBadgeProps } from "./components/CrmBadge";
export type { CrmLegendProps } from "./components/CrmLegend";

// CRM Color Tokens and Utilities
export {
  crmColors,
  getContactColor,
  getOrgColor,
  getDealColor,
  getEntityColor,
  normalizeOrgType,
  normalizeDealState
} from "./theme/crmColors";
export type {
  CrmEntityKind,
  OrgType,
  DealState,
  CrmColorToken
} from "./theme/crmColors";