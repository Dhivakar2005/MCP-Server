import Database from 'better-sqlite3';
import { config } from '../../config.js';
import { successResponse, errorResponse } from '../../utils/response.js';

// Lazy load the database connection
let dbInstance = null;
function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(config.dbPath);
    // Initialize tasks table if it doesn't exist (useful for the tasks module)
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        deadline TEXT,
        status TEXT DEFAULT 'pending'
      )
    `);
  }
  return dbInstance;
}

export const databaseTools = [
  {
    name: 'db_list_tables',
    description: 'List all tables in the SQLite database.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'db_describe_table',
    description: 'Get the schema/columns of a specific table.',
    inputSchema: {
      type: 'object',
      properties: {
        tableName: {
          type: 'string',
          description: 'Name of the table to describe',
        },
      },
      required: ['tableName'],
    },
  },
  {
    name: 'db_run_query',
    description: 'Run a READ-ONLY (SELECT) SQL query against the database.',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'The SELECT SQL query to run',
        },
      },
      required: ['sql'],
    },
  },
];

export async function handleDatabaseTool(name, args) {
  try {
    const db = getDb();

    if (name === 'db_list_tables') {
      const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
      const tables = stmt.all();
      return {
        content: [{ type: 'text', text: successResponse({ tables }) }],
      };
    }

    if (name === 'db_describe_table') {
      const { tableName } = args;
      // SQLite PRAGMA cannot use standard bound parameters in some contexts,
      // but better-sqlite3 handles template strings securely if we don't inject raw.
      // Alternatively, just inject if validated, but PRAGMA table_info is safe.
      const stmt = db.prepare(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`);
      const columns = stmt.all();
      return {
        content: [{ type: 'text', text: successResponse({ columns }) }],
      };
    }

    if (name === 'db_run_query') {
      const { sql } = args;
      
      // Basic security check to ensure it's a SELECT query
      const trimmedQuery = sql.trim().toUpperCase();
      if (!trimmedQuery.startsWith('SELECT') && !trimmedQuery.startsWith('PRAGMA')) {
        throw new Error('Only SELECT or PRAGMA queries are allowed for security reasons.');
      }

      const stmt = db.prepare(sql);
      const results = stmt.all();
      return {
        content: [{ type: 'text', text: successResponse({ results }) }],
      };
    }

    throw new Error(`Unknown database tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: errorResponse(error.message || String(error)) }],
      isError: true,
    };
  }
}

// Export getDb for other modules like Tasks
export { getDb };
