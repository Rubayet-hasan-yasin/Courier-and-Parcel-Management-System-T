import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
// When compiled, __dirname will be in dist/helper/config, so we go up 3 levels to reach project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Helper configuration to retrieve all environment variables
 */
export const EnvConfig = {
    // Application
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Database
    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,

    // Add other environment variables here as needed
    get: (key: string): string | undefined => {
        return process.env[key];
    },
};
