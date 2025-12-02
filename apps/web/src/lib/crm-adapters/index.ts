/**
 * CRM Platform Adapters
 *
 * This module provides platform-specific implementations of the CRM interfaces.
 * Import and call `initializeCRMPlatform()` during application startup.
 */

import {
  CRMPlatformContext,
  initializePlatform,
  DefaultLogger
} from '@united-cars/crm-core';

import { nextAuthAdapter } from './next-auth-adapter';
import { tenantAdapter } from './tenant-adapter';

// Re-export adapters
export { NextAuthAdapter, nextAuthAdapter } from './next-auth-adapter';
export { UnitedCarsTenantAdapter, tenantAdapter, DEFAULT_TENANT_ID } from './tenant-adapter';

/**
 * Initialize the CRM platform with United Cars adapters
 * Call this during application startup (e.g., in instrumentation.ts or a provider)
 */
export function initializeCRMPlatform(): CRMPlatformContext {
  const context: CRMPlatformContext = {
    auth: nextAuthAdapter,
    tenant: tenantAdapter,
    logger: new DefaultLogger()
  };

  initializePlatform(context);

  return context;
}

/**
 * Get the current platform context (already initialized)
 */
export function getCRMContext(): CRMPlatformContext {
  return {
    auth: nextAuthAdapter,
    tenant: tenantAdapter,
    logger: new DefaultLogger()
  };
}
