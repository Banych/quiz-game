import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintCssPlugin from 'eslint-plugin-css';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      'node_modules/**/*',
      '.next/**/*',
      'out/**/*',
      'src/infrastructure/database/prisma/generated/**/*',
    ],
  },
  ...compat.extends(
    'next/core-web-vitals',
    'next/typescript',
    'plugin:react/recommended',
    'plugin:css/standard',
    'plugin:prettier/recommended',
    'plugin:@next/next/recommended'
  ),
  eslintCssPlugin.configs['flat/standard'],
  eslintConfigPrettier,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'linebreak-style': ['error', 'unix'],
    },
  },
];

export default eslintConfig;
