/**
 * API route for OpenAI Realtime sessions
 * Handles both session creation and SDP exchange server-side to keep API keys secure
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only POST requests allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, sdp, clientSecret } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (action === 'create') {
      // Create a new session
      const response = await client.beta.realtime.sessions.create({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
      });

      return res.status(200).json({
        clientSecret: response.client_secret,
      });
    } else if (action === 'sdp') {
      // Handle SDP offer/answer exchange
      if (!sdp) {
        return res.status(400).json({ error: 'Missing SDP offer' });
      }

      // Make the SDP request to OpenAI using the API key directly
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/sdp',
        },
        body: sdp,
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('SDP exchange failed:', sdpResponse.status, errorText);
        return res.status(sdpResponse.status).json({ error: errorText });
      }

      const answer = await sdpResponse.text();
      return res.status(200).json({ answer });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Session request failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
}
