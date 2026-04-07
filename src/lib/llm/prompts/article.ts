import { BASE_SYSTEM_PROMPT } from './base'

export interface ArticlePromptParams {
  contentFormat: string
  promptTemplate: string
  difficulty: number
  articleLength: number
  newWordDensity: number
  reviewWords: string[]
  referenceWords: string[]
}

function getFormatInstructions(format: string): string {
  const formats: Record<string, string> = {
    dialogue: `Format: Write a dialogue between 2-3 characters.
Include a scene description at the top (location, time).
End with a "Key Expressions" section listing 3-5 useful phrases with Chinese translations.`,
    essay: `Format: Write an academic-style short essay.
Use clear paragraph structure (thesis → evidence → counterpoint → conclusion).
End with a "Glossary" section for technical terms.`,
    story: `Format: Write a short story with a complete narrative arc.
Include vivid descriptions and character development.
The story should have a clear beginning, middle, and end.`,
    email: `Format: Write a professional email or workplace document.
Include context (who is writing, to whom, about what).
End with a "Useful Patterns" section listing reusable sentence templates.`,
    mixed: `Format: Choose the most appropriate format for this topic.
You may mix dialogue, narrative, and expository sections.`,
    free: `Format: Choose the most appropriate format based on the topic description.
You have full creative freedom over the structure.`,
  }
  return formats[format] || formats.mixed
}

const DIFFICULTY_GUIDE = `
Difficulty level guide:
1-2: High-frequency 1000 words, simple sentences (CEFR A1-A2)
3-4: High-frequency 3000 words, compound sentences (CEFR B1)
5-6: 5000 words + topic vocabulary, subordinate clauses (CEFR B2)
7-8: Academic/professional vocabulary, complex sentences (CEFR C1)
9-10: No restrictions, native-level prose (CEFR C2)`

export function buildArticlePrompt(params: ArticlePromptParams) {
  const system = `${BASE_SYSTEM_PROMPT}
${getFormatInstructions(params.contentFormat)}
${params.promptTemplate ? '\nAdditional instructions:\n' + params.promptTemplate : ''}
${DIFFICULTY_GUIDE}

Target difficulty level: ${params.difficulty}/10
Target word count: ~${params.articleLength} words
New word density: ~${params.newWordDensity} per 100 words

Output JSON with these exact fields:
{
  "title": "Article title in English",
  "content": "Full article content in English (use Markdown for formatting)",
  "translation": "Full Chinese translation of the article"
}`

  const reviewSection = params.reviewWords.length > 0
    ? `\nNaturally incorporate these review words: ${params.reviewWords.join(', ')}`
    : ''

  const refSection = params.referenceWords.length > 0
    ? `\nPrioritize using these domain words: ${params.referenceWords.join(', ')}`
    : ''

  const user = `Generate a new article.${reviewSection}${refSection}`

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ]
}
