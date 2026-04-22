"use client";

import { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Play, Loader2, Bot } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useNodeState } from '@/hooks/useNodeState';
import { cn } from '@/lib/utils';

export default function LLMNode({ id, data, selected }: any) {
  const { updateNode, runningNodes } = useWorkflowStore();
  const isRunning = runningNodes.has(id);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  
  const { getDisabledProps: getSystemProps } = useNodeState(id, "system_prompt");
  const { getDisabledProps: getUserProps } = useNodeState(id, "user_message");
  
  const systemProps = getSystemProps();
  const userProps = getUserProps();

  const [displayedOutput, setDisplayedOutput] = useState("");
  
  useEffect(() => {
    if (!data.output) {
      setDisplayedOutput("");
      return;
    }
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedOutput(data.output.slice(0, i + 1));
      i++;
      if (i >= data.output.length) clearInterval(intervalId);
    }, 15);
    return () => clearInterval(intervalId);
  }, [data.output]);

  return (
    <BaseNode 
      id={id} 
      title="Prompt" 
      icon={<Bot size={11} className="text-[#a855f7]" />} 
      selected={selected}
      className="w-[220px]"
      headerRight={
        <button 
          disabled={isRunning}
          className="node-run-btn"
        >
          {isRunning ? <Loader2 size={8} className="animate-spin" /> : <Play size={8} fill="currentColor" />}
          Run
        </button>
      }
    >
      <div className="flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-[#ffffff08] bg-black/10">
          {['input', 'output'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-medium transition-colors",
                activeTab === tab ? "text-white border-b-1 border-white" : "text-[#666] hover:text-[#999]"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-2.5">
          {activeTab === 'input' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[9px] text-[#555] mb-0.5">
                <span>Model:</span>
                <select 
                  value={data.model || "gemini-2.0-flash"} 
                  onChange={(e) => updateNode(id, { model: e.target.value })}
                  className="bg-transparent text-[#999] outline-none cursor-pointer hover:text-white"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0</option>
                  <option value="gemini-1.5-pro">Gemini Pro</option>
                </select>
              </div>
              
              <textarea
                value={data.user_message || ""}
                onChange={(e) => updateNode(id, { user_message: e.target.value })}
                placeholder="Describe what you want to generate..."
                className="w-full bg-black/20 border border-[#ffffff0a] rounded-[6px] p-2 text-[11px] text-[#ccc] min-h-[80px] outline-none focus:border-[#ffffff1a] transition-all nodrag"
              />
            </div>
          ) : (
            <div className="min-h-[100px] text-[11px] text-[#bbb] leading-relaxed font-mono whitespace-pre-wrap">
              {displayedOutput || "Waiting for output..."}
              {isRunning && <span className="inline-block w-1 h-3 ml-1 bg-[#a855f7] animate-pulse" />}
            </div>
          )}
        </div>
      </div>

      <Handle type="target" position={Position.Left} id="input" className="handle-prompt !top-[45px]" />
      <Handle type="source" position={Position.Right} id="output" className="handle-output !top-[45px]" />
    </BaseNode>
  );
}
