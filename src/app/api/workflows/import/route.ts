import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const user = await prisma.user.upsert({
    where: { id: clerkId },
    update: {},
    create: { id: clerkId }
  });

  try {
    const data = await req.json();
    const workflow = await prisma.workflow.create({
      data: {
        name: data.name || "Imported Workflow",
        userId: user.id,
        nodes: data.nodes || [],
        edges: data.edges || []
      }
    });
    return NextResponse.json(workflow);
  } catch(e) {
    return new NextResponse("Invalid JSON", { status: 400 });
  }
}
