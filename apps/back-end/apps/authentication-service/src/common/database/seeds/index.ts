// src/database/seeds/index.ts
import { DataSource } from 'typeorm';
import { seedPermissions } from './permission.seed';
import { seedRoles } from './role.seed';
import { seedAdmin } from './admin.seed';
import databaseConfig from '@config/database.config';

async function runSeeds() {
  const config = databaseConfig();

  const dataSource = new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  await dataSource.initialize();

  console.log('Running seeds...');

  await seedPermissions(dataSource);
  await seedRoles(dataSource);
  await seedAdmin(dataSource);

  console.log('Seeds completed!');

  await dataSource.destroy();
}

runSeeds().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
