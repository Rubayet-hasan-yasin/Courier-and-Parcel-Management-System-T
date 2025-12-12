import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvConfig } from './env.config';


export const databaseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: EnvConfig.DB_HOST,
    port: EnvConfig.DB_PORT,
    username: EnvConfig.DB_USERNAME,
    password: EnvConfig.DB_PASSWORD,
    database: EnvConfig.DB_DATABASE,
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: true,
    dropSchema: true, // WARNING: Drops all tables on startup - for testing only!
    ssl: {
        rejectUnauthorized: false, // Required for Neon and most cloud PostgreSQL providers
    },
};
