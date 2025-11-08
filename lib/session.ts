/**
 * Session class for managing OpenAI Realtime API connections
 */
export class Session {
  private apiKey: string;
  private provider: 'openai' | 'gemini' | 'bedrock';
  private useSessionToken: boolean = true;
  private ms: MediaStream | null = null;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;

  ontrack?: (event: RTCTrackEvent) => void;
  onconnectionstatechange?: (state: RTCPeerConnectionState) => void;
  onopen?: () => void;
  onmessage?: (message: any) => void;
  onerror?: (error: Error) => void;

  constructor(apiKey: string, provider: 'openai' | 'gemini' | 'bedrock' = 'openai') {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  async start(stream: MediaStream, sessionConfig: any) {
    await this.startInternal(stream, sessionConfig, '/v1/realtime/sessions');
  }

  async startTranscription(stream: MediaStream, sessionConfig: any) {
    await this.startInternal(stream, sessionConfig, '/v1/realtime/transcription_sessions');
  }

  stop() {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.ms) {
      this.ms.getTracks().forEach((t) => t.stop());
      this.ms = null;
    }
  }

  mute(muted: boolean) {
    if (this.pc) {
      this.pc.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.enabled = !muted;
        }
      });
    }
  }

  private async startInternal(stream: MediaStream, sessionConfig: any, tokenEndpoint: string) {
    this.ms = stream;
    this.pc = new RTCPeerConnection();

    this.pc.ontrack = (e) => this.ontrack?.(e);
    this.pc.addTrack(stream.getTracks()[0]);
    this.pc.onconnectionstatechange = () => this.onconnectionstatechange?.(this.pc!.connectionState);

    this.dc = this.pc.createDataChannel('');
    this.dc.onopen = () => this.onopen?.();
    this.dc.onmessage = (e) => this.onmessage?.(JSON.parse(e.data));

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    try {
      const answer = await this.signal(offer, sessionConfig, tokenEndpoint);
      await this.pc.setRemoteDescription(answer as RTCSessionDescriptionInit);
    } catch (e) {
      this.onerror?.(e instanceof Error ? e : new Error(String(e)));
    }
  }

  private async signal(offer: RTCSessionDescriptionInit, sessionConfig: any, tokenEndpoint: string) {
    const urlRoot = 'https://api.openai.com';
    const realtimeUrl = `${urlRoot}/v1/realtime`;
    let sdpResponse: Response;

    if (this.useSessionToken) {
      // Request client secret from backend API instead of calling OpenAI directly
      console.log('Requesting session token from backend API...');
      
      const backendSessionUrl = '/api/realtime/session';
      const backendResponse = await fetch(backendSessionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          provider: this.provider,
          sessionConfig: sessionConfig,
        }),
      });

      console.log('Backend response status:', backendResponse.status);

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        let errorMsg = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error || errorText;
        } catch (e) {
          // Not JSON, use raw text
        }
        throw new Error(`Backend session request failed: ${backendResponse.status} - ${errorMsg}`);
      }

      const backendData = await backendResponse.json();
      console.log('Session data received from backend');
      
      if (!backendData.clientSecret) {
        throw new Error('Invalid backend response: missing clientSecret');
      }
      const clientSecret = backendData.clientSecret;

      console.log('Sending SDP offer through backend');
      
      // Send SDP exchange through backend for security
      const backendSdpResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sdp',
          provider: this.provider,
          sdp: offer.sdp,
        }),
      });

      console.log('Backend SDP response status:', backendSdpResponse.status);

      if (!backendSdpResponse.ok) {
        const errorText = await backendSdpResponse.text();
        let errorMsg = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error?.message || errorText;
        } catch (e) {
          // Not JSON, use raw text
        }
        throw new Error(`Backend SDP exchange failed: ${backendSdpResponse.status} - ${errorMsg}`);
      }

      const backendData2 = await backendSdpResponse.json();
      const sdp = backendData2.answer;
      return { type: 'answer' as const, sdp };
    } else {
      const formData = new FormData();
      formData.append('session', JSON.stringify(sessionConfig));
      formData.append('sdp', offer.sdp || '');

      sdpResponse = await fetch(`${realtimeUrl}`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`Failed to signal: ${sdpResponse.status} - ${errorText}`);
      }

      const sdp = await sdpResponse.text();
      return { type: 'answer' as const, sdp };
    }
  }

  sendMessage(message: any) {
    if (this.dc) {
      this.dc.send(JSON.stringify(message));
    }
  }
}
