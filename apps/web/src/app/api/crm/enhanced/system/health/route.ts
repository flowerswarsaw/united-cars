import { NextRequest } from 'next/server';
import { 
  checkEnhancedSystemHealth,
  enhancedJsonPersistence,
  uniquenessManager,
  historyLogger
} from '@united-cars/crm-mocks/src/enhanced-index';
import { 
  getUserContext,
  createErrorResponse,
  createSuccessResponse
} from '../../_utils/api-helpers';

// GET /api/crm/enhanced/system/health - System health check
export async function GET(request: NextRequest) {
  try {
    // Get user context (optional for health check)
    const user = await getUserContext(request);
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Basic health check
    const healthCheck = await checkEnhancedSystemHealth();
    
    const response: any = {
      status: healthCheck.status,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      checks: healthCheck.checks
    };

    // Add detailed information if requested and user has permissions
    if (detailed && user && (user.role === 'admin' || user.role === 'senior_sales_manager')) {
      try {
        // Data statistics
        const dataStats = await enhancedJsonPersistence.getDataStatistics();
        response.statistics = dataStats;

        // Uniqueness constraints status
        const uniquenessStats = {
          totalConstraints: uniquenessManager.getAllConstraints().length,
          integrity: uniquenessManager.verifyIntegrity()
        };
        response.uniquenessStatus = uniquenessStats;

        // History logging status
        const historyStats = historyLogger.getStatistics();
        response.historyStatus = historyStats;

        // Data integrity check
        const integrityCheck = await enhancedJsonPersistence.validateDataIntegrity();
        response.dataIntegrity = integrityCheck;

        // Performance metrics (mock data)
        response.performance = {
          averageResponseTime: Math.round(Math.random() * 100 + 50), // 50-150ms
          requestsPerMinute: Math.round(Math.random() * 100 + 20),
          memoryUsage: {
            used: Math.round(Math.random() * 100 + 50), // MB
            total: 512
          },
          uptime: process.uptime()
        };

      } catch (error) {
        console.warn('Error gathering detailed health information:', error);
        response.detailedInfoError = 'Some detailed information unavailable';
      }
    }

    // Determine HTTP status based on health
    let httpStatus = 200;
    if (healthCheck.status === 'error') {
      httpStatus = 503;
    } else if (healthCheck.status === 'warning') {
      httpStatus = 200; // Still operational
    }

    return createSuccessResponse(response, httpStatus, {
      healthCheckPerformed: true,
      checkedBy: user?.id,
      detailed: detailed && !!user
    });

  } catch (error: any) {
    console.error('Error performing health check:', error);
    
    return createSuccessResponse({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error.message
    }, 503, {
      healthCheckFailed: true
    });
  }
}

// POST /api/crm/enhanced/system/health - Run system diagnostics (admin only)
export async function POST(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return createErrorResponse('Unauthorized', null, 401);
    }

    // Only admins can run diagnostics
    if (user.role !== 'admin') {
      return createErrorResponse('Admin access required', null, 403);
    }

    const body = await request.json();
    const { operation } = body;

    let result: any;

    switch (operation) {
      case 'integrity_check':
        // Run comprehensive data integrity check
        result = await enhancedJsonPersistence.validateDataIntegrity();
        
        // Also check uniqueness integrity
        const uniquenessIntegrity = uniquenessManager.verifyIntegrity();
        result.uniquenessIntegrity = uniquenessIntegrity;
        
        // Check history integrity
        const historyIntegrity = historyLogger.verifyIntegrity();
        result.historyIntegrity = historyIntegrity;
        break;

      case 'cache_clear':
        // Clear any cached data (mock implementation)
        result = {
          cachesCleared: ['repository_cache', 'query_cache'],
          clearedAt: new Date().toISOString()
        };
        break;

      case 'backup_create':
        // Create system backup
        try {
          const backupPath = await enhancedJsonPersistence.backup();
          result = {
            backupCreated: true,
            backupPath,
            createdAt: new Date().toISOString()
          };
        } catch (error: any) {
          result = {
            backupCreated: false,
            error: error.message
          };
        }
        break;

      case 'stats_refresh':
        // Refresh system statistics
        const stats = await enhancedJsonPersistence.getDataStatistics();
        const healthCheck = await checkEnhancedSystemHealth();
        
        result = {
          statsRefreshed: true,
          statistics: stats,
          healthStatus: healthCheck,
          refreshedAt: new Date().toISOString()
        };
        break;

      default:
        return createErrorResponse(`Unknown diagnostic operation: ${operation}`, null, 400);
    }

    return createSuccessResponse({
      operation,
      result,
      executedBy: user.id,
      executedAt: new Date().toISOString()
    }, 200, {
      diagnosticOperation: true,
      operationType: operation
    });

  } catch (error: any) {
    console.error('Error running system diagnostics:', error);
    
    if (error.message.includes('Access denied') || error.message.includes('Admin access')) {
      return createErrorResponse('Access denied', null, 403);
    }
    
    return createErrorResponse('Failed to run diagnostics', error.message);
  }
}