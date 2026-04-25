import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchemas1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schemas for each bounded context
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS catalog`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS cart`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS orders`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS payments`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS vendor`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS inventory`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS delivery`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS notification`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS review`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS media`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS promotion`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS admin`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS support`);

    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS support CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS admin CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS promotion CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS media CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS review CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS notification CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS delivery CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS inventory CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS vendor CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS payments CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS orders CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS cart CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS catalog CASCADE`);
  }
}
