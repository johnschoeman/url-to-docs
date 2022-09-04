#!/usr/bin/env node

const esbuild = require("esbuild")

esbuild
  .build({
    entryPoints: ["src/cli.ts"],
    outdir: "lib",
    bundle: true,
    platform: "node",
    minify: false,
    sourcemap: false,
  })
  .catch(e => console.error(e.message))
