import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new NextResponse("Not Found", { status: 404 });

  const { runId } = await params;

  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: {
      nodeRuns: true,
      workflow: true
    }
  });

  if (!run) return new NextResponse("Not Found", { status: 404 });
  if (run.workflow.userId !== user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const nodeStatuses = run.nodeRuns.reduce((acc: any, curr) => {
    acc[curr.nodeId] = {
      status: curr.status,
      output: curr.output,
      errorMessage: curr.errorMessage
    };
    return acc;
  }, {});

  return NextResponse.json({
    status: run.status,
    nodeStatuses
  });
}
