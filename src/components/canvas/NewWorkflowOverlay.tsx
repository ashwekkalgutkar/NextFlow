"use client";

import React from 'react';
import { Plus, X, Sparkles, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ui/ThemeProvider';

interface Preset {
  id: string;
  title: string;
  description: string;
  image?: string;
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

interface NewWorkflowOverlayProps {
  onSelect: (presetId: string) => void;
  onDismiss: () => void;
}

export default function NewWorkflowOverlay({ onSelect, onDismiss }: NewWorkflowOverlayProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={cn(
      "absolute inset-0 z-[100] flex flex-col items-center justify-center transition-all animate-in fade-in duration-500",
      isLight ? "bg-white/80" : "bg-black/60"
    )}>
      <div className="absolute inset-0 backdrop-blur-[4px]" />
      
      <div className="relative z-10 flex flex-col items-center max-w-[1200px] w-full px-8">
        
        <div className="flex items-center gap-2 mb-12">
          <span className={cn(
            "text-[14px] font-bold px-3 py-1 rounded-full border",
            isLight ? "bg-black/5 border-black/10 text-black" : "bg-white/10 border-white/10 text-white"
          )}>Add a node</span>
          <span className={isLight ? "text-black/40" : "text-white/40"}>or drag and drop media files, or select a preset</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
           {/* Empty Preset */}
           <div 
              onClick={() => onSelect('empty')}
              className="group cursor-pointer flex flex-col"
            >
              <div className={cn(
                "relative aspect-[4/3] rounded-[16px] overflow-hidden border transition-all duration-300 group-hover:scale-[1.02] shadow-sm flex items-center justify-center",
                isLight 
                  ? "bg-white border-black/5 group-hover:border-black/10" 
                  : "bg-[#1a1a1a] border-white/10 group-hover:border-white/30",
              )}>
                 <div className={cn(
                    "w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-colors",
                    isLight ? "border-black/10 group-hover:border-black/20" : "border-white/20 group-hover:border-white/40"
                  )}>
                    <Plus size={24} className={isLight ? "text-black/40 group-hover:text-black" : "text-white/60 group-hover:text-white"} />
                  </div>
              </div>
              <div className="mt-4 text-center md:text-left">
                <h3 className={cn(
                  "text-[14px] font-bold transition-colors",
                  isLight ? "text-black group-hover:text-[#1a73e8]" : "text-white group-hover:text-[#1a73e8]"
                )}>Empty Workflow</h3>
                <p className={cn("text-[11px] mt-1", isLight ? "text-black/40" : "text-white/40")}>Start from scratch</p>
              </div>
           </div>

          {PRESETS.map((preset) => {
            const themedImage = preset.image!.replace('-dark.png', `-${theme}.png`);

            return (
              <div 
                key={preset.id}
                onClick={() => onSelect(preset.id)}
                className="group cursor-pointer flex flex-col"
              >
                <div className={cn(
                  "relative aspect-[4/3] rounded-[16px] overflow-hidden border transition-all duration-300 group-hover:scale-[1.02] shadow-sm",
                  isLight 
                    ? "bg-[#f5f5f7] border-black/5 group-hover:border-black/10 group-hover:shadow-[0_12px_48px_rgba(0,0,0,0.06)]" 
                    : "bg-[#111] border-white/10 group-hover:border-white/30 group-hover:shadow-[0_12px_48px_rgba(0,0,0,0.8)]",
                )}>
                  <img 
                    src={themedImage} 
                    alt={preset.title} 
                    className={cn(
                      "w-full h-full object-cover transition-all duration-500",
                      isLight ? "opacity-95 group-hover:opacity-100" : "opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-60"
                    )}
                  />
                  {!isLight && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />}

                  {preset.isPro && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-[4px] bg-[#1a73e8] text-[9px] font-bold text-white tracking-widest flex items-center gap-1 shadow-lg">
                      <Sparkles size={8} fill="currentColor" /> PRO
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <h3 className={cn(
                    "text-[14px] font-bold transition-colors",
                    isLight ? "text-black group-hover:text-[#1a73e8]" : "text-white group-hover:text-[#1a73e8]"
                  )}>{preset.title}</h3>
                  <p className={cn(
                    "text-[11px] mt-1 leading-relaxed line-clamp-1",
                    isLight ? "text-black/40" : "text-white/40"
                  )}>{preset.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={onDismiss}
          className={cn(
            "mt-16 flex items-center gap-2 px-5 py-2 rounded-full border text-[13px] font-bold transition-all group shadow-xl",
            isLight 
              ? "bg-black/5 border-black/10 text-black/60 hover:bg-black/10 hover:text-black" 
              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
          )}
        >
          <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
          Dismiss
        </button>
      </div>
    </div>
  );
}
