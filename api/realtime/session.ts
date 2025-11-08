/**
 * API route for OpenAI Realtime sessions (App Router)
 * Handles authentication server-side to keep API keys secure
 */

import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(request: NextRequest) {
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.beta.realtime.sessions.create({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Session creation failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
