import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUser } from '@/lib/api-helpers';

export const runtime = 'nodejs';

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

export async function POST(req: NextRequest) {
  // Require authentication to prevent unauthenticated API credit consumption
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Basic validation
    if (!Array.isArray(body?.messages)) {
      return NextResponse.json({ error: 'messages must be an array' }, { status: 400 });
    }

    const kimi = getKimiClient();
    const completion = await kimi.chat.completions.create({
      model: "moonshot-v1-8k",
      messages: [
        {
          role: "system",
          content: "You are a professional assistant integrated into the Lab Project."
        },
        ...body.messages,
      ],
      temperature: 0.3,
    });

    return NextResponse.json(completion.choices[0].message);
  } catch (error) {
    console.error("Kimi API Error:", error);
    return NextResponse.json({ error: "Failed to connect to Kimi" }, { status: 500 });
  }
}
