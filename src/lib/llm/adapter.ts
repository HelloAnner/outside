export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamOptions {
  maxTokens?: number
  temperature?: number
}

export interface LLMAdapter {
  streamChat(messages: ChatMessage[], options?: StreamOptions): ReadableStream<string>
  chat(messages: ChatMessage[]): Promise<string>
}

export function createLLMAdapter(provider: string, apiKey: string, model: string, baseUrl?: string): LLMAdapter {
  switch (provider) {
    case 'anthropic':
      return createAnthropicAdapter(apiKey, model)
    case 'openai':
      return createOpenAIAdapter(apiKey, model)
    case 'custom':
      return createOpenAIAdapter(apiKey, model, baseUrl)
    default:
      return createAnthropicAdapter(apiKey, model)
  }
}

function createAnthropicAdapter(apiKey: string, model: string): LLMAdapter {
  const Anthropic = require('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })

  return {
    streamChat(messages: ChatMessage[], options?: StreamOptions): ReadableStream<string> {
      const systemMsg = messages.find(m => m.role === 'system')
      const chatMessages = messages.filter(m => m.role !== 'system')

      return new ReadableStream({
        async start(controller) {
          try {
            const stream = client.messages.stream({
              model,
              max_tokens: options?.maxTokens || 4096,
              temperature: options?.temperature || 0.8,
              system: systemMsg?.content || '',
              messages: chatMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            })

            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                controller.enqueue(event.delta.text)
              }
            }
            controller.close()
          } catch (err) {
            controller.error(err)
          }
        },
      })
    },

    async chat(messages: ChatMessage[]): Promise<string> {
      const systemMsg = messages.find(m => m.role === 'system')
      const chatMessages = messages.filter(m => m.role !== 'system')

      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: systemMsg?.content || '',
        messages: chatMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      })

      return response.content[0].type === 'text' ? response.content[0].text : ''
    },
  }
}

function createOpenAIAdapter(apiKey: string, model: string, baseUrl?: string): LLMAdapter {
  const OpenAI = require('openai')
  const client = new OpenAI({ apiKey, baseURL: baseUrl || undefined })

  return {
    streamChat(messages: ChatMessage[], options?: StreamOptions): ReadableStream<string> {
      return new ReadableStream({
        async start(controller) {
          try {
            const stream = await client.chat.completions.create({
              model,
              messages: messages.map(m => ({ role: m.role, content: m.content })),
              max_tokens: options?.maxTokens || 4096,
              temperature: options?.temperature || 0.8,
              stream: true,
            })

            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta?.content
              if (delta) controller.enqueue(delta)
            }
            controller.close()
          } catch (err) {
            controller.error(err)
          }
        },
      })
    },

    async chat(messages: ChatMessage[]): Promise<string> {
      const response = await client.chat.completions.create({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 1024,
      })

      return response.choices[0]?.message?.content || ''
    },
  }
}
