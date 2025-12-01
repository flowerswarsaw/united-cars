import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import {
  companySettings,
  userProfiles,
  userPreferences,
  mockDataPersistence,
  mockDB
} from '@united-cars/mock-data';

// GET /api/org/settings - Get organization settings (admin only)
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = session.user.roles?.includes('ADMIN');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Find organization settings
    const settings = companySettings.find(s => s.orgId === session.user.orgId);

    if (!settings) {
      return NextResponse.json(
        { error: 'Organization settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization settings' },
      { status: 500 }
    );
  }
}

// PUT /api/org/settings - Update organization settings (admin only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = session.user.roles?.includes('ADMIN');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const updates = await request.json();

    // Find existing settings
    const settingsIndex = companySettings.findIndex(s => s.orgId === session.user.orgId);

    if (settingsIndex === -1) {
      return NextResponse.json(
        { error: 'Organization settings not found' },
        { status: 404 }
      );
    }

    // Update settings
    companySettings[settingsIndex] = {
      ...companySettings[settingsIndex],
      ...updates,
      orgId: session.user.orgId, // Prevent changing orgId
      updatedAt: new Date()
    };

    // Persist changes to disk
    await mockDataPersistence.save({
      userProfiles,
      userPreferences,
      companySettings,
      userSettings: mockDB.userSettings.getAll()
    });

    return NextResponse.json({
      success: true,
      settings: companySettings[settingsIndex]
    });
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json(
      { error: 'Failed to update organization settings' },
      { status: 500 }
    );
  }
}
