import React from 'react';
import { X } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

interface ConnectedPillProps {
  nodeId: string;
  handleId: string;
}

export function ConnectedPill({ nodeId, handleId }: ConnectedPillProps) {
  const { setEdges } = useReactFlow();

  const handleDisconnect = () => {
    setEdges((eds) => eds.filter((e) => !(e.target === nodeId && e.targetHandle === handleId)));
  };

  return (
    <div 
      className="flex items-center justify-between rounded-[6px] px-2 py-1.5 mt-1 mb-1"
      style={{ 
        background: 'var(--bg-elevated-2)', 
        border: '1px solid var(--border-mid)' 
      }}
    >
      <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>🔗 Receiving input</span>
      <button 
        onClick={handleDisconnect}
        className="hover:opacity-100 opacity-60 transition-colors ml-2"
        style={{ color: 'var(--text-primary)' }}
        title="Disconnect"
      >
        <X size={12} />
      </button>
    </div>
  );
}
