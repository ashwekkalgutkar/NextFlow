"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface BaseNodeProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
  accentColor?: string;
  isRunning?: boolean;
  headerRight?: React.ReactNode;
}

export function BaseNode({ 
  id, 
  title, 
  icon, 
  children, 
  selected, 
  className, 
  accentColor,
  isRunning,
  headerRight 
}: BaseNodeProps) {
  return (
    <div 
      className={cn(
        "krea-node transition-all duration-200",
        selected && "selected",
        isRunning && "running",
        className
      )}
      style={{ '--accent-color': accentColor } as any}
    >
      {/* Sleek Krea Header */}
      <div className="node-header">
        <div className="flex items-center gap-2">
          {icon && <div className="flex items-center justify-center opacity-70">{icon}</div>}
          <span className="node-title">{title}</span>
        </div>
        {headerRight}
      </div>

      {/* Node Content */}
      <div className="node-body relative">
        {children}
      </div>

      {/* Selection Indicator (Bottom accent) */}
      {selected && accentColor && (
        <div 
          className="absolute -bottom-[1px] left-3 right-3 h-[1px] opacity-50 blur-[1px]" 
          style={{ backgroundColor: accentColor }} 
        />
      )}
    </div>
  );
}
