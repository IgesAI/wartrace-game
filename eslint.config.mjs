import next from "eslint-config-next";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...next,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", ".data/**", "drizzle/**", "specs/**", "playwright-report/**", "test-results/**", "next-env.d.ts"],
  },
];

export default config;
