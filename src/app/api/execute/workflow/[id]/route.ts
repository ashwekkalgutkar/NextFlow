import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id: clerkId } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const workflow = await prisma.workflow.findUnique({
    where: { id: id, userId: user.id }
  });

  if (!workflow) return new NextResponse("Workflow not found", { status: 404 });

  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  
  const nodeIds = body.nodeIds as string[] | undefined;
  const scope = nodeIds && nodeIds.length > 0 ? (nodeIds.length === 1 ? "single" : "partial") : "full";

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      scope,
      status: "running",
    }
  });

  // Here we would typically dispatch to Trigger.dev 
  // e.g. await tasks.trigger("execute-workflow", { runId: run.id, ... })
  
  // For the sake of the clone execution boilerplate, we return queued
  return NextResponse.json({ runId: run.id, status: 'queued' });
}
