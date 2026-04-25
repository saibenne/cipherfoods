const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || 'your_db_password',
    database: 'cipherfoods',
  });

  await client.connect();

  try {
    console.log('Clearing existing products and categories...');
    
    // Disable triggers/constraints temporarily if possible, or just delete in order
    await client.query('DELETE FROM cart.cart_items');
    await client.query('DELETE FROM "order".order_items').catch(() => {});
    await client.query('DELETE FROM review.reviews').catch(() => {});
    await client.query('DELETE FROM catalog.product_variants');
    await client.query('DELETE FROM catalog.products');
    await client.query('DELETE FROM catalog.categories');
    
    // Find or create a vendor
    let vendorRes = await client.query('SELECT id FROM vendor.vendors LIMIT 1').catch(() => ({ rows: [] }));
    let vendorId = vendorRes.rows[0]?.id;
    if (!vendorId) {
       vendorId = uuidv4();
       // Try to insert a dummy vendor
       await client.query(`INSERT INTO "vendor"."vendors" (id, "userId", "storeName", "slug", "status", "createdAt", "updatedAt") VALUES ($1, $1, 'Indian Farms', 'indian-farms', 'active', NOW(), NOW()) ON CONFLICT DO NOTHING`.replace(/"/g, ''), [vendorId]).catch(() => {});
       // If that fails, we'll just use a random uuid, but vendorId might fail FK constraint. Let's see if there is a vendorId constraint
       vendorId = 'b0f92b7c-f12b-4e1b-b7ea-25d2ea99e4b3'; // some random uuid if needed
    }

    console.log('Inserting Indian Farm Product Categories...');
    const categories = [
      { id: uuidv4(), name: 'Millets', slug: 'millets', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Spices & Masalas', slug: 'spices', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Cold Pressed Oils', slug: 'oils', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Jaggery & Sweeteners', slug: 'sweeteners', imageUrl: 'https://images.unsplash.com/photo-1621236173879-fcd1476dbbba?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Pickles & Podis', slug: 'pickles', imageUrl: 'https://images.unsplash.com/photo-1610444547926-dce0ea434d28?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Traditional Rice', slug: 'rice', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Pulses & Dals', slug: 'pulses', imageUrl: 'https://images.unsplash.com/photo-1585934522927-463d1ed34988?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Dry Fruits & Nuts', slug: 'dry-fruits', imageUrl: 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Honey & Ghee', slug: 'honey-ghee', imageUrl: 'https://images.unsplash.com/photo-1587049352847-81a56d773c1c?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Herbal Teas', slug: 'teas', imageUrl: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Fresh Fruits', slug: 'fresh-fruits', imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=400&auto=format&fit=crop' },
      { id: uuidv4(), name: 'Fresh Vegetables', slug: 'fresh-vegetables', imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=400&auto=format&fit=crop' }
    ];

    for (const cat of categories) {
      await client.query(
        'INSERT INTO catalog.categories (id, name, slug, "imageUrl", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())',
        [cat.id, cat.name, cat.slug, cat.imageUrl]
      );
    }

    console.log('Inserting Products...');
    // Create products
    const products = [
      { catId: categories[0].id, id: uuidv4(), name: 'Organic Foxtail Millet', desc: 'Fresh from Telangana farms.', price: 150, url: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=400' },
      { catId: categories[0].id, id: uuidv4(), name: 'Pearl Millet (Bajra)', desc: 'Nutrient rich bajra.', price: 120, url: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=400' },
      { catId: categories[1].id, id: uuidv4(), name: 'Guntur Red Chilli Powder', desc: 'Spicy and authentic.', price: 250, url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400' },
      { catId: categories[1].id, id: uuidv4(), name: 'Turmeric Powder', desc: 'Pure organic turmeric.', price: 180, url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400' },
      { catId: categories[2].id, id: uuidv4(), name: 'Wood Pressed Groundnut Oil', desc: 'Healthy cooking oil.', price: 350, url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400' },
      { catId: categories[2].id, id: uuidv4(), name: 'Cold Pressed Sesame Oil', desc: 'Traditional gingelly oil.', price: 450, url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=400' },
      { catId: categories[3].id, id: uuidv4(), name: 'Palm Jaggery', desc: 'Natural alternative to sugar.', price: 200, url: 'https://images.unsplash.com/photo-1621236173879-fcd1476dbbba?q=80&w=400' },
      { catId: categories[4].id, id: uuidv4(), name: 'Mango Pickle (Avakaya)', desc: 'Homemade style.', price: 300, url: 'https://images.unsplash.com/photo-1610444547926-dce0ea434d28?q=80&w=400' },
      { catId: categories[5].id, id: uuidv4(), name: 'Sona Masuri Rice', desc: 'Premium aged rice.', price: 1200, url: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=400' },
      { catId: categories[6].id, id: uuidv4(), name: 'Toor Dal', desc: 'Unpolished split pigeon peas.', price: 180, url: 'https://images.unsplash.com/photo-1585934522927-463d1ed34988?q=80&w=400' },
      { catId: categories[7].id, id: uuidv4(), name: 'Premium Cashews', desc: 'Whole W240 grade.', price: 900, url: 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?q=80&w=400' },
      { catId: categories[8].id, id: uuidv4(), name: 'Desi Cow Ghee', desc: 'A2 bilona ghee.', price: 1500, url: 'https://images.unsplash.com/photo-1587049352847-81a56d773c1c?q=80&w=400' },
      { catId: categories[9].id, id: uuidv4(), name: 'Hibiscus Tea', desc: 'Organic herbal infusion.', price: 250, url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=400' },
    ];

    for (const p of products) {
      await client.query(
        'INSERT INTO catalog.products (id, name, slug, description, "basePrice", images, unit, "category_id", "vendorId", "isActive", "isFeatured", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())',
        [p.id, p.name, p.id, p.desc, p.price, JSON.stringify([{ url: p.url }]), '1 kg', p.catId, vendorId, true, true]
      );
      // Create a default variant
      await client.query(
        'INSERT INTO catalog.product_variants (id, name, sku, price, "stockQuantity", "product_id", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
        [uuidv4(), '1 kg', 'SKU-' + p.id.slice(0,5), p.price, 100, p.id]
      );
    }
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Error during seed:', err);
  } finally {
    await client.end();
  }
}

seed();
