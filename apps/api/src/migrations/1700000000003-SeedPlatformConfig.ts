import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPlatformConfig1700000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO admin.platform_config (id, key, value, description, value_type)
      VALUES
        (uuid_generate_v4(), 'COMMISSION_RATE_DEFAULT', '10', 'Default commission rate percentage', 'number'),
        (uuid_generate_v4(), 'COMMISSION_RATE_PREMIUM', '8', 'Premium vendor commission rate', 'number'),
        (uuid_generate_v4(), 'MIN_ORDER_AMOUNT', '99', 'Minimum order amount in INR', 'number'),
        (uuid_generate_v4(), 'FREE_DELIVERY_THRESHOLD', '499', 'Free delivery above this amount', 'number'),
        (uuid_generate_v4(), 'DEFAULT_DELIVERY_CHARGE', '40', 'Default delivery charge in INR', 'number'),
        (uuid_generate_v4(), 'MAX_CART_ITEMS', '50', 'Maximum items allowed in cart', 'number'),
        (uuid_generate_v4(), 'PLATFORM_NAME', 'CipherFoods', 'Platform display name', 'string'),
        (uuid_generate_v4(), 'SUPPORT_EMAIL', 'support@cipherfoods.in', 'Support email address', 'string'),
        (uuid_generate_v4(), 'SUPPORT_PHONE', '+91-4040000000', 'Support phone number', 'string'),
        (uuid_generate_v4(), 'COD_ENABLED', 'true', 'Cash on delivery enabled', 'boolean'),
        (uuid_generate_v4(), 'VENDOR_AUTO_APPROVE', 'false', 'Auto-approve new vendors', 'boolean')
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM admin.platform_config WHERE key IN (
      'COMMISSION_RATE_DEFAULT', 'COMMISSION_RATE_PREMIUM', 'MIN_ORDER_AMOUNT',
      'FREE_DELIVERY_THRESHOLD', 'DEFAULT_DELIVERY_CHARGE', 'MAX_CART_ITEMS',
      'PLATFORM_NAME', 'SUPPORT_EMAIL', 'SUPPORT_PHONE', 'COD_ENABLED', 'VENDOR_AUTO_APPROVE'
    )`);
  }
}
