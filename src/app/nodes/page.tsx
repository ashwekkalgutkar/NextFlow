"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Play, Plus, Search, ChevronDown, Check, LayoutGrid } from 'lucide-react';
import { useWorkflowStore, SavedWorkflow } from '@/store/workflowStore';
import { startPageLoader } from '@/components/ui/PageLoader';
import { useUser } from '@clerk/nextjs';
import { fetchWorkflows } from '@/app/actions/workflowActions';
import { cn } from '@/lib/utils';

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

type SortBy = 'last_viewed' | 'date_created' | 'alphabetical';
type SortOrder = 'newest' | 'oldest';

export default function NodesPage() {
  const [activeTab, setActiveTab] = useState('projects');
  const router = useRouter();
  const { user } = useUser();
  const { savedWorkflows } = useWorkflowStore();
  
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('last_viewed');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (user?.id) {
      fetchWorkflows().then((dbWorkflows) => {
        const formatted = dbWorkflows.map(wf => ({
          id: wf.id,
          name: wf.name,
          updatedAt: wf.updatedAt.getTime(),
          createdAt: wf.createdAt.getTime(), // Added createdAt to DB and action
          nodes: JSON.parse(wf.nodes as string),
          edges: JSON.parse(wf.edges as string)
        }));
        setWorkflows(formatted);
      });
    } else {
      setWorkflows(savedWorkflows || []);
    }
  }, [user, savedWorkflows]);

  // Click outside sort menu handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewWorkflow = () => {
    const uuid = crypto.randomUUID();
    startPageLoader();
    router.push(`/nodes/${uuid}`);
  };

  // Filter and Sort Logic
  const filteredWorkflows = workflows
    .filter(wf => wf.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'last_viewed' || sortBy === 'date_created') {
        const valA = sortBy === 'last_viewed' ? a.updatedAt : (a as any).createdAt || a.updatedAt;
        const valB = sortBy === 'last_viewed' ? b.updatedAt : (b as any).createdAt || b.updatedAt;
        comparison = valB - valA;
      } else if (sortBy === 'alphabetical') {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'newest' ? comparison : -comparison;
    });

  const getSortLabel = () => {
    switch (sortBy) {
      case 'last_viewed': return 'Last viewed';
      case 'date_created': return 'Date created';
      case 'alphabetical': return 'Alphabetical';
      default: return 'Sort';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto w-full hide-scrollbar bg-[var(--bg-page)]">
      <section className="hero relative border-b border-[var(--border-subtle)] overflow-hidden h-[420px] flex flex-col justify-center">
        <div className="absolute inset-0 z-0" 
          style={{
            backgroundImage: `url('https://s.krea.ai/nodesHeaderBannerBlurGradient.webp')`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
            opacity: 1
          }} 
        />
        
        <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[rgba(0,0,0,0.4)] to-transparent z-[5] md:bg-none" />

        <div className="relative z-10 flex flex-col justify-center px-6 md:px-[44px] max-w-[800px] mt-6 md:mt-6 items-center text-center md:items-start md:text-left mx-auto md:mx-0">
          <div className="flex items-center gap-2 mb-2.5 mt-4">
             <div className="w-[30px] h-[30px] shrink-0">
                 <img src="https://optim-images.krea.ai/https---s-krea-ai-icons-NodeEditor-png-128.webp" alt="Node Editor" className="w-full h-full object-contain" />
             </div>
             <h1 className="text-white font-semibold text-[24px] tracking-[-0.3px]">Node Editor</h1>
          </div>
          <p className="text-white/70 text-[13px] max-w-[460px] leading-[1.6] mb-5 font-medium">
            Nodes is the most powerful way to operate Krea. Connect every tool and model into complex automated pipelines.
          </p>
          <button onClick={handleNewWorkflow} className="group flex items-center justify-center bg-white text-black text-[12px] font-semibold px-5 py-2.5 rounded-full hover:bg-[#e6e6e6] transition-all w-fit shadow-sm active:scale-95">
            New Workflow <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      <section
        className="tabs-bar px-6 md:px-[44px] flex flex-col md:flex-row items-center justify-between relative z-30 border-b py-4 gap-4"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1">
          {['Projects', 'Apps', 'Examples', 'Templates'].map(tab => (
            <button
              key={tab.toLowerCase()}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "tab px-4 py-1.5 text-[13px] font-semibold rounded-[8px] transition-colors",
                activeTab === tab.toLowerCase()
                  ? "text-[var(--text-primary)] bg-[var(--bg-elevated-2)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] group-focus-within:text-[var(--text-primary)] transition-colors" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-[8px] pl-9 pr-3 py-1.5 text-[12.5px] w-[220px] focus:outline-none transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-mid)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-[var(--bg-elevated-2)]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
            >
              {getSortLabel()}
              <ChevronDown size={14} className={cn("text-[var(--text-muted)] transition-transform", showSortMenu && "rotate-180")} />
            </button>

            {showSortMenu && (
              <div 
                className="absolute right-0 mt-2 w-[200px] rounded-[12px] shadow-2xl p-1.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-mid)' }}
              >
                <div className="px-2 py-1.5 text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Sort by</div>
                {[
                  { id: 'last_viewed', label: 'Last viewed' },
                  { id: 'date_created', label: 'Date created' },
                  { id: 'alphabetical', label: 'Alphabetical' }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => { setSortBy(option.id as SortBy); setShowSortMenu(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] hover:bg-[var(--bg-elevated)] transition-colors"
                    style={{ color: sortBy === option.id ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {option.label}
                    {sortBy === option.id && <Check size={14} className="text-[var(--accent-blue)]" />}
                  </button>
                ))}
                
                <div className="h-[1px] bg-[var(--border-subtle)] my-1.5" />
                
                <div className="px-2 py-1.5 text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider">Order by</div>
                {[
                  { id: 'newest', label: 'Newest first' },
                  { id: 'oldest', label: 'Oldest first' }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => { setSortOrder(option.id as SortOrder); setShowSortMenu(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] hover:bg-[var(--bg-elevated)] transition-colors"
                    style={{ color: sortOrder === option.id ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {option.label}
                    {sortOrder === option.id && <Check size={14} className="text-[var(--accent-blue)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="flex items-center justify-center rounded-[8px] w-8 h-8 transition-colors hover:bg-[var(--bg-elevated-2)]"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </section>

      <section
        className="content-grid px-6 md:px-[44px] pt-8 pb-[100px] relative z-10 flex flex-col items-start min-h-[500px]"
        style={{ background: 'var(--bg-sidebar)' }}
      >
        {activeTab === 'projects' && (
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 w-full">
              <div onClick={handleNewWorkflow} className="cursor-pointer group">
                <div
                  className="card-thumb w-full aspect-[4/3] rounded-[12px] flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-md"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm" style={{ background: 'var(--text-primary)' }}>
                    <Plus size={20} style={{ color: 'var(--bg-page)' }} strokeWidth={3} />
                  </div>
                </div>
                <div className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>New Workflow</div>
              </div>

             {filteredWorkflows.map((wf, index) => {
               const colors = ['#4a9eff', '#f0c040', '#cc66ff', '#f0963a', '#22c55e'];
               const stripeColor = colors[index % colors.length];
               return (
                 <div key={wf.id} onClick={() => { startPageLoader(); router.push(`/nodes/${wf.id}`); }} className="cursor-pointer group">
                   <div
                     className="card-thumb w-full aspect-[4/3] rounded-[12px] p-4 relative overflow-hidden mb-3 flex items-center justify-center transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-md"
                     style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                   >
                     <div
                       className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 z-10"
                       style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.05)' }}
                     >
                       <Play size={11} fill="white" className="text-white ml-0.5" />
                     </div>

                     <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                        <div className="relative w-[120px] h-[80px]">
                           <div className="absolute top-0 left-0 w-[40px] h-[30px] rounded-[6px] border" style={{ borderColor: 'var(--card-mock-border)', background: 'var(--card-mock-node)' }} />
                           <div className="absolute top-[15px] left-[35px] w-[20px] h-[1px]" style={{ background: 'var(--card-mock-border)' }} />
                           <div className="absolute top-[10px] right-0 w-[50px] h-[40px] rounded-[6px] border" style={{ borderColor: 'var(--card-mock-border)', background: 'var(--card-mock-node)' }} />
                           <div className="absolute bottom-0 left-[20%] w-[45px] h-[35px] rounded-[6px] border" style={{ borderColor: 'var(--card-mock-border)', background: 'var(--card-mock-node)' }} />
                           <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
                              <path d="M 20,15 C 40,15 40,30 60,30" stroke={stripeColor} strokeWidth="1.5" fill="none" />
                              <path d="M 60,30 C 80,30 80,50 100,50" stroke={stripeColor} strokeWidth="1.5" fill="none" opacity="0.5" />
                           </svg>
                        </div>
                     </div>
                   </div>
                   <div className="text-[14px] font-bold truncate pr-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>{wf.name || 'Untitled Workflow'}</div>
                   <div className="text-[11.5px] mt-[2px] font-medium opacity-40" style={{ color: 'var(--text-muted)' }}>{wf.updatedAt ? `Edited ${formatTimeAgo(wf.updatedAt)}` : 'Edited recently'}</div>
                 </div>
               );
             })}
           </div>
        )}

        {filteredWorkflows.length === 0 && searchQuery && (
          <div className="w-full flex flex-col items-center justify-center py-20">
            <Search size={40} className="text-[var(--text-dim)] mb-4" strokeWidth={1} />
            <h3 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>No projects found</h3>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Try a different search term or tab.</p>
          </div>
        )}
      </section>
    </div>
  );
}
