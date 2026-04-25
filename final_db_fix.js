const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || 'your_db_password',
  database: 'cipherfoods'
});
async function run() {
  await client.connect();
  
  console.log("Updating categoryId to match category_id...");
  await client.query('UPDATE catalog.products SET "categoryId" = category_id WHERE "categoryId" IS NULL AND category_id IS NOT NULL');
  
  console.log("Updating search vectors for all products...");
  await client.query(`
    UPDATE catalog.products
    SET "searchVector" = 
      setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE("shortDescription", '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'C')
  `);

  console.log("Checking products count per category again...");
  const res = await client.query('SELECT "categoryId", count(*) FROM catalog.products GROUP BY "categoryId"');
  console.log(res.rows);

  await client.end();
}
run();
