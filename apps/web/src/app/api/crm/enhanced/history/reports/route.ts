import { NextRequest, NextResponse } from 'next/server';
import { 
  HistoryReportingEngine,
  REPORT_CONFIGS
} from '@united-cars/crm-core/src/history-reporting';
import { 
  getUserContext,
  createErrorResponse,
  createSuccessResponse,
  sanitizeInput
} from '../../_utils/api-helpers';

// GET /api/crm/enhanced/history/reports - Get available reports for user
export async function GET(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return createErrorResponse('Unauthorized', null, 401);
    }

    // Get available reports for user role
    const availableReports = HistoryReportingEngine.getAvailableReports(user.role);

    return createSuccessResponse({
      reports: availableReports,
      userRole: user.role,
      totalReports: availableReports.length
    }, 200, {
      userRole: user.role
    });

  } catch (error: any) {
    console.error('Error fetching available reports:', error);
    return createErrorResponse('Failed to fetch available reports', error.message);
  }
}

// POST /api/crm/enhanced/history/reports - Generate a report
export async function POST(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    if (!user) {
      return createErrorResponse('Unauthorized', null, 401);
    }

    // Parse request body
    const body = sanitizeInput(await request.json());
    const { reportId, parameters } = body;

    if (!reportId) {
      return createErrorResponse('Missing required field: reportId', null, 400);
    }

    // Check if report exists
    if (!REPORT_CONFIGS[reportId]) {
      return createErrorResponse(`Report not found: ${reportId}`, null, 404);
    }

    // Generate report
    const report = await HistoryReportingEngine.generateReport(reportId, parameters || {}, user);

    return createSuccessResponse(report, 200, {
      reportGenerated: true,
      generatedBy: user.id,
      executionTime: report.metadata?.executionTime
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    
    if (error.message.includes('Insufficient permissions')) {
      return createErrorResponse('Access denied', error.message, 403);
    }
    
    if (error.message.includes('Required parameter missing') || 
        error.message.includes('Invalid')) {
      return createErrorResponse('Invalid request parameters', error.message, 400);
    }
    
    return createErrorResponse('Failed to generate report', error.message);
  }
}