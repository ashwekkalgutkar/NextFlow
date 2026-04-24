import { task } from '@trigger.dev/sdk/v3';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '@/lib/prisma';
import { Transloadit } from 'transloadit';

export const cropImageTask = task({
  id: 'crop-image',
  run: async (payload: {
    imageUrl: string;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    nodeRunId: string;
  }) => {
    const { imageUrl, xPercent, yPercent, widthPercent, heightPercent, nodeRunId } = payload;
    
    try {
      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      
      const inputPath = path.join(tmpDir, `input_${Date.now()}.jpg`);
      const outputPath = path.join(tmpDir, `output_${Date.now()}.jpg`);
      
      // Download
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(inputPath, Buffer.from(buffer));
      
      // Dimensions
      const probeOut = execSync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${inputPath}"`
      ).toString().trim();
      const [width, height] = probeOut.split(',').map(Number);
      
      const x = Math.round((xPercent / 100) * width);
      const y = Math.round((yPercent / 100) * height);
      const w = Math.round((widthPercent / 100) * width);
      const h = Math.round((heightPercent / 100) * height);
      
      // FFmpeg Crop
      execSync(`ffmpeg -i "${inputPath}" -vf "crop=${w}:${h}:${x}:${y}" "${outputPath}" -y`);
      
      // Upload via Transloadit SDK
      const transloadit = new Transloadit({
        authKey: process.env.TRANSLOADIT_KEY!,
        authSecret: process.env.TRANSLOADIT_SECRET!,
      });
      
      const assembly = await transloadit.createAssembly({
        files: { [path.basename(outputPath)]: outputPath },
        params: {
          steps: {
            // Just store it temporarily
            store: { robot: '/http/import', url: 'https://example.com' } // Dummy step to trigger assembly
          }
        },
        waitForCompletion: true,
      });

      // Transloadit returns results. If no steps are provided, it just uploads the original
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
      console.error("Crop Task Error:", error);
      await prisma.nodeRun.update({
        where: { id: nodeRunId },
        data: { status: 'failed', errorMessage: error.message }
      });
      throw error;
    }
  }
});
