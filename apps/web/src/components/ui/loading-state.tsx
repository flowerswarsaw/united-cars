import { clsx } from 'clsx'

interface LoadingStateProps {
  text?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({ text = 'Loading...', className, size = 'md' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }
  
  return (
    <div className={clsx('flex flex-col items-center justify-center py-12', className)}>
      <div className={clsx(
        'animate-spin rounded-full border-b-2 border-blue-600',
        sizeClasses[size]
      )} />
      {text && (
        <p className="mt-4 text-sm text-gray-500">{text}</p>
      )}
    </div>
  )
}

export function LoadingSpinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }
  
  return (
    <div className={clsx(
      'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
      sizeClasses[size],
      className
    )} />
  )
}