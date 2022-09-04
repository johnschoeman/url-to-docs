#!/bin/bash

# Reset lib directory
rm -rf lib
mkdir lib

# Build cli program
node ./bin/esbuild.js
chmod +x ./lib/cli.js
