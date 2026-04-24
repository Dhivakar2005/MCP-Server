import { calendarTools } from './src/modules/calendar/index.js';
import { filesystemTools } from './src/modules/filesystem/index.js';
import { databaseTools } from './src/modules/database/index.js';
import { tasksTools } from './src/modules/tasks/index.js';
import { devtoolsTools } from './src/modules/devtools/index.js';

const allTools = [
  ...filesystemTools,
  ...databaseTools,
  ...tasksTools,
  ...calendarTools,
  ...devtoolsTools,
];

console.log("Current Tool List:");
allTools.forEach(t => console.log(` - ${t.name}`));
