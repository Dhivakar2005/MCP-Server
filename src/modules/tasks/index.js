import { getDb } from '../database/index.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export const tasksTools = [
  {
    name: 'tasks_get_tasks',
    description: 'Retrieve tasks, optionally filtered by deadline date.',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Optional date string (e.g., YYYY-MM-DD) to filter tasks by deadline',
        },
      },
    },
  },
  {
    name: 'tasks_add_task',
    description: 'Add a new task with a title and optional deadline.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the task',
        },
        deadline: {
          type: 'string',
          description: 'Optional deadline for the task (e.g., YYYY-MM-DD)',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'tasks_update_task',
    description: 'Update the status of an existing task by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The ID of the task to update',
        },
        status: {
          type: 'string',
          description: 'The new status (e.g., pending, completed)',
        },
      },
      required: ['id', 'status'],
    },
  },
];

export async function handleTasksTool(name, args) {
  try {
    const db = getDb(); // Initializes tables if needed

    if (name === 'tasks_get_tasks') {
      const { date } = args;
      let stmt;
      let tasks;
      if (date) {
        stmt = db.prepare('SELECT * FROM tasks WHERE deadline = ?');
        tasks = stmt.all(date);
      } else {
        stmt = db.prepare('SELECT * FROM tasks');
        tasks = stmt.all();
      }
      return {
        content: [{ type: 'text', text: successResponse({ tasks }) }],
      };
    }

    if (name === 'tasks_add_task') {
      const { title, deadline } = args;
      const stmt = db.prepare('INSERT INTO tasks (title, deadline) VALUES (?, ?)');
      const info = stmt.run(title, deadline || null);
      return {
        content: [{ type: 'text', text: successResponse({ id: info.lastInsertRowid, message: 'Task added successfully' }) }],
      };
    }

    if (name === 'tasks_update_task') {
      const { id, status } = args;
      const stmt = db.prepare('UPDATE tasks SET status = ? WHERE id = ?');
      const info = stmt.run(status, id);
      if (info.changes === 0) {
        throw new Error(`Task with ID ${id} not found.`);
      }
      return {
        content: [{ type: 'text', text: successResponse({ message: 'Task updated successfully' }) }],
      };
    }

    throw new Error(`Unknown tasks tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: errorResponse(error.message || String(error)) }],
      isError: true,
    };
  }
}
