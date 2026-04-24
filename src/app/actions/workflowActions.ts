"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function fetchWorkflows() {
  const { userId } = await auth();
  if (!userId) return [];
  try {
    return await prisma.workflow.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to fetch workflows:', error);
    return [];
  }
}

export async function saveWorkflow(id: string, nodes: any[], edges: any[], name?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  
  try {
    // Ensure user exists in our DB (synchronize Clerk ID)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    });

    const workflow = await prisma.workflow.upsert({
      where: { id },
      update: {
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        name: name || undefined,
        updatedAt: new Date(),
      },
      create: {
        id,
        userId,
        name: name || "Untitled",
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      },
    });
    revalidatePath('/nodes');
    return workflow;
  } catch (error) {
    console.error('Failed to save workflow:', error);
    throw error;
  }
}

export async function loadWorkflow(id: string) {
  const { userId } = await auth();
  if (!userId) return null;
  
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id }
    });
    if (!workflow || workflow.userId !== userId) return null;
    
    return {
      ...workflow,
      nodes: typeof workflow.nodes === 'string' ? JSON.parse(workflow.nodes) : workflow.nodes,
      edges: typeof workflow.edges === 'string' ? JSON.parse(workflow.edges) : workflow.edges,
    };
  } catch (error) {
    console.error('Failed to load workflow:', error);
    return null;
  }
}

export async function deleteWorkflow(id: string) {
  const { userId } = await auth();
  if (!userId) return { success: false };
  
  try {
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow || workflow.userId !== userId) return { success: false };

    await prisma.workflow.delete({ where: { id } });
    revalidatePath('/nodes');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    return { success: false };
  }
}

export async function fetchHistory(workflowId: string) {
  try {
    return await prisma.nodeRun.findMany({
      where: { 
        workflowRun: {
          workflowId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return [];
  }
}
