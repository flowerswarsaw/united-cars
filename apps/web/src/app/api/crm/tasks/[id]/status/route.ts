import { NextRequest, NextResponse } from 'next/server';
import { taskRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { TaskStatus } from '@united-cars/crm-core';
import { z } from 'zod';

const changeStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus)
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { status } = changeStatusSchema.parse(body);
    const { id } = await params;
    
    const task = await taskRepository.changeStatus(id, status);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json(task);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid status', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Failed to change task status:', error);
    return NextResponse.json(
      { error: 'Failed to change task status' },
      { status: 500 }
    );
  }
}