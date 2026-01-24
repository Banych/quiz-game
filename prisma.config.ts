import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load environment variables from .env file
config();

const schemaPath = './src/infrastructure/database/prisma/schema.prisma';

export default defineConfig({
  schema: schemaPath,
  datasource: {
    // Use DIRECT_URL for migrations (bypasses connection pooling)
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
  migrations: {
    seed: 'tsx src/infrastructure/database/prisma/seed.ts',
  },
});
