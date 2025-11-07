'use client';

import { useState, useRef } from 'react';
import { Session } from '@/lib/session';

interface VertexAIUIProps {
  title: string;
  description?: string;
  demoType: 'basic' | 'text' | 'transcribe' | 'noise-reduction' | 'imager' | 'vibecoder';
}

// OpenAI GPT-4o Realtime API pricing (per 1M tokens)
const PRICING = {
  inputTokensPerMillion: 5.0,    // $5.00 per 1M input tokens
  outputTokensPerMillion: 20.0,  // $20.00 per 1M output tokens
};

function calculateCost(inputTokens: number, outputTokens: number): { input: number; output: number; total: number } {
  const inputCost = (inputTokens / 1_000_000) * PRICING.inputTokensPerMillion;
  const outputCost = (outputTokens / 1_000_000) * PRICING.outputTokensPerMillion;
  return {
    input: inputCost,
    output: outputCost,
    total: inputCost + outputCost,
  };
}

export default function VertexAIUI({ title, description }: VertexAIUIProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const sessionRef = useRef<Session | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      setMessages(['Requesting microphone access...']);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMessages((prev) => [...prev, 'Microphone access granted']);
      setMessages((prev) => [...prev, 'Creating session...']);

      // Create session without API key (backend handles it)
      sessionRef.current = new Session('');

      sessionRef.current.onopen = () => {
        setIsConnected(true);
        setMessages((prev) => [...prev, 'Connected to session']);
      };

      sessionRef.current.onmessage = (message: any) => {
        setMessages((prev) => [...prev, JSON.stringify(message)]);
        
        // Track token usage
        if (message.type === 'response.done' && message.response?.usage) {
          const usage = message.response.usage;
          if (usage.input_tokens) {
            setInputTokens((prev) => prev + usage.input_tokens);
          }
          if (usage.output_tokens) {
            setOutputTokens((prev) => prev + usage.output_tokens);
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
        instructions: 'You are a helpful assistant.',
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
        },
        tools: [],
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
    setInputTokens(0);
    setOutputTokens(0);
  };

  return (
    <div className="container">
      <div className="header">{title}</div>

      {description && <p>{description}</p>}

      <div style={{ marginTop: '20px' }}>
        <label htmlFor="api-key-status">Status:</label>
        <div className="status-indicator">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="controls-row" style={{ marginTop: '20px' }}>
        <button onClick={handleConnect} disabled={isConnected || isLoading}>
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
        <button onClick={handleDisconnect} disabled={!isConnected}>
          Disconnect
        </button>
      </div>

      {error && (
        <div style={{ color: '#c00', marginTop: '10px', padding: '10px', backgroundColor: '#ffe0e0', borderRadius: '4px' }}>
          <strong>⚠️ {error}</strong>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Token Usage & Cost:</div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', marginBottom: '10px' }}>
          <div>
            <span style={{ color: '#0066cc' }}>📥 Input:</span>
            <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>{inputTokens}</span>
          </div>
          <div>
            <span style={{ color: '#00aa00' }}>📤 Output:</span>
            <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>{outputTokens}</span>
          </div>
          <div>
            <span style={{ color: '#ff6600' }}>📊 Total:</span>
            <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>{inputTokens + outputTokens}</span>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #d0e0ff', paddingTop: '10px', display: 'flex', gap: '20px', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#0066cc' }}>💰 Input Cost:</span>
            <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>${calculateCost(inputTokens, outputTokens).input.toFixed(6)}</span>
          </div>
          <div>
            <span style={{ color: '#00aa00' }}>💰 Output Cost:</span>
            <span style={{ fontWeight: 'bold', marginLeft: '5px' }}>${calculateCost(inputTokens, outputTokens).output.toFixed(6)}</span>
          </div>
          <div>
            <span style={{ color: '#ff6600', fontWeight: 'bold' }}>💵 Total Cost:</span>
            <span style={{ fontWeight: 'bold', marginLeft: '5px', color: '#ff6600' }}>${calculateCost(inputTokens, outputTokens).total.toFixed(6)}</span>
          </div>
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
            maxHeight: '400px',
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
