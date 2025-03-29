#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the package root directory
const __filename = fileURLToPath(import.meta.url);
const distDir = path.dirname(__filename);
const packageRoot = path.resolve(distDir, '../..');

console.log('🔍 Checking for pydantic-ai documentation...');

// Check if docs directory exists and has content
const docsDir = path.join(packageRoot, '.docs/raw');
let needsInit = false;

try {
  if (!existsSync(docsDir)) {
    console.log('📚 Documentation directory not found.');
    needsInit = true;
  } else {
    const files = await readdir(docsDir);
    if (files.length === 0) {
      console.log('📚 Documentation directory is empty.');
      needsInit = true;
    } else {
      console.log('✅ Documentation already exists.');
    }
  }
} catch (error) {
  console.log('⚠️ Error checking documentation, will attempt initialization:', error);
  needsInit = true;
}

// Run the initialization script if needed
if (needsInit) {
  const initScriptPath = path.join(packageRoot, 'init.sh');
  
  if (existsSync(initScriptPath)) {
    console.log('🔄 Running initialization script to fetch documentation...');
    try {
      // Create the .docs directory if it doesn't exist
      if (!existsSync(path.join(packageRoot, '.docs'))) {
        execSync(`mkdir -p "${path.join(packageRoot, '.docs')}"`);
      }
      
      // Run the initialization script
      execSync(`bash "${initScriptPath}"`, { 
        stdio: 'inherit',
        cwd: packageRoot 
      });
      console.log('✅ Documentation initialization complete!');
    } catch (error) {
      console.error('❌ Documentation initialization failed:', error);
      console.error('⚠️ The MCP server will run with limited functionality.');
      console.error('💡 You can manually initialize by running: bash init.sh');
    }
  } else {
    console.error('❌ Initialization script not found at:', initScriptPath);
    console.error('⚠️ The MCP server will run with limited functionality.');
  }
} 