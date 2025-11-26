import { NextRequest, NextResponse } from 'next/server';
import { organisationRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { UserRole } from '@united-cars/crm-core';
import { formatContactMethods, formatPhoneForStorage } from '@/lib/phone-formatter';
import { formatContactMethodsEmails } from '@/lib/email-formatter';
import { normalizeCountryCode, normalizeRegionCode } from '@/lib/country-validator';
import { normalizePostalCode } from '@/lib/postal-code-validator';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Organisation', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const { id } = await params;

    // Find the specific organization
    const organisation = await organisationRepository.get(id);

    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // 3. Check tenant access
    if (organisation.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // 4. Check assignment access for junior managers
    if (user.role === UserRole.JUNIOR_SALES_MANAGER) {
      const assignedTo = organisation.responsibleUserId || organisation.assigneeId;
      if (assignedTo !== user.id && organisation.createdBy !== user.id) {
        return NextResponse.json(
          { error: 'Access denied - This organisation is not assigned to you' },
          { status: 403 }
        );
      }
    }

    console.log(`Found organization: ${organisation.name} (ID: ${id})`);
    return NextResponse.json(organisation);
  } catch (error) {
    console.error('Failed to fetch organisation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organisation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { id } = await params;

    // Get existing organisation
    const existingOrg = await organisationRepository.get(id);

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // 2. Check tenant access
    if (existingOrg.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // 3. Check update permission (includes assignment check)
    const assignedTo = existingOrg.responsibleUserId || existingOrg.assigneeId;
    const accessCheck = checkEntityAccess(user, 'Organisation', 'canUpdate', assignedTo);
    if (accessCheck instanceof NextResponse) return accessCheck;

    const body = await request.json();

    // Format phone numbers and emails in contact methods if present
    const updateData = { ...body };
    if (updateData.contactMethods) {
      updateData.contactMethods = formatContactMethods(updateData.contactMethods);
      updateData.contactMethods = formatContactMethodsEmails(updateData.contactMethods);
    }
    if (updateData.phone) {
      updateData.phone = formatPhoneForStorage(updateData.phone);
    }

    // Normalize country, state, and postal code if present
    if (updateData.country) {
      updateData.country = normalizeCountryCode(updateData.country);
    }
    if (updateData.state) {
      updateData.state = normalizeRegionCode(updateData.state);
    }
    if (updateData.zipCode || updateData.postalCode) {
      const postalCode = updateData.zipCode || updateData.postalCode;
      updateData.zipCode = normalizePostalCode(postalCode);
      if (updateData.postalCode) {
        updateData.postalCode = normalizePostalCode(postalCode);
      }
    }

    // Update the organization using the repository with user tracking
    const updatedOrg = await organisationRepository.update(id, {
      ...updateData,
      updatedBy: user.id
    });

    if (!updatedOrg) {
      return NextResponse.json(
        { error: 'Failed to update organisation' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    console.log(`Updated organization: ${updatedOrg.name} (ID: ${id})`);

    return NextResponse.json(updatedOrg);
  } catch (error: any) {
    console.error('Failed to update organisation:', error);
    return NextResponse.json(
      { error: 'Failed to update organisation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { id } = await params;
    console.log(`Attempting to delete organization with ID: ${id}`);

    // Get existing organisation
    const existingOrg = await organisationRepository.get(id);

    if (!existingOrg) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // 2. Check tenant access
    if (existingOrg.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // 3. Check delete permission (includes assignment check)
    const assignedTo = existingOrg.responsibleUserId || existingOrg.assigneeId;
    const accessCheck = checkEntityAccess(user, 'Organisation', 'canDelete', assignedTo);
    if (accessCheck instanceof NextResponse) return accessCheck;

    // Delete the organization using the repository
    const deleted = await organisationRepository.remove(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete organisation' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    console.log(`Deleted organization with ID: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organisation' },
      { status: 500 }
    );
  }
}