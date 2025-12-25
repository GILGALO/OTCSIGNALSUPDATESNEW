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

# Use Node.js loader directly to avoid npx path issues
echo "Running the build..."
NODE_OPTIONS="--loader tsx" node script/build.ts
