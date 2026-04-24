import { runs } from '@trigger.dev/sdk/v3';

export async function GET(req: Request, { params }: { params: Promise<{ runId: string }> | { runId: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const runId = resolvedParams.runId;

    if (!runId || runId === 'undefined') {
      return Response.json({ error: 'Invalid runId' }, { status: 400 });
    }

    const run = await runs.retrieve(runId);

    let output = null;
    if (run.status === 'COMPLETED') {
      output = run.output?.output || run.output?.outputUrl || run.output;
    }

    return Response.json({
      status: run.status,  // PENDING, EXECUTING, COMPLETED, FAILED
      output,
      error: run.status === 'FAILED' ? 'Execution failed' : null
    });
  } catch (error: any) {
    console.error('Execute Status Error:', error);
    return Response.json({ error: 'Failed to retrieve status' }, { status: 500 });
  }
}
