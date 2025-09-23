import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      'camelcase': ['error', { properties: 'always' }],
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
      'no-constant-condition': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name='log'] > *:has(CallExpression) ",
          message: 'Do not log inside loops.',
        },
      ],
    },
  },
];

export default eslintConfig;
