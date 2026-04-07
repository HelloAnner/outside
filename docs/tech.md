# Outside — 技术架构设计

## 技术选型

### 全栈框架

**Next.js 15 (App Router) + React 19 + TypeScript**

选择 Next.js 而非前后端分离的原因：

- 单仓库单部署，前后端共享类型定义，无接口对齐成本
- App Router 的 Server Components 天然适合阅读页——文章内容服务端渲染，交互部分（划词、生词面板）客户端水合
- Route Handlers 充当后端 API，处理 LLM 代理、数据库读写、认证逻辑
- 流式响应（`ReadableStream`）原生支持，文章生成可以边生成边渲染

### 样式

**Tailwind CSS 4 + CSS Variables**

- 用 CSS Variables 定义设计基调（阅读器配色、高亮底色、字体参数），Tailwind 负责布局和响应式
- 不引入组件库，所有 UI 手写——阅读器风格的产品需要高度定制的排版控制

### 数据库

**SQLite + Drizzle ORM**

- SQLite 单文件部署，不需要运维数据库服务。适合个人工具型产品的早期阶段
- Drizzle ORM：类型安全、schema-first、生成迁移文件，且对 SQLite 支持好
- 驱动层使用 `better-sqlite3`（同步 API，性能优于 `sql.js`）

### 认证

**iron-session（Cookie-based Session）**

- 无状态 session：session 数据加密后直接存在 cookie 中，服务端不需要 session 存储
- 密码哈希使用 `bcrypt`（cost factor = 10）
- 不引入 NextAuth —— 当前只有邮箱密码登录，NextAuth 对这个场景过重

### AI 调用

**多供应商 LLM 适配器**

- Anthropic SDK（`@anthropic-ai/sdk`）为默认
- OpenAI SDK（`openai`）覆盖 OpenAI 及所有兼容 OpenAI Chat Completions 格式的服务
- 统一适配层抹平两种 SDK 的流式响应差异，上层业务代码只面向一个接口

### TTS

**Web Speech API（默认）+ Edge TTS（可选）**

- Web Speech API 在前端直接调用 `speechSynthesis.speak()`，零网络延迟
- Edge TTS 通过后端 `edge-tts` npm 包调用微软语音服务，返回音频流给前端播放，音质更好

### 依赖清单

```
核心框架    next@15  react@19  typescript
样式        tailwindcss@4
数据库      drizzle-orm  drizzle-kit  better-sqlite3
认证        iron-session  bcrypt
AI         @anthropic-ai/sdk  openai
TTS        edge-tts（后端，可选）
工具        zod（入参校验）  nanoid（ID 生成）
```

## 项目结构

```
outside/
├── drizzle/                    # 数据库迁移文件（drizzle-kit generate）
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 认证相关页面（不带导航栏的布局）
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/             # 主应用页面（带导航栏的布局）
│   │   │   ├── page.tsx                    # P1 首页
│   │   │   ├── topics/
│   │   │   │   ├── [topicId]/
│   │   │   │   │   └── page.tsx            # P2 主题详情页
│   │   │   │   └── new/
│   │   │   │       └── page.tsx            # P2b 自定义主题创建
│   │   │   ├── articles/
│   │   │   │   └── [articleId]/
│   │   │   │       └── page.tsx            # P3 阅读页
│   │   │   ├── vocabulary/
│   │   │   │   └── page.tsx                # P4 生词本
│   │   │   └── settings/
│   │   │       └── page.tsx                # P5 设置页
│   │   ├── api/                # Route Handlers
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── articles/
│   │   │   │   ├── route.ts                # POST 生成文章
│   │   │   │   └── [articleId]/route.ts
│   │   │   ├── topics/
│   │   │   │   ├── route.ts                # GET 列表 / POST 创建
│   │   │   │   └── [topicId]/route.ts      # PUT 更新 / DELETE 删除
│   │   │   ├── words/
│   │   │   │   ├── route.ts                # GET 生词列表
│   │   │   │   └── [wordId]/route.ts       # PUT 更新熟练度
│   │   │   ├── translate/route.ts          # POST 划词翻译
│   │   │   ├── tts/route.ts                # POST Edge TTS 音频流
│   │   │   └── settings/route.ts           # GET / PUT 用户设置
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── db/
│   │   ├── index.ts            # 数据库连接（单例）
│   │   ├── schema.ts           # Drizzle schema 定义
│   │   └── seed.ts             # 内置主题种子数据
│   ├── lib/
│   │   ├── auth.ts             # session 读写、密码哈希、中间件
│   │   ├── llm/
│   │   │   ├── adapter.ts      # 统一 LLM 接口
│   │   │   ├── anthropic.ts    # Anthropic 实现
│   │   │   ├── openai.ts       # OpenAI / 兼容格式实现
│   │   │   └── prompts/        # Prompt 模板
│   │   │       ├── base.ts             # 基础系统 prompt
│   │   │       ├── article.ts          # 文章生成 prompt 组装
│   │   │       └── translate.ts        # 划词翻译 prompt
│   │   ├── review-weaving.ts   # 复习词筛选算法
│   │   ├── difficulty.ts       # 难度计算
│   │   └── tts.ts              # TTS 服务封装
│   └── components/
│       ├── reader/             # 阅读页组件
│       │   ├── article-body.tsx        # 文章正文（支持划词交互）
│       │   ├── word-panel.tsx          # 右侧生词面板
│       │   ├── word-card.tsx           # 单个生词卡片
│       │   └── word-popover.tsx        # 划词浮层
│       ├── vocabulary/         # 生词本组件
│       ├── topic/              # 主题相关组件
│       └── ui/                 # 通用基础组件
├── outside.db                  # SQLite 数据库文件（gitignore）
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## 数据库设计

### Schema 定义

```sql
-- 用户表
CREATE TABLE users (
  id          TEXT PRIMARY KEY,           -- nanoid, 16 chars
  email       TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login_at INTEGER
);

-- 主题表
CREATE TABLE topics (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,              -- 如 "daily-conversation"
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content_format TEXT NOT NULL DEFAULT 'essay',
                                          -- dialogue | essay | story | email | mixed | free
  is_builtin  INTEGER NOT NULL DEFAULT 0, -- 1=内置 0=自定义
  prompt_template TEXT NOT NULL DEFAULT '',
  reference_words TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  config      TEXT NOT NULL DEFAULT '{}',      -- JSON TopicConfig
  articles_count INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(user_id, slug)
);

-- 文章表
CREATE TABLE articles (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id    TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  sequence    INTEGER NOT NULL,           -- 该主题下的文章序号
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,              -- 英文原文 Markdown
  translation TEXT NOT NULL DEFAULT '',   -- 中文译文
  difficulty  REAL NOT NULL,              -- 难度等级，如 3.5
  word_count  INTEGER NOT NULL DEFAULT 0,
  review_word_ids TEXT NOT NULL DEFAULT '[]',  -- JSON array of word IDs
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(topic_id, sequence)
);

-- 生词表
CREATE TABLE words (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,              -- 单词原形（小写）
  phonetic    TEXT NOT NULL DEFAULT '',
  definition  TEXT NOT NULL DEFAULT '',
  pos         TEXT NOT NULL DEFAULT '',   -- noun | verb | adj | adv | ...
  familiarity TEXT NOT NULL DEFAULT 'unfamiliar',
                                          -- unfamiliar | vague | familiar
  review_count INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(user_id, text)                   -- 同一用户同一单词只有一条记录
);

-- 生词上下文表（多对多：一个词出现在多篇文章，一篇文章有多个生词）
CREATE TABLE word_contexts (
  id          TEXT PRIMARY KEY,
  word_id     TEXT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  article_id  TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  sentence    TEXT NOT NULL,              -- 单词所在的原文句子
  sentence_translation TEXT NOT NULL DEFAULT '',
  is_review   INTEGER NOT NULL DEFAULT 0, -- 1=复习出现 0=首次标记
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(word_id, article_id)             -- 同一单词在同一文章中只记录一条上下文
);

-- 用户设置表
CREATE TABLE user_settings (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  global_config TEXT NOT NULL DEFAULT '{}',    -- JSON GlobalConfig
  accent      TEXT NOT NULL DEFAULT 'us',      -- us | uk
  auto_pronounce INTEGER NOT NULL DEFAULT 0,
  auto_read_on_select INTEGER NOT NULL DEFAULT 1,
  llm_provider TEXT NOT NULL DEFAULT 'anthropic',  -- anthropic | openai | custom
  llm_model   TEXT NOT NULL DEFAULT 'claude-sonnet-4-5',
  llm_api_key TEXT NOT NULL DEFAULT '',        -- AES-256 加密存储
  llm_base_url TEXT NOT NULL DEFAULT '',
  tts_service TEXT NOT NULL DEFAULT 'web-speech-api'  -- web-speech-api | edge-tts
);
```

### JSON 字段结构

```typescript
// topics.config / user_settings.global_config
interface TopicConfig {
  difficulty_start?: number    // 1-10
  difficulty_step?: number     // 默认 0.3
  difficulty_max?: number      // 默认 8
  article_length?: number      // 默认 300
  review_ratio?: number        // 0-1, 默认 0.3
  review_window?: number       // 默认 5
  new_word_density?: number    // 默认 3
}
```

### 索引

```sql
-- 查询用户的主题列表
CREATE INDEX idx_topics_user ON topics(user_id);

-- 查询某主题下的文章列表（按序号倒序）
CREATE INDEX idx_articles_topic_seq ON articles(topic_id, sequence DESC);

-- 查询用户的所有文章（首页"最近阅读"）
CREATE INDEX idx_articles_user_created ON articles(user_id, created_at DESC);

-- 查询用户的生词本（支持按熟练度筛选）
CREATE INDEX idx_words_user_familiarity ON words(user_id, familiarity, created_at DESC);

-- 查询某个单词的所有上下文
CREATE INDEX idx_word_contexts_word ON word_contexts(word_id, created_at DESC);

-- 查询某篇文章关联的所有生词上下文
CREATE INDEX idx_word_contexts_article ON word_contexts(article_id);

-- Review Weaving 查询：找出用户最近 N 篇文章中标记的、需要复习的生词
-- 利用 articles + word_contexts + words 联合查询，关键索引：
CREATE INDEX idx_words_user_review ON words(user_id, familiarity, review_count);
```

### 数据隔离

所有查询都带 `WHERE user_id = ?` 条件。在 API 层通过中间件统一注入 `userId`，业务代码不需要操心隔离逻辑：

```typescript
// 中间件：从 session 中提取 userId，注入到请求上下文
export async function withAuth(
  handler: (req: Request, userId: string) => Promise<Response>
) {
  return async (req: Request) => {
    const session = await getSession(req)
    if (!session.userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(req, session.userId)
  }
}
```

SQLite 是单文件数据库，所有用户数据存在同一个 `outside.db` 文件中，通过行级别的 `user_id` 字段隔离。不做物理分库——SQLite 的性能瓶颈在写入并发（单写锁），但本产品的写入量很小（生成文章、标记生词），远未达到 SQLite 的瓶颈。

如果未来用户量增长需要迁移，Drizzle ORM 支持切换到 PostgreSQL，schema 定义几乎无需修改。

## 核心模块设计

### 1. 认证流程

```
注册：
  前端 POST /api/auth/register { email, password }
    → 校验邮箱格式、密码强度（≥8位）
    → bcrypt.hash(password, 10)
    → 插入 users 表 + user_settings 表（默认值）
    → 复制内置主题种子数据到该用户名下（5 条 topics 记录）
    → 创建 session，写入加密 cookie
    → 302 重定向到首页

登录：
  前端 POST /api/auth/login { email, password }
    → 查询 users 表
    → bcrypt.compare(password, hash)
    → 创建 session，写入加密 cookie
    → 更新 last_login_at
    → 302 重定向到首页

Session 结构：
  { userId: string }
  通过 iron-session 加密存储在 cookie 中
  cookie 有效期 30 天，sliding expiration
```

### 2. LLM 适配器

统一接口，屏蔽不同供应商的 SDK 差异：

```typescript
interface LLMAdapter {
  // 流式生成，返回 ReadableStream<string>
  streamChat(messages: ChatMessage[], options?: StreamOptions): ReadableStream<string>

  // 非流式生成（用于划词翻译等短文本场景）
  chat(messages: ChatMessage[]): Promise<string>
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface StreamOptions {
  maxTokens?: number
  temperature?: number
}
```

工厂函数根据用户设置创建对应实现：

```typescript
function createLLMAdapter(settings: UserSettings): LLMAdapter {
  switch (settings.llm_provider) {
    case 'anthropic':
      return new AnthropicAdapter(settings.llm_api_key, settings.llm_model)
    case 'openai':
      return new OpenAIAdapter(settings.llm_api_key, settings.llm_model)
    case 'custom':
      // 复用 OpenAI SDK，只替换 baseURL
      return new OpenAIAdapter(settings.llm_api_key, settings.llm_model, settings.llm_base_url)
  }
}
```

API Key 安全：
- 用户提交的 API Key 在写入数据库前用 AES-256-GCM 加密，密钥来自环境变量 `ENCRYPTION_KEY`
- 读取时解密，仅在后端 LLM 调用时使用，永不发送到前端
- 前端设置页显示为 `sk-ant-•••••••••`，编辑时全量覆盖

### 3. 文章生成流水线

```
POST /api/articles { topicId }
  │
  ├── 1. 读取主题配置
  │     合并优先级：topic.config > user_settings.global_config > 系统默认值
  │
  ├── 2. 计算难度
  │     difficulty = min(
  │       config.difficulty_start + (topic.articles_count * config.difficulty_step),
  │       config.difficulty_max
  │     )
  │
  ├── 3. 筛选复习词（Review Weaving）
  │     → 查询该用户最近 review_window 篇文章中标记的生词
  │     → 按优先级排序：unfamiliar > vague > familiar，review_count 少的优先
  │     → 取 ceil(article_length / 100 * new_word_density * review_ratio) 个词
  │     → 同时取出 topic.reference_words 中尚未出现过的词（自定义主题）
  │
  ├── 4. 组装 Prompt
  │     system prompt = base_prompt
  │                   + content_format 指令（对话体 / 学术体 / 故事体...）
  │                   + topic.prompt_template（内置模板或用户自写指令）
  │     user prompt   = 难度参数 + 目标字数
  │                   + 复习词列表（"请自然融入以下单词：..."）
  │                   + 参考词汇（如有）
  │                   + 输出格式要求（JSON：title, content, translation）
  │
  ├── 5. 流式调用 LLM
  │     const stream = adapter.streamChat(messages, { maxTokens, temperature: 0.8 })
  │
  ├── 6. 流式响应
  │     返回 Response with ReadableStream
  │     前端通过 fetch + reader 逐块渲染
  │
  └── 7. 生成完成后（前端回调 POST /api/articles/[id]/finalize）
        → 解析完整 JSON 响应
        → 写入 articles 表
        → topic.articles_count += 1
        → 记录 review_word_ids
```

### 4. Prompt 模板结构

```typescript
function buildArticlePrompt(params: {
  topic: Topic
  difficulty: number
  reviewWords: Word[]
  referenceWords: string[]
  config: TopicConfig
}): ChatMessage[] {
  const system = `You are an English learning content generator.
${getFormatInstructions(params.topic.content_format)}
${params.topic.prompt_template}

Rules:
- Target difficulty level: ${params.difficulty}/10
- Target word count: ~${params.config.article_length} words
- New word density: ~${params.config.new_word_density} per 100 words
- Content must be engaging and enjoyable to read
- Output valid JSON with fields: title, content, translation`

  const reviewSection = params.reviewWords.length > 0
    ? `\nNaturally incorporate these review words: ${params.reviewWords.map(w => w.text).join(', ')}`
    : ''

  const refSection = params.referenceWords.length > 0
    ? `\nPrioritize using these domain words: ${params.referenceWords.join(', ')}`
    : ''

  const user = `Generate a new article.${reviewSection}${refSection}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

// 内容形式指令
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
  }
  return formats[format] || formats.mixed
}
```

### 5. 划词翻译

```
用户在阅读页选中一个单词
  │
  ├── 前端：获取选中文本 + 所在句子（通过 DOM 上下文提取）
  │
  ├── POST /api/translate { word, sentence, articleId }
  │     → LLM 调用，prompt 要求返回 JSON:
  │       { phonetic, definition, pos, sentence_translation }
  │     → 非流式调用（翻译很快，不需要流式）
  │
  ├── 前端：渲染浮层（音标、释义、词性）
  │     → 同时触发 TTS 朗读该单词
  │
  └── 前端：写入生词记录
        POST /api/words { text, phonetic, definition, pos, articleId, sentence, sentenceTranslation }
        → 若 words 表中已有该用户的同一单词，只追加 word_contexts 记录
        → 若为新词，创建 words + word_contexts 记录
```

翻译 Prompt：

```
System: You are a dictionary assistant. Given an English word and the sentence it appears in,
provide: phonetic transcription (US), part of speech, concise Chinese definition
(context-appropriate meaning first), and Chinese translation of the sentence.
Output JSON: { "phonetic": "...", "pos": "...", "definition": "...", "sentence_translation": "..." }

User: Word: "commute"
Sentence: "My commute was a nightmare today."
```

### 6. TTS 实现

**Web Speech API（前端直接调用）**

```typescript
function speak(text: string, accent: 'us' | 'uk') {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = accent === 'us' ? 'en-US' : 'en-GB'
  utterance.rate = 0.9  // 略慢于正常语速，方便学习
  speechSynthesis.speak(utterance)
}
```

**Edge TTS（后端代理）**

```
POST /api/tts { text, accent }
  → 后端调用 edge-tts 包，生成音频流
  → 返回 audio/mpeg 流
  → 前端用 Audio API 播放

前端调用：
  const res = await fetch('/api/tts', { method: 'POST', body: JSON.stringify({ text, accent }) })
  const blob = await res.blob()
  const audio = new Audio(URL.createObjectURL(blob))
  audio.play()
```

### 7. Review Weaving 算法

```typescript
async function selectReviewWords(
  userId: string,
  topicId: string,
  config: TopicConfig
): Promise<Word[]> {
  const { review_ratio, review_window, article_length, new_word_density } = config

  // 目标复习词数量
  const totalNewWords = Math.ceil(article_length / 100 * new_word_density)
  const reviewCount = Math.ceil(totalNewWords * review_ratio)

  // 查询最近 N 篇文章中标记的生词（跨所有主题，复习不限于当前主题）
  const recentArticles = await db.query.articles.findMany({
    where: and(eq(articles.user_id, userId)),
    orderBy: desc(articles.created_at),
    limit: review_window,
    columns: { id: true },
  })
  const recentArticleIds = recentArticles.map(a => a.id)

  // 从这些文章的生词中，按优先级选取
  const candidates = await db
    .select()
    .from(words)
    .innerJoin(wordContexts, eq(words.id, wordContexts.word_id))
    .where(and(
      eq(words.user_id, userId),
      inArray(wordContexts.article_id, recentArticleIds),
      ne(words.familiarity, 'familiar'),  // 已熟悉的不再复习
    ))
    .orderBy(
      // 优先级：陌生 > 模糊，复习次数少的优先
      sql`CASE WHEN ${words.familiarity} = 'unfamiliar' THEN 0 ELSE 1 END`,
      asc(words.review_count),
    )

  // 去重（同一个词可能出现在多篇文章中）并截取
  const unique = [...new Map(candidates.map(c => [c.words.id, c.words])).values()]
  return unique.slice(0, reviewCount)
}
```

### 8. 难度计算

```typescript
function calculateDifficulty(
  articlesCount: number,
  config: TopicConfig
): number {
  const { difficulty_start = 3, difficulty_step = 0.3, difficulty_max = 8 } = config
  const raw = difficulty_start + articlesCount * difficulty_step
  return Math.min(Math.round(raw * 10) / 10, difficulty_max)
}
```

难度等级对照（供 LLM prompt 参考）：

| Level | 词汇范围 | 句式复杂度 | 对标 |
|-------|---------|-----------|------|
| 1-2 | 高频 1000 词 | 简单句为主 | CEFR A1-A2 |
| 3-4 | 高频 3000 词 | 复合句出现 | CEFR B1 |
| 5-6 | 高频 5000 词 + 主题词汇 | 从句嵌套 | CEFR B2 |
| 7-8 | 学术/专业词汇 | 长难句 | CEFR C1 |
| 9-10 | 无限制 | 原生语料级 | CEFR C2 |

## API 设计

所有 API 统一返回 JSON，错误响应格式：`{ error: string }`。

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 `{ email, password }` |
| POST | `/api/auth/login` | 登录 `{ email, password }` |
| POST | `/api/auth/logout` | 退出登录 |

### 主题

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/topics` | 获取当前用户的所有主题 |
| POST | `/api/topics` | 创建自定义主题 |
| PUT | `/api/topics/[id]` | 更新主题（名称、配置等） |
| DELETE | `/api/topics/[id]` | 删除自定义主题（is_builtin=0 才允许） |

### 文章

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/articles?topicId=xxx` | 获取某主题下的文章列表 |
| GET | `/api/articles/[id]` | 获取单篇文章详情（含关联生词） |
| POST | `/api/articles` | 生成新文章（流式响应） |
| POST | `/api/articles/[id]/finalize` | 文章生成完成后落库 |

### 生词

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/words?familiarity=xxx&sort=xxx` | 获取生词列表（支持筛选排序） |
| POST | `/api/words` | 标记新生词 |
| PUT | `/api/words/[id]` | 更新熟练度 |
| GET | `/api/words/[id]/contexts` | 获取某个词的所有上下文 |

### 工具

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/translate` | 划词翻译 `{ word, sentence }` |
| POST | `/api/tts` | Edge TTS 音频流 `{ text, accent }` |
| POST | `/api/settings/test-llm` | 测试 LLM 连接 |

### 设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取用户设置 |
| PUT | `/api/settings` | 更新用户设置 |

## 前端关键交互

### 划词选择

阅读页的文章正文区域监听 `selectionchange` 事件：

```
用户在文章区域划选文本
  ↓
mouseup / selectionchange 触发
  ↓
window.getSelection() 获取选中文本
  ↓
判断选中内容：
  ├── 单个单词 → 触发翻译 + 标记 + TTS
  └── 多个单词/句子 → 仅触发 TTS
  ↓
单词场景：
  → 从 DOM 上下文提取所在句子（向上遍历到 <p> 或 <li>）
  → 显示翻译浮层（Popover，定位到选中文本下方）
  → 调用 POST /api/translate
  → 翻译返回后更新浮层内容
  → 同时调用 POST /api/words 标记生词
  → 文章正文中该单词添加高亮样式
  → 右侧生词面板顶部插入新卡片
```

### 流式文章渲染

```
用户点击"生成文章"
  ↓
前端 POST /api/articles { topicId }
  ↓
fetch 拿到 Response，获取 body.getReader()
  ↓
逐块读取 → 解析文本 → 追加渲染到页面
  ↓
用户在生成过程中就能开始阅读
  ↓
流结束 → 解析完整 JSON → POST /api/articles/[id]/finalize 落库
  ↓
页面切换到完整阅读模式（启用划词等交互）
```

## 部署

单进程 Node.js 应用 + SQLite 文件：

```
Node.js 进程
  ├── Next.js 服务（SSR + API Routes）
  └── SQLite（outside.db 文件在本地磁盘）
```

部署方式：
- 开发环境：`npm run dev`
- 生产环境：`npm run build && npm start`
- 推荐部署到 VPS（如 Fly.io、Railway），SQLite 需要持久化磁盘
- 不适合 Vercel Serverless（SQLite 需要持久化文件系统）

环境变量：

```
SESSION_SECRET=     # iron-session 加密密钥，至少 32 字符
ENCRYPTION_KEY=     # AES-256 加密用户 API Key 的密钥
ANTHROPIC_API_KEY=  # 系统默认 Anthropic API Key（用户未配置自己的 key 时使用）
```
