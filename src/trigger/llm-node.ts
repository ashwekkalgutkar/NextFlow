import { task } from "@trigger.dev/sdk/v3";
// Assume global Prisma client in a real app, importing dummy here for typing context
// import prisma from "@/lib/prisma";

export const llmNodeTask = task({
  id: "llm-node",
  run: async (payload: {
    model: string;
    systemPrompt?: string;
    userMessage: string;
    imageUrls?: string[];
    nodeRunId: string;
  }) => {
    // 1. Init Google Generative AI
    // 2. Build parts: text + optional image parts
    // 3. Call generateContent()
    // 4. Update NodeRun in DB with result
    
    // Simulating delay
    await new Promise(res => setTimeout(res, 2000));
    
    // Simulate generation output
    const output = `Simulated response from ${payload.model} for message: "${payload.userMessage}"`;
    return { output };
  },
});
