import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  githubToken: process.env.GITHUB_TOKEN || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost',
  googleTokenPath: process.env.GOOGLE_TOKEN_PATH || 'token.json',
  safeDir: process.env.SAFE_DIR || process.cwd(),
  dbPath: process.env.DB_PATH || 'data.db',
};
