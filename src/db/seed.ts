export interface BuiltinTopic {
  slug: string
  name: string
  description: string
  contentFormat: string
  promptTemplate: string
  config: string
}

export const builtinTopics: BuiltinTopic[] = [
  {
    slug: 'daily-conversation',
    name: '日常口语',
    description: '围绕生活场景的对话练习，从打招呼到深度闲聊',
    contentFormat: 'dialogue',
    promptTemplate: `Focus on everyday life scenarios (ordering food, asking directions, small talk, shopping).
Use colloquial short sentences and high-frequency collocations.
Structure: scene description → dialogue → key expressions with Chinese translations.`,
    config: JSON.stringify({ difficulty_start: 2, difficulty_step: 0.3, difficulty_max: 7, article_length: 250, review_ratio: 0.3, review_window: 5, new_word_density: 3 }),
  },
  {
    slug: 'workplace-english',
    name: '职场英语',
    description: '邮件、会议、汇报等职场场景的英语表达',
    contentFormat: 'email',
    promptTemplate: `Each article focuses on one workplace scenario (weekly meeting, project email, interview Q&A, performance review).
Emphasize formal expressions and tactful phrasing.
Structure: context → main content → useful sentence patterns box.`,
    config: JSON.stringify({ difficulty_start: 4, difficulty_step: 0.3, difficulty_max: 8, article_length: 300, review_ratio: 0.3, review_window: 5, new_word_density: 3 }),
  },
  {
    slug: 'ielts-prep',
    name: '雅思备考',
    description: '模拟雅思阅读段落风格的学术短文训练',
    contentFormat: 'essay',
    promptTemplate: `Write academic-style passages mimicking IELTS reading sections.
Use Academic Word List (AWL) vocabulary, complex sentence structures.
Structure: thesis → evidence → counterpoint → conclusion, with glossary.`,
    config: JSON.stringify({ difficulty_start: 5, difficulty_step: 0.2, difficulty_max: 9, article_length: 400, review_ratio: 0.25, review_window: 5, new_word_density: 4 }),
  },
  {
    slug: 'tech-science',
    name: '科技前沿',
    description: 'AI、编程、硬件等科技话题的英文阅读',
    contentFormat: 'essay',
    promptTemplate: `Write about AI, programming, hardware, startups, or scientific breakthroughs.
Technical terms should be explained in context on first use.
Structure: lead → body → glossary of key terms with definitions.`,
    config: JSON.stringify({ difficulty_start: 4, difficulty_step: 0.3, difficulty_max: 8, article_length: 300, review_ratio: 0.3, review_window: 5, new_word_density: 3 }),
  },
  {
    slug: 'story-time',
    name: '故事阅读',
    description: '短篇故事、寓言、改编经典，在趣味中学习',
    contentFormat: 'story',
    promptTemplate: `Write engaging short stories with a complete narrative arc.
Include vivid descriptions and character development.
The story should have a clear beginning, middle, and end.
Vocabulary learning happens naturally through the narrative.`,
    config: JSON.stringify({ difficulty_start: 2, difficulty_step: 0.4, difficulty_max: 8, article_length: 350, review_ratio: 0.35, review_window: 5, new_word_density: 2 }),
  },
]
