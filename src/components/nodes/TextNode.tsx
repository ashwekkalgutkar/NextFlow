"use client";

import { Handle, Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useWorkflowStore } from '@/store/workflowStore';
import { Type } from 'lucide-react';

export default function TextNode({ id, data, selected }: any) {
  const { updateNode } = useWorkflowStore();

  return (
    <BaseNode 
      id={id} 
      title="Text" 
      icon={<Type size={11} className="text-[#999]" />} 
      selected={selected}
      className="w-[180px]"
    >
      <div className="p-2">
        <textarea
          value={data.text || ""}
          onChange={(e) => updateNode(id, { text: e.target.value })}
          placeholder="Enter text..."
          className="w-full bg-black/10 border border-[#ffffff0a] rounded-[6px] p-2 text-[11px] text-[#ccc] min-h-[60px] outline-none focus:border-[#ffffff1a] transition-all nodrag font-sans"
        />
      </div>
      <Handle type="source" position={Position.Right} id="text" className="handle-prompt !top-1/2" />
    </BaseNode>
  );
}
