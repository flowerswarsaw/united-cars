import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ContextMenuProps {
  children: React.ReactNode;
  onContextMenu?: (e: React.MouseEvent) => void;
}

interface ContextMenuContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ContextMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
  icon?: React.ReactNode;
  shortcut?: string;
}

interface ContextMenuSeparatorProps {
  className?: string;
}

interface ContextMenuContextType {
  isOpen: boolean;
  position: { x: number; y: number };
  openMenu: (x: number, y: number) => void;
  closeMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function ContextMenu({ children, onContextMenu }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const openMenu = (x: number, y: number) => {
    setPosition({ x, y });
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
    onContextMenu?.(e);
  };

  useEffect(() => {
    const handleClickOutside = () => closeMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <ContextMenuContext.Provider value={{ isOpen, position, openMenu, closeMenu }}>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>
    </ContextMenuContext.Provider>
  );
}

export function ContextMenuTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ContextMenuContent({ children, className }: ContextMenuContentProps) {
  const context = useContext(ContextMenuContext);
  const menuRef = useRef<HTMLDivElement>(null);

  if (!context || !context.isOpen) return null;

  const { position } = context;

  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Adjust position to keep menu in viewport
      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > viewport.width) {
        adjustedX = position.x - rect.width;
      }

      if (position.y + rect.height > viewport.height) {
        adjustedY = position.y - rect.height;
      }

      menu.style.left = `${Math.max(4, adjustedX)}px`;
      menu.style.top = `${Math.max(4, adjustedY)}px`;
    }
  }, [position]);

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[9999] min-w-[200px] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-200",
        "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl",
        className
      )}
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {children}
    </div>
  );
}

export function ContextMenuItem({ 
  children, 
  onClick, 
  disabled = false, 
  destructive = false, 
  className,
  icon,
  shortcut
}: ContextMenuItemProps) {
  const context = useContext(ContextMenuContext);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      context?.closeMenu();
    }
  };

  return (
    <button
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        destructive && "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon && <span className="mr-3 flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && (
        <span className="ml-3 text-xs text-muted-foreground tracking-wider">
          {shortcut}
        </span>
      )}
    </button>
  );
}

export function ContextMenuSeparator({ className }: ContextMenuSeparatorProps) {
  return (
    <div
      className={cn(
        "-mx-1 my-1 h-px bg-muted",
        "bg-slate-200 dark:bg-slate-700",
        className
      )}
    />
  );
}