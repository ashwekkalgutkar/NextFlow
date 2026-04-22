import Canvas from "@/components/canvas/Canvas";

export default async function NodeEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="flex w-full h-[100vh] overflow-hidden relative">
      <div className="flex-1 relative">
        <Canvas workflowId={resolvedParams.id} />
      </div>
    </div>
  );
}
