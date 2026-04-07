export function buildTranslatePrompt(word: string, sentence: string) {
  return [
    {
      role: 'system' as const,
      content: `You are a dictionary assistant. Given an English word and the sentence it appears in, provide:
- phonetic: IPA phonetic transcription (US pronunciation)
- pos: part of speech (noun, verb, adj, adv, etc.)
- definition: concise Chinese definition (context-appropriate meaning first)
- sentence_translation: Chinese translation of the full sentence

Output valid JSON only with these exact fields:
{ "phonetic": "...", "pos": "...", "definition": "...", "sentence_translation": "..." }`,
    },
    {
      role: 'user' as const,
      content: `Word: "${word}"\nSentence: "${sentence}"`,
    },
  ]
}
