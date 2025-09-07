import { NextRequest, NextResponse } from 'next/server';
import { taskRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { createTaskSchema, EntityType } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    
    let tasks;
    if (targetType && targetId) {
      tasks = await taskRepository.getByTarget(targetType as EntityType, targetId);
    } else {
      tasks = await taskRepository.list();
    }
    
    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }
    
    if (assigneeId) {
      tasks = tasks.filter(task => task.assigneeId === assigneeId);
    }
    
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Convert date strings to Date objects
    if (body.dueDate && typeof body.dueDate === 'string') {
      body.dueDate = new Date(body.dueDate);
    }
    
    const validated = createTaskSchema.parse(body);
    
    const task = await taskRepository.create(validated);
    await jsonPersistence.save();
    
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}