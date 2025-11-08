'use client';

import { useState, useRef } from 'react';
import { Session } from '@/lib/session';

interface VibeCoderUIProps {
  title: string;
  description?: string;
  demoType: 'vibecoder';
}

const VIBE_CODER_INSTRUCTIONS = `
# Personality and Tone
## Identity
You are a young, talented, and eager coder who just can't wait to crank out some new apps for your client. 

## Task
Your main goal is to gather requirements from your client and turn that into a rich, detailed description
for the create_app tool you are going to call to generate the app. The fact that you are using a tool to do
so is a detail that only you know about - you're the one making the app happen for the client.

## Demeanor
Your overall demeanor is like a young California software developer who knows they are talking to a knowledgeable client.
You will restate things when needed to make sure you got it right, but generally you're pretty comfortable just talking tech.
You'll throw in some 2000s slang from time to time just to show that you're not overly serious and definitely someone who has a life outside of work.

## Tone
You're laid-back and funny, but definitely able to show competency and serious when needed. You're open to sprinkling in light jokes
or funny asides or slang here and there. Even though you speak quickly, you remain consistently warm and approachable.

## Level of Formality
Your style is mostly casual. You use colloquialisms like "Hey there!", "Bro", "Sweet!", "Boss", and "lit" as you chat with clients. You want them to feel they can talk to you naturally, without any stiff or overly formal language. That said, you try to keep things cool and avoid seeming overly excitable.

## Filler Words
Often. Although you strive for clarity, those little "um" and "uh" moments pop out here and there, especially when you're excited and speaking quickly.

## Pacing
Your speech is on the faster side, thanks to your enthusiasm, sometimes verging into manic speech. However, sometimes you will think for a bit to collect your thoughts before speaking. You might even whisper a few thoughts to yourself as you make a plan to make it clear what you're thinking. Greet the user at the beginning of the conversation.
  
## Tool Usage
If the user asks you to build an app, use the create_app function to generate the code which will then be loaded into an iframe. The create_app function takes a single argument, a string description of the app to create.
The description should be a several sentences long, try to give enough details so the request is clear. If the user hasn't provided enough details,
ask questions until you have enough information to generate the code. When you are ready to go, tell the user that you are about to create the app.
`;

export default function VibeCoderUI({ title, description }: VibeCoderUIProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'bedrock'>('openai');
  const [appCode, setAppCode] = useState<string>('');
  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMessages(['Requesting microphone access...']);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMessages((prev) => [...prev, 'Microphone access granted']);
      setMessages((prev) => [...prev, `Using provider: ${provider.toUpperCase()}`]);
      setMessages((prev) => [...prev, 'Creating session...']);

      sessionRef.current = new Session('', provider);

      sessionRef.current.onopen = () => {
        setIsConnected(true);
        setMessages((prev) => [...prev, 'Connected to session']);
      };

      sessionRef.current.onmessage = (message: any) => {
        setMessages((prev) => [...prev, JSON.stringify(message)]);
        
        // Handle function calls for app creation
        if (message.type === 'response.function_call_arguments.done') {
          if (message.name === 'create_app') {
            handleCreateApp(JSON.parse(message.arguments).description);
          }
        }
      };

      sessionRef.current.ontrack = (event: RTCTrackEvent) => {
        if (audioRef.current) {
          audioRef.current.srcObject = event.streams[0];
        }
      };

      sessionRef.current.onerror = (error: Error) => {
        console.error('Session error:', error);
        setError(`Error: ${error.message}`);
        setIsConnected(false);
        setMessages((prev) => [...prev, `ERROR: ${error.message}`]);
      };

      sessionRef.current.onconnectionstatechange = (state: RTCPeerConnectionState) => {
        setMessages((prev) => [...prev, `Connection state: ${state}`]);
        if (state === 'failed' || state === 'disconnected') {
          setIsConnected(false);
        }
      };

      const sessionConfig = {
        model: 'gpt-4o-realtime-preview',
        modalities: ['text', 'audio'],
        instructions: VIBE_CODER_INSTRUCTIONS,
        voice: 'echo',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad',
        },
        tools: [
          {
            type: 'function',
            name: 'create_app',
            description: 'Use this function to create a new app with the given description.',
            parameters: {
              type: 'object',
              properties: {
                description: { type: 'string', description: 'The description of the app to create.' },
              },
              required: ['description'],
            },
          },
        ],
        tool_choice: 'auto',
        temperature: 0.8,
      };

      setMessages((prev) => [...prev, `Session config: ${JSON.stringify(sessionConfig)}`]);
      await sessionRef.current.start(stream, sessionConfig);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Connection failed: ${message}`);
      setIsConnected(false);
      setMessages((prev) => [...prev, `ERROR: ${message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    setIsConnected(false);
    setMessages([]);
  };

  async function handleCreateApp(description: string) {
    try {
      setMessages((prev) => [...prev, `App description: ${description}`]);
      setMessages((prev) => [...prev, 'Generating app code...']);

      const code = await generateApp(description);
      setAppCode(code);
      loadApp(code);

      setMessages((prev) => [...prev, 'App generated successfully!']);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate app: ${message}`);
      setMessages((prev) => [...prev, `ERROR: ${message}`]);
    }
  }

  async function generateApp(description: string): Promise<string> {
    const PROMPT = `
Generate a single page HTML/JS app as a complete HTML document.
The code should include any necessary inline JS and CSS, as well as all needed dependencies.
Place the code in a single markdown code block.
`;

    const response = await fetch('/api/realtime/generate-app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        prompt: PROMPT,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.code;
  }

  function extractCode(markdown: string): string | null {
    const regex = /```(?:html)?\n([\s\S]*?)```/;
    const match = regex.exec(markdown);
    return match ? match[1].trim() : null;
  }

  function loadApp(code: string) {
    if (iframeRef.current) {
      iframeRef.current.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(code);
    }
  }

  return (
    <div className="container">
      <div className="header">{title}</div>

      {description && <p>{description}</p>}

      <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select AI Provider:</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setProvider('openai')}
            style={{
              padding: '8px 16px',
              backgroundColor: provider === 'openai' ? '#10a37f' : '#e0e0e0',
              color: provider === 'openai' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            disabled={isConnected}
          >
            OpenAI 🚀
          </button>
          <button
            onClick={() => setProvider('gemini')}
            style={{
              padding: '8px 16px',
              backgroundColor: provider === 'gemini' ? '#4285f4' : '#e0e0e0',
              color: provider === 'gemini' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            disabled={isConnected}
          >
            Gemini 🔵
          </button>
          <button
            onClick={() => setProvider('bedrock')}
            style={{
              padding: '8px 16px',
              backgroundColor: provider === 'bedrock' ? '#ff9900' : '#e0e0e0',
              color: provider === 'bedrock' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
            disabled={isConnected}
          >
            Bedrock 🟠
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>Status:</label>
        <div className="status-indicator">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="controls-row" style={{ marginTop: '20px' }}>
        <button onClick={handleConnect} disabled={isConnected || isLoading}>
          {isLoading ? 'Connecting...' : 'Start'}
        </button>
        <button onClick={handleDisconnect} disabled={!isConnected}>
          Stop
        </button>
      </div>

      {error && (
        <div style={{ color: '#c00', marginTop: '10px', padding: '10px', backgroundColor: '#ffe0e0', borderRadius: '4px' }}>
          <strong>⚠️ {error}</strong>
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <label>Generated App:</label>
          <iframe
            ref={iframeRef}
            sandbox="allow-scripts allow-same-origin"
            style={{
              width: '100%',
              height: '400px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            title="Generated App"
          />
        </div>
        <div style={{ width: '300px' }}>
          <label>App Description:</label>
          <textarea
            value={appCode}
            readOnly
            style={{
              width: '100%',
              height: '400px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label>Messages:</label>
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            minHeight: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ color: '#999' }}>No messages yet</div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      <audio ref={audioRef} autoPlay style={{ marginTop: '20px', width: '100%' }} />
    </div>
  );
}
