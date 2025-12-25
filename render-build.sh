#!/usr/bin/env bash
# render-build.sh: Optimized build script for Render.com

# Fail on error
set -e

echo "Installing dependencies..."
# Use --include=dev to ensure tsx and esbuild are available for the build script
npm install --include=dev

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
npm run build
