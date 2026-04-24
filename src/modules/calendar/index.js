import { google } from 'googleapis';
import fs from 'fs/promises';
import { config } from '../../config.js';
import { successResponse, errorResponse } from '../../utils/response.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getOAuth2Client() {
  if (!config.googleClientId || !config.googleClientSecret) {
    throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set.');
  }
  return new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.googleRedirectUri
  );
}

async function getAuthenticatedClient() {
  const oAuth2Client = getOAuth2Client();
  try {
    const token = await fs.readFile(config.googleTokenPath, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    throw new Error('Not authenticated. Please use calendar_get_auth_url to log in first.');
  }
}

export const calendarTools = [
  {
    name: 'calendar_get_auth_url',
    description: 'Get the URL to authorize the MCP server with your Google account.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'calendar_set_auth_code',
    description: 'Exchange the authorization code for a token to complete the login.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'The code from the Google auth page' },
      },
      required: ['code'],
    },
  },
  {
    name: 'calendar_get_events',
    description: 'Retrieve calendar events for a specific date.',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'YYYY-MM-DD' },
        calendarId: { type: 'string', description: 'Defaults to primary' },
      },
      required: ['date'],
    },
  },
  {
    name: 'calendar_create_event',
    description: 'Create a new calendar event.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        startTime: { type: 'string', description: 'ISO format' },
        endTime: { type: 'string', description: 'ISO format' },
        calendarId: { type: 'string' },
      },
      required: ['title', 'startTime', 'endTime'],
    },
  },
];

export async function handleCalendarTool(name, args) {
  try {
    if (name === 'calendar_get_auth_url') {
      const oAuth2Client = getOAuth2Client();
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      return {
        content: [{ type: 'text', text: successResponse({ authUrl, instruction: 'Open this URL in your browser, log in, and copy the code back to calendar_set_auth_code.' }) }],
      };
    }

    if (name === 'calendar_set_auth_code') {
      const oAuth2Client = getOAuth2Client();
      const { tokens } = await oAuth2Client.getToken(args.code);
      await fs.writeFile(config.googleTokenPath, JSON.stringify(tokens));
      return {
        content: [{ type: 'text', text: successResponse({ message: 'Authentication successful! You can now use calendar tools.' }) }],
      };
    }

    // Tools below require authentication
    const auth = await getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = args.calendarId || 'primary';

    if (name === 'calendar_get_events') {
      const { date } = args;
      const timeMin = new Date(`${date}T00:00:00Z`).toISOString();
      const timeMax = new Date(`${date}T23:59:59Z`).toISOString();
      const res = await calendar.events.list({ calendarId, timeMin, timeMax, singleEvents: true, orderBy: 'startTime' });
      return { content: [{ type: 'text', text: successResponse({ events: res.data.items }) }] };
    }

    if (name === 'calendar_create_event') {
      const { title, startTime, endTime } = args;
      const event = { summary: title, start: { dateTime: startTime }, end: { dateTime: endTime } };
      const res = await calendar.events.insert({ calendarId, resource: event });
      return { content: [{ type: 'text', text: successResponse({ event: res.data }) }] };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [{ type: 'text', text: errorResponse(error.message || String(error)) }],
      isError: true,
    };
  }
}
