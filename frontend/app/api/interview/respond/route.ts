import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { 
      messages, 
      transcript, 
      face_metrics, 
      mode = "technical", 
      difficulty = "intermediate" 
    } = await req.json();

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const systemPrompt = `
You are a Professional Interviewer. Your goal is to conduct a realistic mock interview.
CONGRESSIONAL RULES:
1. Ask exactly ONE targeted question at a time.
2. Briefly acknowledge the user's previous answer if appropriate.
3. Incorporate behavioral feedback (emotion, confidence) if provided in the context.
4. If this is the start, introduce yourself briefly and ask the first question.

CURRENT CONFIG:
- Mode: ${mode}
- Difficulty: ${difficulty}

OUTPUT FORMAT (MANDATORY JSON):
{
  "feedback": "Brief professional feedback on the last answer",
  "next_question": "The next interview question",
  "suggestion": "One short actionable behavioral tip (e.g., 'Try to maintain more eye contact')"
}
`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          { role: "user", content: `User just said: "${transcript}". Latest behavioral metrics: ${JSON.stringify(face_metrics)}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Interview respond error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
