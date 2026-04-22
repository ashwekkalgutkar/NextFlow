"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface Preset {
  id: string;
  title: string;
  description: string;
  image: string;
  isPro?: boolean;
}

const PRESETS: Preset[] = [
  {
    id: "image-generator",
    title: "Image Generator",
    description: "Simple text to image Generation with Krea 1",
    image: "https://www.krea.ai/workflow-templates/image-generator-dark.png",
  },
  {
    id: "video-generator",
    title: "Video Generator",
    description: "Simple Video Generation with Wan 2.1",
    image: "https://www.krea.ai/workflow-templates/video-generator-dark.png",
  },
  {
    id: "upscaling-enhancer",
    title: "8K Upscaling & Enhancer",
    description: "Upscaling a low resolution image to 8K",
    image: "https://www.krea.ai/workflow-templates/upscaling-enhancer-dark.png",
  },
  {
    id: "llm-captioning",
    title: "LLM Image Captioning",
    description: "Generate a prompt from an image with GPT-4",
    image: "https://www.krea.ai/workflow-templates/llm-captioning-dark.png",
    isPro: true,
  },
];

interface PresetsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPreset?: (preset: Preset) => void;
  onSelectEmpty?: () => void;
}

export default function PresetsModal({
  open,
  onClose,
  onSelectPreset,
}: PresetsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    /* Backdrop — blurs canvas behind */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Dialog */}

      <div 
        className="relative w-full max-w-7xl max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h2 className="text-[28px] font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>Presets</h2>
            <p className="text-[15px]" style={{ color: 'var(--text-dim)' }}>Quickly jumpstart your workflow with these curated templates.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content - Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {PRESETS.map((preset) => (
              <div key={preset.id} className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    onSelectPreset?.(preset);
                    onClose();
                  }}
                  className="group relative flex aspect-[3/2] w-full items-center justify-center rounded-[12px] bg-cover bg-center shadow-lg transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl overflow-hidden active:scale-[0.98]"
                  style={{ 
                     backgroundImage: `url(${preset.image})`,
                     border: '1px solid var(--border-mid)'
                  }}
                >
                  {/* Dark gradient overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  
                  {/* Pro Badge */}
                  {preset.isPro && (
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-[4px] flex items-center gap-1">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Pro</span>
                    </div>
                  )}
                </button>

                <div className="flex flex-col px-1">
                  <h3 className="flex items-center gap-2 text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    {preset.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed mt-1" style={{ color: 'var(--text-muted)' }}>
                    {preset.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
