import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSearchIndexesAndTriggers1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Full-text search GIN index on products
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_products_search
      ON catalog.products USING GIN (search_vector)
    `);

    // Trigger to auto-update search vector on product insert/update
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION catalog.update_product_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
          setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
          setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_products_search_vector ON catalog.products
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_products_search_vector
      BEFORE INSERT OR UPDATE OF name, description, short_description
      ON catalog.products
      FOR EACH ROW
      EXECUTE FUNCTION catalog.update_product_search_vector()
    `);

    // Performance indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_user
      ON cart.cart_items (user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_order
      ON orders.order_items (order_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_order
      ON payments.payments (order_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_product
      ON review.reviews (product_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read
      ON notification.notifications (user_id, is_read)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tickets_created
      ON support.tickets (created_at DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_products_search_vector ON catalog.products`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS catalog.update_product_search_vector()`);
    await queryRunner.query(`DROP INDEX IF EXISTS catalog.idx_products_search`);
    await queryRunner.query(`DROP INDEX IF EXISTS cart.idx_cart_items_user`);
    await queryRunner.query(`DROP INDEX IF EXISTS orders.idx_order_items_order`);
    await queryRunner.query(`DROP INDEX IF EXISTS payments.idx_payments_order`);
    await queryRunner.query(`DROP INDEX IF EXISTS review.idx_reviews_product`);
    await queryRunner.query(`DROP INDEX IF EXISTS notification.idx_notifications_user_read`);
    await queryRunner.query(`DROP INDEX IF EXISTS support.idx_tickets_created`);
  }
}
