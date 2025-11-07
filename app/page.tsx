import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <div className="header">OpenAI Realtime API Demos</div>
      <div>
        <p>
          This page shows demos of the{' '}
          <a href="https://platform.openai.com/docs/guides/realtime" target="_blank" rel="noopener noreferrer">
            OpenAI Realtime API
          </a>
          , which makes it easy to build realtime voice and text AI applications. The demos are written in
          Next.js with TypeScript, integrated with{' '}
          <a href="https://cloud.google.com/vertex-ai" target="_blank" rel="noopener noreferrer">
            Google Vertex AI UI
          </a>
          . Click the GitHub link below to view the source code. Patches and{' '}
          <a href="https://github.com/juberti/demos/issues" target="_blank" rel="noopener noreferrer">
            issues
          </a>{' '}
          welcome!
        </p>
        <p>
          Note that the demos require an OpenAI API key, which you can get{' '}
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
            here
          </a>
          .
        </p>
      </div>
      <div>
        <table>
          <tbody>
            <tr>
              <td>🤖 <Link href="/realtime/basic">Voice Agent Demo</Link></td>
              <td>Lets you chat with a simple voice agent.</td>
            </tr>
            <tr>
              <td>📓 <Link href="/realtime/text">Voice to Text Agent Demo</Link></td>
              <td>Lets you chat with an agent that listens to voice and replies with text.</td>
            </tr>
            <tr>
              <td>📝 <Link href="/realtime/transcribe">Transcription Demo</Link></td>
              <td>Transcribes mic or audio file input.</td>
            </tr>
            <tr>
              <td>🔁 <Link href="/realtime/noise-reduction">Loopback Demo</Link></td>
              <td>Echoes back what you say after applying noise reduction.</td>
            </tr>
            <tr>
              <td>🎨 <Link href="/realtime/imager">Image Generation Demo</Link></td>
              <td>Demonstrates how to generate images from a voice conversation.</td>
            </tr>
            <tr>
              <td>🧑‍💻 <Link href="/realtime/vibecoder">Vibe Coding Demo</Link></td>
              <td>Demonstrates how to delegate to a reasoning model for code generation.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="github-link">
        <a href="https://github.com/juberti/demos" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </p>
    </div>
  );
}
