import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const SAFE_DIR = path.resolve(config.safeDir);

function isSafePath(targetPath) {
  const resolved = path.resolve(SAFE_DIR, targetPath);
  return resolved.startsWith(SAFE_DIR);
}

export const filesystemTools = [
  {
    name: 'fs_list_files',
    description: 'List files and directories in a given path within the safe directory.',
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: {
          type: 'string',
          description: 'Relative path to list files from, defaults to root of safe directory',
        },
      },
    },
  },
  {
    name: 'fs_read_file',
    description: 'Read the contents of a file within the safe directory.',
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: {
          type: 'string',
          description: 'Relative path to the file to read',
        },
      },
      required: ['targetPath'],
    },
  },
  {
    name: 'fs_write_file',
    description: 'Write content to a file within the safe directory.',
    inputSchema: {
      type: 'object',
      properties: {
        targetPath: {
          type: 'string',
          description: 'Relative path to the file to write',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
      },
      required: ['targetPath', 'content'],
    },
  },
];

export async function handleFilesystemTool(name, args) {
  try {
    const targetPath = args.targetPath || '';
    const resolvedPath = path.resolve(SAFE_DIR, targetPath);

    if (!isSafePath(targetPath)) {
      throw new Error(`Path is outside the allowed safe directory: ${SAFE_DIR}`);
    }

    if (name === 'fs_list_files') {
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      const files = entries.map(e => ({ name: e.name, isDirectory: e.isDirectory() }));
      return {
        content: [{ type: 'text', text: successResponse({ files }) }],
      };
    }

    if (name === 'fs_read_file') {
      const content = await fs.readFile(resolvedPath, 'utf8');
      return {
        content: [{ type: 'text', text: successResponse({ content }) }],
      };
    }

    if (name === 'fs_write_file') {
      // Ensure the directory exists
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
      await fs.writeFile(resolvedPath, args.content, 'utf8');
      return {
        content: [{ type: 'text', text: successResponse({ message: `File written successfully to ${targetPath}` }) }],
      };
    }

    throw new Error(`Unknown filesystem tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: errorResponse(error.message || String(error)) }],
      isError: true,
    };
  }
}
