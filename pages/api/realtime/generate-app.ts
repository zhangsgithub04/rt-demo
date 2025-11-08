/**
 * API route for generating apps using OpenAI
 * Takes a description and generates HTML/JS code
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description, prompt } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Missing description' });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompt || 'Generate a single page HTML/JS app as a complete HTML document.',
        },
        {
          role: 'user',
          content: description,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'Invalid API response' });
    }

    // Extract code from markdown code block
    const regex = /```(?:html)?\n([\s\S]*?)```/;
    const match = regex.exec(content);
    const code = match ? match[1].trim() : content;

    return res.status(200).json({
      code,
      fullResponse: content,
    });
  } catch (error) {
    console.error('App generation failed:', error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
}
