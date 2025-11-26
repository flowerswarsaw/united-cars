import { NextRequest, NextResponse } from 'next/server';
import { teamRepository } from '@united-cars/crm-mocks';
import { getCRMUser } from '@/lib/crm-auth';
import { createTeamSchema } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const withMembers = searchParams.get('withMembers') === 'true';

    let teams = await teamRepository.list();
    teams = teams.filter(t => t.tenantId === user.tenantId);

    if (activeOnly) teams = teams.filter(t => t.isActive);

    if (withMembers) {
      const teamsWithMembers = await Promise.all(
        teams.map(async (team) => {
          const memberships = await teamRepository.getMembers(team.id);
          return { ...team, memberships };
        })
      );
      return NextResponse.json(teamsWithMembers);
    }

    return NextResponse.json(teams);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const existing = await teamRepository.getByName(validation.data.name);
    if (existing) {
      return NextResponse.json({ error: 'Team name already exists' }, { status: 409 });
    }

    const newTeam = await teamRepository.create(validation.data, user.id);
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
