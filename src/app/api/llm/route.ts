import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const schema = z.object({
  model: z.string().default("gemini-2.0-flash"),
  systemPrompt: z.string().optional(),
  userMessage: z.string().min(1, "userMessage is required"),
  imageUrls: z.array(z.string()).optional().default([]),
});

// Map deprecated/experimental model names to their current stable equivalents
const MODEL_MAP: Record<string, string> = {
  "gemini-2.0-flash-exp":    "gemini-2.0-flash",
  "gemini-2.0-flash-lite":   "gemini-2.0-flash",
  "gemini-pro":              "gemini-1.5-pro",
  "gemini-pro-vision":       "gemini-1.5-pro",
};

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" }, { status: 500 });
    }

    // Normalize deprecated model names
    const resolvedModel = MODEL_MAP[body.model] ?? body.model;
    console.log(`[LLM] Requested model: ${body.model} → resolved: ${resolvedModel}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: resolvedModel });

    const parts: any[] = [];

    if (body.systemPrompt) {
      parts.push({ text: `System: ${body.systemPrompt}\n\n` });
    }
    parts.push({ text: body.userMessage });

    if (body.imageUrls && body.imageUrls.length > 0) {
      for (const url of body.imageUrls) {
        try {
          const imageResponse = await fetch(url);
          if (!imageResponse.ok) {
            console.warn(`Failed to fetch image at ${url}: ${imageResponse.status}`);
            continue;
          }
          const imageData = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(imageData).toString("base64");
          const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
          const mimeType = contentType.split(";")[0] as any;
          parts.push({ inlineData: { data: base64, mimeType } });
        } catch (imgErr) {
          console.warn(`Skipping image ${url}:`, imgErr);
        }
      }
    }

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const text = result.response.text();

    return Response.json({ output: text });
  } catch (err: any) {
    console.error("LLM API Error:", err);
    return Response.json({ error: err.message ?? "LLM execution failed" }, { status: 500 });
  }
}
