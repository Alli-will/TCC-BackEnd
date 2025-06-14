import { DataSource } from 'typeorm';
import 'dotenv/config';

const ormconfig = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,  // aqui usa a string completa
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migration/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});

export default ormconfig;