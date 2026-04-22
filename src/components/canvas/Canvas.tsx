"use client";

import React, { useCallback, useRef, useState } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Background, 
  Controls, 
  BackgroundVariant, 
  Connection, 
  ReactFlowProvider, 
  useReactFlow,
  getOutgoers,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '@/store/workflowStore';
import TextNode from '@/components/nodes/TextNode';
import LLMNode from '@/components/nodes/LLMNode';
import { ImageUploadNode, VideoUploadNode } from '@/components/nodes/UploadNodes';
import { CropImageNode, ExtractFrameNode } from '@/components/nodes/ProcessingNodes';
import { validateEdge } from '@/lib/validations';
import PresetsModal from '@/components/common/PresetsModal';

/* Custom Overlay Icons */
import { 
  MousePointer2, Hand, Scissors, Grid3X3, ArrowRightLeft, Plus, 
  Undo2, Redo2, Moon, Sun, Share, Wand2, ChevronDown, X, Folder,
  Search, Image as ImageIcon, ChevronRight, Video, Type, Bot, Film
} from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

const nodeTypes = {
  textNode: TextNode,
  llmNode: LLMNode,
  imageUploadNode: ImageUploadNode,
  videoUploadNode: VideoUploadNode,
  cropImageNode: CropImageNode,
  extractFrameNode: ExtractFrameNode
};

function CanvasInner({ workflowId }: { workflowId: string }) {
  const { nodes, edges, onNodesChange, onEdgesChange, addEdge, addNode, loadWorkflow, saveCurrentWorkflow, renameWorkflow, getWorkflowName } = useWorkflowStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  
  // Hydration fix for store values
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const startEditingTitle = () => {
    const current = getWorkflowName(workflowId);
    setTitleDraft(current);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 30);
  };

  const commitTitle = () => {
    if (isEditingTitle) {
      renameWorkflow(workflowId, titleDraft);
      setIsEditingTitle(false);
    }
  };

  // Load workflow on mount
  React.useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId, loadWorkflow]);

  // Debounced auto-save when components change
  React.useEffect(() => {
    if (!workflowId) return;
    const timeout = setTimeout(() => {
      saveCurrentWorkflow(workflowId);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [nodes, edges, workflowId, saveCurrentWorkflow]);

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (connection.source === connection.target) return false;

      const targetNode = nodes.find((node) => node.id === connection.target);
      if (!targetNode) return false;

      const hasCycle = (node: Node, visited = new Set<string>()): boolean => {
        if (visited.has(node.id)) return false;
        visited.add(node.id);
        
        const outgoers = getOutgoers(node, nodes, edges);
        for (const outgoer of outgoers) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
        return false;
      };

      if (hasCycle(targetNode)) return false;

      // Verify connection via Zod schema
      const sourceNode = nodes.find((node) => node.id === connection.source);
      if (!sourceNode || !connection.targetHandle) return false;
      
      const isValidType = validateEdge(sourceNode.type || '', connection.targetHandle);
      if (!isValidType) return false;

      return true;
    },
    [nodes, edges]
  );

  const onConnect = useCallback((connection: Connection) => {
    addEdge({ 
      ...connection, 
      id: `e-${connection.source}-${connection.target}`, 
      animated: true, 
      className: 'animated custom-edge' 
    } as Edge);
  }, [addEdge]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowWrapper.current) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: `${type}-${crypto.randomUUID().slice(0, 8)}`,
      type,
      position,
      data: { label: `${type.replace('Node', '')}` },
    };

    addNode(newNode);
  }, [screenToFlowPosition, addNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      {/* Presets modal — opened via toolbar button */}
      <PresetsModal
        open={showPresetsModal}
        onClose={() => setShowPresetsModal(false)}
        onSelectPreset={() => setShowPresetsModal(false)}
        onSelectEmpty={() => setShowPresetsModal(false)}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Shift']}
        selectionKeyCode={['Shift']}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={1} 
          color="var(--canvas-dot-color)" 
          style={{ backgroundColor: 'transparent' }} 
        />
        
        {/* Top Navigation Overlay */}
        <div className="absolute top-4 left-14 md:left-4 right-4 z-50 flex justify-between items-start pointer-events-none">
           {/* Left side nav */}
           <div className="flex items-center gap-2 pointer-events-auto">
             {/* Logo button */}
             <button
               className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors shadow-sm"
               style={{ background: 'var(--bg-node)', border: '1px solid var(--border-node)' }}
             >
               <span className="font-bold text-[12px] text-white">K</span>
             </button>

             <div
               className="h-7 px-2 rounded-[6px] flex items-center gap-1.5 transition-colors cursor-text group"
               style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}
               onClick={!isEditingTitle ? startEditingTitle : undefined}
             >
               <div className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
               {isEditingTitle ? (
                 <input
                   ref={titleInputRef}
                   value={titleDraft}
                   onChange={(e) => setTitleDraft(e.target.value)}
                   onBlur={commitTitle}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') commitTitle();
                     if (e.key === 'Escape') setIsEditingTitle(false);
                   }}
                   className="text-[11px] font-medium bg-transparent outline-none w-[100px]"
                   style={{ color: 'var(--text-primary)' }}
                   maxLength={64}
                   autoFocus
                 />
               ) : (
                 <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>
                   {mounted ? getWorkflowName(workflowId) : 'Untitled'}
                 </span>
               )}
               <ChevronDown size={10} className="text-[#666] group-hover:text-[#999] transition-colors" />
             </div>
           </div>
           
           {/* Right side nav */}
           <div className="flex items-center gap-2 pointer-events-auto">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-[8px] flex items-center justify-center transition-colors shadow"
                style={{ background: 'var(--btn-bg)', border: '1px solid var(--btn-border)' }}
                title="Toggle Theme"
              >
                {theme === 'dark'
                  ? <Moon size={15} style={{ color: 'var(--btn-text)' }} strokeWidth={2} />
                  : <Sun size={15} style={{ color: 'var(--btn-text)' }} strokeWidth={2} />}
              </button>
              <button
                className="h-9 px-3 rounded-[8px] flex items-center gap-2 transition-colors shadow"
                style={{ background: 'var(--btn-bg)', border: '1px solid var(--btn-border)' }}
              >
                <Share size={14} style={{ color: 'var(--btn-text)' }} strokeWidth={2} />
                <span className="text-[13px] font-semibold hidden md:block" style={{ color: 'var(--btn-text)' }}>Share</span>
              </button>
              <button
                className="hidden md:flex h-9 px-3 rounded-[8px] items-center gap-2 transition-colors shadow"
                style={{ background: 'var(--btn-bg)', border: '1px solid var(--btn-border)' }}
              >
                <Wand2 size={14} style={{ color: 'var(--btn-text)' }} strokeWidth={2} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--btn-text)' }}>Turn workflow into app</span>
              </button>
              <button
                className="w-9 h-9 rounded-[8px] flex items-center justify-center shadow overflow-hidden"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--btn-border)' }}
              >
                <ImageIcon size={14} style={{ color: 'var(--btn-text)' }} />
              </button>
           </div>
        </div>

        {/* Empty State Hint */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 select-none">
            <span className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Add a node</span>
            <span className="text-[13px] mt-2 flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
              Double click, right click, or press
              <kbd className="text-[11px] font-mono rounded-[4px] px-1.5 py-0.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}>N</kbd>
            </span>
          </div>
        )}

         {/* Bottom Toolbar & Controls Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-50 flex justify-between items-end pointer-events-none">
           {/* Left Bottom Controls */}
           <div className="flex items-center gap-2 pointer-events-auto relative">
             <button
               className="w-9 h-9 rounded-md flex items-center justify-center transition-colors shadow"
               style={{ background: 'var(--btn-bg)', border: '1px solid var(--btn-border)' }}
             >
               <span className="font-bold text-[15px]" style={{ color: 'var(--text-muted)' }}>G</span>
             </button>
             <button
               className="w-9 h-9 rounded-md flex items-center justify-center transition-colors shadow opacity-50 cursor-not-allowed"
               style={{ background: 'var(--btn-bg)', border: '1px solid var(--btn-border)' }}
             >
               <Undo2 size={16} style={{ color: 'var(--text-secondary)' }} />
             </button>
             <button
               className="w-9 h-9 rounded-md flex items-center justify-center transition-colors shadow opacity-50 cursor-not-allowed"
               style={{ background: 'var(--btn-bg)', border: '1px solid var(--btn-border)' }}
             >
               <Redo2 size={16} style={{ color: 'var(--text-secondary)' }} />
             </button>
             <button
               onClick={() => setShowShortcuts(!showShortcuts)}
               className="h-9 px-3 rounded-md flex items-center gap-2 transition-colors shadow"
               style={{ background: 'var(--btn-bg)', border: '1px solid var(--btn-border)' }}
             >
               <span className="text-[11px] font-[600] uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Keyboard shortcuts</span>
             </button>
             
             {/* Keyboard Shortcuts Modal */}
             {showShortcuts && (
               <div 
                 className="absolute bottom-12 left-0 w-[420px] rounded-[24px] shadow-2xl p-6 flex flex-col font-sans mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                 style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border-subtle)' }}
               >
                 <div className="flex items-start justify-between mb-2">
                   <div>
                     <h3 className="text-[17px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</h3>
                     <p className="text-[13px] mt-1" style={{ color: 'var(--text-dim)' }}>Quickly navigate and create with these shortcuts.</p>
                   </div>
                   <button 
                     onClick={() => setShowShortcuts(false)} 
                     className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors"
                     style={{ border: '1px solid var(--border-mid)', background: 'var(--bg-elevated)', color: 'var(--text-dim)' }}
                   >
                     <X size={16} strokeWidth={1.5} />
                   </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
                   <div className="mb-6">
                     <h4 className="text-[14px] font-bold mb-3" style={{ color: 'var(--text-primary)' }}>General</h4>
                     <div className="space-y-3">
                       {[
                         { label: 'Undo', keys: ['Ctrl', 'Z'] },
                         { label: 'Redo', keys: ['Ctrl', 'Shift', 'Z'] },
                         { label: 'Save', keys: ['Ctrl', 'S'] },
                         { label: 'Select all', keys: ['Ctrl', 'A'] },
                         { label: 'Deselect all', keys: ['Esc'] },
                       ].map(s => (
                         <div key={s.label} className="flex justify-between items-center text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                           <span>{s.label}</span>
                           <div className="flex gap-1">
                             {s.keys.map(k => (
                               <kbd key={k} className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-focus)', color: 'var(--text-primary)' }}>{k}</kbd>
                             ))}
                           </div>
                         </div>
                       ))}
                       <div className="flex justify-between items-center text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                         <span>Multi select</span>
                         <div className="flex gap-1 items-center text-[11px]" style={{ color: 'var(--text-dim)' }}>
                            <kbd className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-focus)', color: 'var(--text-primary)' }}>Drag</kbd> or <kbd className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-focus)', color: 'var(--text-primary)' }}>Shift</kbd> <span>+</span> <kbd className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-focus)', color: 'var(--text-primary)' }}>Click</kbd>
                         </div>
                       </div>
                       <div className="flex justify-between items-center text-[12.5px] text-[#ebebeb]">
                         <span>Pan canvas</span><div className="flex gap-1 items-center text-[11px] text-[#666]"><kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">Space</kbd> <kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">Drag</kbd></div>
                       </div>
                       <div className="flex justify-between items-center text-[12.5px] text-[#ebebeb]">
                         <span>Cut edges (Scissor)</span><div className="flex gap-1 items-center text-[11px] text-[#666]"><kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">X</kbd> <kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">Drag</kbd></div>
                       </div>
                       <div className="flex justify-between items-center text-[12.5px] text-[#ebebeb]">
                         <span>Canvas Agent</span><div className="flex gap-1"><kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">Ctrl</kbd><kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">C</kbd></div>
                       </div>
                     </div>
                   </div>

                   <div className="mb-6">
                     <h4 className="text-white text-[14px] font-bold mb-3">Node Creation</h4>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-[12.5px] text-[#ebebeb]">
                         <span>New node</span><div className="flex gap-1"><kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">N</kbd></div>
                       </div>
                       <div className="flex justify-between items-center text-[12.5px] text-[#ebebeb]">
                         <span>Image node</span><div className="flex gap-1"><kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">I</kbd></div>
                       </div>
                       <div className="flex justify-between items-center text-[12.5px] text-[#ebebeb]">
                         <span>Video node</span><div className="flex gap-1"><kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">V</kbd></div>
                       </div>
                       <div className="flex justify-between items-center text-[12.5px] text-[#ebebeb]">
                         <span>LLM node</span><div className="flex gap-1"><kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">L</kbd></div>
                       </div>
                       <div className="flex justify-between items-center text-[12.5px] text-[#ebebeb]">
                         <span>Enhance node</span><div className="flex gap-1"><kbd className="bg-[#222] border border-[#333] rounded px-1.5 py-0.5 text-[#fff] text-[10px] font-semibold tracking-wide">E</kbd></div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
           </div>

           {/* Center Floating Toolbar */}
           <div
             className="absolute left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-0.5 p-[5px] rounded-[16px] shadow-2xl"
             style={{ background: 'var(--toolbar-bg)', border: '1px solid var(--toolbar-border)' }}
           >
              <div className="relative">
                <button onClick={() => setShowNodeMenu(!showNodeMenu)} className="w-10 h-10 rounded-[12px] hover:bg-[#2c2c2c] flex items-center justify-center transition-colors text-[#999] hover:text-white group">
                  <Plus size={18} strokeWidth={2} />
                </button>
                {/* Add Node Context Menu */}
                {showNodeMenu && (
                  <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[240px] bg-[#111] border border-[#222] rounded-[16px] shadow-2xl flex flex-col py-2 z-50">
                     <div className="px-3 pb-2 border-b border-[#222]">
                        <div className="relative">
                          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666]" />
                          <input type="text" placeholder="Search nodes or models..." className="w-full bg-transparent text-[13px] text-white placeholder:text-[#666] bg-[#1a1a1a] rounded border border-[#222] pl-8 pr-2 py-1.5 outline-none focus:border-[#444]" />
                        </div>
                     </div>
                     <div className="flex-1 max-h-[300px] overflow-y-auto px-2 pt-2 custom-scrollbar">
                        <div className="mb-1 px-2 text-[10px] font-semibold text-[#666] uppercase tracking-wider flex items-center gap-1"><ImageIcon size={10} /> Image</div>
                        <div className="hover:bg-[#1a1a1a] rounded px-2 py-1.5 text-[13px] text-[#ebebeb] flex justify-between items-center cursor-pointer mb-0.5">Generate Image <ChevronRight size={14} className="text-[#666]" /></div>
                        <div className="hover:bg-[#1a1a1a] rounded px-2 py-1.5 text-[13px] text-[#ebebeb] flex justify-between items-center cursor-pointer mb-0.5">Enhance Image <ChevronRight size={14} className="text-[#666]" /></div>
                        <div className="hover:bg-[#1a1a1a] rounded px-2 py-1.5 text-[13px] text-[#ebebeb] flex justify-between items-center cursor-pointer mb-0.5">Edit Image <ChevronRight size={14} className="text-[#666]" /></div>
                        <div className="hover:bg-[#1a1a1a] rounded px-2 py-1.5 text-[13px] text-[#ebebeb] flex justify-between items-center cursor-pointer mb-3">Image Utility <ChevronRight size={14} className="text-[#666]" /></div>

                        <div className="mb-1 px-2 text-[10px] font-semibold text-[#666] uppercase tracking-wider flex items-center gap-1"><Video size={10} /> Video</div>
                        <div className="hover:bg-[#1a1a1a] rounded px-2 py-1.5 text-[13px] text-[#ebebeb] flex justify-between items-center cursor-pointer mb-0.5">Generate Video <ChevronRight size={14} className="text-[#666]" /></div>
                        <div className="hover:bg-[#1a1a1a] rounded px-2 py-1.5 text-[13px] text-[#ebebeb] flex justify-between items-center cursor-pointer mb-0.5">Enhance Video <ChevronRight size={14} className="text-[#666]" /></div>
                        <div className="hover:bg-[#1a1a1a] rounded px-2 py-1.5 text-[13px] text-[#ebebeb] flex justify-between items-center cursor-pointer mb-0.5">Motion Transfer <ChevronRight size={14} className="text-[#666]" /></div>
                     </div>
                  </div>
                )}
              </div>
              
              <div className="w-[1px] h-[24px] bg-[#333] mx-1"></div>
              
              <button onClick={() => addNode({ id: `textNode-${crypto.randomUUID().slice(0, 8)}`, type: 'textNode', position: { x: window.innerWidth/2 - 100, y: window.innerHeight/2 - 100 }, data: { label: 'TEXT' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Add Text">
                <Type size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: `imageUploadNode-${crypto.randomUUID().slice(0, 8)}`, type: 'imageUploadNode', position: { x: window.innerWidth/2 - 50, y: window.innerHeight/2 - 100 }, data: { label: 'UPLOAD IMAGE' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Upload Image">
                <ImageIcon size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: `videoUploadNode-${crypto.randomUUID().slice(0, 8)}`, type: 'videoUploadNode', position: { x: window.innerWidth/2, y: window.innerHeight/2 - 100 }, data: { label: 'UPLOAD VIDEO' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Upload Video">
                <Video size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: `llmNode-${crypto.randomUUID().slice(0, 8)}`, type: 'llmNode', position: { x: window.innerWidth/2 + 50, y: window.innerHeight/2 - 100 }, data: { label: 'LLM' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Add LLM">
                <Bot size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: `cropImageNode-${crypto.randomUUID().slice(0, 8)}`, type: 'cropImageNode', position: { x: window.innerWidth/2 + 100, y: window.innerHeight/2 - 100 }, data: { label: 'CROP IMAGE' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Add Crop">
                <Scissors size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: `extractFrameNode-${crypto.randomUUID().slice(0, 8)}`, type: 'extractFrameNode', position: { x: window.innerWidth/2 + 150, y: window.innerHeight/2 - 100 }, data: { label: 'EXTRACT FRAME' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Add Extract Frame">
                <Film size={18} strokeWidth={2} />
              </button>

              <div className="w-[1px] h-[24px] mx-1" style={{ background: 'var(--border-subtle)' }} />

              {/* Presets — last button in toolbar */}
              <div className="relative group/presets">
                <button
                  onClick={() => setShowPresetsModal(true)}
                  className="w-10 h-10 rounded-[12px] hover:bg-[#2c2c2c] flex items-center justify-center transition-colors text-[#999] hover:text-white"
                  aria-label="Presets"
                >
                  {/* Overlapping nodes icon — matches Krea */}
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="5" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <rect x="11" y="9" width="8" height="6" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M9 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-[7px] text-[12px] text-white font-medium whitespace-nowrap opacity-0 group-hover/presets:opacity-100 transition-opacity pointer-events-none shadow-xl">
                  Presets
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2a2a2a]" style={{marginTop: '-1px'}} />
                </div>
              </div>
           </div>

           {/* Right Bottom Logo */}
           <div className="pointer-events-auto">
             <button
               className="w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-xl"
               style={{ background: 'var(--btn-bg)', border: '1px solid var(--btn-border)' }}
             >
               <img src="https://s.krea.ai/browser-logo.png" alt="k" className="w-[22px] h-[22px] opacity-70 filter brightness-200" onError={(e) => { e.currentTarget.style.display='none'; (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden') }} />
               <span className="hidden font-bold text-[18px]" style={{ color: 'var(--text-primary)' }}>K</span>
             </button>
           </div>
        </div>

      </ReactFlow>
    </div>
  );
}

export default function Canvas({ workflowId }: { workflowId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasInner workflowId={workflowId} />
    </ReactFlowProvider>
  );
}
