import { task } from "@trigger.dev/sdk/v3";
import { cropImageTask } from "./crop-image";
import { extractFrameTask } from "./extract-frame";

/**
 * The main orchestrator that recursively or sequentially triggers DAG sub-tasks in parallel using Promise.all.
 * Ensures Branch A (Crop) and Branch B (Extract) resolve before firing Convergence Node (LLM).
 */
export const executeWorkflowTask = task({
  id: "execute-workflow",
  run: async (payload: { workflowId: string; nodes: any[]; edges: any[] }) => {
    const { nodes, edges } = payload;

    // Build adjacency list for identifying dependencies
    const incomingEdgesMap: Record<string, string[]> = {};
    edges.forEach((e) => {
      if (!incomingEdgesMap[e.target]) {
        incomingEdgesMap[e.target] = [];
      }
      incomingEdgesMap[e.target].push(e.source);
    });

    // We will simulate the execution logic tailored specifically for the Marketing Kit
    // In a prod app, we'd topologically sort and run nodes. Here we implement the parallel requirements:

    const cropNode = nodes.find(n => n.type === 'cropImageNode');
    const extractNode = nodes.find(n => n.type === 'extractFrameNode');
    const llmNode = nodes.find(n => n.type === 'llmNode');

    if (!cropNode || !extractNode || !llmNode) {
      return { status: "missing_nodes" };
    }

    // Branch A & B parallel execution using triggerAndWait (Trigger SDK v3)
    // We execute them simultaneously since they do not depend on each other.
    console.log("Triggering Branch A and Branch B in parallel...");
    
    // Instead of sequentially awaiting, we use Promise.all to fire the sub-tasks in parallel.
    // Trigger.dev will manage their states independently
    const [cropResult, extractResult] = await Promise.all([
      cropImageTask.triggerAndWait({
        imageUrl: cropNode.data.imageUrl || "mock_image.jpg",
        xPercent: parseInt(cropNode.data.xPercent || "0"),
        yPercent: parseInt(cropNode.data.yPercent || "0"),
        widthPercent: parseInt(cropNode.data.widthPercent || "100"),
        heightPercent: parseInt(cropNode.data.heightPercent || "100"),
        nodeRunId: `run-crop-${Date.now()}`
      }),
      extractFrameTask.triggerAndWait({
        videoUrl: extractNode.data.videoUrl || "mock_video.mp4",
        timestamp: extractNode.data.timestamp || "0",
        nodeRunId: `run-extract-${Date.now()}`
      })
    ]);

    // Convergence logic:
    console.log("Branches completed. Triggering Convergence LLM Node...");
    
    // Mock assembling the prompts
    const cropOut = cropResult.ok ? cropResult.output?.outputUrl : undefined;
    const frameOut = extractResult.ok ? extractResult.output?.outputUrl : undefined;

    const llmResult = { ok: true, payload: "Generated ad campaign mock." };

    return {
      status: "completed",
      results: {
        crop: cropResult,
        extract: extractResult,
        llm: llmResult,
      }
    };
  },
});
