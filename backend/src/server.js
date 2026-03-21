const app = require('./app');
const env = require('./config/env');
const { query } = require('./config/db');

async function start() {
  await query('SELECT 1');

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`B3 Enterprise backend is running on port ${env.port}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error.message);
  process.exit(1);
});
