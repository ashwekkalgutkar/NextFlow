"use client";

import { Handle, Position } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Play, Loader2, Scissors, Film } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useNodeState } from '@/hooks/useNodeState';
import { cn } from '@/lib/utils';

export function CropImageNode({ id, data, selected }: any) {
  const { updateNode, runningNodes } = useWorkflowStore();
  const isRunning = runningNodes.has(id);
  
  const { getDisabledProps: getXProps } = useNodeState(id, "x_percent");
  const { getDisabledProps: getYProps } = useNodeState(id, "y_percent");
  const { getDisabledProps: getWProps } = useNodeState(id, "width_percent");
  const { getDisabledProps: getHProps } = useNodeState(id, "height_percent");

  const xProps = getXProps();
  const yProps = getYProps();
  const wProps = getWProps();
  const hProps = getHProps();

  const handleRun = async () => {
    // We reuse the global execution logic which handles Trigger.dev polling
    const { executeNodeAction } = await import('@/lib/executeNode');
    executeNodeAction({ id, data, type: 'cropImageNode' } as any, useWorkflowStore.getState().activeWorkflowId || 'temp');
  };

  return (
    <BaseNode 
      id={id} 
      title="Crop" 
      icon={<Scissors size={9} className="text-[#4a9eff]" />}
      selected={selected}
      className="w-[140px]"
      accentColor="#4a9eff"
      isRunning={isRunning}
      headerRight={
        <button 
          onClick={handleRun} 
          disabled={isRunning} 
          className={cn("node-run-btn", isRunning && "running")}
          style={{ height: '20px', fontSize: '9px', padding: '0 8px' }}
        >
          {isRunning ? <Loader2 size={8} className="animate-spin" /> : <Play size={8} fill="currentColor" />}
          Run
        </button>
      }
    >
      <div className="flex flex-col relative">
        {/* Labels Row - Center handles here */}
        <div className="flex justify-between items-center px-2 py-1.5 border-b relative" style={{ borderColor: 'var(--border-subtle)' }}>
           <span className="text-[8px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>In</span>
           <span className="text-[8px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>Out</span>
           
           {/* Image handles centered vertically with the IN/OUT text */}
           <Handle type="target" position={Position.Left} id="image_url" className="handle-image !-left-[4.5px]" />
           <Handle type="source" position={Position.Right} id="image_url" className="handle-image !-right-[4.5px]" />
        </div>

        {data.outputUrl && (
          <div className="aspect-square relative overflow-hidden m-1.5 rounded-md border" style={{ background: 'var(--bg-elevated-2)', borderColor: 'var(--border-mid)' }}>
             <img src={data.outputUrl} alt="cropped" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-2 grid grid-cols-2 gap-1.5">
          <div className="flex flex-col gap-0.5 relative">
            <div className="flex items-center gap-1">
              <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>X %</span>
              <div className="w-1 h-1 rounded-full bg-yellow-500/20" /> {/* Marker */}
            </div>
            <input 
              {...xProps}
              className={cn(
                "rounded-md px-1.5 py-1 text-[9px] outline-none nodrag transition-all",
                xProps.className
              )}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              value={xProps.disabled ? "" : (data.xPercent || 0)} 
              placeholder={xProps.disabled ? "Linked" : "0"}
              onChange={e => updateNode(id, { xPercent: e.target.value })} 
            />
            <Handle type="target" position={Position.Left} id="x_percent" className="handle-text !-left-[12px] !top-[6px]" />
          </div>
          
          <div className="flex flex-col gap-0.5 relative">
            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Y %</span>
            <input 
              {...yProps}
              className={cn(
                "rounded-md px-1.5 py-1 text-[9px] outline-none nodrag transition-all",
                yProps.className
              )}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              value={yProps.disabled ? "" : (data.yPercent || 0)} 
              placeholder={yProps.disabled ? "Linked" : "0"}
              onChange={e => updateNode(id, { yPercent: e.target.value })} 
            />
            <Handle type="target" position={Position.Left} id="y_percent" className="handle-text !-left-[12px] !top-[6px]" />
          </div>

          <div className="flex flex-col gap-0.5 relative">
            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>W %</span>
            <input 
              {...wProps}
              className={cn(
                "rounded-md px-1.5 py-1 text-[9px] outline-none nodrag transition-all",
                wProps.className
              )}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              value={wProps.disabled ? "" : (data.widthPercent !== undefined ? data.widthPercent : 100)} 
              placeholder={wProps.disabled ? "Linked" : "100"}
              onChange={e => updateNode(id, { widthPercent: e.target.value })} 
            />
            <Handle type="target" position={Position.Left} id="width_percent" className="handle-text !-left-[12px] !top-[6px]" />
          </div>

          <div className="flex flex-col gap-0.5 relative">
            <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>H %</span>
            <input 
              {...hProps}
              className={cn(
                "rounded-md px-1.5 py-1 text-[9px] outline-none nodrag transition-all",
                hProps.className
              )}
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
              value={hProps.disabled ? "" : (data.heightPercent !== undefined ? data.heightPercent : 100)} 
              placeholder={hProps.disabled ? "Linked" : "100"}
              onChange={e => updateNode(id, { heightPercent: e.target.value })} 
            />
            <Handle type="target" position={Position.Left} id="height_percent" className="handle-text !-left-[12px] !top-[6px]" />
          </div>
        </div>

        {/* Error display */}
        {data.error && !isRunning && (
          <div 
            className="m-2 px-2 py-1.5 rounded-[6px] text-[8.5px] leading-relaxed overflow-hidden" 
            style={{ 
              background: 'rgba(255,80,80,0.08)', 
              border: '1px solid rgba(255,80,80,0.2)', 
              color: '#ff6060',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis'
            }}
            title={data.error}
          >
            {data.error}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export function ExtractFrameNode({ id, data, selected }: any) {
  const { updateNode, runningNodes } = useWorkflowStore();
  const isRunning = runningNodes.has(id);
  
  const { getDisabledProps: getVideoProps } = useNodeState(id, "video_url");
  const { getDisabledProps: getTimeProps } = useNodeState(id, "timestamp");

  const videoProps = getVideoProps();
  const timeProps = getTimeProps();

  const handleRun = async () => {
    const { executeNodeAction } = await import('@/lib/executeNode');
    executeNodeAction({ id, data, type: 'extractFrameNode' } as any, useWorkflowStore.getState().activeWorkflowId || 'temp');
  };

  return (
    <BaseNode 
      id={id} 
      title="Frame" 
      icon={<Film size={9} className="text-[#f0963a]" />}
      selected={selected}
      className="w-[140px]"
      accentColor="#f0963a"
      isRunning={isRunning}
      headerRight={
        <button 
          onClick={handleRun} 
          disabled={isRunning} 
          className={cn("node-run-btn", isRunning && "running")}
          style={{ height: '20px', fontSize: '9px', padding: '0 8px' }}
        >
          {isRunning ? <Loader2 size={8} className="animate-spin" /> : <Play size={8} fill="currentColor" />}
          Run
        </button>
      }
    >
      <div className="flex flex-col relative">
        {/* Labels Row */}
        <div className="flex justify-between items-center px-2 py-1.5 border-b relative" style={{ borderColor: 'var(--border-subtle)' }}>
           <span className="text-[8px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>Video</span>
           <span className="text-[8px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>Out</span>
           
           <Handle type="target" position={Position.Left} id="video_url" className="handle-video !-left-[4.5px]" />
           <Handle type="source" position={Position.Right} id="image_url" className="handle-image !-right-[4.5px]" />
        </div>

        {data.outputUrl && (
          <div className="aspect-video relative m-1.5 rounded-md overflow-hidden border" style={{ background: 'var(--bg-elevated-2)', borderColor: 'var(--border-mid)' }}>
             <img src={data.outputUrl} alt="frame" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-2 flex flex-col gap-1 relative">
          <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>Time (s)</span>
          <input 
            {...timeProps}
            className={cn(
              "rounded-md px-1.5 py-1 text-[9px] outline-none nodrag transition-all",
              timeProps.className
            )}
            style={{ background: 'var(--input-bg)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
            value={timeProps.disabled ? "" : (data.timestamp || 0)} 
            placeholder={timeProps.disabled ? "Linked" : "0"}
            onChange={e => updateNode(id, { timestamp: e.target.value })} 
          />
          <Handle type="target" position={Position.Left} id="timestamp" className="handle-text !-left-[12px] !top-[6px]" />
        </div>

        {/* Error display */}
        {data.error && !isRunning && (
          <div 
            className="m-2 px-2 py-1.5 rounded-[6px] text-[8.5px] leading-relaxed overflow-hidden" 
            style={{ 
              background: 'rgba(255,80,80,0.08)', 
              border: '1px solid rgba(255,80,80,0.2)', 
              color: '#ff6060',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis'
            }}
            title={data.error}
          >
            {data.error}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
