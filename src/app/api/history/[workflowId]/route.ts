import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ workflowId: string }> | { workflowId: string } }) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return new NextResponse("User Not Found", { status: 404 });

  const resolvedParams = await Promise.resolve(params);
  
  try {
    const runs = await prisma.workflowRun.findMany({
      where: { workflowId: resolvedParams.workflowId },
      orderBy: { createdAt: 'desc' },
      include: {
        nodeRuns: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to load history", { status: 500 });
  }
}
