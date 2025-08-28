// src/tools/idea-tools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { Props } from '../types';

// Schemas for your tools
const CreateIdeaSchema = z.object({
  title: z.string().min(1).describe("Title of the idea"),
  user_id: z.number().int().nonnegative().describe("User who created the idea"),
  description: z.string().min(1).describe("Description of the idea"),
  status: z.string().min(1).describe("Current status of the idea"),
  category: z.string().min(1).describe("Category of the idea"),
  priority: z.string().min(1).describe("Priority level of the idea"),
});

const ListIdeasSchema = z.object({
  user_id: z.number().describe("User ID to list ideas for")
});

const GetIdeaSchema = z.object({
  id: z.number().describe("Idea ID to retrieve")
});

type CreateIdeaParams = z.infer<typeof CreateIdeaSchema>;
type ListIdeasParams = z.infer<typeof ListIdeasSchema>;

// Tool registration function
export function registerIdeaTools(server: McpServer, env: any, props: Props) {
  
  server.tool("create_idea", "Create a new idea", CreateIdeaSchema.shape, async (params: CreateIdeaParams) => {
    try {
      const response = await fetch(`${env.API_BASE_URL}/v1/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.API_KEY}`
        },
        body: JSON.stringify(params)
      });
      
      const result = await response.json() as any;
      
      return {
        content: [{
          type: "text",
          text: `Idea created successfully: ${JSON.stringify(result, null, 2)}`
        }]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `Error creating idea: ${message}`
        }]
      };
    }
  });

  server.tool("list_ideas", "List ideas for a user", ListIdeasSchema.shape, async (params: ListIdeasParams) => {
    try {
      const response = await fetch(`${env.API_BASE_URL}/v1/ideas?user_id=${params.user_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${env.API_KEY}`
        }
      });
      
      const ideas = await response.json() as any[];
      
      return {
        content: [{
          type: "text", 
          text: `Found ${ideas.length} ideas:\n\n${JSON.stringify(ideas, null, 2)}`
        }]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: "text",
          text: `Error listing ideas: ${message}`
        }]
      };
    }
  });

  // Add get_idea, update_idea, delete_idea tools...
}