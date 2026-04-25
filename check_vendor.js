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
  // Check if there is a vendor with email vendor@cipherfoods.test
  const vendors = await client.query(`SELECT * FROM "vendor"."vendors" WHERE email = 'vendor@cipherfoods.test'`);
  console.log("Vendors with email vendor@cipherfoods.test:", vendors.rows);
  
  if (vendors.rows.length === 0) {
      const allVendors = await client.query(`SELECT id, businessName, email FROM "vendor"."vendors"`);
      console.log("All Vendors:", allVendors.rows);
  }

  await client.end();
}
run();
