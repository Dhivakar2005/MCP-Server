import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { filesystemTools, handleFilesystemTool } from './src/modules/filesystem/index.js';
import { databaseTools, handleDatabaseTool } from './src/modules/database/index.js';
import { tasksTools, handleTasksTool } from './src/modules/tasks/index.js';
import { calendarTools, handleCalendarTool } from './src/modules/calendar/index.js';
import { devtoolsTools, handleDevtoolsTool } from './src/modules/devtools/index.js';

const server = new Server(
  {
    name: 'mcp-server-unified',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// All tools from modules will be aggregated here
const allTools = [
  ...filesystemTools,
  ...databaseTools,
  ...tasksTools,
  ...calendarTools,
  ...devtoolsTools,
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name.startsWith('fs_')) return await handleFilesystemTool(name, args);
    if (name.startsWith('db_')) return await handleDatabaseTool(name, args);
    if (name.startsWith('tasks_')) return await handleTasksTool(name, args);
    if (name.startsWith('calendar_')) return await handleCalendarTool(name, args);
    if (name.startsWith('devtools_')) return await handleDevtoolsTool(name, args);

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            data: null,
            error: error.message || String(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Unified MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
