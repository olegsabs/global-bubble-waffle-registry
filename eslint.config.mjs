import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const nextCoreWebVitalsConfigPath = require.resolve(
  "eslint-config-next/core-web-vitals.js"
);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default [...compat.extends(nextCoreWebVitalsConfigPath)];
