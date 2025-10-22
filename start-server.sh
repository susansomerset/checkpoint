#!/bin/bash

# Checkpoint Development Server Startup Script
# Run this from /chuckles/checkpoint/

echo "🚀 Starting Checkpoint development server..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from /chuckles/checkpoint/"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
fi

echo "🔧 Starting Next.js dev server on port 3000..."
echo ""
npm run dev


