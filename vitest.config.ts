import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    alias: {
      '@components/': new URL('./src/components', import.meta.url).pathname,
      '@utils/': new URL('./src/lib/utils', import.meta.url).pathname,
      '@ui/': new URL('./src/components/ui', import.meta.url).pathname,
      '@lib/': new URL('./src/lib', import.meta.url).pathname,
      '@hooks/': new URL('./src/hooks', import.meta.url).pathname,
      '@domain/': new URL('./src/domain', import.meta.url).pathname,
      '@application/': new URL('./src/application', import.meta.url).pathname,
      '@infrastructure/': new URL('./src/infrastructure', import.meta.url)
        .pathname,
      '@/': new URL('./src/', import.meta.url).pathname,
    },
    include: ['src/tests/**/*.test.ts'],
  },
});
