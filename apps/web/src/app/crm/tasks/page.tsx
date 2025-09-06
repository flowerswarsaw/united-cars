"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Clock, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '@united-cars/crm-core';

const StatusIcons = {
  [TaskStatus.TODO]: Circle,
  [TaskStatus.IN_PROGRESS]: Clock,
  [TaskStatus.DONE]: CheckCircle2,
  [TaskStatus.CANCELLED]: XCircle,
};

const StatusColors = {
  [TaskStatus.TODO]: 'text-gray-500',
  [TaskStatus.IN_PROGRESS]: 'text-blue-500',
  [TaskStatus.DONE]: 'text-green-500',
  [TaskStatus.CANCELLED]: 'text-red-500',
};

const PriorityColors = {
  [TaskPriority.LOW]: 'bg-gray-100 text-gray-800',
  [TaskPriority.MEDIUM]: 'bg-blue-100 text-blue-800',
  [TaskPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [TaskPriority.URGENT]: 'bg-red-100 text-red-800',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    loadTasks();
  }, [filterStatus, filterPriority]);

  const loadTasks = async () => {
    try {
      let url = '/api/crm/tasks';
      const params = new URLSearchParams();
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const data = await fetch(url).then(r => r.json());
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/crm/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadTasks(); // Refresh tasks
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (dueDate?: Date | string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your action items</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
            <SelectItem value={TaskStatus.CANCELLED}>Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
            <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
            <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
            <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const StatusIcon = StatusIcons[task.status];
                const overdue = isOverdue(task.dueDate);
                
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {task.targetType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={PriorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={overdue ? 'text-red-600 font-medium' : ''}>
                        {formatDate(task.dueDate)}
                        {overdue && ' (overdue)'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${StatusColors[task.status]} p-1`}
                        onClick={() => {
                          const nextStatus = task.status === TaskStatus.TODO 
                            ? TaskStatus.IN_PROGRESS 
                            : task.status === TaskStatus.IN_PROGRESS 
                              ? TaskStatus.DONE 
                              : TaskStatus.TODO;
                          updateTaskStatus(task.id, nextStatus);
                        }}
                      >
                        <StatusIcon className="h-4 w-4" />
                        <span className="ml-1 text-xs">
                          {task.status.replace('_', ' ')}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}