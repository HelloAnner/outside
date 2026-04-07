export interface TopicConfig {
  difficulty_start?: number
  difficulty_step?: number
  difficulty_max?: number
  article_length?: number
  review_ratio?: number
  review_window?: number
  new_word_density?: number
}

export const DEFAULT_CONFIG: Required<TopicConfig> = {
  difficulty_start: 3,
  difficulty_step: 0.3,
  difficulty_max: 8,
  article_length: 300,
  review_ratio: 0.3,
  review_window: 5,
  new_word_density: 3,
}

export function mergeConfig(...configs: (string | TopicConfig)[]): Required<TopicConfig> {
  const result = { ...DEFAULT_CONFIG }
  for (const c of configs) {
    const parsed = typeof c === 'string' ? JSON.parse(c || '{}') : c
    for (const key of Object.keys(DEFAULT_CONFIG) as (keyof TopicConfig)[]) {
      if (parsed[key] !== undefined && parsed[key] !== null) {
        (result as Record<string, number>)[key] = parsed[key]
      }
    }
  }
  return result
}

export function calculateDifficulty(articlesCount: number, config: Required<TopicConfig>): number {
  const raw = config.difficulty_start + articlesCount * config.difficulty_step
  return Math.min(Math.round(raw * 10) / 10, config.difficulty_max)
}
