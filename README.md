# Unified MCP Server

A production-ready Model Context Protocol (MCP) server providing a unified suite of tools for task management, calendar integration, developer operations, and safe filesystem access.

## Modules & Tools

### 📁 Filesystem
- `fs_list_files`: Securely list files in the safe directory.
- `fs_read_file`: Read file contents.
- `fs_write_file`: Write data to files.

### 📝 Tasks
- `tasks_get_tasks`: Retrieve tasks from local SQLite storage.
- `tasks_add_task`: Create new tasks with deadlines.
- `tasks_update_task`: Mark tasks as completed or pending.

### 📅 Calendar (Google)
- `calendar_get_events`: Sync with your personal Google Calendar.
- `calendar_create_event`: Add events directly via AI.
- `calendar_get_auth_url`: One-time setup link.
- `calendar_set_auth_code`: Finalize secure OAuth2 connection.

### 🗄️ Database
- `db_list_tables`: Explore your local SQLite schema.
- `db_run_query`: Execute safe, read-only SELECT queries.

### 🛠️ DevTools (GitHub)
- `devtools_search_repo`: Search code across any public/private GitHub repo.
- `devtools_read_repo_file`: Fetch raw code from GitHub.
- `devtools_explain_code`: AI-ready code analysis.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configuration:**
   Rename `.env.example` to `.env` and fill in your GITHUB_TOKEN and Google OAuth credentials.

3. **Authentication:**
   Run the server and use the `calendar_get_auth_url` tool to link your personal Google account.

4. **Run Server:**
   ```bash
   node index.js
   ```

## Security
- **Filesystem:** Access is restricted to the `SAFE_DIR` defined in `.env`.
- **Database:** Only `SELECT` and `PRAGMA` queries are allowed to prevent data loss.
- **Tokens:** OAuth2 refresh tokens are stored locally and never shared with the AI.
