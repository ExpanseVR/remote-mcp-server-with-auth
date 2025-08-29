import { describe, it, expect, vi, beforeEach } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerIdeaTools } from '../../../src/tools/idea-tools'
import { mockProps } from '../../fixtures/auth.fixtures'

// Mock fetch for API calls
const mockFetch = vi.fn()

describe('Idea Tools', () => {
  let mockServer: McpServer
  const env = {
    API_BASE_URL: 'https://api.example.com',
    API_KEY: 'test-api-key',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).fetch = mockFetch
    mockServer = new McpServer({ name: 'test', version: '1.0.0' })
  })

  describe('list_ideas tool', () => {
    it('registers and lists ideas for a user', async () => {
      const toolSpy = vi.spyOn(mockServer, 'tool')

      // Setup mock response
      mockFetch.mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue([{ id: 1, title: 'Idea A' }, { id: 2, title: 'Idea B' }]),
      })

      registerIdeaTools(mockServer, env as any, mockProps)

      // Grab the registered handler for list_ideas
      const toolCall = toolSpy.mock.calls.find(call => call[0] === 'list_ideas')
      const handler = toolCall?.[3] as unknown as (args: { user_id: number }) => Promise<any>

      const result = await handler({ user_id: 123 })

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/v1/ideas?user_id=123', expect.any(Object))
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('Found 2 ideas:')
    })

    it('handles API errors gracefully', async () => {
      const toolSpy = vi.spyOn(mockServer, 'tool')

      mockFetch.mockRejectedValueOnce(new Error('Network down'))

      registerIdeaTools(mockServer, env as any, mockProps)
      const toolCall = toolSpy.mock.calls.find(call => call[0] === 'list_ideas')
      const handler = toolCall?.[3] as unknown as (args: { user_id: number }) => Promise<any>

      const result = await handler({ user_id: 999 })
      expect(result.content[0].text).toContain('Error listing ideas:')
    })
  })
})


