import VertexAIUI from '@/components/VertexAIUI';

export default function TranscribeDemo() {
  return (
    <VertexAIUI
      title="📝 Transcription Demo"
      description="Transcribes mic or audio file input using the OpenAI Realtime API."
      demoType="transcribe"
    />
  );
}
