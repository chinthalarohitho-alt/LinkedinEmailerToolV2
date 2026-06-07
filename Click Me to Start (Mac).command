#!/bin/bash
# LinkedIn Emailer Tool - macOS Launcher
# Double-click this file to start the app

cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi
if [ ! -d "client/node_modules" ]; then
  echo "Installing client dependencies..."
  npm install --prefix client
fi

echo ""
echo "  Starting LinkedIn Emailer Tool..."
echo "  App will open at http://localhost:5173"
echo ""

# Open browser after a short delay
(sleep 3 && open "http://localhost:5173") &

npm run dev
