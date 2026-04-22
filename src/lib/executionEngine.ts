import { Node, Edge, getIncomers, getOutgoers } from "@xyflow/react";

export type HandleDataType = 'text' | 'image_url' | 'video_url' | 'number';

export const ALLOWED_CONNECTIONS: Record<string, HandleDataType[]> = {
  system_prompt:   ['text'],
  user_message:    ['text'],
  images:          ['image_url'],

  image_url:       ['image_url'],
  x_percent:       ['text', 'number'],
  y_percent:       ['text', 'number'],
  width_percent:   ['text', 'number'],
  height_percent:  ['text', 'number'],

  video_url:       ['video_url'],
  timestamp:       ['text', 'number'],
};

/**
 * Topologically sorts nodes
 */
export function buildDAGLevels(nodes: Node[], edges: Edge[]): Node[][] {
  const levels: Node[][] = [];
  const inDegree = new Map<string, number>();
  const adj = new Map<string, Node[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  });

  edges.forEach(e => {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    const targetNode = nodes.find(n => n.id === e.target);
    if (targetNode) adj.get(e.source)?.push(targetNode);
  });

  let queue = nodes.filter(n => inDegree.get(n.id) === 0);

  while(queue.length > 0) {
    levels.push([...queue]);
    const nextQueue: Node[] = [];
    
    queue.forEach(node => {
      const neighbors = adj.get(node.id) || [];
      neighbors.forEach(neighbor => {
        const deg = (inDegree.get(neighbor.id) || 0) - 1;
        inDegree.set(neighbor.id, deg);
        if (deg === 0) {
          nextQueue.push(neighbor);
        }
      });
    });

    queue = nextQueue;
  }

  return levels;
}

/**
 * Execute DAG. Uses Promise.all() for independent nodes (same breadth).
 */
export async function executeParallelDAG(
  nodes: Node[], 
  edges: Edge[], 
  executeNode: (node: Node) => Promise<any>
) {
  const levels = buildDAGLevels(nodes, edges);
  
  for (const level of levels) {
    // Fire ALL independent nodes in this depth level simultaneously
    await Promise.all(level.map(node => executeNode(node)));
  }
}
