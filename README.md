# pydantic-ai-docs-server

A Model Context Protocol (MCP) server that provides AI assistants with direct access to pydantic-ai's complete knowledge base. This includes comprehensive documentation with MDX support, a collection of production-ready code examples, technical blog posts, and detailed package changelogs. The server integrates with popular AI development environments like Cursor and Windsurf, making it easy to build documentation-aware AI assistants that can provide accurate, up-to-date information about pydantic-ai.

## Installation

### Direct Installation from GitHub

You can install this package directly from GitHub:

```bash
# Install globally
npm install -g github:brickfrog/pydantic-ai-docs-server

# Or use with npx without installing
npx github:brickfrog/pydantic-ai-docs-server
```

### In Cursor

Create or update `.cursor/mcp.json` in your project root:

MacOS/Linux

```json
{
  "mcpServers": {
    "pydantic-ai": {
      "command": "npx",
      "args": ["-y", "github:brickfrog/pydantic-ai-docs-server"]
    }
  }
}
```

Windows

```json
{
  "mcpServers": {
    "pydantic-ai": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "github:brickfrog/pydantic-ai-docs-server"]
    }
  }
}
```

This will make all pydantic-ai documentation tools available in your Cursor workspace.
Note that the MCP server won't be enabled by default. You'll need to go to Cursor settings -> MCP settings and click "enable" on the pydantic-ai MCP server.

> **Note:** The first time the server runs, it will automatically initialize and download the documentation if it doesn't exist. You don't need to run any additional scripts.

### In Windsurf

Create or update `~/.codeium/windsurf/mcp_config.json`:

MacOS/Linux

```json
{
  "mcpServers": {
    "pydantic-ai": {
      "command": "npx",
      "args": ["-y", "github:brickfrog/pydantic-ai-docs-server"]
    }
  }
}
```

Windows

```json
{
  "mcpServers": {
    "pydantic-ai": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "github:brickfrog/pydantic-ai-docs-server"]
    }
  }
}
```

This will make all pydantic-ai documentation tools available in your Windsurf workspace.

## Tools

### Documentation Tool (`pydanticAIDocs`)

- Get pydantic-ai documentation by requesting specific paths
- Explore both general guides and API reference documentation
- Automatically lists available paths when a requested path isn't found

### Examples Tool (`pydanticAIExamples`)

- Access code examples showing pydantic-ai implementation patterns
- List all available examples
- Get detailed source code for specific examples

### Blog Tool (`pydanticAIBlog`)

- Access technical blog posts and articles from pydantic-ai
- Posts are properly formatted with code block handling
- Supports various date formats in blog metadata

### Changes Tool (`pydanticAIChanges`)

- Access package changelogs
- List all available package changelogs
- Get detailed changelog content for specific packages

## Keeping the documentation up-to-date

To update the documentation with the latest content from the pydantic-ai repository:

```bash
# If you've installed globally
pydantic-ai-docs-server-update

# If using from a local clone
cd pydantic-ai-docs-server
npm run update
```

## Contributing

To add or update documentation, you'll need to:

1. Add Markdown/MDX files to the `.docs/raw` directory
2. Add code examples to the `.docs/organized/code-examples` directory
3. Add changelogs to the `.docs/organized/changelogs` directory
4. Run `npm run build` to process the documentation 