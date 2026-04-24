import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new NextResponse("User Not Found", { status: 404 });

  const resolvedParams = await Promise.resolve(params);
  
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!workflow) {
      return NextResponse.json({ nodes: [], edges: [] });
    }

    if (workflow.userId !== user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json({
      nodes: typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes || [],
      edges: typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges || [],
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to load workflow", { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new NextResponse("User Not Found", { status: 404 });

  const resolvedParams = await Promise.resolve(params);
  
  try {
    const body = await req.json();
    
    const workflow = await prisma.workflow.upsert({
      where: { id: resolvedParams.id },
      update: {
        nodes: body.nodes,
        edges: body.edges,
      },
      create: {
        id: resolvedParams.id,
        name: "Untitled",
        nodes: body.nodes,
        edges: body.edges,
        userId: user.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to save workflow", { status: 500 });
  }
}
