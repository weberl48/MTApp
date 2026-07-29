import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // eslint-config-next 16.2.12 widened this rule's detection, flagging 31
      // pre-existing sites (the documented settings-form "mirror org state into
      // local state" pattern). Keep visible as warnings; fix sites incrementally
      // rather than churning every settings page in a deps bump.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Utility scripts (Node.js CommonJS)
    "scripts/**",
    // Nested app folder (separate project copy)
    "mca-app/**",
  ]),
]);

export default eslintConfig;
