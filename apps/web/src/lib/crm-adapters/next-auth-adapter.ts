/**
 * NextAuth Adapter for CRM Platform Integration
 *
 * This adapter implements the CRM AuthenticationProvider interface
 * using NextAuth.js as the authentication backend.
 */

import { getServerSession } from 'next-auth';
import {
  AuthenticationProvider,
  PlatformUser
} from '@united-cars/crm-core';
import { authOptions } from '@/lib/auth';

/**
 * NextAuth implementation of the CRM AuthenticationProvider
 */
export class NextAuthAdapter implements AuthenticationProvider {
  /**
   * Get the currently authenticated user from the NextAuth session
   */
  async getCurrentUser(context?: unknown): Promise<PlatformUser | null> {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return null;
      }

      return {
        id: session.user.id || session.user.email || 'unknown',
        email: session.user.email || '',
        name: session.user.name || undefined,
        isActive: true,
        avatarUrl: session.user.image || undefined
      };
    } catch (error) {
      console.error('[NextAuthAdapter] Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if a user has permission for a specific action
   * This is a simplified implementation - extend based on your RBAC needs
   */
  hasPermission(user: PlatformUser, resource: string, action: string): boolean {
    // For now, allow all authenticated users all permissions
    // This should be extended with proper RBAC checks based on your requirements
    if (!user.isActive) {
      return false;
    }

    // Add custom permission logic here based on your application's needs
    // Example:
    // - Check user roles from your database
    // - Check resource-specific permissions
    // - Implement hierarchical permissions

    return true;
  }

  /**
   * Validate a session token (optional implementation)
   */
  async validateToken(token: string): Promise<PlatformUser | null> {
    // NextAuth handles token validation internally
    // This method is provided for cases where you need manual token validation
    // Implement if needed for API authentication scenarios
    console.warn('[NextAuthAdapter] validateToken not fully implemented - using session-based auth');
    return null;
  }

  /**
   * Refresh user data from the authentication source
   */
  async refreshUser(userId: string): Promise<PlatformUser | null> {
    // NextAuth sessions are already managed
    // Implement if you need to fetch fresh user data from your database
    return this.getCurrentUser();
  }
}

/**
 * Singleton instance of the NextAuth adapter
 */
export const nextAuthAdapter = new NextAuthAdapter();
