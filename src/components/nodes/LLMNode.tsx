"use client";

import { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Play, Loader2, Bot, Edit2, Sparkles } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useNodeState } from '@/hooks/useNodeState';
import { cn } from '@/lib/utils';

export default function LLMNode({ id, data, selected }: any) {
  const { updateNode, runningNodes } = useWorkflowStore();
  const isRunning = runningNodes.has(id);

  const { getDisabledProps: getUserProps } = useNodeState(id, "user_message");
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

  const handleRun = async () => {
    updateNode(id, { output: null, error: null });
    const store = useWorkflowStore.getState();
    store.setRunning(id, true);

    try {
      const connectedInputs = store.getNodeInputs(id);

      const systemPrompt = connectedInputs['system_prompt'] ?? data.system_prompt ?? '';
      const userMessage = connectedInputs['user_message'] ?? data.user_message ?? '';
      const imageUrls = connectedInputs['images'] ?? [];

      if (!userMessage && !systemPrompt) {
        updateNode(id, { error: 'Please enter a prompt or connect a Text node.' });
        store.setRunning(id, false);
        return;
      }

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: data.model ?? 'gemini-2.0-flash',
          systemPrompt,
          userMessage: userMessage || systemPrompt,
          imageUrls,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error ?? `HTTP ${response.status}`);
      }

      const output = result.output as string;
      updateNode(id, { output, error: null });
      store.setOutput(id, output);
    } catch (err: any) {
      updateNode(id, { error: err.message ?? 'LLM execution failed' });
    } finally {
      store.setRunning(id, false);
    }
  };

  return (
    <BaseNode
      id={id}
      title="LLM"
      icon={<Bot size={9} className="text-[#f0c040]" />}
      selected={selected}
      className="w-[170px]"
      accentColor="#f0c040"
      isRunning={isRunning}
      headerRight={
        <button
          onClick={handleRun}
          disabled={isRunning}
          className={cn("node-run-btn", isRunning && "running")}
          style={{ height: '20px', fontSize: '9px', padding: '0 8px' }}
        >
          {isRunning ? <Loader2 size={8} className="animate-spin" /> : <Play size={8} fill="currentColor" />}
          Run
        </button>
      }
    >
      <div className="flex flex-col">
        {/* Model Selector */}
        <div className="flex items-center justify-between px-2 py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Model</span>
          <div className="flex items-center gap-1 rounded-md px-1.5 py-0.5 border" style={{ background: 'var(--input-bg)', borderColor: 'var(--border-mid)' }}>
            <Sparkles size={8} className="text-[#f0c040]" />
            <select
              value={data.model || "gemini-2.0-flash"}
              onChange={(e) => updateNode(id, { model: e.target.value })}
              className="bg-transparent text-[9px] outline-none cursor-pointer appearance-none pr-0.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="gemini-2.0-flash">Gemini 2.0</option>
              <option value="gemini-1.5-pro">1.5 Pro</option>
              <option value="gemini-1.5-flash">1.5 Flash</option>
            </select>
          </div>
        </div>

        <div className="p-2 flex flex-col gap-2 relative">
          {/* Prompt Section */}
          <div className="flex flex-col gap-1 relative">
            <div className="flex items-center gap-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
              <Edit2 size={8} />
              <span>Prompt</span>
            </div>
            <textarea
              {...userProps}
              value={userProps.disabled ? "" : (data.user_message || "")}
              onChange={(e) => updateNode(id, { user_message: e.target.value })}
              placeholder={userProps.disabled ? "Using connected input..." : "Prompt..."}
              className={cn(
                "w-full rounded-[6px] p-2 text-[9.5px] min-h-[50px] outline-none transition-all nodrag resize-none hide-scrollbar",
                userProps.className
              )}
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border-mid)',
                color: 'var(--text-primary)'
              }}
            />
            {/* Prompt handle centered with label */}
            <Handle type="target" position={Position.Left} id="user_message" className="handle-text !-left-[12px] !top-[6px]" />
          </div>

          {/* Image handle marker/label */}
          <div className="flex items-center gap-1 text-[9px] relative" style={{ color: 'var(--text-muted)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
            <span>Images</span>
            <Handle type="target" position={Position.Left} id="images" className="handle-image !-left-[12px] !top-[6px]" />
          </div>

          {/* Error display */}
          {data.error && !isRunning && (
            <div 
              className="mt-1 px-2 py-1.5 rounded-[6px] text-[8.5px] leading-relaxed overflow-hidden" 
              style={{ 
                background: 'rgba(255,80,80,0.08)', 
                border: '1px solid rgba(255,80,80,0.2)', 
                color: '#ff6060',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textOverflow: 'ellipsis'
              }}
              title={data.error}
            >
              {data.error}
            </div>
          )}

          {/* Inline Output */}
          {(isRunning || displayedOutput) && (
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[8px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>Result</span>
              </div>
              <div className="max-h-[120px] overflow-y-auto hide-scrollbar text-[9.5px] leading-relaxed font-mono whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {displayedOutput || (isRunning ? "Processing..." : "")}
                {isRunning && <span className="inline-block w-1 h-3 ml-1 bg-[#f0c040] animate-pulse rounded-sm" />}
              </div>
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="output" className="handle-text !top-[44px]" />
    </BaseNode>
  );
}
