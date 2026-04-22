"use client";

import { useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { useWorkflowStore } from '@/store/workflowStore';
import { ImageIcon, Video } from 'lucide-react';

export function ImageUploadNode({ id, data, selected }: any) {
  const { updateNode } = useWorkflowStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateNode(id, { outputUrl: url });
    }
  };

  return (
    <BaseNode 
      id={id} 
      title="Input Image" 
      icon={<ImageIcon size={11} className="text-[#1a73e8]" />}
      selected={selected}
      className="w-[160px]"
    >
      <div className="relative group">
        {!data.outputUrl ? (
          <div 
            onClick={() => inputRef.current?.click()}
            className="h-[120px] flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-black/20 hover:bg-black/40 transition-colors"
          >
            <ImageIcon size={18} className="text-[#444]" />
            <span className="text-[10px] text-[#666]">Upload</span>
          </div>
        ) : (
          <div className="relative aspect-square">
            <img 
              src={data.outputUrl} 
              alt="preview" 
              className="w-full h-full object-cover" 
              onClick={() => inputRef.current?.click()}
            />
            {/* Edit overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => inputRef.current?.click()}>
              <span className="text-white text-[10px] font-medium">Replace</span>
            </div>
          </div>
        )}
        <input type="file" ref={inputRef} className="hidden" accept="image/*" onChange={handleUpload} />
      </div>
      <Handle type="source" position={Position.Right} id="image_url" className="handle-image !top-1/2" />
    </BaseNode>
  );
}

export function VideoUploadNode({ id, data, selected }: any) {
  const { updateNode } = useWorkflowStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateNode(id, { outputUrl: url });
    }
  };

  return (
    <BaseNode 
      id={id} 
      title="Input Video" 
      icon={<Video size={11} className="text-[#f97316]" />}
      selected={selected}
      className="w-[180px]"
    >
      <div className="relative group">
        {!data.outputUrl ? (
          <div 
            onClick={() => inputRef.current?.click()}
            className="h-[140px] flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-black/20 hover:bg-black/40 transition-colors"
          >
            <Video size={18} className="text-[#444]" />
            <span className="text-[10px] text-[#666]">Upload</span>
          </div>
        ) : (
          <div className="p-0.5">
            <video 
              src={data.outputUrl} 
              className="w-full rounded-[6px] shadow-sm" 
              controls 
            />
          </div>
        )}
        <input type="file" ref={inputRef} className="hidden" accept="video/*" onChange={handleUpload} />
      </div>
      <Handle type="source" position={Position.Right} id="video_url" className="handle-video !top-1/2" />
    </BaseNode>
  );
}
