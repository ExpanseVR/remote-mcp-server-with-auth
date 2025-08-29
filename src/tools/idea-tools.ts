// src/tools/idea-tools.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { Props, createSuccessResponse, createErrorResponse } from '../types';

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
type GetIdeaParams = z.infer<typeof GetIdeaSchema>;

const UpdateIdeaSchema = CreateIdeaSchema.partial().extend({
  id: z.number().int().nonnegative().describe("Idea ID to update"),
});
type UpdateIdeaParams = z.infer<typeof UpdateIdeaSchema>;

const DeleteIdeaSchema = z.object({
  id: z.number().int().nonnegative().describe("Idea ID to delete"),
});
type DeleteIdeaParams = z.infer<typeof DeleteIdeaSchema>;

// Tool registration function
export function registerIdeaTools(server: McpServer, env: any, props: Props) {
  
  server.tool(
    "create_idea", 
    "Create a new idea entry. Requires title (string), description (string), and user_id (number). Returns the newly created idea with its assigned ID and timestamp.", 
    CreateIdeaSchema.shape, 
    async (params: CreateIdeaParams) => {
    try {
      const response = await fetch(`${env.API_BASE_URL}/v1/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${env.API_KEY}`
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json() as any;
      return createSuccessResponse('Idea created successfully:', result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createErrorResponse('Error creating idea', message);
    }
  });

  server.tool(
    "list_ideas",
    "List all ideas for a specific user. Requires user_id parameter. Returns array of user's ideas.",
    ListIdeasSchema.shape,
    async (params: ListIdeasParams) => {
    try {
      const response = await fetch(`${env.API_BASE_URL}/v1/ideas?user_id=${params.user_id}`, {
        method: 'GET',
        //headers: {
          // 'Authorization': `Bearer ${env.API_KEY}`
        //}
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const ideas = await response.json() as any[];

      return createSuccessResponse(`Found ${ideas.length} ideas:`, ideas);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createErrorResponse('Error listing ideas', message);
    }
  });

  server.tool(
    "get_idea", 
    "Retrieve a specific idea by its ID. Returns full idea details including title, description, and metadata.", 
    GetIdeaSchema.shape, 
    async (params: GetIdeaParams) => {
    try {
      const response = await fetch(`${env.API_BASE_URL}/v1/ideas/${params.id}`, {
        method: 'GET',
        //headers: {
          // 'Authorization': `Bearer ${env.API_KEY}`
        //}
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const idea = await response.json() as any;
      return createSuccessResponse('Idea details:', idea);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createErrorResponse('Error getting idea', message);
    }
  });

  server.tool(
    "update_idea", 
    "Update an idea. Requires id parameter and any number of fields to update. Returns the updated idea details.", 
    UpdateIdeaSchema.shape, 
    async (params: UpdateIdeaParams) => {
    try {
      const { id, ...body } = params;
      const response = await fetch(`${env.API_BASE_URL}/v1/ideas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          //'Authorization': `Bearer ${env.API_KEY}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updated = await response.json() as any;
      return createSuccessResponse('Idea updated:', updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createErrorResponse('Error updating idea', message);
    }
  });

  server.tool(
    "delete_idea", 
    "Delete an idea. Requires id parameter. Returns success message if idea was deleted. This action is irreversible.", 
    DeleteIdeaSchema.shape, 
    async (params: DeleteIdeaParams) => {
    try {
      const response = await fetch(`${env.API_BASE_URL}/v1/ideas/${params.id}`, {
        method: 'DELETE',
        //headers: {
          //'Authorization': `Bearer ${env.API_KEY}`
        //}
      });
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        result = {} as Record<string, unknown>;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const hasBody = typeof result === 'object' && result !== null && Object.keys(result as Record<string, unknown>).length > 0;
      return hasBody
        ? createSuccessResponse(`Idea ${params.id} deleted:`, result)
        : createSuccessResponse(`Idea ${params.id} deleted`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return createErrorResponse('Error deleting idea', message);
    }
  });
}
