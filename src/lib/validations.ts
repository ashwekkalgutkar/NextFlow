import { z } from "zod";

// Define what each handle outputs
const nodeOutputs: Record<string, "text" | "image" | "video"> = {
  textNode: "text",
  llmNode: "text",
  imageUploadNode: "image",
  videoUploadNode: "video",
  cropImageNode: "image",
  extractFrameNode: "image",
};

// Define what each map expects 
// key: handle string ID
const handleInputs: Record<string, z.ZodType> = {
  // LLM Node targets
  system_prompt: z.literal("text"),
  user_message: z.literal("text"),
  images: z.literal("image"),
  
  // Crop Node targets
  image_url: z.literal("image"),
  x_percent: z.literal("text"), // usually just typed, but if they feed text...
  y_percent: z.literal("text"),
  width_percent: z.literal("text"),
  height_percent: z.literal("text"),

  // Extract Node targets
  video_url: z.literal("video"),
  timestamp: z.literal("text"),
  
  // Text node target
  textIn: z.literal("text"),
};

export const validateEdge = (
  sourceNodeType: string,
  targetHandleId: string
): boolean => {
  const outputType = nodeOutputs[sourceNodeType];
  if (!outputType) return true; // fallback if unknown

  const validator = handleInputs[targetHandleId];
  if (!validator) return true; // fallback if handle not strictly typed

  const parseResult = validator.safeParse(outputType);
  return parseResult.success;
};
