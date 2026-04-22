import { useWorkflowStore } from '@/store/workflowStore';
import { useMemo } from 'react';

/**
 * Hook to determine if a specific handle on a specific node has an incoming connection.
 * Used to disable manual inputs when data is being piped in from an edge.
 */
export function useNodeState(nodeId: string, targetHandleId: string) {
  const { edges } = useWorkflowStore();

  const isConnected = useMemo(() => {
    return edges.some(
      (edge) => edge.target === nodeId && edge.targetHandle === targetHandleId
    );
  }, [edges, nodeId, targetHandleId]);

  return {
    isConnected,
    // Provide a standardized prop generator for inputs that should be disabled
    getDisabledProps: () => ({
      disabled: isConnected,
      className: isConnected ? "opacity-50 pointer-events-none" : "transition-opacity duration-200 ease-in-out",
    }),
  };
}
