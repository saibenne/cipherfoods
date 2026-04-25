const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || 'your_db_password',
  database: 'cipherfoods'
});

async function run() {
  await client.connect();
  const vendorId = '79b73359-44f3-4b60-bac4-c98f07c69ed5';
  
  // Delete old products
  console.log("Deleting old products...");
  await client.query('DELETE FROM cart.cart_items').catch(() => {});
  await client.query('DELETE FROM "order".order_items').catch(() => {});
  await client.query('DELETE FROM review.reviews').catch(() => {});
  await client.query('DELETE FROM catalog.product_variants');
  await client.query('DELETE FROM catalog.products');
  
  const cats = await client.query('SELECT * FROM catalog.categories');
  console.log(`Found ${cats.rows.length} categories.`);
  
  for (const cat of cats.rows) {
    console.log(`Adding 10 products for ${cat.name}...`);
    for (let i = 1; i <= 10; i++) {
      const pid = uuidv4();
      const pName = `${cat.name} Item ${i}`;
      const desc = `Premium quality ${cat.name} sourced directly from farms.`;
      const price = Math.floor(Math.random() * 500) + 100;
      
      await client.query(
        'INSERT INTO catalog.products (id, name, slug, description, "basePrice", images, unit, "category_id", "vendorId", "isActive", "isFeatured", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())',
        [pid, pName, pid, desc, price, JSON.stringify([]), '1 kg', cat.id, vendorId, true, false]
      );
      
      await client.query(
        'INSERT INTO catalog.product_variants (id, name, sku, price, "stockQuantity", "product_id", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [uuidv4(), '1 kg', 'SKU-' + pid.slice(0,5), price, 100, pid]
      );
    }
  }
  
  console.log("Successfully added 10 products per category.");
  await client.end();
}
run();
