import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import globals from "globals";

const appFiles = ["src/**/*.{ts,tsx}"];
const typedFiles = [...appFiles, "next.config.ts"];

function scopeConfig(configs, files) {
  return configs.map((config) => ({
    ...config,
    files,
  }));
}

const eslintConfig = defineConfig([
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  ...scopeConfig(nextVitals, appFiles),
  ...scopeConfig(nextTs, typedFiles),
  {
    ...js.configs.recommended,
    files: ["scripts/**/*.mjs", "*.config.mjs", "eslint.config.mjs"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]);

export default eslintConfig;
