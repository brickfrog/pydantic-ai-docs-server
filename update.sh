#!/bin/bash

# Script to update pydantic-ai-docs-server with the latest pydantic-ai documentation
# Usage: ./update.sh [pydantic-ai-repo-path]

set -e

# Define paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYDANTIC_AI_REPO="${1:-$SCRIPT_DIR/pydantic-ai}"
DOCS_DIR="$SCRIPT_DIR/.docs"

echo "🔄 Updating pydantic-ai-docs-server with latest documentation"

# Step 1: Pull latest changes from pydantic-ai repository
echo "📥 Pulling latest changes from pydantic-ai repository..."
(
  cd "$PYDANTIC_AI_REPO" || { echo "❌ Error: pydantic-ai repository not found at $PYDANTIC_AI_REPO"; exit 1; }
  git pull
)

# Step 2: Import the documentation
echo "📚 Importing documentation from pydantic-ai..."
"$SCRIPT_DIR/import-docs.sh" "$PYDANTIC_AI_REPO/docs"

# Step 3: Rebuild the docs server
echo "🔨 Rebuilding the docs server..."
(
  cd "$SCRIPT_DIR" || exit 1
  npm run build
)

# Step 4: Check if the server is running
SERVER_PID=$(pgrep -f "node.*pydantic-ai-docs-server/dist/stdio.js" || echo "")
if [ -n "$SERVER_PID" ]; then
  echo "🔄 Restarting the MCP server..."
  kill "$SERVER_PID"
  echo "👉 You need to restart any applications using the MCP server"
else
  echo "✅ Update complete! Server is not currently running."
fi

echo "
✨ pydantic-ai-docs-server has been updated successfully! ✨

To run the server manually:
  cd $SCRIPT_DIR && node dist/stdio.js

Make sure your .cursor/mcp.json configuration is set up correctly:
{
  \"mcpServers\": {
    \"pydantic-ai\": {
      \"command\": \"node\",
      \"args\": [\"$(realpath "$SCRIPT_DIR/dist/stdio.js")\"]
    }
  }
}
" 