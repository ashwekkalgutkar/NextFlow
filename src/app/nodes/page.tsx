"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Play } from 'lucide-react';
import { useWorkflowStore, SavedWorkflow } from '@/store/workflowStore';
import { startPageLoader } from '@/components/ui/PageLoader';

const formatTimeAgo = (dateMs: number) => {
  const seconds = Math.round((Date.now() - dateMs) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

export default function NodesPage() {
  const [activeTab, setActiveTab] = useState('projects');
  const router = useRouter();
  
  // Need to hydrate from zustand store properly to avoid server-side mismatches
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  
  useEffect(() => {
    const unsubscribe = useWorkflowStore.subscribe((state) => {
       setWorkflows(state.savedWorkflows || []);
    });
    setWorkflows(useWorkflowStore.getState().savedWorkflows || []);
    return unsubscribe;
  }, []);

  const handleNewWorkflow = () => {
    const uuid = crypto.randomUUID();
    startPageLoader();
    router.push(`/nodes/${uuid}`);
  };

  return (
    <div className="flex-1 overflow-y-auto w-full hide-scrollbar">
      <section className="hero relative border-b border-[#1f1f1f] overflow-hidden h-[420px] flex flex-col justify-center">
        {/* Background WebP asset placed to match the Krea crop */}
        <div className="absolute inset-0 z-0" 
          style={{
            backgroundImage: `url('https://s.krea.ai/nodesHeaderBannerBlurGradient.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            opacity: 1
          }} 
        />
        
        {/* Bottom fading gradient to smooth transition if required */}
        <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#111111] to-transparent z-[5]" />

        <div className="relative z-10 flex flex-col justify-center px-6 md:px-[44px] max-w-[800px] mt-6 md:mt-6 items-center text-center md:items-start md:text-left mx-auto md:mx-0">
          <div className="flex items-center gap-2 mb-2.5 mt-4">
             <div className="w-[30px] h-[30px] shrink-0">
                 <img src="https://optim-images.krea.ai/https---s-krea-ai-icons-NodeEditor-png-128.webp" alt="Node Editor" className="w-full h-full object-contain" />
             </div>
             <h1 className="text-white font-semibold text-[24px] tracking-[-0.3px]">Node Editor</h1>
          </div>
          <p className="text-[#a0a0a0] text-[13px] max-w-[460px] leading-[1.6] mb-5 font-medium">
            Nodes is the most powerful way to operate Krea. Connect every tool and model into complex automated pipelines.
          </p>
          <button onClick={handleNewWorkflow} className="group flex items-center justify-center bg-white text-black text-[12px] font-semibold px-4 py-2 rounded-full hover:bg-[#e6e6e6] transition-colors w-fit shadow-sm">
            New Workflow <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      <section
        className="tabs-bar px-6 md:px-[44px] flex flex-wrap flex-col md:flex-row items-start md:items-center justify-between relative z-10 border-b py-4 gap-4 md:gap-0"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex flex-wrap items-center gap-1">
          {['Projects', 'Apps', 'Examples', 'Templates'].map(tab => (
            <button
              key={tab.toLowerCase()}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className="tab px-4 md:px-3 py-1.5 text-[13px] font-semibold rounded-[8px] transition-colors"
              style={activeTab === tab.toLowerCase()
                ? { color: 'var(--text-primary)', background: 'var(--bg-elevated-2)' }
                : { color: 'var(--text-muted)', background: 'transparent' }
              }
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Right side filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              className="rounded-md pl-8 pr-3 py-1.5 text-[12px] w-[180px] focus:outline-none transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-mid)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] transition-colors"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
          >
            Last viewed
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--text-muted)' }}>
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="flex items-center justify-center rounded-md w-8 h-8 transition-colors"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3H3V10H10V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 3H14V10H21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 14H3V21H10V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 14H14V21H21V14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>

      <section
        className="content-grid px-6 md:px-[44px] pt-8 pb-[100px] relative z-10 flex flex-col items-start min-h-[500px]"
        style={{ background: 'var(--bg-page)' }}
      >
        {activeTab === 'projects' && (
           <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 md:gap-6 w-full">
             {/* New Workflow card */}
             <div onClick={handleNewWorkflow} className="cursor-pointer group">
               <div
                 className="card-thumb w-full aspect-[4/3] rounded-[12px] flex items-center justify-center mb-3 transition-colors"
                 style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
               >
                 <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--text-primary)' }}>
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={`var(--bg-page)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <line x1="12" y1="5" x2="12" y2="19" />
                     <line x1="5" y1="12" x2="19" y2="12" />
                   </svg>
                 </div>
               </div>
               <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>New Workflow</div>
             </div>

             {/* Saved workflows */}
             {workflows.map((wf, index) => {
               const colors = ['#2563eb', '#eab308', '#ec4899', '#22c55e', '#a855f7'];
               const stripeColor = colors[index % colors.length];
               return (
                 <div key={wf.id} onClick={() => { startPageLoader(); router.push(`/nodes/${wf.id}`); }} className="cursor-pointer group">
                   <div
                     className="card-thumb w-full aspect-[4/3] rounded-[12px] p-4 relative overflow-hidden mb-3 flex items-center justify-center transition-colors"
                     style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                   >
                     <div
                       className="absolute top-2 right-2 w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-sm z-10"
                       style={{ background: 'var(--bg-input)', border: '1px solid var(--border-mid)' }}
                     >
                       <Play size={10} style={{ fill: 'var(--text-primary)', color: 'var(--text-primary)' }} className="ml-0.5" />
                     </div>
                     <div className="absolute w-[45%] h-[55%] left-[20%] top-[15%] rounded-md shadow-sm" style={{ background: 'var(--bg-elevated)' }} />
                     <svg className="absolute w-[50%] h-[70%] left-[40%] top-[45%] overflow-visible" viewBox="0 0 100 100">
                       <path d={index % 2 === 0 ? "M 0,0 C 50,0 20,80 80,80" : "M 0,0 C 70,0 10,60 80,60"} fill="none" stroke={stripeColor} strokeWidth="4" />
                     </svg>
                     <div className="absolute w-[45%] h-[60%] right-[15%] bottom-[-10%] rounded-md shadow-sm" style={{ background: 'var(--bg-elevated)' }} />
                   </div>
                   <div className="text-[13px] font-semibold truncate pr-2" style={{ color: 'var(--text-primary)' }}>{wf.name || 'Untitled'}</div>
                   <div className="text-[11px] mt-[2px]" style={{ color: 'var(--text-muted)' }}>{wf.updatedAt ? `Edited ${formatTimeAgo(wf.updatedAt)}` : 'Edited recently'}</div>
                 </div>
               );
             })}
           </div>
        )}
      </section>
    </div>
  );
}
