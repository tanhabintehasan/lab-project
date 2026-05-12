import { NextResponse } from 'next/server';
import OpenAI from 'openai';

function getKimiClient() {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    throw new Error('Missing MOONSHOT_API_KEY environment variable');
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.moonshot.cn/v1",
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const kimi = getKimiClient();
    const completion = await kimi.chat.completions.create({
      model: "moonshot-v1-8k", 
      messages: [
        { 
          role: "system", 
          content: "You are a professional assistant integrated into the Lab Project." 
        },
        ...messages,
      ],
      temperature: 0.3,
    });

    return NextResponse.json(completion.choices[0].message);
  } catch (error) {
    console.error("Kimi API Error:", error);
    return NextResponse.json({ error: "Failed to connect to Kimi" }, { status: 500 });
  }
}