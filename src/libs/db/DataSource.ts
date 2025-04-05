import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DataSourceOptions } from 'typeorm/data-source/DataSourceOptions';
import { entities } from './entity';
import * as migrations from './migration';

const { PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DB } = process.env;

export const DataSourceConfig: DataSourceOptions & TypeOrmModuleOptions = {
  type: 'postgres',
  host: PG_HOST,
  port: Number(PG_PORT),
  username: PG_USER,
  password: PG_PASSWORD,
  database: PG_DB,
  synchronize: false,
  logging: false,
  entities,
  migrations,
  uuidExtension: 'uuid-ossp',
  // todo - add TypeOrmModuleOptions
  migrationsTableName: 'db_migrations',
  migrationsTransactionMode: 'all',
  ssl: true,
};

export const AuthServicePgDataSource = new DataSource(DataSourceConfig);
