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
  const res = await client.query("SELECT id, \"userId\", email FROM vendor.vendors WHERE \"userId\" = '5179c272-1bdd-4ef0-86df-00236946ba3c'");
  console.log("Vendor for user:", res.rows);
  await client.end();
}
run();
