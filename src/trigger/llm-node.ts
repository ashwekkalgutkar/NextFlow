import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const llmNodeTask = task({
  id: "llm-node",
  run: async (payload: {
    model: string;
    systemPrompt?: string;
    userMessage: string;
    imageUrls?: string[];
    nodeRunId: string;
    workflowRunId: string;
  }) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: payload.model });
      
      const parts: any[] = [];
      if (payload.systemPrompt) {
        parts.push({ text: `System: ${payload.systemPrompt}\n\n` });
      }
      parts.push({ text: payload.userMessage });
      
      if (payload.imageUrls && payload.imageUrls.length > 0) {
        for (const url of payload.imageUrls) {
          const imageResponse = await fetch(url);
          const imageData = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(imageData).toString('base64');
          const mimeType = url.includes('.png') ? 'image/png' : 'image/jpeg';
          parts.push({ inlineData: { data: base64, mimeType } });
        }
      }
      
      const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
      const text = result.response.text();
      
      await prisma.nodeRun.update({
        where: { id: payload.nodeRunId },
        data: { status: 'success', output: { text }, durationMs: Date.now() } // Note: durationMs ideally is current time minus start time, but passing Date.now() as per instruction
      });
      
      return { output: text };
    } catch (error: any) {
      await prisma.nodeRun.update({
        where: { id: payload.nodeRunId },
        data: { status: 'failed', errorMessage: error.message }
      });
      throw error;
    }
  },
});
