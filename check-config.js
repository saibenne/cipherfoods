const { Client } = require('pg');

async function check() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'your_db_password',
    database: 'cipherfoods',
  });

  await client.connect();

  try {
    const res = await client.query('SELECT key, value FROM admin.platform_config');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
