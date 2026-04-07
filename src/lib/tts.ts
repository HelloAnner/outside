export async function generateEdgeTTS(text: string, accent: 'us' | 'uk'): Promise<Buffer> {
  const { tts } = await import('edge-tts/out/index.js')
  const voice = accent === 'uk' ? 'en-GB-SoniaNeural' : 'en-US-JennyNeural'
  const audioBuffer = await tts(text, { voice })
  return audioBuffer
}
