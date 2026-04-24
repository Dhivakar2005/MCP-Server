import { config } from '../../config.js';
import { successResponse, errorResponse } from '../../utils/response.js';

function getGithubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'MCP-Unified-Server',
  };
  if (config.githubToken) {
    headers['Authorization'] = `token ${config.githubToken}`;
  }
  return headers;
}

export const devtoolsTools = [
  {
    name: 'devtools_search_repo',
    description: 'Search for files or code within a GitHub repository.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository name (e.g., owner/repo)',
        },
        query: {
          type: 'string',
          description: 'Search query',
        },
      },
      required: ['repo', 'query'],
    },
  },
  {
    name: 'devtools_read_repo_file',
    description: 'Read a file from a GitHub repository.',
    inputSchema: {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'Repository name (e.g., owner/repo)',
        },
        path: {
          type: 'string',
          description: 'Path to the file within the repository',
        },
        ref: {
          type: 'string',
          description: 'Optional branch or commit ref',
        },
      },
      required: ['repo', 'path'],
    },
  },
  {
    name: 'devtools_explain_code',
    description: 'Analyze code and prepare it for explanation.',
    inputSchema: {
      type: 'object',
      properties: {
        fileContent: {
          type: 'string',
          description: 'The raw code to explain',
        },
      },
      required: ['fileContent'],
    },
  },
];

export async function handleDevtoolsTool(name, args) {
  try {
    const headers = getGithubHeaders();

    if (name === 'devtools_search_repo') {
      const { repo, query } = args;
      // https://docs.github.com/en/rest/search?apiVersion=2022-11-28#search-code
      const q = encodeURIComponent(`${query} repo:${repo}`);
      const url = `https://api.github.com/search/code?q=${q}`;
      
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
      const data = await res.json();
      
      return {
        content: [{ type: 'text', text: successResponse({ items: data.items }) }],
      };
    }

    if (name === 'devtools_read_repo_file') {
      const { repo, path, ref } = args;
      let url = `https://api.github.com/repos/${repo}/contents/${path}`;
      if (ref) url += `?ref=${ref}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
      const data = await res.json();

      if (data.type === 'file' && data.encoding === 'base64') {
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return {
          content: [{ type: 'text', text: successResponse({ content }) }],
        };
      }
      return {
        content: [{ type: 'text', text: successResponse({ data }) }],
      };
    }

    if (name === 'devtools_explain_code') {
      const { fileContent } = args;
      const lines = fileContent.split('\n').length;
      
      return {
        content: [{ 
          type: 'text', 
          text: successResponse({
            metadata: {
              lineCount: lines,
              charCount: fileContent.length,
            },
            instructionForAI: "As an AI, analyze the provided fileContent and provide a detailed explanation of its architecture and logic.",
            fileContent
          }) 
        }],
      };
    }

    throw new Error(`Unknown devtools tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: errorResponse(error.message || String(error)) }],
      isError: true,
    };
  }
}
