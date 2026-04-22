import { task } from "@trigger.dev/sdk/v3";

export const cropImageTask = task({
  id: "crop-image",
  run: async (payload: {
    imageUrl: string;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    nodeRunId: string;
  }) => {
    // 1. Download image to temp file
    // 2. Get dimensions with ffprobe
    // 3. Calculate px values from %
    // 4. Run ffmpeg crop filter
    // 5. Upload result to Transloadit
    
    await new Promise(res => setTimeout(res, 1500));
    
    return { outputUrl: payload.imageUrl + "?cropped=true" };
  },
});
