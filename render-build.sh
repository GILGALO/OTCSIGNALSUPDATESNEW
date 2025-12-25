#!/usr/bin/env bash
# render-build.sh: Custom build script for Render.com to install Chrome

# Ensure dependencies are available
echo "Installing dependencies..."
npm install

# Set Puppeteer cache directory
export PUPPETEER_CACHE_DIR=/opt/render/project/.cache/puppeteer

# Create cache directory if it doesn't exist
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then
  echo "Creating Puppeteer cache directory..."
  mkdir -p $PUPPETEER_CACHE_DIR
fi

# Install Chromium via Puppeteer
echo "Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

# Run the standard build
echo "Running the build..."
# Reverting to npm run build as the standard, but ensuring tsx and esbuild are accessible
# tsx script/build.ts is what 'npm run build' does.
# Using 'npx' is safer in Render's environment to resolve local binaries.
npx tsx script/build.ts
