"use client";

import React, { useCallback, useRef, useState } from 'react';
import NewWorkflowOverlay from '@/components/canvas/NewWorkflowOverlay';
import { 
  ReactFlow, 
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
import { executeParallelDAG } from '@/lib/executionEngine';
import { executeNodeAction } from '@/lib/executeNode';

/* Custom Overlay Icons */
import { 
  MousePointer2, Hand, Scissors, Grid3X3, ArrowRightLeft, Plus, 
  Undo2, Redo2, Moon, Sun, Share, Wand2, ChevronDown, X, Folder,
  Search, Image as ImageIcon, ChevronRight, Video, Type, Bot, Film, Play
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
  const { nodes, edges, onNodesChange, onEdgesChange, addEdge, addNode, loadWorkflow, saveCurrentWorkflow, renameWorkflow, getWorkflowName, setActiveWorkflowId, setNodes, setEdges } = useWorkflowStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showNodeMenu, setShowNodeMenu] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  // Hydration fix for store values
  const [mounted, setMounted] = useState(false);
  
  const generateId = useCallback((prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 11)}-${Date.now().toString(36)}`, []);

  React.useEffect(() => {
    setMounted(true);
    if (nodes.length > 0) setShowSplash(false);
  }, [nodes]);

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

  const handleRunSelected = () => {
    const nodeIds = new Set(selectedNodes.map(n => n.id));
    const edgesToRun = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    executeParallelDAG(selectedNodes, edgesToRun, (node) => executeNodeAction(node, workflowId));
  };

  const handleRunAll = () => {
    executeParallelDAG(nodes, edges, (node) => executeNodeAction(node, workflowId));
  };

  // Load workflow on mount
  React.useEffect(() => {
    if (workflowId) {
      setActiveWorkflowId(workflowId);
      loadWorkflow(workflowId).then((loaded: any) => {
        // If we loaded something with content, hide splash. Otherwise, show it.
        if (loaded && loaded.nodes && loaded.nodes.length > 0) {
          setShowSplash(false);
        } else {
          setShowSplash(true);
        }
      });
    }
  }, [workflowId, loadWorkflow, setActiveWorkflowId]);

  // Debounced auto-save when components change
  React.useEffect(() => {
    if (!workflowId || showSplash) return;
    const timeout = setTimeout(() => {
      saveCurrentWorkflow(workflowId);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [nodes, edges, workflowId, saveCurrentWorkflow, showSplash]);

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

      // Handle type matching
      const sourceHandleId = connection.sourceHandle;
      const targetHandleId = connection.targetHandle;
      if (!sourceHandleId || !targetHandleId) return false;
      
      const sourceType = (sourceHandleId.includes('image') || sourceHandleId === 'images') ? 'image' 
                       : sourceHandleId.includes('video') ? 'video' 
                       : 'text';
                       
      const targetType = (targetHandleId.includes('image') || targetHandleId === 'images') ? 'image'
                       : targetHandleId.includes('video') ? 'video'
                       : 'text';
                       
      if (sourceType !== targetType) return false;

      return true;
    },
    [nodes, edges]
  );

  const onConnect = useCallback((connection: Connection) => {
    let edgeClass = 'edge-text';
    if (connection.sourceHandle?.includes('image')) edgeClass = 'edge-image';
    else if (connection.sourceHandle?.includes('video')) edgeClass = 'edge-video';

    addEdge({ 
      ...connection, 
      id: `e-${connection.source}-${connection.target}-${Math.random().toString(36).slice(2, 7)}`, 
      animated: false, 
      className: edgeClass 
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

  const handleSelectPreset = useCallback((presetId: string) => {
    setShowSplash(false);
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    if (presetId === 'empty') {
      setNodes([]);
      setEdges([]);
      return;
    }

    if (presetId === 'image-generator') {
      const id1 = generateId('text');
      const id2 = generateId('llm');
      
      setNodes([
        { 
          id: id1, 
          type: 'textNode', 
          position: { x: centerX - 300, y: centerY - 100 }, 
          data: { label: 'PROMPT', text: 'A futuristic city at sunset, cinematic lighting, highly detailed' } 
        },
        { 
          id: id2, 
          type: 'llmNode', 
          position: { x: centerX + 50, y: centerY - 150 }, 
          data: { label: 'ENHANCER', model: 'gemini-2.0-flash-exp' } 
        }
      ]);
      setEdges([
        { id: `e-${id1}-${id2}`, source: id1, target: id2, sourceHandle: 'text', targetHandle: 'user_message', className: 'edge-text' }
      ]);
    } else if (presetId === 'video-generator') {
      const id1 = generateId('text');
      const id2 = generateId('llm');
      
      setNodes([
        { 
          id: id1, 
          type: 'textNode', 
          position: { x: centerX - 300, y: centerY - 100 }, 
          data: { label: 'SCENE DESCRIPTION', text: 'A golden retriever puppy running through a field of flowers' } 
        },
        { 
          id: id2, 
          type: 'llmNode', 
          position: { x: centerX + 50, y: centerY - 150 }, 
          data: { label: 'VIDEO PROMPT', model: 'gemini-2.0-flash-exp' } 
        }
      ]);
      setEdges([
        { id: `e-${id1}-${id2}`, source: id1, target: id2, sourceHandle: 'text', targetHandle: 'user_message', className: 'edge-text' }
      ]);
    } else if (presetId === 'upscaling-enhancer') {
      const id1 = generateId('upload');
      const id2 = generateId('crop');
      
      setNodes([
        { 
          id: id1, 
          type: 'imageUploadNode', 
          position: { x: centerX - 300, y: centerY - 100 }, 
          data: { label: 'INPUT IMAGE' } 
        },
        { 
          id: id2, 
          type: 'cropImageNode', 
          position: { x: centerX + 50, y: centerY - 150 }, 
          data: { label: 'ENHANCE & CROP' } 
        }
      ]);
      setEdges([
        { id: `e-${id1}-${id2}`, source: id1, target: id2, sourceHandle: 'image_url', targetHandle: 'image_url', className: 'edge-image' }
      ]);
    } else if (presetId === 'llm-captioning') {
      const id1 = generateId('upload');
      const id2 = generateId('llm');
      
      setNodes([
        { 
          id: id1, 
          type: 'imageUploadNode', 
          position: { x: centerX - 300, y: centerY - 100 }, 
          data: { label: 'SOURCE IMAGE' } 
        },
        { 
          id: id2, 
          type: 'llmNode', 
          position: { x: centerX + 50, y: centerY - 150 }, 
          data: { label: 'CAPTIONER', systemPrompt: 'Describe this image in detail for an accessibility caption.' } 
        }
      ]);
      setEdges([
        { id: `e-${id1}-${id2}`, source: id1, target: id2, sourceHandle: 'image_url', targetHandle: 'images', className: 'edge-image' }
      ]);
    }
  }, [setNodes, setEdges]);

  const selectedNodes = nodes.filter(n => n.selected);
  const showMultiSelectToolbar = selectedNodes.length >= 2;

  // Calculate toolbar position (average of selected nodes positions)
  let toolbarX = 0;
  let toolbarY = 0;
  if (showMultiSelectToolbar) {
    const minX = Math.min(...selectedNodes.map(n => n.position.x));
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + (n.measured?.width || 200)));
    const minY = Math.min(...selectedNodes.map(n => n.position.y));
    
    // Position slightly above the highest node
    toolbarX = (minX + maxX) / 2;
    toolbarY = minY - 60;
  }

  // Transform coordinates to screen space
  const { getViewport } = useReactFlow();
  const { x, y, zoom } = getViewport();
  const screenX = toolbarX * zoom + x;
  const screenY = toolbarY * zoom + y;

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper} style={{ backgroundColor: 'var(--canvas-bg)' }}>
      {/* Splash Experience */}
      {showSplash && mounted && (
        <NewWorkflowOverlay 
          onSelect={handleSelectPreset} 
          onDismiss={() => setShowSplash(false)} 
        />
      )}
      
      {/* Presets modal — opened via toolbar button */}
      <PresetsModal
        open={showPresetsModal}
        onClose={() => setShowPresetsModal(false)}
        onSelectPreset={(p) => handleSelectPreset(p.id)}
        onSelectEmpty={() => handleSelectPreset('empty')}
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
        style={{ background: 'var(--canvas-bg)' }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={32} 
          size={1} 
          color="var(--canvas-dot-color)" 
        />
        
        
        {/* Top Navigation Overlay */}
        <div className="absolute top-4 left-14 md:left-4 right-4 z-50 flex justify-between items-start pointer-events-none">
           {/* Left side nav */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Logo button */}
              <button
                className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors shadow-sm overflow-hidden"
                style={{ background: 'var(--bg-node)', border: '1px solid var(--border-node)' }}
              >
                <img 
                  src={theme === 'dark' ? "https://plain-apac-prod-public.komododecks.com/202604/23/KVDPGqHxpZk38VsRrw63/image.png" : "https://plain-apac-prod-public.komododecks.com/202604/23/TsmJGprgy6IEM9moJhsX/image.png"} 
                  alt="L" 
                  className="w-5 h-5 object-contain" 
                />
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
                onClick={handleRunAll}
                className="h-9 px-4 rounded-[8px] flex items-center gap-2 transition-colors shadow hover:opacity-90"
                style={{ background: '#1a73e8', color: '#ffffff' }}
              >
                <Play size={14} strokeWidth={2} fill="currentColor" />
                <span className="text-[13px] font-bold">Run All</span>
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

        {/* Multi-Select Toolbar */}
        {showMultiSelectToolbar && (
          <div 
            className="absolute z-50 flex items-center gap-2 p-1.5 rounded-[12px] shadow-2xl transition-all"
            style={{ 
              background: '#1a1a1a', 
              border: '1px solid #333',
              left: Math.max(20, Math.min(window.innerWidth - 300, screenX)),
              top: Math.max(80, screenY),
              transform: 'translate(-50%, -100%)'
            }}
          >
            <button onClick={handleRunSelected} className="flex items-center gap-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors">
              <Play size={12} fill="currentColor" />
              Run nodes
            </button>
            <div className="w-[1px] h-[16px] bg-[#333]" />
            <button className="flex items-center gap-1.5 hover:bg-[#2c2c2c] text-[#ccc] hover:text-white px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors">
              Group
            </button>
            <button className="flex items-center gap-1.5 hover:bg-[#2c2c2c] text-[#ccc] hover:text-white px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors">
              <Grid3X3 size={12} />
              Tidy Up
            </button>
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
              
              <button onClick={() => addNode({ id: generateId('text'), type: 'textNode', position: { x: window.innerWidth/2 - 100, y: window.innerHeight/2 - 100 }, data: { label: 'TEXT' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Add Text">
                <Type size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: generateId('imageUpload'), type: 'imageUploadNode', position: { x: window.innerWidth/2 - 50, y: window.innerHeight/2 - 100 }, data: { label: 'UPLOAD IMAGE' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Upload Image">
                <ImageIcon size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: generateId('videoUpload'), type: 'videoUploadNode', position: { x: window.innerWidth/2, y: window.innerHeight/2 - 100 }, data: { label: 'UPLOAD VIDEO' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Upload Video">
                <Video size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: generateId('llm'), type: 'llmNode', position: { x: window.innerWidth/2 + 50, y: window.innerHeight/2 - 100 }, data: { label: 'LLM' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Add LLM">
                <Bot size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: generateId('crop'), type: 'cropImageNode', position: { x: window.innerWidth/2 + 100, y: window.innerHeight/2 - 100 }, data: { label: 'CROP IMAGE' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Add Crop">
                <Scissors size={18} strokeWidth={2} />
              </button>
              <button onClick={() => addNode({ id: generateId('extract'), type: 'extractFrameNode', position: { x: window.innerWidth/2 + 150, y: window.innerHeight/2 - 100 }, data: { label: 'EXTRACT FRAME' } })} className="w-10 h-10 rounded-[12px] hover:bg-[var(--bg-elevated)] flex items-center justify-center transition-colors" style={{ color: 'var(--text-dim)' }} title="Add Extract Frame">
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

           {/* Right Bottom Controls - Empty space for now */}
           <div className="pointer-events-none w-12 h-12" />
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
