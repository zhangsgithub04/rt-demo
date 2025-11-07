/**
 * API route for OpenAI Realtime sessions
 * Handles authentication server-side to keep API keys secure
 */

import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  clientSecret?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only POST requests allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const sessionConfig = req.body;

    // Request session token from OpenAI
    const sessionResponse = await fetch(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'openai-beta': 'realtime-v1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionConfig),
      }
    );

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      let errorMsg = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorText;
      } catch (e) {
        // Not JSON, use raw text
      }
      return res
        .status(sessionResponse.status)
        .json({ error: `OpenAI session failed: ${errorMsg}` });
    }

    const sessionData = await sessionResponse.json();

    if (!sessionData.client_secret?.value) {
      return res.status(500).json({ error: 'Invalid session response' });
    }

    // Return only the client secret to the frontend
    res.status(200).json({
      clientSecret: sessionData.client_secret.value,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Server error: ${message}` });
  }
}
