import { defineConfig } from 'prisma/config';

const schemaPath = './src/infrastructure/database/prisma/schema.prisma';

export default defineConfig({
  schema: schemaPath,
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
