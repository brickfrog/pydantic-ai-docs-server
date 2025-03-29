#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuration
const PYDANTIC_AI_REPO = 'https://github.com/pydantic/pydantic-ai.git';
const TEMP_DIR = path.join(process.cwd(), 'temp-pydantic-ai');
const DOCS_RAW_DIR = path.join(process.cwd(), 'docs/raw');
const EXAMPLES_DIR = path.join(process.cwd(), 'docs/organized/code-examples');
const CHANGELOG_DIR = path.join(process.cwd(), 'docs/organized/changelogs');

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } catch (error) {
    console.error(`❌ Failed to create directory ${dir}: ${error.message}`);
  }
}

async function cloneRepo() {
  try {
    // Check if temp directory exists and remove it
    try {
      await fs.access(TEMP_DIR);
      console.log(`Removing existing temp directory: ${TEMP_DIR}`);
      await fs.rm(TEMP_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory doesn't exist, which is fine
    }

    console.log(`Cloning pydantic-ai repository to ${TEMP_DIR}...`);
    await execAsync(`git clone ${PYDANTIC_AI_REPO} ${TEMP_DIR}`);
    console.log('✅ Repository cloned successfully');
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to clone repository: ${error.message}`);
    return false;
  }
}

async function copyDocs() {
  try {
    const docsSource = path.join(TEMP_DIR, 'docs');
    
    // Check if docs directory exists in the cloned repo
    try {
      await fs.access(docsSource);
    } catch {
      console.warn('⚠️ No docs directory found in pydantic-ai repository');
      return false;
    }
    
    // Clear target docs directory
    try {
      await fs.rm(DOCS_RAW_DIR, { recursive: true, force: true });
    } catch {
      // It's okay if it doesn't exist
    }
    
    // Ensure the directory exists
    await ensureDirectoryExists(DOCS_RAW_DIR);
    
    // Copy all files from source to target
    const copyFiles = async (sourceDir, targetDir) => {
      const entries = await fs.readdir(sourceDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);
        
        if (entry.isDirectory()) {
          await ensureDirectoryExists(targetPath);
          await copyFiles(sourcePath, targetPath);
        } else {
          await fs.copyFile(sourcePath, targetPath);
        }
      }
    };
    
    await copyFiles(docsSource, DOCS_RAW_DIR);
    console.log('✅ Documentation copied successfully');
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to copy docs: ${error.message}`);
    return false;
  }
}

async function processExamples() {
  try {
    const examplesSource = path.join(TEMP_DIR, 'examples');
    
    // Check if examples directory exists in the cloned repo
    try {
      await fs.access(examplesSource);
    } catch {
      console.warn('⚠️ No examples directory found in pydantic-ai repository');
      return false;
    }
    
    // Clear target examples directory
    try {
      await fs.rm(EXAMPLES_DIR, { recursive: true, force: true });
    } catch {
      // It's okay if it doesn't exist
    }
    
    // Ensure the directory exists
    await ensureDirectoryExists(EXAMPLES_DIR);
    
    // Get all directories in the examples folder
    const dirs = await fs.readdir(examplesSource, { withFileTypes: true });
    
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;
      
      const exampleName = dir.name;
      const exampleOutputFile = path.join(EXAMPLES_DIR, `${exampleName}.md`);
      
      // Create example markdown file
      let markdownContent = `# ${exampleName}\n\n`;
      
      // Function to recursively process Python files
      const processPythonFiles = async (currentDir, relativePath = '') => {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(currentDir, entry.name);
          const entryRelativePath = path.join(relativePath, entry.name);
          
          if (entry.isDirectory()) {
            await processPythonFiles(entryPath, entryRelativePath);
          } else if (entry.name.endsWith('.py')) {
            const fileContent = await fs.readFile(entryPath, 'utf-8');
            markdownContent += `## ${entryRelativePath}\n\`\`\`python\n${fileContent}\n\`\`\`\n\n`;
          }
        }
      };
      
      await processPythonFiles(path.join(examplesSource, exampleName));
      
      // Write the markdown file
      await fs.writeFile(exampleOutputFile, markdownContent);
      console.log(`✅ Processed example: ${exampleName}`);
    }
    
    // Create a single file containing all examples if there are multiple examples
    const allExamplesFile = path.join(EXAMPLES_DIR, 'pydantic_ai_examples.md');
    let allExamplesContent = '# Pydantic AI Examples\n\n';
    
    const exampleFiles = await fs.readdir(EXAMPLES_DIR);
    for (const file of exampleFiles) {
      if (file === 'pydantic_ai_examples.md') continue;
      
      const content = await fs.readFile(path.join(EXAMPLES_DIR, file), 'utf-8');
      allExamplesContent += `\n\n${content}`;
    }
    
    await fs.writeFile(allExamplesFile, allExamplesContent);
    console.log('✅ Created combined examples file');
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to process examples: ${error.message}`);
    return false;
  }
}

async function extractChangelog() {
  try {
    const changelogSource = path.join(TEMP_DIR, 'CHANGELOG.md');
    
    // Ensure the directory exists
    await ensureDirectoryExists(CHANGELOG_DIR);
    
    // Check if changelog file exists in the cloned repo
    try {
      await fs.access(changelogSource);
    } catch {
      console.warn('⚠️ No CHANGELOG.md found in pydantic-ai repository');
      
      // Create placeholder
      const changelogTarget = path.join(CHANGELOG_DIR, 'pydantic-ai.md');
      await fs.writeFile(changelogTarget, '# Pydantic AI Changelog\n\n## Latest Version\n- No changelog available\n');
      
      return false;
    }
    
    // Copy changelog
    const changelogTarget = path.join(CHANGELOG_DIR, 'pydantic-ai.md');
    await fs.copyFile(changelogSource, changelogTarget);
    console.log('✅ Changelog extracted successfully');
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to extract changelog: ${error.message}`);
    return false;
  }
}

async function cleanup() {
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
    console.log('✅ Cleaned up temporary files');
  } catch (error) {
    console.error(`❌ Failed to clean up: ${error.message}`);
  }
}

async function syncVersionInfo() {
  try {
    // Try to extract version info from pyproject.toml
    let version = null;
    try {
      const pyprojectPath = path.join(TEMP_DIR, 'pyproject.toml');
      const pyproject = await fs.readFile(pyprojectPath, 'utf-8');
      const versionMatch = pyproject.match(/version = ["']([^"']+)["']/);
      if (versionMatch) {
        version = versionMatch[1];
      }
    } catch {
      // No pyproject.toml, try setup.py
      try {
        const setupPath = path.join(TEMP_DIR, 'setup.py');
        const setup = await fs.readFile(setupPath, 'utf-8');
        const versionMatch = setup.match(/version=["']([^"']+)["']/);
        if (versionMatch) {
          version = versionMatch[1];
        }
      } catch {
        // No setup.py either
      }
    }
    
    if (version) {
      console.log(`✅ Found pydantic-ai version: ${version}`);
      
      // Update our package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      packageJson.version = version;
      
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log('✅ Updated package.json with new version');
    } else {
      console.warn('⚠️ Could not determine pydantic-ai version');
    }
  } catch (error) {
    console.error(`❌ Failed to sync version info: ${error.message}`);
  }
}

async function main() {
  console.log('🔄 Starting pydantic-ai docs sync...');
  
  if (await cloneRepo()) {
    await Promise.all([
      copyDocs(),
      processExamples(),
      extractChangelog(),
      syncVersionInfo()
    ]);
  }
  
  await cleanup();
  console.log('✨ Sync completed!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
}); 