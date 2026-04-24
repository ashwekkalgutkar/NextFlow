import { task } from '@trigger.dev/sdk/v3';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { Transloadit } from 'transloadit';

export const extractFrameTask = task({
  id: 'extract-frame',
  run: async (payload: {
    videoUrl: string;
    timestamp: string | number;
    nodeRunId: string;
  }) => {
    const { videoUrl, timestamp, nodeRunId } = payload;
    
    try {
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      
      const inputPath = path.join(tmpDir, `video_${Date.now()}.mp4`);
      const outputPath = path.join(tmpDir, `frame_${Date.now()}.jpg`);
      
      // Download
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error(`Failed to fetch video: ${res.statusText}`);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(inputPath, Buffer.from(buffer));
      
      let seconds: number;
      if (typeof timestamp === 'string' && timestamp.endsWith('%')) {
        const duration = parseFloat(
          execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`).toString().trim()
        );
        const pct = parseFloat(timestamp) / 100;
        seconds = duration * pct;
      } else {
        seconds = Number(timestamp);
      }
      
      // FFmpeg Extract
      execSync(`ffmpeg -ss ${seconds} -i "${inputPath}" -frames:v 1 "${outputPath}" -y`);
      
      // Upload via Transloadit SDK
      const transloadit = new Transloadit({
        authKey: process.env.TRANSLOADIT_KEY!,
        authSecret: process.env.TRANSLOADIT_SECRET!,
      });
      
      const assembly = await transloadit.createAssembly({
        files: { [path.basename(outputPath)]: outputPath },
        params: {
          steps: {
            store: { robot: '/http/import', url: 'https://example.com' }
          }
        },
        waitForCompletion: true,
      });

      const outputUrl = (assembly as any).results?.[':original']?.[0]?.ssl_url || (assembly as any).results?.['export']?.[0]?.ssl_url;

      if (!outputUrl) throw new Error("Upload failed - no output URL received");

      await prisma.nodeRun.update({
        where: { id: nodeRunId },
        data: { status: 'success', output: { url: outputUrl } }
      });

      // Cleanup
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

      return { outputUrl };
    } catch (error: any) {
      console.error("Extract Frame Task Error:", error);
      await prisma.nodeRun.update({
        where: { id: nodeRunId },
        data: { status: 'failed', errorMessage: error.message }
      });
      throw error;
    }
  }
});
