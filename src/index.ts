import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
import { z } from "zod";
import { COMPONENT_DOCS } from './data/components.generated'

const COMPONENT_NAMES = Object.keys(COMPONENT_DOCS).sort((left, right) =>
  left.localeCompare(right),
)

const normalizeComponentName = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/\.md$/, '')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const findSuggestions = (value: string): string[] => {
  const directMatches = COMPONENT_NAMES.filter((name) => {
    return name.includes(value) || value.includes(name)
  })

  if (directMatches.length > 0) {
    return directMatches.slice(0, 5)
  }

  if (value.length < 2) {
    return []
  }

  const prefix = value.slice(0, 2)
  return COMPONENT_NAMES.filter((name) => name.startsWith(prefix)).slice(0, 5)
}

function createServer() {
  const server = new McpServer({
    name: "daisyui-docs",
    version: "1.0.0",
  });

  server.tool(
    "list_components",
    "List all available DaisyUI components with their descriptions. Use this to discover what components are available.",
    {},
    async () => {
      const components = COMPONENT_NAMES.map((name) => ({
        name,
        description: COMPONENT_DOCS[name]?.description ?? '',
      }))
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ total: components.length, components }, null, 2),
          },
        ],
      }
    },
  )

  server.tool(
    "get_component",
    "Get full documentation for a specific DaisyUI component including all variants, classes, and code examples.",
    {
      name: z.string().describe('The name of the daisyUI component (e.g., "button", "card", "input", "checkbox")'),
    },
    async ({ name }) => {
      const normalizedName = normalizeComponentName(name)
      const component = COMPONENT_DOCS[normalizedName]

      if (!component) {
        const suggestions = findSuggestions(normalizedName)
        return {
          content: [
            {
              type: 'text',
              text: `Component '${name}' not found.` + (suggestions.length > 0 ? `\n\nDid you mean?\n  - ${suggestions.join('\n  - ')}` : ''),
            },
          ],
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              name: normalizedName,
              description: component.description,
              markdown: component.markdown,
              sourceUrl: `https://daisyui.com/components/${normalizedName}/`,
            }, null, 2),
          },
        ],
      }
    },
  )

  server.tool(
    "search_components",
    "Search DaisyUI components by name or keyword. Returns matching components with their descriptions.",
    {
      query: z.string().describe('The search query to filter components by name or description'),
      limit: z.number().optional().default(10).describe('Maximum number of results to return'),
    },
    async ({ query, limit = 10 }) => {
      const searchTerm = query.toLowerCase()
      const results = COMPONENT_NAMES
        .filter((name) => {
          const description = COMPONENT_DOCS[name]?.description?.toLowerCase() ?? ''
          return name.includes(searchTerm) || description.includes(searchTerm)
        })
        .slice(0, limit)
        .map((name) => ({
          name,
          description: COMPONENT_DOCS[name]?.description ?? '',
        }))

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ query: searchTerm, total: results.length, results }, null, 2),
          },
        ],
      }
    },
  )

  return server
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      const mcpHandler = createMcpHandler(createServer(), {
        route: "/mcp",
      });
      return mcpHandler(request, env as Record<string, unknown>, ctx);
    }

    return new Response("DaisyUI Docs MCP Server - Use /mcp endpoint for MCP tools", { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  },
};

export type Env = {}
