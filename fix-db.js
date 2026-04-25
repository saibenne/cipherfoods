const { Client } = require('pg');

async function fix() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'your_db_password',
    database: 'cipherfoods',
  });

  await client.connect();

  try {
    await client.query('UPDATE catalog.products SET "categoryId" = category_id');
    console.log('Fixed categoryId in catalog.products');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fix();
