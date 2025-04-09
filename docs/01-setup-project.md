# Step 1: Setup Project

## Tasks

- [x] Initialize a Next.js project using `create-next-app`.
- [x] Configure Tailwind CSS for styling.
  - [x] Install Tailwind CSS and its dependencies.
  - [x] Add Tailwind directives to the global CSS file.
- [x] Set up TypeScript.
  - [x] Configure `tsconfig.json`.
- [x] Configure ESLint and Prettier for code formatting and linting.
  - [x] Install ESLint, Prettier, and related plugins.
  - [x] Create or update ESLint and Prettier configuration files.
  - [x] Verify linting and formatting work as expected.
- [x] Add `shadcn` library for UI components.
  - [x] Install `shadcn` and its dependencies.
  - [x] Verify the library is working by adding a sample component.
- [x] Verify the development server runs successfully.

## Details

### Initialize Next.js Project
Run the following command to create a new Next.js project:

```bash
npx create-next-app@latest quiz-game
```

### Configure Tailwind CSS
Follow the [official Tailwind CSS setup guide](https://tailwindcss.com/docs/installation) for Next.js.

1. Install Tailwind CSS and its dependencies:
    ```bash
    npm install -D tailwindcss postcss autoprefixer
    ```
2. Add Tailwind directives to your global CSS file (e.g., `globals.css`):
    ```css
    @import "tailwindcss";
    ```

### Set Up TypeScript
1. Update the `tsconfig.json` file as needed.

### Configure ESLint and Prettier
1. Install ESLint, Prettier, and related plugins:
    ```bash
    npm install -D eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-css
    ```
2. Create or update the ESLint configuration file (`eslint.config.mjs`):
    ```mjs
    import { dirname } from "path";
    import { fileURLToPath } from "url";
    import { FlatCompat } from "@eslint/eslintrc";
    import eslintConfigPrettier from "eslint-config-prettier";
    import eslintCssPlugin from "eslint-plugin-css";
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const compat = new FlatCompat({
      baseDirectory: __dirname,
    });
    const eslintConfig = [
      ...compat.extends(
        "next/core-web-vitals",
        "next/typescript",
        "plugin:react/recommended",
        "plugin:css/standard",
        "plugin:prettier/recommended",
        "plugin:@next/next/recommended",
      ),
      eslintCssPlugin.configs["flat/standard"],
      eslintConfigPrettier,
      {
        ignores: ["node_modules/**/*", ".next/**/*", "out/**/*"],
        rules: {
          "react/react-in-jsx-scope": "off",
        },
      },
    ];
    export default eslintConfig;
    ```
3. Add a Prettier configuration file (`.prettierrc`):
    ```json
    {
      "semi": true,
      "singleQuote": true,
      "printWidth": 80,
      "trailingComma": "es5",
      "endOfLine": "lf",
      "tabWidth": 2,
    }
    ```
4. Verify linting and formatting:
    ```bash
    npx eslint . --ext .js,.jsx,.ts,.tsx
    npx prettier --check .
    ```

### Add `shadcn` Library
1. Install `shadcn`:
    ```bash
    npm install shadcn-ui
    ```
2. Verify the library by adding a sample component to your project.

### Verify Development Server
Start the development server to ensure everything is working:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to verify the setup.

---

Once all tasks are completed, mark the checkboxes above to track progress.