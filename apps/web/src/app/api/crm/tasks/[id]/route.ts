import { NextRequest, NextResponse } from 'next/server';
import { taskRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { updateTaskSchema, TaskStatus } from '@united-cars/crm-core';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await taskRepository.get(id);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateTaskSchema.parse(body);
    
    // Handle status change specially
    if (validated.status) {
      const task = await taskRepository.changeStatus(id, validated.status as TaskStatus);
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }
      
      // Apply other updates if any
      const { status, ...otherUpdates } = validated;
      if (Object.keys(otherUpdates).length > 0) {
        await taskRepository.update(id, otherUpdates);
      }
      
      await jsonPersistence.save();
      return NextResponse.json(task);
    }
    
    // Handle assignee change specially
    if ('assigneeId' in validated) {
      const task = await taskRepository.changeAssignee(id, validated.assigneeId || null);
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }
      
      // Apply other updates if any
      const { assigneeId, ...otherUpdates } = validated;
      if (Object.keys(otherUpdates).length > 0) {
        await taskRepository.update(id, otherUpdates);
      }
      
      await jsonPersistence.save();
      return NextResponse.json(task);
    }
    
    // Normal update
    const task = await taskRepository.update(id, validated);
    
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
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await taskRepository.remove(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}