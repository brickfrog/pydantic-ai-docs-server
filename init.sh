#!/bin/bash

# Initialization script for pydantic-ai-docs-server
# This script:
# 1. Clones the pydantic-ai repository if it doesn't exist
# 2. Imports documentation
# 3. Builds the server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYDANTIC_AI_DIR="$SCRIPT_DIR/pydantic-ai"

# Ensure we have git installed
if ! command -v git &> /dev/null; then
  echo "❌ Error: git is required but not found"
  echo "Please install git and try again"
  exit 1
fi

# Create .docs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/.docs"

# Check if pydantic-ai repository exists
if [ ! -d "$PYDANTIC_AI_DIR" ]; then
  echo "📦 pydantic-ai repository not found, cloning it now..."
  git clone https://github.com/pydantic/pydantic-ai.git "$PYDANTIC_AI_DIR"
  echo "✅ pydantic-ai repository cloned successfully"
else
  echo "📦 pydantic-ai repository already exists, updating..."
  (cd "$PYDANTIC_AI_DIR" && git pull)
  echo "✅ pydantic-ai repository updated successfully"
fi

# Check if import-docs.sh script exists and is executable
if [ ! -f "$SCRIPT_DIR/import-docs.sh" ]; then
  echo "❌ Error: import-docs.sh script not found"
  exit 1
fi

if [ ! -x "$SCRIPT_DIR/import-docs.sh" ]; then
  echo "Making import-docs.sh executable..."
  chmod +x "$SCRIPT_DIR/import-docs.sh"
fi

# Install dependencies if not installed via npx
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "📦 Installing Node.js dependencies..."
  cd "$SCRIPT_DIR" && npm install
  echo "✅ Dependencies installed successfully"
else
  echo "📦 Dependencies already installed"
fi

# Import documentation
echo "📚 Importing documentation from pydantic-ai..."
"$SCRIPT_DIR/import-docs.sh" "$PYDANTIC_AI_DIR/docs"

# Build the server if not being run from postinstall
if [ -z "$npm_lifecycle_event" ] || [ "$npm_lifecycle_event" != "postinstall" ]; then
  echo "🔨 Building the server..."
  cd "$SCRIPT_DIR" && npm run build
fi

echo "
✨ pydantic-ai-docs-server has been initialized successfully! ✨

To run the server:
  node dist/stdio.js

To set up with Cursor, update your .cursor/mcp.json:
{
  \"mcpServers\": {
    \"pydantic-ai\": {
      \"command\": \"node\",
      \"args\": [\"$(realpath "$SCRIPT_DIR/dist/stdio.js")\"]
    }
  }
}
" 