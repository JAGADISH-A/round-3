import { NextResponse } from "next/server";

const VOICE_EMOTION_MODEL = "ehauckdo/wav2vec2-lg-xlsr-en-speech-emotion-recognition";

export async function POST(req: Request) {
  try {
    const { audio } = await req.json(); // Base64 audio chunk
    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN || HF_TOKEN === "hf_your_token_here") {
      return NextResponse.json({ error: "HF_TOKEN not configured" }, { status: 500 });
    }

    // Clean base64
    const base64Data = audio.includes(",") ? audio.split(",")[1] : audio;
    const buffer = Buffer.from(base64Data, "base64");

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${VOICE_EMOTION_MODEL}`,
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
      // Result is usually a list of dicts: [{'label': 'happy', 'score': 0.9}, ...]
      const dominant = result.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      );
      
      return NextResponse.json({
        voice_emotion: dominant.label,
        confidence_score: Math.round(dominant.score * 100)
      });
    }

    return NextResponse.json({ voice_emotion: "neutral", confidence_score: 100 });
  } catch (error: any) {
    console.error("Voice analysis error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
