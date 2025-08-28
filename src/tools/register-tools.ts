import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Props } from "../types";
import { registerIdeaTools } from "./idea-tools";

/**
 * Register all MCP tools based on user permissions
 */
export function registerAllTools(server: McpServer, env: Env, props: Props) {
	// Future tools can be registered here
	registerIdeaTools(server, env, props);
}