import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.mts"],
  format: ["esm"],
  outDir: "dist",
  splitting: false,
  clean: true,
  noExternal: [
    /^(?!@sentry\/profiling-node|@sentry\/node-cpu-profiler|pg-native).*$/,
  ],
  external: [
    "pg-native",
    "@sentry/profiling-node",
    "@sentry/node-cpu-profiler",
    /\.node$/,
  ],
  banner: {
    js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);',
  },
});
