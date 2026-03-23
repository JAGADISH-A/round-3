import { NextResponse } from "next/server";

const FACE_EMOTION_MODEL = "dima806/facial_emotions_image_detection";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN || HF_TOKEN === "hf_your_token_here") {
      return NextResponse.json({ error: "HF_TOKEN not configured" }, { status: 500 });
    }

    // Clean base64
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const buffer = Buffer.from(base64Data, "base64");

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${FACE_EMOTION_MODEL}`,
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        method: "POST",
        body: buffer,
      }
    );

    const result = await response.json();

    if (Array.isArray(result) && result.length > 0) {
      const dominant = result.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      );
      
      return NextResponse.json({
        face_emotion: dominant.label,
        confidence_score: Math.round(dominant.score * 100),
        all_metrics: result
      });
    }

    return NextResponse.json({ face_emotion: "neutral", confidence_score: 100 });
  } catch (error: any) {
    console.error("Face analysis error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
