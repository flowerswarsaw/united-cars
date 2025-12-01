import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import {
  userProfiles,
  userPreferences,
  companySettings,
  mockDataPersistence
} from '@united-cars/mock-data';
import { mockDB } from '@united-cars/mock-data';

// GET /api/user/profile - Get current user's profile and preferences
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user profile
    const profile = userProfiles.find(p => p.userId === session.user.id);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Find user preferences
    const preferences = userPreferences.find(p => p.userId === session.user.id);

    return NextResponse.json({
      profile,
      preferences: preferences || null
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update current user's profile and preferences
export async function PUT(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profile: profileUpdates, preferences: preferencesUpdates } = body;

    // Find existing profile
    const profileIndex = userProfiles.findIndex(p => p.userId === session.user.id);

    if (profileIndex === -1) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Update profile
    if (profileUpdates) {
      userProfiles[profileIndex] = {
        ...userProfiles[profileIndex],
        ...profileUpdates,
        userId: session.user.id, // Prevent changing userId
        email: session.user.email, // Prevent changing email (synced from User)
        updatedAt: new Date()
      };
    }

    // Update preferences
    if (preferencesUpdates) {
      const preferencesIndex = userPreferences.findIndex(p => p.userId === session.user.id);

      if (preferencesIndex !== -1) {
        userPreferences[preferencesIndex] = {
          ...userPreferences[preferencesIndex],
          ...preferencesUpdates,
          userId: session.user.id,
          updatedAt: new Date()
        };
      } else {
        // Create new preferences if doesn't exist
        userPreferences.push({
          id: `pref-${session.user.id}-${Date.now()}`,
          userId: session.user.id,
          ...preferencesUpdates,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Persist changes to disk
    await mockDataPersistence.save({
      userProfiles,
      userPreferences,
      companySettings,
      userSettings: mockDB.userSettings.getAll()
    });

    return NextResponse.json({
      success: true,
      profile: userProfiles[profileIndex],
      preferences: userPreferences.find(p => p.userId === session.user.id) || null
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
