const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const connectionConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || ''
};

const databaseName = process.env.DB_NAME;
const migrationDir = path.resolve(__dirname, '../migrations');

async function ensureDatabase() {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  } finally {
    await connection.end();
  }
}

async function ensureMigrationTable(connection) {
  await connection.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query('SELECT migration_name FROM schema_migrations');
  return new Set(rows.map((row) => row.migration_name));
}

async function run() {
  await ensureDatabase();

  const connection = await mysql.createConnection({
    ...connectionConfig,
    database: databaseName,
    multipleStatements: true
  });

  try {
    await ensureMigrationTable(connection);

    const files = (await fs.readdir(migrationDir))
      .filter((name) => name.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    const applied = await getAppliedMigrations(connection);

    for (const file of files) {
      if (applied.has(file)) {
        // eslint-disable-next-line no-console
        console.log(`Skipping already applied migration: ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationDir, file), 'utf8');

      // eslint-disable-next-line no-console
      console.log(`Applying migration: ${file}`);
      await connection.query(sql);
      await connection.query('INSERT INTO schema_migrations (migration_name) VALUES (?)', [file]);
    }

    // eslint-disable-next-line no-console
    console.log('Migrations completed successfully.');
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', error.message);
  process.exit(1);
});
