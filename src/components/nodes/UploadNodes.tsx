"use client";

import React, { useState, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Upload, Image as ImageIcon, Film, Loader2, X } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid response from server");
  }
}

async function pollTransloadit(assemblyUrl: string): Promise<string> {
  while (true) {
    const r = await fetch(assemblyUrl);
    const res = await safeJson(r);
    
    if (res.ok === 'ASSEMBLY_COMPLETED' || (res.ok && res.ok !== 'ASSEMBLY_EXECUTING' && res.ok !== 'ASSEMBLY_UPLOADING')) {
      const results = res.results;
      // Prioritize :original for the actual content, then fall back to processed
      const fileUrl = results?.[':original']?.[0]?.ssl_url || 
                      results?.['processed']?.[0]?.ssl_url || 
                      (Object.values(results || {}) as any)[0]?.[0]?.ssl_url;
      return fileUrl;
    }
    if (res.error || res.ok === 'ASSEMBLY_ERROR') {
      throw new Error(res.message || res.error || "Transloadit assembly failed");
    }
    await new Promise(r => setTimeout(r, 1500));
  }
}

export function ImageUploadNode({ id, data, selected }: any) {
  const { updateNode } = useWorkflowStore();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    updateNode(id, { isRunning: true });
    
    try {
      const rSig = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: 'image' })
      });
      const { signature, params } = await safeJson(rSig);

      const formData = new FormData();
      formData.append('params', params);
      formData.append('signature', signature);
      formData.append('file', file);

      const rAss = await fetch('https://api2.transloadit.com/assemblies', {
        method: 'POST', body: formData
      });
      const result = await safeJson(rAss);
      
      if (!result.assembly_ssl_url) {
        const errorMsg = result.message || result.error || "Transloadit assembly failed to start";
        throw new Error(errorMsg);
      }

      const fileUrl = await pollTransloadit(result.assembly_ssl_url);
      updateNode(id, { imageUrl: fileUrl, isRunning: false });
      useWorkflowStore.getState().setOutput(id, fileUrl);
    } catch (err: any) {
      console.error("Image Upload Error:", err);
      updateNode(id, { isRunning: false });
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <BaseNode 
      id={id} 
      title="Image" 
      icon={<ImageIcon size={9} className="text-[#4a9eff]" />} 
      selected={selected}
      className="w-[140px]"
      accentColor="#4a9eff"
      isRunning={uploading}
    >
      <div className="p-2">
        {data.imageUrl ? (
          <div 
            className="upload-preview relative group aspect-square rounded-md overflow-hidden border"
            style={{ background: 'var(--bg-elevated-2)', borderColor: 'var(--border-mid)' }}
          >
            <img src={data.imageUrl} alt="uploaded" className="w-full h-full object-cover" />
            <button 
              onClick={() => updateNode(id, { imageUrl: null })}
              className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
        ) : (
          <div className="upload-zone" style={{ minHeight: '80px', gap: '6px' }} onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} 
            />
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#4a9eff]" />
                <span className="upload-zone-label" style={{ fontSize: '9px' }}>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={16} className="upload-zone-icon" />
                <span className="upload-zone-label" style={{ fontSize: '9px' }}>Upload</span>
              </>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="image_url" className="handle-image" />
    </BaseNode>
  );
}

export function VideoUploadNode({ id, data, selected }: any) {
  const { updateNode } = useWorkflowStore();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    updateNode(id, { isRunning: true });
    
    try {
      const rSig = await fetch('/api/upload/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: 'video' })
      });
      const { signature, params } = await safeJson(rSig);

      const formData = new FormData();
      formData.append('params', params);
      formData.append('signature', signature);
      formData.append('file', file);

      const rAss = await fetch('https://api2.transloadit.com/assemblies', {
        method: 'POST', body: formData
      });
      const result = await safeJson(rAss);
      
      if (!result.assembly_ssl_url) {
        const errorMsg = result.message || result.error || "Transloadit assembly failed to start";
        throw new Error(errorMsg);
      }

      const fileUrl = await pollTransloadit(result.assembly_ssl_url);
      updateNode(id, { videoUrl: fileUrl, isRunning: false });
      useWorkflowStore.getState().setOutput(id, fileUrl);
    } catch (err: any) {
      console.error("Video Upload Error:", err);
      updateNode(id, { isRunning: false });
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <BaseNode 
      id={id} 
      title="Video" 
      icon={<Film size={9} className="text-[#f0963a]" />} 
      selected={selected}
      className="w-[140px]"
      accentColor="#f0963a"
      isRunning={uploading}
    >
      <div className="p-2">
        {data.videoUrl ? (
          <div 
            className="upload-preview relative group aspect-video rounded-md overflow-hidden border"
            style={{ background: 'var(--bg-elevated-2)', borderColor: 'var(--border-mid)' }}
          >
            <video src={data.videoUrl} className="w-full h-full object-cover" controls={false} autoPlay loop muted />
            <button 
              onClick={() => updateNode(id, { videoUrl: null })}
              className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
        ) : (
          <div className="upload-zone" style={{ minHeight: '80px', gap: '6px' }} onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="video/*" 
              onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} 
            />
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#f0963a]" />
                <span className="upload-zone-label" style={{ fontSize: '9px' }}>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={16} className="upload-zone-icon" />
                <span className="upload-zone-label" style={{ fontSize: '9px' }}>Upload</span>
              </>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="video_url" className="handle-video" />
    </BaseNode>
  );
}
