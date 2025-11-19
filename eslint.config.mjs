import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional directories to exclude from linting:
    "old/**",          // Old build artifacts and directories
    ".claude/**",      // Claude Code skills and backup directories
    "docs/**",         // Documentation with example code
    "debug-*.js",      // Debug scripts with relaxed syntax
    "scripts/**/*.js", // Build scripts that may use CommonJS
  ]),
]);

export default eslintConfig;
