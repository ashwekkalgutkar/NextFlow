"use client";

import { Handle, Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Play, Loader2, Scissors, Film } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';

export function CropImageNode({ id, data, selected }: any) {
  const { updateNode, runningNodes } = useWorkflowStore();
  const isRunning = runningNodes.has(id);
  
  return (
    <BaseNode 
      id={id} 
      title="Crop Image" 
      icon={<Scissors size={11} className="text-[#2a8a66]" />}
      selected={selected}
      className="w-[180px]"
      headerRight={
        <button disabled={isRunning} className="node-run-btn">
          {isRunning ? <Loader2 size={8} className="animate-spin" /> : <Play size={8} fill="currentColor" />}
          Run
        </button>
      }
    >
      <div className="flex flex-col">
        {data.outputUrl && (
          <div className="aspect-square relative overflow-hidden bg-black/10 border-b border-[#ffffff08]">
             <img src={data.outputUrl} alt="cropped" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-2.5 grid grid-cols-2 gap-2 text-[10px] text-[#666]">
          <div className="flex flex-col gap-1">
            <span>X%</span>
            <input 
              className="bg-black/20 border border-[#ffffff0a] rounded px-1.5 py-1 text-white outline-none focus:border-[#ffffff1a] nodrag" 
              value={data.xPercent || 0} 
              onChange={e => updateNode(id, { xPercent: e.target.value })} 
            />
          </div>
          <div className="flex flex-col gap-1">
            <span>Y%</span>
            <input 
              className="bg-black/20 border border-[#ffffff0a] rounded px-1.5 py-1 text-white outline-none focus:border-[#ffffff1a] nodrag" 
              value={data.yPercent || 0} 
              onChange={e => updateNode(id, { yPercent: e.target.value })} 
            />
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Left} id="image_url" className="handle-image top-1/2" />
      <Handle type="source" position={Position.Right} id="image_url" className="handle-image top-1/2" />
    </BaseNode>
  );
}

export function ExtractFrameNode({ id, data, selected }: any) {
  const { updateNode, runningNodes } = useWorkflowStore();
  const isRunning = runningNodes.has(id);
  
  return (
    <BaseNode 
      id={id} 
      title="Extract Frame" 
      icon={<Film size={11} className="text-[#cc4466]" />}
      selected={selected}
      className="w-[180px]"
      headerRight={
        <button disabled={isRunning} className="node-run-btn">
          {isRunning ? <Loader2 size={8} className="animate-spin" /> : <Play size={8} fill="currentColor" />}
          Run
        </button>
      }
    >
      <div className="flex flex-col">
        {data.outputUrl && (
          <div className="aspect-[16/9] relative bg-black/10 border-b border-[#ffffff08]">
             <img src={data.outputUrl} alt="frame" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-2.5 flex flex-col gap-1.5 text-[10px] text-[#666]">
          <span>Timestamp (sec)</span>
          <input 
            className="bg-black/20 border border-[#ffffff0a] rounded px-1.5 py-1 text-white outline-none focus:border-[#ffffff1a] nodrag" 
            value={data.timestamp || 0} 
            onChange={e => updateNode(id, { timestamp: e.target.value })} 
          />
        </div>
      </div>

      <Handle type="target" position={Position.Left} id="video_url" className="handle-video top-1/2" />
      <Handle type="source" position={Position.Right} id="image_url" className="handle-image top-1/2" />
    </BaseNode>
  );
}
