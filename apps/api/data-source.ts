import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'cipherfoods',
  password: process.env.DB_PASSWORD || 'cipherfoods_dev',
  database: process.env.DB_NAME || 'cipherfoods',
  entities: [path.join(__dirname, 'src/modules/**/entities/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'src/migrations/*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  logging: ['error', 'warn', 'migration'],
});
