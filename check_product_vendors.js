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
  const res = await client.query("SELECT \"vendorId\", count(*) FROM catalog.products GROUP BY \"vendorId\"");
  console.log("Product vendor IDs:", res.rows);
  await client.end();
}
run();
