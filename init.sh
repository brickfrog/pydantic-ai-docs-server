#!/bin/bash

# Initialization script for pydantic-ai-docs-server
# This script:
# 1. Clones the pydantic-ai repository if it doesn't exist
# 2. Imports documentation
# 3. Builds the server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYDANTIC_AI_DIR="$SCRIPT_DIR/pydantic-ai"

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

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install
echo "✅ Dependencies installed successfully"

# Import documentation
echo "📚 Importing documentation from pydantic-ai..."
"$SCRIPT_DIR/import-docs.sh" "$PYDANTIC_AI_DIR/docs"

# Build the server
echo "🔨 Building the server..."
npm run build

echo "
✨ pydantic-ai-docs-server has been initialized successfully! ✨

To run the server:
  node dist/stdio.js

To set up with Cursor, update your .cursor/mcp.json:
{
  \"mcpServers\": {
    \"pydantic\": {
      \"command\": \"node\",
      \"args\": [\"$(realpath "$SCRIPT_DIR/dist/stdio.js")\"]
    }
  }
}
" 