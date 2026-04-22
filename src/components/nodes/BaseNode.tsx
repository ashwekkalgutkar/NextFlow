"use client";

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useWorkflowStore } from '@/store/workflowStore';
import { motion } from 'framer-motion';

interface BaseNodeProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
  headerRight?: React.ReactNode;
}

export const BaseNode = memo(({
  id,
  title,
  icon,
  children,
  selected,
  className,
  headerRight
}: BaseNodeProps) => {
  const { runningNodes } = useWorkflowStore();
  const isRunning = runningNodes.has(id);

  return (
    <motion.div 
      className={cn(
        "krea-node min-w-[180px] overflow-visible relative transition-all duration-200",
        selected ? "ring-1 ring-[#A855F7] border-[#A855F7]" : "border-[#ffffff1a]",
        className
      )}
      initial={false}
      animate={isRunning ? { boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' } : { boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
    >
      {/* Node Header - Compact */}
      <div 
        className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#ffffff0d]"
        style={{ 
          background: 'rgba(25, 25, 25, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '11px 11px 0 0'
        }}
      >
        <div className="flex items-center gap-1.5">
          {icon && <div className="shrink-0">{icon}</div>}
          <span className="text-[11px] font-medium text-[#e0e0e0] tracking-tight">{title}</span>
        </div>
        {headerRight && <div className="flex items-center">{headerRight}</div>}
      </div>

      {/* Node Body */}
      <div className="node-body p-0 overflow-hidden rounded-b-[11px]">
        {children}
      </div>
    </motion.div>
  );
});

BaseNode.displayName = "BaseNode";
