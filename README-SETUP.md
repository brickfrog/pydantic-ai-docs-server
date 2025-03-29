# pydantic-docs-server Setup Guide

This guide explains how to properly set up and populate the pydantic-docs-server with your actual pydantic-ai documentation.

## Overview

The pydantic-docs-server is a Model Context Protocol (MCP) server that makes your pydantic-ai documentation available to AI assistants like those in Cursor and Windsurf. It's a fork of the Mastra docs server, adapted for pydantic-ai.

## Installation and Setup

### 1. Install dependencies

```bash
cd pydantic-docs-server
npm install
```

### 2. Import your documentation

The server needs your real documentation, code examples, and changelogs. Use the provided script to import them:

```bash
./import-docs.sh /path/to/your/pydantic-ai/docs
```

This will:
- Copy your Markdown/MDX documentation to `.docs/raw/`
- Import code examples from the `examples` directory
- Import changelogs

### 3. Build the server

```bash
npm run build
```

### 4. Test the server

```bash
node dist/stdio.js
```

You should see a JSON RPC server start up. Press Ctrl+C to exit.

## Documentation Structure

The server expects documentation in these locations:

1. **Raw Documentation** (`.docs/raw/`):
   - Markdown/MDX files organized in directories
   - This is where your main documentation lives

2. **Code Examples** (`.docs/organized/code-examples/`):
   - Examples converted to markdown files
   - Each example should be in its own file

3. **Changelogs** (`.docs/organized/changelogs/`):
   - Package changelog files
   - Used by the `pydanticChanges` tool

## Integrating with AI Tools

### Cursor

Create or update `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "pydantic": {
      "command": "node",
      "args": ["/absolute/path/to/pydantic-docs-server/dist/stdio.js"]
    }
  }
}
```

Then enable the MCP server in Cursor settings.

### Windsurf

Update `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "pydantic": {
      "command": "node",
      "args": ["/absolute/path/to/pydantic-docs-server/dist/stdio.js"]
    }
  }
}
```

## Available Tools

The server provides these MCP tools:

1. `pydanticDocs` - Access documentation
2. `pydanticExamples` - Access code examples
3. `pydanticBlog` - Fetch blog posts
4. `pydanticChanges` - View changelogs

## Publishing (Optional)

If you want to make this available as an npm package:

1. Update package.json with your organization/name
2. Publish to npm:
   ```
   npm publish
   ```

Then users can install with:
```
npm install -g pydantic-docs-server
``` 