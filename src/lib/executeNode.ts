import { Node } from '@xyflow/react';
import { useWorkflowStore } from '@/store/workflowStore';

export const executeNodeAction = async (node: Node, workflowId: string) => {
  if (!['llmNode', 'cropImageNode', 'extractFrameNode'].includes(node.type!)) return;

  const store = useWorkflowStore.getState();
  store.updateNode(node.id, { error: null, output: null });
  store.setRunning(node.id, true);

  try {
    const connectedInputs = store.getNodeInputs(node.id);

    // --- LLM Node: call Gemini directly, no Trigger.dev queue ---
    if (node.type === 'llmNode') {
      const systemPrompt = connectedInputs['system_prompt'] ?? (node.data.system_prompt as string) ?? '';
      const userMessage  = connectedInputs['user_message']  ?? (node.data.user_message  as string) ?? '';
      const imageUrls    = (connectedInputs['images'] as string[]) ?? [];

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: (node.data.model as string) ?? 'gemini-2.0-flash',
          systemPrompt,
          userMessage: userMessage || systemPrompt,
          imageUrls,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error ?? `HTTP ${response.status}`);

      store.updateNode(node.id, { output: result.output });
      store.setOutput(node.id, result.output);
      store.setRunning(node.id, false);
      return;
    }

    // --- Processing nodes: go through Trigger.dev ---
    let inputs: Record<string, any> = {};
    if (node.type === 'cropImageNode') {
      inputs = {
        imageUrl: connectedInputs['image_url'] || node.data.image_url,
        xPercent: Number(connectedInputs['x_percent'] !== undefined ? connectedInputs['x_percent'] : (node.data.xPercent || 0)),
        yPercent: Number(connectedInputs['y_percent'] !== undefined ? connectedInputs['y_percent'] : (node.data.yPercent || 0)),
        widthPercent: Number(connectedInputs['width_percent'] !== undefined ? connectedInputs['width_percent'] : (node.data.widthPercent !== undefined ? node.data.widthPercent : 100)),
        heightPercent: Number(connectedInputs['height_percent'] !== undefined ? connectedInputs['height_percent'] : (node.data.heightPercent !== undefined ? node.data.heightPercent : 100)),
      };
    } else if (node.type === 'extractFrameNode') {
      inputs = {
        videoUrl: connectedInputs['video_url'] || node.data.video_url,
        timestamp: connectedInputs['timestamp'] !== undefined ? connectedInputs['timestamp'] : (node.data.timestamp || 0),
      };
    }

    const startRes = await fetch('/api/execute/node', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, nodeId: node.id, nodeType: node.type, inputs }),
    });
    const { runId, error: startError } = await startRes.json();
    if (!runId) throw new Error(startError || 'Failed to start execution');

    return new Promise<void>((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        const r = await fetch(`/api/execute/status/${runId}`);
        const { status, output, error } = await r.json();
        if (status === 'COMPLETED') {
          clearInterval(pollInterval);
          store.updateNode(node.id, { outputUrl: output, output });
          store.setOutput(node.id, output);
          store.setRunning(node.id, false);
          resolve();
        } else if (status === 'FAILED') {
          clearInterval(pollInterval);
          store.updateNode(node.id, { error: error ?? 'Failed' });
          store.setRunning(node.id, false);
          reject(new Error(error));
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (store.runningNodes.has(node.id)) {
          store.updateNode(node.id, { error: 'Timeout: Trigger.dev worker not running' });
          store.setRunning(node.id, false);
          reject(new Error('Execution timed out'));
        }
      }, 60000);
    });
  } catch (err: any) {
    store.setRunning(node.id, false);
    store.updateNode(node.id, { error: err.message ?? 'Execution failed' });
  }
};
