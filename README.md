# Pydantic AI Documentation Server

MCP server for accessing pydantic-ai documentation directly in your IDE.

Can't be arsed to make it a package, so you'll have to clone it.

## Local Setup for Cursor

To use this documentation server with Cursor:

1. Clone this repository:
   ```bash
   git clone https://github.com/brickfrog/pydantic-ai-docs-server.git
   cd pydantic-ai-docs-server
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Create or modify your `.cursor/mcp.json` file in the project where you want to use pydantic-ai documentation:
   ```json
   {
     "mcpServers": {
       "pydantic-ai": {
         "command": "node",
         "args": ["/absolute/path/to/pydantic-ai-docs-server/dist/stdio.js"]
       }
     }
   }
   ```
   
   Replace `/absolute/path/to/` with the actual path to where you cloned this repository.

4. Restart Cursor for the changes to take effect.

Documentation stays current through an automatic GitHub Action that syncs with the pydantic-ai repo daily. Run `git pull` periodically to get the latest docs. 