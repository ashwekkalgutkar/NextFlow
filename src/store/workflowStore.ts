import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Node, 
  Edge, 
  Connection, 
  addEdge as rfAddEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange
} from '@xyflow/react';

// For brevity, we type WorkflowRun as any here, will be defined with Prisma
type WorkflowRun = any;

export interface SavedWorkflow {
  id: string;
  name: string;
  updatedAt: number;
  nodes: Node[];
  edges: Edge[];
}

interface WorkflowState {
  // Canvas state
  nodes: Node[];
  edges: Edge[];
  selectedNodes: string[];

  // Execution state
  runningNodes: Set<string>;
  nodeOutputs: Record<string, any>;
  nodeErrors: Record<string, string>;

  // History & Storage
  workflowRuns: WorkflowRun[];
  savedWorkflows: SavedWorkflow[];

  // Undo/redo
  history: { nodes: Node[]; edges: Edge[] }[];
  historyIndex: number;

  // Actions
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, data: Partial<any>) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addEdge: (connection: Connection | Edge) => void;
  removeEdge: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodes: (nodes: string[]) => void;

  setRunning: (nodeId: string, running: boolean) => void;
  setOutput: (nodeId: string, output: any) => void;
  setError: (nodeId: string, error: string) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Multi-workflow management
  saveCurrentWorkflow: (id: string) => void;
  loadWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  renameWorkflow: (id: string, name: string) => void;
  getWorkflowName: (id: string) => string;
}

const defaultNodes = [
  { id: 'img-1', type: 'imageUploadNode', position: { x: 50, y: 100 }, data: { label: 'PRODUCT IMAGE' } },
  { id: 'crop-1', type: 'cropImageNode', position: { x: 350, y: 100 }, data: { label: 'CROP SUBJECT' } },
  { id: 'vid-1', type: 'videoUploadNode', position: { x: 50, y: 350 }, data: { label: 'B-ROLL VIDEO' } },
  { id: 'frame-1', type: 'extractFrameNode', position: { x: 350, y: 350 }, data: { label: 'EXTRACT KEYFRAME' } },
  { id: 'llm-1', type: 'llmNode', position: { x: 750, y: 225 }, data: { label: 'MARKETING KIT GEN', model: 'gemini-2.0-flash-exp', system_prompt: 'You are an expert marketing copywriter. Use the provided product image and b-roll keyframe to generate an ad campaign.', user_message: 'Generate 3 twitter captions and 1 instagram post description for this product.' } }
];

const defaultEdges = [
  { id: 'e-img1-crop1', source: 'img-1', sourceHandle: 'image_url', target: 'crop-1', targetHandle: 'image_url', animated: true, className: 'animated custom-edge' },
  { id: 'e-crop1-llm1', source: 'crop-1', sourceHandle: 'image_url', target: 'llm-1', targetHandle: 'images', animated: true, className: 'animated custom-edge' },
  { id: 'e-vid1-frame1', source: 'vid-1', sourceHandle: 'video_url', target: 'frame-1', targetHandle: 'video_url', animated: true, className: 'animated custom-edge' },
  { id: 'e-frame1-llm1', source: 'frame-1', sourceHandle: 'image_url', target: 'llm-1', targetHandle: 'images', animated: true, className: 'animated custom-edge' }
];

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      nodes: defaultNodes,
      edges: defaultEdges,
      selectedNodes: [],

      runningNodes: new Set(),
      nodeOutputs: {},
      nodeErrors: {},
      workflowRuns: [],
      savedWorkflows: [],

      history: [{ nodes: defaultNodes, edges: defaultEdges }],
      historyIndex: 0,

      pushHistory: () => {
        const { nodes, edges, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: [...nodes], edges: [...edges] });
        set({ history: newHistory, historyIndex: newHistory.length - 1 });
      },

      addNode: (node) => {
        get().pushHistory();
        set({ nodes: [...get().nodes, node] });
      },
      
      removeNode: (id) => {
        get().pushHistory();
        set({ nodes: get().nodes.filter(n => n.id !== id) });
      },
      
      updateNode: (id, data) => {
        set({
          nodes: get().nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
        });
      },

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes) as Node[],
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges) as Edge[],
        });
      },

      addEdge: (connection) => {
        get().pushHistory();
        set({ edges: rfAddEdge(connection, get().edges) });
      },

      removeEdge: (id) => {
        get().pushHistory();
        set({ edges: get().edges.filter(e => e.id !== id) });
      },

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setSelectedNodes: (selectedNodes) => set({ selectedNodes }),

      setRunning: (nodeId, running) => {
        const newSet = new Set(get().runningNodes);
        if (running) newSet.add(nodeId);
        else newSet.delete(nodeId);
        set({ runningNodes: newSet });
      },

      setOutput: (nodeId, output) => {
        set({ nodeOutputs: { ...get().nodeOutputs, [nodeId]: output } });
      },

      setError: (nodeId, error) => {
        set({ nodeErrors: { ...get().nodeErrors, [nodeId]: error } });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({
            nodes: [...history[newIndex].nodes],
            edges: [...history[newIndex].edges],
            historyIndex: newIndex
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({
            nodes: [...history[newIndex].nodes],
            edges: [...history[newIndex].edges],
            historyIndex: newIndex
          });
        }
      },

      // Multi-workflow management implementations
      saveCurrentWorkflow: (id: string) => {
        const { nodes, edges, savedWorkflows } = get();
        
        const existingIndex = savedWorkflows.findIndex(w => w.id === id);
        if (existingIndex !== -1) {
          const updated = [...savedWorkflows];
          updated[existingIndex] = { ...updated[existingIndex], updatedAt: Date.now(), nodes, edges };
          set({ savedWorkflows: updated });
        } else {
          const newWorkflow: SavedWorkflow = {
            id,
            name: "Untitled",
            updatedAt: Date.now(),
            nodes,
            edges
          };
          set({ savedWorkflows: [newWorkflow, ...savedWorkflows] });
        }
      },

      loadWorkflow: (id: string) => {
        const { savedWorkflows } = get();
        const found = savedWorkflows.find(w => w.id === id);
        if (found) {
          set({ 
            nodes: found.nodes || [], 
            edges: found.edges || [],
            history: [{ nodes: found.nodes || [], edges: found.edges || [] }],
            historyIndex: 0
          });
        } else {
          // Reset to default blank state for new workflows
          set({ nodes: [], edges: [], history: [{ nodes: [], edges: [] }], historyIndex: 0 });
        }
      },

      deleteWorkflow: (id: string) => {
        const { savedWorkflows } = get();
        set({ savedWorkflows: savedWorkflows.filter(w => w.id !== id) });
      },

      renameWorkflow: (id: string, name: string) => {
        const { savedWorkflows } = get();
        const idx = savedWorkflows.findIndex(w => w.id === id);
        if (idx !== -1) {
          const updated = [...savedWorkflows];
          updated[idx] = { ...updated[idx], name: name.trim() || 'Untitled', updatedAt: Date.now() };
          set({ savedWorkflows: updated });
        }
      },

      getWorkflowName: (id: string) => {
        const { savedWorkflows } = get();
        return savedWorkflows.find(w => w.id === id)?.name ?? 'Untitled';
      },

    }),
    {
      name: 'krea-workflow-storage',
      partialize: (state) => ({ 
        savedWorkflows: state.savedWorkflows 
      })
    }
  )
);
