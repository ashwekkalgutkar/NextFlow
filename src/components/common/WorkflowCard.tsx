import React from 'react';
import Link from 'next/link';

export function WorkflowCard({ id, name, updatedAt }: { id: string, name: string, updatedAt: string }) {
  return (
    <Link href={`/nodes/${id}`} className="workflow-card block border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-[var(--radius-lg)] overflow-hidden transition-colors hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-focus)]">
      <div className="card-thumb w-full aspect-video bg-[var(--bg-input)] border-b border-[var(--border-subtle)] relative">
        {/* Placeholder for SVG graph preview */}
        <div className="flex w-full h-full justify-center items-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#333]">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
            </svg>
        </div>
      </div>
      <div className="card-body p-[10px] px-[12px]">
        <div className="card-title text-[var(--text-secondary)] text-[12.5px] font-medium truncate">{name}</div>
        <div className="card-meta text-[var(--text-very-dim)] text-[11px] mt-1 shrink-0">Edited {updatedAt}</div>
      </div>
    </Link>
  );
}

export function NewWorkflowCard({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="new-card w-full text-left border border-dashed border-[#222] bg-[#111] hover:border-[#333] hover:bg-[#141414] transition-colors rounded-[var(--radius-lg)] flex flex-col items-center justify-center gap-2 text-[#3a3a3a] hover:text-[#555] text-[12px] h-[184px]">
      <div className="text-2xl font-light leading-none mb-1">+</div>
      <div className="lowercase tracking-wider text-[11px]">New workflow</div>
    </button>
  );
}
