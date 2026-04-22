import { task } from "@trigger.dev/sdk/v3";

export const extractFrameTask = task({
  id: "extract-frame",
  run: async (payload: {
    videoUrl: string;
    timestamp: string | number;
    nodeRunId: string;
  }) => {
    // 1. If timestamp is "50%": get video duration, calculate seconds
    // 2. Run: ffmpeg -ss {ts} -i {url} -frames:v 1 output.jpg
    // 3. Upload to Transloadit
    
    await new Promise(res => setTimeout(res, 1800));

    return { outputUrl: payload.videoUrl + "?frame=" + payload.timestamp };
  },
});
