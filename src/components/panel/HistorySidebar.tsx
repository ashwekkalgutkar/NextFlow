"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';

function Badge({ children, status }: { children: React.ReactNode, status: string }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'success': return 'bg-[#0f6e56] text-[#44cc99] border-[#188a6d]';
      case 'failed': return 'bg-[#993555] text-[#f07090] border-[#b84266]';
      case 'running': return 'bg-[#3c3489] text-[#9b7ef8] border-[#5044b3]';
      case 'partial': return 'bg-[#7c2d12] text-[#f97316] border-[#9a3412]';
      default: return 'bg-[#222] text-[#888] border-[#333]';
    }
  };

  return (
    <span className={cn("text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-[4px] border", getBadgeStyle())}>
      {children}
    </span>
  );
}

export default function HistorySidebar() {
  const { workflowRuns } = useWorkflowStore();
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());

  const toggleRun = (runId: string) => {
    const next = new Set(expandedRuns);
    if (next.has(runId)) next.delete(runId);
    else next.add(runId);
    setExpandedRuns(next);
  };

  if (workflowRuns.length === 0) {
    return (
      <div className="w-[300px] h-full flex flex-col bg-[#0a0a0a] border-l border-[#1f1f1f] relative z-20 shrink-0">
        <div className="p-4 py-3 border-b border-[#1f1f1f] text-[13px] font-semibold tracking-tight text-[#ebebeb] flex justify-between items-center bg-[#0c0c0c]">
          Run History
        </div>
        <div className="text-[12px] text-[#555] px-4 py-4 italic text-center">No runs yet</div>
      </div>
    );
  }

  return (
    <div className="w-[300px] h-full flex flex-col bg-[#0a0a0a] border-l border-[#1f1f1f] relative z-20 shrink-0">
      <div className="p-4 py-3 border-b border-[#1f1f1f] text-[13px] font-semibold tracking-tight text-[#ebebeb] flex justify-between items-center bg-[#0c0c0c]">
        Run History
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {workflowRuns.map((run) => {
          const isExpanded = expandedRuns.has(run.id);

          return (
            <div key={run.id} className="border-b border-[#1f1f1f]">
              <div 
                className={cn("flex flex-col gap-1.5 p-3 px-4 hover:bg-[#111] cursor-pointer transition-colors", isExpanded && "bg-[#111]")}
                onClick={() => toggleRun(run.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[12px] text-[#ebebeb] font-medium tracking-tight">Run #{run.id.slice(0, 6)}</div>
                  <Badge status={run.status}>{run.scope || run.status}</Badge>
                </div>
                
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#888]">
                    {run.status === 'success' && <CheckCircle size={12} className="text-[#44cc99]" />}
                    {run.status === 'failed' && <XCircle size={12} className="text-[#f07090]" />}
                    {run.status === 'running' && <Clock size={12} className="text-[#9b7ef8]" />}
                    {run.status === 'partial' && <CheckCircle size={12} className="text-[#f97316]" />}
                    <span>{run.status.charAt(0).toUpperCase() + run.status.slice(1)} • {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : '...'}</span>
                  </div>
                  {isExpanded ? <ChevronDown size={14} className="text-[#555]" /> : <ChevronRight size={14} className="text-[#555]" />}
                </div>

                {isExpanded && (
                  <div className="flex flex-col font-mono text-[10px] mt-2 bg-[#000] rounded-[6px] border border-[#222] p-2 gap-2 overflow-x-auto">
                    {run.nodeRuns?.map((nodeRun: any, idx: number) => {
                      const isLast = idx === run.nodeRuns.length - 1;
                      return (
                        <div key={nodeRun.id} className="flex flex-col min-w-max">
                          <div className="flex items-center gap-2">
                            <span className="text-[#444]">{isLast ? '└─' : '├─'}</span>
                            <span className="text-[#a0a0a0] font-semibold">{nodeRun.nodeType}</span>
                            <span className="text-[#555]">({nodeRun.nodeId.split('-')[0]})</span>
                            <span className="ml-2">
                              {nodeRun.status === 'success' && '✅'}
                              {nodeRun.status === 'failed' && '❌'}
                              {nodeRun.status === 'running' && '⏳'}
                            </span>
                          </div>
                          {nodeRun.output && (
                            <div className={cn("pl-6 pr-2 py-1 mt-1 rounded-[4px] border-l-2 max-h-[80px] overflow-y-auto whitespace-pre-wrap break-words w-full text-[#ebebeb] bg-[#0c0c0c]", nodeRun.status === 'success' ? "border-[#44cc99]" : "border-[#f07090]")}>
                              {typeof nodeRun.output === 'object' ? JSON.stringify(nodeRun.output, null, 2) : String(nodeRun.output)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
