#!/bin/bash

# Script to import documentation from your pydantic-ai project into the docs server

# Check if source directory is provided
if [ -z "$1" ]; then
  echo "Usage: ./import-docs.sh <path-to-pydantic-ai-docs>"
  echo "Example: ./import-docs.sh ../pydantic-ai/docs"
  exit 1
fi

SOURCE_DIR="$1"
RAW_DOCS_DIR=".docs/raw"
CODE_EXAMPLES_DIR=".docs/organized/code-examples"
CHANGELOGS_DIR=".docs/organized/changelogs"

# Create directories if they don't exist
mkdir -p "$RAW_DOCS_DIR"
mkdir -p "$CODE_EXAMPLES_DIR"
mkdir -p "$CHANGELOGS_DIR"

# Copy markdown/mdx docs
echo "Copying documentation files from $SOURCE_DIR..."
if [ -d "$SOURCE_DIR" ]; then
  # Use rsync to copy only markdown files
  rsync -av --include="*/" --include="*.md" --include="*.mdx" --exclude="*" "$SOURCE_DIR/" "$RAW_DOCS_DIR/"
  echo "✅ Documentation files copied successfully"
else
  echo "⚠️ Source directory $SOURCE_DIR not found. No documentation files copied."
fi

# Look for code examples
EXAMPLES_DIR="$SOURCE_DIR/../examples"
if [ -d "$EXAMPLES_DIR" ]; then
  echo "Found examples directory, processing examples..."
  
  # Process each example directory
  for EXAMPLE_DIR in "$EXAMPLES_DIR"/*; do
    if [ -d "$EXAMPLE_DIR" ]; then
      EXAMPLE_NAME=$(basename "$EXAMPLE_DIR")
      echo "Processing example: $EXAMPLE_NAME"
      
      # Create markdown file for the example
      EXAMPLE_FILE="$CODE_EXAMPLES_DIR/$EXAMPLE_NAME.md"
      echo "" > "$EXAMPLE_FILE"
      
      # Process Python files in the example
      find "$EXAMPLE_DIR" -name "*.py" | while read -r PYFILE; do
        REL_PATH=$(realpath --relative-to="$EXAMPLE_DIR" "$PYFILE")
        echo "### $REL_PATH" >> "$EXAMPLE_FILE"
        echo '```python' >> "$EXAMPLE_FILE"
        cat "$PYFILE" >> "$EXAMPLE_FILE"
        echo '```' >> "$EXAMPLE_FILE"
        echo "" >> "$EXAMPLE_FILE"
      done
    fi
  done
  echo "✅ Examples processed successfully"
else
  echo "⚠️ Examples directory $EXAMPLES_DIR not found. No examples processed."
fi

# Look for changelogs
CHANGELOG_FILE="$SOURCE_DIR/../CHANGELOG.md"
if [ -f "$CHANGELOG_FILE" ]; then
  echo "Found changelog file, copying..."
  cp "$CHANGELOG_FILE" "$CHANGELOGS_DIR/pydantic-ai.md"
  echo "✅ Changelog copied successfully"
else
  echo "⚠️ Changelog file $CHANGELOG_FILE not found. Creating placeholder."
  echo "# Pydantic-AI Changelog" > "$CHANGELOGS_DIR/pydantic-ai.md"
  echo "" >> "$CHANGELOGS_DIR/pydantic-ai.md"
  echo "## Latest Version" >> "$CHANGELOGS_DIR/pydantic-ai.md"
  echo "" >> "$CHANGELOGS_DIR/pydantic-ai.md"
  echo "- Initial release" >> "$CHANGELOGS_DIR/pydantic-ai.md"
fi

echo "Documentation import complete!"
echo "You can now build and run the docs server:"
echo "npm run build"
echo "node dist/stdio.js" 