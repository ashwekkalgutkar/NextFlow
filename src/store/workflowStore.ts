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
import { saveWorkflow, loadWorkflow as dbLoadWorkflow, deleteWorkflow as dbDeleteWorkflow, fetchHistory } from '@/app/actions/workflowActions';

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
  workflowRuns: any[];
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
  saveCurrentWorkflow: (id: string) => Promise<void>;
  loadWorkflow: (id: string) => Promise<any>;
  deleteWorkflow: (id: string) => Promise<void>;
  renameWorkflow: (id: string, name: string) => void;
  getWorkflowName: (id: string) => string;
  getNodeInputs: (nodeId: string) => Record<string, any>;
  refreshHistory: (workflowId: string) => Promise<void>;
  
  activeWorkflowId: string | null;
  setActiveWorkflowId: (id: string | null) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodes: [],

      runningNodes: new Set(),
      nodeOutputs: {},
      nodeErrors: {},
      workflowRuns: [],
      savedWorkflows: [],

      history: [{ nodes: [], edges: [] }],
      historyIndex: 0,
      
      activeWorkflowId: null,
      setActiveWorkflowId: (id) => set({ 
        activeWorkflowId: id, 
        nodes: [], 
        edges: [], 
        nodeOutputs: {}, 
        nodeErrors: {},
        history: [{ nodes: [], edges: [] }],
        historyIndex: 0
      }),

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

      setNodes: (nodes) => {
        const uniqueNodes = Array.from(new Map(nodes.map(n => [n.id, n])).values());
        set({ nodes: uniqueNodes });
      },
      
      setEdges: (edges) => {
        const uniqueEdges = Array.from(new Map(edges.map(e => [e.id, e])).values());
        set({ edges: uniqueEdges });
      },
      
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

      saveCurrentWorkflow: async (id: string) => {
        const { nodes, edges, savedWorkflows } = get();
        const name = get().getWorkflowName(id);
        
        try {
          await saveWorkflow(id, nodes, edges, name);
          
          const existingIndex = savedWorkflows.findIndex(w => w.id === id);
          if (existingIndex !== -1) {
            const updated = [...savedWorkflows];
            updated[existingIndex] = { ...updated[existingIndex], updatedAt: Date.now(), nodes, edges };
            set({ savedWorkflows: updated });
          } else {
            const newWorkflow: SavedWorkflow = {
              id,
              name: name || "Untitled",
              updatedAt: Date.now(),
              nodes,
              edges
            };
            set({ savedWorkflows: [newWorkflow, ...savedWorkflows] });
          }
        } catch (error) {
          console.error('Failed to save workflow:', error);
        }
      },

      loadWorkflow: async (id: string) => {
        try {
          const workflow = await dbLoadWorkflow(id);
          if (workflow) {
            const uniqueNodes = Array.from(new Map((workflow.nodes || []).map((n: any) => [n.id, n])).values()) as Node[];
            const uniqueEdges = Array.from(new Map((workflow.edges || []).map((e: any) => [e.id, e])).values()) as Edge[];

            set({ 
              nodes: uniqueNodes, 
              edges: uniqueEdges,
              history: [{ nodes: uniqueNodes, edges: uniqueEdges }],
              historyIndex: 0,
              nodeOutputs: {},
              nodeErrors: {}
            });
            
            const { savedWorkflows } = get();
            if (!savedWorkflows.find(w => w.id === id)) {
               set({ savedWorkflows: [{ id, name: workflow.name || "Untitled", updatedAt: Date.now(), nodes: workflow.nodes || [], edges: workflow.edges || [] }, ...savedWorkflows] });
            }
            return workflow;
          }
          
          // CRITICAL: Reset state for new workflow ID
          set({ 
            nodes: [], 
            edges: [], 
            history: [{ nodes: [], edges: [] }], 
            historyIndex: 0,
            nodeOutputs: {},
            nodeErrors: {}
          });
          return null;
        } catch (error) {
          console.error('Failed to load workflow:', error);
          set({ nodes: [], edges: [], history: [{ nodes: [], edges: [] }], historyIndex: 0, nodeOutputs: {}, nodeErrors: {} });
          return null;
        }
      },

      deleteWorkflow: async (id: string) => {
        try {
          await dbDeleteWorkflow(id);
          const { savedWorkflows } = get();
          set({ savedWorkflows: savedWorkflows.filter(w => w.id !== id) });
        } catch (error) {
          console.error('Failed to delete workflow:', error);
        }
      },

      renameWorkflow: (id: string, name: string) => {
        const { savedWorkflows } = get();
        const idx = savedWorkflows.findIndex(w => w.id === id);
        if (idx !== -1) {
          const updated = [...savedWorkflows];
          updated[idx] = { ...updated[idx], name: name.trim() || 'Untitled', updatedAt: Date.now() };
          set({ savedWorkflows: updated });
          get().saveCurrentWorkflow(id);
        }
      },

      getWorkflowName: (id: string) => {
        const { savedWorkflows } = get();
        return savedWorkflows.find(w => w.id === id)?.name ?? 'Untitled';
      },

      getNodeInputs: (nodeId: string) => {
        const { nodes, edges, nodeOutputs } = get();
        const incomingEdges = edges.filter(e => e.target === nodeId);
        
        const connectedInputs: Record<string, any> = {};
        for (const edge of incomingEdges) {
          const sourceOutput = nodeOutputs[edge.source];
          if (sourceOutput !== undefined) {
            if (edge.targetHandle === 'images') {
              connectedInputs['images'] = connectedInputs['images'] || [];
              if (Array.isArray(sourceOutput)) {
                connectedInputs['images'].push(...sourceOutput);
              } else if (sourceOutput.url) {
                connectedInputs['images'].push(sourceOutput.url);
              } else if (typeof sourceOutput === 'string') {
                connectedInputs['images'].push(sourceOutput);
              }
            } else {
              connectedInputs[edge.targetHandle!] = sourceOutput.url || sourceOutput;
            }
          }
        }
        return connectedInputs;
      },

      refreshHistory: async (workflowId: string) => {
        try {
          const runs = await fetchHistory(workflowId);
          set({ workflowRuns: runs });
        } catch (error) {
          console.error('Failed to load history:', error);
        }
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
