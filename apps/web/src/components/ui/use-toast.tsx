"use client"

// Simplified toast hook for the CRM demo
import { useState } from 'react';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastCallbacks: Array<(toast: ToastProps & { id: string }) => void> = [];

export function toast(props: ToastProps) {
  const id = Math.random().toString(36).substr(2, 9);
  toastCallbacks.forEach(callback => callback({ ...props, id }));
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    toastCallbacks.forEach(callback => callback({ id, title: '', description: '', variant: 'default' }));
  }, 5000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);
  
  const addToast = (toast: ToastProps & { id: string }) => {
    if (toast.title || toast.description) {
      setToasts(prev => [...prev, toast]);
    } else {
      // Remove toast
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }
  };
  
  // Register callback
  if (!toastCallbacks.includes(addToast)) {
    toastCallbacks.push(addToast);
  }
  
  return {
    toast,
    toasts,
    dismiss: (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }
  };
}