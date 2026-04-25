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
  
  const targetEmail = 'vendor@cipherfoods.test';
  const targetUserId = '5179c272-1bdd-4ef0-86df-00236946ba3c';
  
  // 1. Ensure the vendor record exists for this user
  console.log("Checking vendor record...");
  const vendorRes = await client.query("SELECT * FROM vendor.vendors WHERE \"userId\" = $1", [targetUserId]);
  
  if (vendorRes.rows.length === 0) {
    console.log("No vendor found for target user. Updating the existing vendor profile to belong to this user...");
    // Update the existing vendor record's userId and email
    await client.query(
      "UPDATE vendor.vendors SET \"userId\" = $1, email = $2 WHERE email = 'vendor@cipher.com'",
      [targetUserId, targetEmail]
    );
  } else {
    console.log("Vendor record already exists for this user.");
  }

  // 2. Update all products to point to the userId (which the API uses as vendorId)
  console.log("Updating products to use the correct vendorId (userId)...");
  await client.query("UPDATE catalog.products SET \"vendorId\" = $1", [targetUserId]);
  
  // 3. Verify
  const productCheck = await client.query("SELECT count(*) FROM catalog.products WHERE \"vendorId\" = $1", [targetUserId]);
  console.log(`Verified: ${productCheck.rows[0].count} products now belong to vendorId ${targetUserId}`);

  await client.end();
}
run();
