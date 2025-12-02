/**
 * Platform Integration Interfaces
 *
 * These interfaces define the contract between the CRM module and the hosting platform.
 * This abstraction layer enables the CRM to be:
 * - Extracted into a separate package
 * - Integrated with different authentication systems
 * - Deployed with different platform providers
 *
 * When migrating to a new platform, implement these interfaces with platform-specific adapters.
 */

// ============================================================================
// PLATFORM USER INTERFACE
// ============================================================================

/**
 * Platform-agnostic user representation
 * Maps to platform-specific user models (NextAuth, Auth0, custom, etc.)
 */
export interface PlatformUser {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  avatarUrl?: string;
}

// ============================================================================
// AUTHENTICATION PROVIDER
// ============================================================================

/**
 * Authentication provider interface
 * Implement this to integrate with different auth systems (NextAuth, Auth0, Clerk, etc.)
 */
export interface AuthenticationProvider {
  /**
   * Get the currently authenticated user from request context
   * @param context Platform-specific context (request, session, etc.)
   * @returns The authenticated user or null if not authenticated
   */
  getCurrentUser(context: unknown): Promise<PlatformUser | null>;

  /**
   * Check if a user has permission for a specific action on a resource
   * @param user The user to check permissions for
   * @param resource The resource type (e.g., 'deal', 'contact')
   * @param action The action to check (e.g., 'read', 'write', 'delete')
   * @returns True if the user has permission
   */
  hasPermission(user: PlatformUser, resource: string, action: string): boolean;

  /**
   * Validate a session token
   * @param token The session token to validate
   * @returns The user if valid, null otherwise
   */
  validateToken?(token: string): Promise<PlatformUser | null>;

  /**
   * Refresh user data from the authentication source
   * @param userId The user ID to refresh
   * @returns Updated user data
   */
  refreshUser?(userId: string): Promise<PlatformUser | null>;
}

// ============================================================================
// TENANT PROVIDER
// ============================================================================

/**
 * Multi-tenancy provider interface
 * Implement this to support multiple organizations/tenants
 */
export interface TenantProvider {
  /**
   * Get the tenant ID for a user
   * @param user The user to get tenant for
   * @returns The tenant ID
   */
  getTenantId(user: PlatformUser): string;

  /**
   * Get tenant configuration
   * @param tenantId The tenant ID
   * @returns Tenant-specific configuration
   */
  getTenantConfig?(tenantId: string): Promise<TenantConfig | null>;

  /**
   * Check if a tenant is active
   * @param tenantId The tenant ID
   * @returns True if the tenant is active
   */
  isTenantActive?(tenantId: string): Promise<boolean>;
}

/**
 * Tenant configuration
 */
export interface TenantConfig {
  id: string;
  name: string;
  domain?: string;
  settings?: Record<string, unknown>;
  limits?: {
    maxUsers?: number;
    maxDeals?: number;
    maxContacts?: number;
    maxOrganisations?: number;
  };
}

// ============================================================================
// NOTIFICATION PROVIDER
// ============================================================================

/**
 * Notification provider interface
 * Implement this to send notifications through different channels
 */
export interface NotificationProvider {
  /**
   * Send a notification to a user
   * @param userId Target user ID
   * @param notification Notification details
   */
  sendNotification(userId: string, notification: Notification): Promise<void>;

  /**
   * Send an email notification
   * @param email Target email address
   * @param template Email template name
   * @param data Template data
   */
  sendEmail?(email: string, template: string, data: Record<string, unknown>): Promise<void>;

  /**
   * Send a real-time notification (WebSocket, etc.)
   * @param userId Target user ID
   * @param event Event type
   * @param data Event data
   */
  sendRealTime?(userId: string, event: string, data: unknown): Promise<void>;
}

/**
 * Notification details
 */
export interface Notification {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// FILE STORAGE PROVIDER
// ============================================================================

/**
 * File storage provider interface
 * Implement this to use different storage backends (S3, GCS, local, etc.)
 */
export interface FileStorageProvider {
  /**
   * Upload a file
   * @param path Storage path
   * @param content File content
   * @param options Upload options
   * @returns The file URL
   */
  upload(path: string, content: Buffer | string, options?: UploadOptions): Promise<string>;

  /**
   * Download a file
   * @param path Storage path
   * @returns File content
   */
  download(path: string): Promise<Buffer>;

  /**
   * Delete a file
   * @param path Storage path
   */
  delete(path: string): Promise<void>;

  /**
   * Get a signed URL for temporary access
   * @param path Storage path
   * @param expiresIn Expiration time in seconds
   * @returns Signed URL
   */
  getSignedUrl?(path: string, expiresIn: number): Promise<string>;
}

/**
 * File upload options
 */
export interface UploadOptions {
  contentType?: string;
  public?: boolean;
  metadata?: Record<string, string>;
}

// ============================================================================
// LOGGER PROVIDER
// ============================================================================

/**
 * Logger provider interface
 * Implement this to use different logging backends
 */
export interface LoggerProvider {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

// ============================================================================
// CRM PLATFORM CONTEXT
// ============================================================================

/**
 * Complete platform context
 * Container for all platform-specific providers
 */
export interface CRMPlatformContext {
  auth: AuthenticationProvider;
  tenant: TenantProvider;
  notifications?: NotificationProvider;
  storage?: FileStorageProvider;
  logger?: LoggerProvider;
}

/**
 * Global platform context holder
 * Set this during application initialization
 */
let globalPlatformContext: CRMPlatformContext | null = null;

/**
 * Initialize the CRM platform context
 * Call this during application startup with platform-specific adapters
 */
export function initializePlatform(context: CRMPlatformContext): void {
  globalPlatformContext = context;
}

/**
 * Get the current platform context
 * @throws Error if platform not initialized
 */
export function getPlatformContext(): CRMPlatformContext {
  if (!globalPlatformContext) {
    throw new Error(
      'CRM Platform not initialized. Call initializePlatform() during application startup.'
    );
  }
  return globalPlatformContext;
}

/**
 * Check if platform is initialized
 */
export function isPlatformInitialized(): boolean {
  return globalPlatformContext !== null;
}

// ============================================================================
// DEFAULT IMPLEMENTATIONS (for development/testing)
// ============================================================================

/**
 * Default authentication provider (no-op for development)
 */
export class DefaultAuthProvider implements AuthenticationProvider {
  async getCurrentUser(): Promise<PlatformUser | null> {
    // Return a default development user
    return {
      id: 'dev-user',
      email: 'dev@localhost',
      name: 'Development User',
      isActive: true
    };
  }

  hasPermission(): boolean {
    // Allow all in development
    return true;
  }
}

/**
 * Default tenant provider (single tenant for development)
 */
export class DefaultTenantProvider implements TenantProvider {
  getTenantId(): string {
    return 'default-tenant';
  }

  async getTenantConfig(tenantId: string): Promise<TenantConfig> {
    return {
      id: tenantId,
      name: 'Default Tenant'
    };
  }

  async isTenantActive(): Promise<boolean> {
    return true;
  }
}

/**
 * Default logger (console-based)
 */
export class DefaultLogger implements LoggerProvider {
  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(`[CRM DEBUG] ${message}`, meta || '');
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(`[CRM INFO] ${message}`, meta || '');
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[CRM WARN] ${message}`, meta || '');
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[CRM ERROR] ${message}`, meta || '');
  }
}

/**
 * Create a default platform context for development
 */
export function createDefaultPlatformContext(): CRMPlatformContext {
  return {
    auth: new DefaultAuthProvider(),
    tenant: new DefaultTenantProvider(),
    logger: new DefaultLogger()
  };
}
