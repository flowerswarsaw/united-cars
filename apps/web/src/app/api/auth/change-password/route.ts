import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionFromRequest } from '@/lib/auth';
import { mockUserRepository } from '@/lib/mock-user-repository';
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/password-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
    }

    // Validate new password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get user - find in same org
    const users = await mockUserRepository.findMany({ orgId: session.user.orgId });
    const user = users.find(u => u.id === session.user.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await mockUserRepository.update(
      { id: session.user.id },
      { passwordHash: newPasswordHash }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to change password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
