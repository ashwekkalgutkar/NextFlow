"use client";

import { useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useWorkflowStore } from '@/store/workflowStore';
import { Type, Edit2, Copy } from 'lucide-react';

export default function TextNode({ id, data, selected }: any) {
  const { updateNode, setOutput } = useWorkflowStore();

  // Sync text value into nodeOutputs so downstream nodes can read it via getNodeInputs
  useEffect(() => {
    setOutput(id, data.text || '');
  }, [id, data.text, setOutput]);

  return (
    <BaseNode 
      id={id} 
      title="Text" 
      icon={<Type size={9} className="text-[#f0c040]" />} 
      selected={selected}
      className="w-[130px]"
      accentColor="#f0c040"
    >
      <div className="flex flex-col">
        {/* Handle Pills Row */}
        <div className="flex justify-between items-center px-1.5 py-1 mt-0.5">
          <div /> 
          <span className="text-[8px] font-bold uppercase tracking-wider pr-1" style={{ color: 'var(--text-muted)' }}>Output</span>
        </div>

        <div className="px-1.5 pb-1.5">
          {/* Editor Header */}
          <div className="flex justify-between items-center mb-1 px-0.5">
            <Edit2 size={8} style={{ color: 'var(--text-dim)' }} />
            <Copy size={8} className="cursor-pointer hover:opacity-100 opacity-60" style={{ color: 'var(--text-primary)' }} />
          </div>
          <textarea
            value={data.text || ""}
            onChange={(e) => {
              updateNode(id, { text: e.target.value });
              setOutput(id, e.target.value);
            }}
            placeholder="Enter text..."
            className="w-full rounded-[4px] p-1.5 text-[9.5px] min-h-[40px] outline-none transition-all nodrag font-sans resize-none hide-scrollbar"
            style={{ 
              background: 'var(--input-bg)', 
              border: '1px solid var(--border-mid)', 
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="text" className="handle-text !top-[30px]" />
    </BaseNode>
  );
}
