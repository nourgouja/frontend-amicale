import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'src/main.ts',
        'src/app/app.config.ts',
        'src/app/app.routes.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        'node_modules/**',
      ],
    },
  },
});
