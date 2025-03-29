import * as path from 'path';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'url';

// Fix for import.meta.dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function fromRepoRoot(relative: string): string {
  return path.resolve(__dirname, `../../../`, relative);
}

export function fromPackageRoot(relative: string): string {
  return path.resolve(__dirname, `../`, relative);
}

export const log = console.error;

// Source and destination directories
export const EXAMPLES_SOURCE = fromRepoRoot("examples");
export const OUTPUT_DIR = fromPackageRoot(".docs/organized/code-examples");

// Prepare code examples from the examples directory
export async function prepareCodeExamples() {
  try {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  } catch {}
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const examples = await fs.readdir(EXAMPLES_SOURCE, { withFileTypes: true });
  const exampleDirs = examples.filter(entry => entry.isDirectory());
  
  for (const dir of exampleDirs) {
    const examplePath = path.join(EXAMPLES_SOURCE, dir.name);
    const outputFile = path.join(OUTPUT_DIR, `${dir.name}.md`);
    
    const files: Array<{ path: string, content: string }> = [];
    
    // Try to get package.json
    try {
      const packageJson = await fs.readFile(path.join(examplePath, "package.json"), "utf-8");
      files.push({
        path: "package.json",
        content: packageJson
      });
    } catch {}
    
    // Try to scan Python files
    try {
      const srcPath = path.join(examplePath, "src");
      await scanDirectory(srcPath, srcPath, files);
    } catch {}
    
    if (files.length > 0) {
      const output = files.map(file => 
        `### ${file.path}
\`\`\`${getFileType(file.path)}
${file.content}
\`\`\`
`).join("\n");
      
      const totalLines = output.split("\n").length;
      if (totalLines > 500) {
        log(`Skipping ${dir.name}: ${totalLines} lines exceeds limit of 500`);
        continue;
      }
      
      await fs.writeFile(outputFile, output, "utf-8");
      log(`Generated ${dir.name}.md with ${totalLines} lines`);
    }
  }
}

// Scan a directory for Python files
async function scanDirectory(basePath: string, currentPath: string, files: Array<{ path: string, content: string }>) {
  const entries = await fs.readdir(currentPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    const relativePath = path.relative(basePath, fullPath);
    
    if (entry.isDirectory()) {
      await scanDirectory(basePath, fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith(".py") || entry.name.endsWith(".ipynb"))) {
      const content = await fs.readFile(fullPath, "utf-8");
      files.push({
        path: relativePath,
        content
      });
    }
  }
}

// Get file type for syntax highlighting
function getFileType(filePath: string): string {
  if (filePath === "package.json") return "json";
  if (filePath.endsWith(".py")) return "python";
  if (filePath.endsWith(".ipynb")) return "json";
  return "";
}

// Documentation source and destination
export const DOCS_SOURCE = fromRepoRoot("docs/src/pages/docs");
export const DOCS_DEST = fromPackageRoot(".docs/raw");

// Copy documentation files
export async function copyRaw() {
  try {
    try {
      await fs.rm(DOCS_DEST, { recursive: true });
    } catch {}
    
    await copyDir(DOCS_SOURCE, DOCS_DEST);
    log("✅ Documentation files copied successfully");
  } catch (error) {
    console.error("❌ Failed to copy documentation files:", error);
    process.exit(1);
  }
}

// Copy a directory recursively
async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  
  try {
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else if (entry.isFile() && (entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))) {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    // If source directory doesn't exist, try to create an example docs structure
    await createExampleDocs(dest);
  }
}

// Create an example documentation structure if source doesn't exist
async function createExampleDocs(dest: string) {
  const exampleContent = `# Pydantic-AI Documentation

This is a placeholder documentation file. Replace this with your actual documentation.

## Getting Started

Please add your getting started guide here.

## API Reference

Please add your API reference documentation here.
`;

  await fs.mkdir(path.join(dest, "getting-started"), { recursive: true });
  await fs.mkdir(path.join(dest, "api-reference"), { recursive: true });
  
  await fs.writeFile(path.join(dest, "index.mdx"), exampleContent, "utf-8");
  await fs.writeFile(
    path.join(dest, "getting-started", "index.mdx"), 
    "# Getting Started with Pydantic-AI\n\nAdd your getting started documentation here.", 
    "utf-8"
  );
  await fs.writeFile(
    path.join(dest, "api-reference", "index.mdx"), 
    "# API Reference\n\nAdd your API reference documentation here.", 
    "utf-8"
  );
  
  log("✅ Created example documentation structure");
}

// Source directories for changelogs
export const SOURCE_DIRS = ["packages"].map(fromRepoRoot);
export const CHANGELOGS_DEST = fromPackageRoot(".docs/organized/changelogs");
export const MAX_LINES = 300;

// Truncate content if it exceeds max lines
export function truncateContent(content: string, maxLines: number): string {
  const lines = content.split("\n");
  if (lines.length <= maxLines) return content;
  
  const visibleLines = lines.slice(0, maxLines);
  const hiddenCount = lines.length - maxLines;
  
  return visibleLines.join("\n") + `\n\n... ${hiddenCount} more lines hidden. See full changelog in package directory.`;
}

// Process a package directory to extract its changelog
export async function processPackageDir(packagePath: string, outputDir: string) {
  let packageName: string;
  
  try {
    const packageJsonPath = path.join(packagePath, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    packageName = packageJson.name;
    
    if (!packageName) {
      log(`Skipping ${path.basename(packagePath)}: No package name found in package.json`);
      return;
    }
  } catch {
    try {
      // Try to get package name from pyproject.toml or setup.py
      const files = await fs.readdir(packagePath);
      if (files.includes("pyproject.toml")) {
        const pyprojectContent = await fs.readFile(path.join(packagePath, "pyproject.toml"), "utf-8");
        const match = pyprojectContent.match(/name\s*=\s*["']([^"']+)["']/);
        packageName = match?.[1] || path.basename(packagePath);
      } else if (files.includes("setup.py")) {
        const setupContent = await fs.readFile(path.join(packagePath, "setup.py"), "utf-8");
        const match = setupContent.match(/name\s*=\s*["']([^"']+)["']/);
        packageName = match?.[1] || path.basename(packagePath);
      } else {
        packageName = path.basename(packagePath);
      }
    } catch {
      log(`Skipping ${path.basename(packagePath)}: Failed to determine package name`);
      return;
    }
  }
  
  try {
    // Try to find changelog file with various names
    const possibleChangelogFiles = ["CHANGELOG.md", "CHANGELOG", "CHANGES.md", "CHANGES", "HISTORY.md", "HISTORY"];
    let changelog: string | undefined;
    
    for (const file of possibleChangelogFiles) {
      try {
        const changelogPath = path.join(packagePath, file);
        const content = await fs.readFile(changelogPath, "utf-8");
        changelog = truncateContent(content, MAX_LINES);
        break;
      } catch {}
    }
    
    if (!changelog) {
      changelog = "No changelog available.";
    }
    
    const outputFile = path.join(outputDir, `${encodeURIComponent(packageName)}.md`);
    await fs.writeFile(outputFile, changelog, "utf-8");
    log(`Generated changelog for ${packageName}`);
  } catch (error) {
    console.error(`Error processing changelog for ${packageName}:`, error);
  }
}

// Prepare package changelogs
export async function preparePackageChanges() {
  const outputDir = path.resolve(process.cwd(), CHANGELOGS_DEST);
  
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
  } catch {}
  
  await fs.mkdir(outputDir, { recursive: true });
  
  for (const sourceDir of SOURCE_DIRS) {
    const fullSourceDir = path.resolve(process.cwd(), sourceDir);
    
    try {
      await fs.access(fullSourceDir);
      const entries = await fs.readdir(fullSourceDir, { withFileTypes: true });
      const packageDirs = entries
        .filter(entry => entry.isDirectory())
        .filter(entry => !entry.name.startsWith("_") && !entry.name.startsWith("."));
      
      for (const dir of packageDirs) {
        const packagePath = path.join(fullSourceDir, dir.name);
        await processPackageDir(packagePath, outputDir);
      }
    } catch {
      console.error(`Skipping ${sourceDir}: Directory not found or not accessible`);
      
      // If no source directory exists, create a placeholder changelog
      const placeholderChangelog = "# Pydantic-AI Changelog\n\n## Latest Version\n\n- Initial release";
      await fs.writeFile(path.join(outputDir, "pydantic-ai.md"), placeholderChangelog, "utf-8");
      log("Created placeholder changelog");
    }
  }
} 