/**
 * API route for Realtime sessions
 * Handles session creation and SDP exchange for OpenAI, Gemini, and Bedrock
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
    const { action, provider = 'openai', sdp, sessionConfig } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    if (action === 'create') {
      // Create a new session based on provider
      if (provider === 'openai') {
        const client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await client.beta.realtime.sessions.create({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'alloy',
        });

        return res.status(200).json({
          clientSecret: response.client_secret,
          provider: 'openai',
        });
      } else if (provider === 'gemini') {
        // Gemini doesn't use session tokens like OpenAI
        // We'll use API key directly
        return res.status(200).json({
          clientSecret: process.env.GEMINI_API_KEY || '',
          provider: 'gemini',
        });
      } else if (provider === 'bedrock') {
        // Bedrock uses AWS credentials
        return res.status(200).json({
          clientSecret: process.env.AWS_ACCESS_KEY_ID || '',
          provider: 'bedrock',
        });
      } else {
        return res.status(400).json({ error: 'Invalid provider' });
      }
    } else if (action === 'sdp') {
      // Handle SDP offer/answer exchange based on provider
      if (!sdp) {
        return res.status(400).json({ error: 'Missing SDP offer' });
      }

      if (provider === 'openai') {
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
          console.error('OpenAI SDP exchange failed:', sdpResponse.status, errorText);
          return res.status(sdpResponse.status).json({ error: errorText });
        }

        const answer = await sdpResponse.text();
        return res.status(200).json({ answer });
      } else if (provider === 'gemini') {
        // Gemini realtime API endpoint (placeholder for now)
        console.log('Gemini SDP exchange - implementation needed');
        return res.status(501).json({ error: 'Gemini realtime API not yet implemented' });
      } else if (provider === 'bedrock') {
        // Bedrock realtime API endpoint (placeholder for now)
        console.log('Bedrock SDP exchange - implementation needed');
        return res.status(501).json({ error: 'Bedrock realtime API not yet implemented' });
      } else {
        return res.status(400).json({ error: 'Invalid provider' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Session request failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
}
