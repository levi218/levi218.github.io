import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    ".cache/**",
    ".build/**",
    "next-env.d.ts",
    // Deliberately odd little projects: they exist to be *scanned*, not linted.
    "test/fixtures/**",
  ]),
  {
    /*
     * Reading `window.location` on mount, and fetching on mount, are both
     * "synchronise React with an external system" — the case this rule exists
     * to permit. It cannot tell them apart from a cascading-render mistake, and
     * the alternative is a data-fetching library for four screens that only
     * ever run on localhost.
     */
    files: ["app/admin/**", "components/ProjectList.tsx"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
]);

export default eslintConfig;
