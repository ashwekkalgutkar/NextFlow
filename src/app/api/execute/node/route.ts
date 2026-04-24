import { auth } from '@clerk/nextjs/server';
import { tasks } from '@trigger.dev/sdk/v3';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  workflowId: z.string(),
  nodeId: z.string(),
  nodeType: z.string(),
  inputs: z.object({
    model: z.string().optional().default('gemini-2.0-flash-exp'),
    systemPrompt: z.string().optional(),
    userMessage: z.string().optional(),
    imageUrls: z.array(z.string()).optional(),
    xPercent: z.number().optional(),
    yPercent: z.number().optional(),
    widthPercent: z.number().optional(),
    heightPercent: z.number().optional(),
    imageUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
  })
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = schema.parse(await req.json());
    
    // Create WorkflowRun + NodeRun in DB
    const workflowRun = await prisma.workflowRun.create({
      data: {
        workflowId: body.workflowId,
        scope: 'single',
        status: 'running',
      }
    });
    
    const nodeRun = await prisma.nodeRun.create({
      data: {
        workflowRunId: workflowRun.id,
        nodeId: body.nodeId,
        nodeType: body.nodeType,
        status: 'running',
        inputs: body.inputs,
      }
    });
    
    let handle;
    
    // Trigger the corresponding task based on nodeType
    if (body.nodeType === 'llmNode') {
      handle = await tasks.trigger('llm-node', {
        ...body.inputs,
        userMessage: body.inputs.userMessage || '',
        nodeRunId: nodeRun.id,
        workflowRunId: workflowRun.id,
      });
    } else if (body.nodeType === 'cropImageNode') {
      handle = await tasks.trigger('crop-image', {
        imageUrl: body.inputs.imageUrl || '',
        xPercent: body.inputs.xPercent || 0,
        yPercent: body.inputs.yPercent || 0,
        widthPercent: body.inputs.widthPercent !== undefined ? body.inputs.widthPercent : 100,
        heightPercent: body.inputs.heightPercent !== undefined ? body.inputs.heightPercent : 100,
        nodeRunId: nodeRun.id,
      });
    } else if (body.nodeType === 'extractFrameNode') {
      handle = await tasks.trigger('extract-frame', {
        videoUrl: body.inputs.videoUrl || '',
        timestamp: body.inputs.timestamp || 0,
        nodeRunId: nodeRun.id,
      });
    } else {
      return Response.json({ error: 'Unsupported node type' }, { status: 400 });
    }
    
    return Response.json({ runId: handle.id, workflowRunId: workflowRun.id });
  } catch (error: any) {
    console.error('Execute Node Error:', error);
    return Response.json({ error: error.message || 'Execution failed' }, { status: 500 });
  }
}
