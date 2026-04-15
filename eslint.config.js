import js from "@eslint/js";
import tsEslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist",
      "build",
      "node_modules",
      "*.config.js",
      "*.config.ts",
      ".next",
      "containers/apps/*/dist",
      "containers/apps/*/.next",
    ],
  },
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
