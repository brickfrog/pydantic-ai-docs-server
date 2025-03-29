#!/bin/bash

# Script to rename the directory from pydantic-docs-server to pydantic-ai-docs-server

# Get the current directory
CURRENT_DIR="$(pwd)"
PARENT_DIR="$(dirname "$CURRENT_DIR")"
NEW_DIR_NAME="pydantic-ai-docs-server"

echo "Renaming directory from $(basename "$CURRENT_DIR") to $NEW_DIR_NAME..."

# Move to the parent directory
cd "$PARENT_DIR" || exit 1

# Rename the directory
mv "$(basename "$CURRENT_DIR")" "$NEW_DIR_NAME"

echo "✅ Directory renamed successfully."
echo "You can now access it at $PARENT_DIR/$NEW_DIR_NAME"
echo "Please cd into the new directory:"
echo "cd $PARENT_DIR/$NEW_DIR_NAME" 