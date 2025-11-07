# Backend API Setup Guide

This project now uses **server-side API key management** for enhanced security. All API keys are stored in `.env.local` and only accessed from the backend.

## Configuration

### 1. Environment Variables

Create or update `.env.local` in the project root:

```bash
# OpenAI API Key (for Realtime API)
OPENAI_API_KEY=your_key_here

# Google Gemini API Key
GEMINI_API_KEY=your_key_here

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_key_here
```

### 2. Getting API Keys

- **OpenAI**: https://platform.openai.com/api-keys
- **Gemini**: https://aistudio.google.com/apikey
- **AWS Bedrock**: Configure via AWS Console or `~/.aws/credentials`

## API Endpoints

### OpenAI Realtime Session
**Endpoint**: `POST /api/realtime/session`

**Request Body**:
```json
{
  "model": "gpt-4o-realtime-preview",
  "modalities": ["text", "audio"],
  "instructions": "You are a helpful assistant.",
  "voice": "alloy",
  "input_audio_format": "pcm16",
  "output_audio_format": "pcm16"
}
```

**Response**:
```json
{
  "clientSecret": "token_here"
}
```

### Gemini API
**Endpoint**: `POST /api/gemini`

**Request Body**:
```json
{
  "prompt": "Your prompt here",
  "model": "gemini-pro"
}
```

### AWS Bedrock
**Endpoint**: `POST /api/bedrock`

**Request Body**:
```json
{
  "modelId": "anthropic.claude-v2",
  "prompt": "Your prompt here"
}
```

## Security Benefits

✅ **API keys never exposed to client**
✅ **No secrets in frontend code**
✅ **Easy credential rotation**
✅ **Centralized request logging**
✅ **Rate limiting on backend**

## Frontend Usage

Frontend code no longer handles API keys. Instead:

```typescript
// Instead of: const session = new Session(apiKey)
// Backend handles authentication

const response = await fetch('/api/realtime/session', {
  method: 'POST',
  body: JSON.stringify(sessionConfig)
});

const { clientSecret } = await response.json();
```

## Deployment

When deploying:

1. Set environment variables on your hosting platform
2. Never commit `.env.local` to git (it's in `.gitignore`)
3. Use platform-specific secret management (Vercel Secrets, AWS Secrets Manager, etc.)

## Development

Run the dev server:
```bash
npm run dev
```

The `.env.local` file will be loaded automatically by Next.js.
