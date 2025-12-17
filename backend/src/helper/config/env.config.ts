import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const EnvConfig = {
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',

    DB_HOST: process.env.DB_HOST,
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_DATABASE: process.env.DB_DATABASE,

    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-this-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    GMAP_API_KEY: process.env.GMAP_API_KEY || '',

    EMAIL_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    EMAIL_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    EMAIL_USER: process.env.SMTP_USER || '',
    EMAIL_PASS: process.env.SMTP_PASS || '',

    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    get: (key: string): string | undefined => {
        return process.env[key];
    },
};
