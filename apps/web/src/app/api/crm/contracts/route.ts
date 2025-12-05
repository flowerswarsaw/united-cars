import { NextRequest, NextResponse } from 'next/server';
import { contractRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess, filterByUserAccess } from '@/lib/crm-auth';
import { ContractType, ContractStatus } from '@united-cars/crm-core';

// GET /api/crm/contracts - List contracts with filters
export async function GET(request: NextRequest) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const accessCheck = checkEntityAccess(user, 'Contract', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const organisationId = searchParams.get('organisationId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let contracts;

    if (dealId) {
      contracts = await contractRepository.getByDeal(dealId, user);
    } else if (organisationId) {
      contracts = await contractRepository.getByOrganisation(organisationId, user);
    } else {
      contracts = await contractRepository.list({}, { user });
    }

    // Filter by tenant
    contracts = contracts.filter(contract => contract.tenantId === user.tenantId);

    // Filter by user access
    contracts = filterByUserAccess(contracts, user, 'Contract');

    // Apply additional filters
    if (status) {
      contracts = contracts.filter(c => c.status === status);
    }
    if (type) {
      contracts = contracts.filter(c => c.type === type);
    }

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Failed to fetch contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

// POST /api/crm/contracts - Create contract
export async function POST(request: NextRequest) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const accessCheck = checkEntityAccess(user, 'Contract', 'canCreate');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const body = await request.json();

    // Map string type to enum, default to SERVICE
    const contractType = body.type && Object.values(ContractType).includes(body.type)
      ? body.type as ContractType
      : ContractType.SERVICE;

    // Map string status to enum, default to DRAFT
    const contractStatus = body.status && Object.values(ContractStatus).includes(body.status)
      ? body.status as ContractStatus
      : ContractStatus.DRAFT;

    const contractData = {
      title: body.title || '',
      contractNumber: body.contractNumber || undefined, // Auto-generate if not provided
      type: contractType,
      status: contractStatus,
      description: body.description || '',
      amount: body.amount || undefined,
      currency: body.currency || 'USD',
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      dealId: body.dealId || undefined,
      organisationId: body.organisationId,
      contactIds: body.contactIds || [],
      responsibleUserId: body.responsibleUserId || user.id,
      fileId: body.fileId || undefined,
      version: body.version || '1.0',
      notes: body.notes || '',
      tags: body.tags || [],
      createdBy: user.id,
      updatedBy: user.id
    };

    const result = await contractRepository.createContract(contractData, {
      user,
      reason: 'User created contract'
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors?.join(', ') || 'Failed to create contract' },
        { status: 400 }
      );
    }

    await jsonPersistence.save();

    console.log(`Created new contract: ${result.data?.title} (ID: ${result.data?.id})`);

    return NextResponse.json(result.data, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract', details: error.message },
      { status: 500 }
    );
  }
}
