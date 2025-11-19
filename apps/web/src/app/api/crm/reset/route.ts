import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * DELETE /api/crm/reset
 *
 * Resets CRM data to seed state by deleting the persisted data file.
 * This will cause the system to reload from seed data on next request.
 *
 * IMPORTANT: This is a destructive operation and should only be used in development!
 */
export async function DELETE(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    const dataFile = join(process.cwd(), '.crm-data', 'data.json');

    if (existsSync(dataFile)) {
      await unlink(dataFile);
      console.log('CRM data reset: Deleted persisted data file');

      return NextResponse.json({
        success: true,
        message: 'CRM data reset successfully. Data will reload from seeds on next request.'
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No persisted data found. Already using seed data.'
      });
    }
  } catch (error: any) {
    console.error('Failed to reset CRM data:', error);
    return NextResponse.json(
      { error: 'Failed to reset CRM data', details: error.message },
      { status: 500 }
    );
  }
}
