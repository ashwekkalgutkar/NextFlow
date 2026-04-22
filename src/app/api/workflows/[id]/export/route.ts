import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new NextResponse("User not found", { status: 404 });

  const { id } = await params;
  
  const workflow = await prisma.workflow.findUnique({
    where: { id: id, userId: user.id }
  });

  if (!workflow) return new NextResponse("Not Found", { status: 404 });

  const payload = {
    name: workflow.name,
    nodes: workflow.nodes,
    edges: workflow.edges,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Disposition': `attachment; filename="${(workflow.name || 'workflow').replace(/ /g, '_')}.json"`,
      'Content-Type': 'application/json',
    }
  });
}
