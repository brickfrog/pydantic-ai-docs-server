# pydantic-ai-docs-server

A Model Context Protocol (MCP) server that provides AI assistants with direct access to pydantic-ai's complete knowledge base. This MCP server makes pydantic-ai documentation available to AI tools like Cursor and Windsurf.

## Repository Structure

```
pydantic-ai-docs-server/
├── src/                     # Source code for the MCP server
├── bin/                     # Executable scripts
├── .docs/                   # Documentation storage (generated)
│   ├── raw/                 # Raw documentation files
│   └── organized/           # Processed documentation
│       ├── changelogs/      # Package changelogs
│       └── code-examples/   # Code examples
├── dist/                    # Compiled JavaScript (generated)
├── import-docs.sh           # Script to import documentation
├── update.sh                # Script to update documentation
└── pydantic-ai/             # pydantic-ai repository (git submodule)
```

## Development Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/brickfrog/pydantic-ai-docs-server.git
   cd pydantic-ai-docs-server
   ```

2. Clone the pydantic-ai repository inside this project:
   ```bash
   git clone https://github.com/pydantic/pydantic-ai.git
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Import the documentation:
   ```bash
   ./import-docs.sh pydantic-ai/docs
   ```

5. Build the server:
   ```bash
   npm run build
   ```

6. Run the server:
   ```bash
   node dist/stdio.js
   ```

## Keeping Documentation Updated

To update the documentation with the latest changes from the pydantic-ai repository:

```bash
./update.sh
```

This will:
1. Pull the latest changes from the pydantic-ai repository
2. Re-import the documentation
3. Rebuild the server

## Integration with AI Tools

### Cursor

Create or update `.cursor/mcp.json` in your project root:

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

### Windsurf

Update `~/.codeium/windsurf/mcp_config.json`:

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

## Available Tools

The server provides these MCP tools:

1. `pydanticAIDocs` - Access documentation
2. `pydanticAIExamples` - Access code examples
3. `pydanticAIBlog` - Fetch blog posts
4. `pydanticAIChanges` - View changelogs

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT 