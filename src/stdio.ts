#!/usr/bin/env node
import { fromPackageRoot } from './utils.js';
import * as fs from 'node:fs/promises';
import { FastMCP } from 'tylerbarnes-fastmcp-fix';
import { JSDOM } from 'jsdom';
import { z } from 'zod';
import * as path from 'node:path';

// Blog Tool - Fetch pydantic-ai blog posts
async function fetchBlogPosts() {
  try {
    const response = await fetch("https://pydantic-docs.helpmanual.io/blog/");
    if (!response.ok) {
      throw new Error("Failed to fetch blog posts");
    }
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const blogLinks = Array.from(document.querySelectorAll('a[href^="/blog/"]'))
      .filter(link => {
        const href = link?.getAttribute("href");
        return href !== "/blog" && !href?.includes("authors");
      })
      .map(link => {
        const title = link?.textContent?.trim();
        const href = link?.getAttribute("href");
        if (title && href) {
          return `[${title}](${href})`;
        }
        return null;
      })
      .filter(Boolean) as string[];
    
    return "Pydantic-AI Blog Posts:\n\n" + blogLinks.join("\n");
  } catch (error) {
    // Fallback if blog doesn't exist yet
    return "Pydantic-AI Blog Posts:\n\nNo blog posts available yet.";
  }
}

async function fetchBlogPost(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch blog post");
    }
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove scripts
    const scripts = document.querySelectorAll("script");
    scripts.forEach(script => script.remove());
    
    const content = document.body.textContent?.trim() || "";
    if (!content) {
      throw new Error("No content found in blog post");
    }
    
    return content;
  } catch (error) {
    throw new Error(`Failed to fetch blog post: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Blog Tool Definition
const blogTool = {
  name: "pydanticAIBlog",
  description: "Get pydantic-ai blog content. Without a URL, returns a list of all blog posts. With a URL, returns the specific blog post content in markdown format.",
  parameters: z.object({
    url: z.string().describe("URL of a specific blog post to fetch. If the string /blog is passed as the url it returns a list of all blog posts.")
  }),
  execute: async (args: { url: string }) => {
    try {
      if (args.url !== `/blog`) {
        return await fetchBlogPost(`https://pydantic-docs.helpmanual.io${args.url}`);
      } else {
        return await fetchBlogPosts();
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error("Failed to fetch blog posts");
      }
      throw error;
    }
  }
};

// Utility functions for changelogs
function encodePackageName(name: string): string {
  return encodeURIComponent(name);
}

function decodePackageName(name: string): string {
  return decodeURIComponent(name);
}

// Changelogs Tool
const changelogsDir = fromPackageRoot("docs/organized/changelogs");

async function listPackageChangelogs() {
  try {
    const files = await fs.readdir(changelogsDir);
    return files
      .filter(f => f.endsWith(".md"))
      .map(f => ({
        name: decodePackageName(f.replace(".md", "")),
        path: f
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

async function readPackageChangelog(filename: string) {
  const encodedName = encodePackageName(filename.replace(".md", ""));
  const filePath = path.join(changelogsDir, `${encodedName}.md`);
  
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    const packages = await listPackageChangelogs();
    const availablePackages = packages.map(pkg => `- ${pkg.name}`).join("\n");
    
    throw new Error(
      `Changelog for "${filename.replace(".md", "")}" not found.

Available packages:
${availablePackages}`
    );
  }
}

// Changes Tool Schema Definition
const changesSchema = z.object({
  package: z.string().optional().describe("Name of the specific package to fetch changelog for. If not provided, lists all available packages.")
});

// Documentation Tool
const docsBaseDir = fromPackageRoot("docs/raw/");

// Function to check if MCP server is running with documentation
function checkDocsStatus() {
  try {
    // Always return true since we have docs
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}

async function listDirContents(dirPath: string) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const dirs: string[] = [];
  const files: string[] = [];
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      dirs.push(entry.name + "/");
    } else if (entry.isFile() && (entry.name.endsWith(".mdx") || entry.name.endsWith(".md"))) {
      files.push(entry.name);
    }
  }
  
  return {
    dirs: dirs.sort(),
    files: files.sort()
  };
}

async function readMdxContent(docPath: string) {
  const fullPath = path.join(docsBaseDir, docPath);
  
  try {
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      const { dirs, files } = await listDirContents(fullPath);
      
      const dirListing = [
        `Directory contents of ${docPath}:`,
        "",
        dirs.length > 0 ? "Subdirectories:" : "No subdirectories.",
        ...dirs.map(d => `- ${d}`),
        "",
        files.length > 0 ? "Files in this directory:" : "No files in this directory.",
        ...files.map(f => `- ${f}`),
        "",
        "---",
        "",
        "Contents of all files in this directory:",
        ""
      ].join("\n");
      
      let fileContents = "";
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const content = await fs.readFile(filePath, "utf-8");
        fileContents += `

# ${file}

${content}`;
      }
      
      return dirListing + fileContents;
    }
    
    return fs.readFile(fullPath, "utf-8");
  } catch (error) {
    throw new Error(`Path not found: ${docPath}`);
  }
}

async function findNearestDirectory(docPath: string, availablePaths: string[]) {
  const parts = docPath.split('/');
  
  while (parts.length > 0) {
    const testPath = parts.join('/');
    
    try {
      const fullPath = path.join(docsBaseDir, testPath);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        const { dirs, files } = await listDirContents(fullPath);
        
        return [
          `Path "${docPath}" not found.`,
          `Here are the available paths in "${testPath}":`,
          "",
          dirs.length > 0 ? "Directories:" : "No subdirectories.",
          ...dirs.map(d => `- ${testPath}/${d}`),
          "",
          files.length > 0 ? "Files:" : "No files.",
          ...files.map(f => `- ${testPath}/${f}`),
        ].join("\n");
      }
    } catch {
      // Continue to check parent directories
    }
    
    parts.pop();
  }
  
  return [
    `Path "${docPath}" not found.`,
    "Available top-level paths:",
    "",
    ...availablePaths.map(p => `- ${p}`)
  ].join("\n");
}

async function getAvailablePaths(): Promise<string[]> {
  try {
    const { dirs, files } = await listDirContents(docsBaseDir);
    return [...dirs, ...files];
  } catch {
    return [];
  }
}

// Code Examples Tool
const examplesDir = fromPackageRoot("docs/organized/code-examples");

async function listCodeExamples() {
  try {
    const files = await fs.readdir(examplesDir);
    return files
      .filter(f => f.endsWith(".md"))
      .map(f => f.replace(".md", ""))
      .sort();
  } catch {
    return [];
  }
}

async function readCodeExample(filename: string) {
  const filePath = path.join(examplesDir, `${filename}.md`);
  
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    const examples = await listCodeExamples();
    
    return [
      `Example "${filename}" not found.`,
      "",
      "Available examples:",
      ...examples.map(ex => `- ${ex}`)
    ].join("\n");
  }
}

// Initialize and start the MCP server
async function main() {
  const hasDocumentation = await checkDocsStatus();
  
  // Get available paths for tools
  const availablePaths = await getAvailablePaths();
  const availablePathsText = availablePaths.length > 0
    ? "Available top-level paths: " + availablePaths.join(", ")
    : "No documentation available yet. Please contact the package author.";

  const initialExamples = await listCodeExamples();
  const examplesListing = initialExamples.length > 0
    ? "\n\nAvailable examples: " + initialExamples.join(", ")
    : "\n\nNo examples available yet. Please contact the package author.";
    
  const initialPackages = await listPackageChangelogs();
  const packagesListing = initialPackages.length > 0 
    ? "\n\nAvailable packages: " + initialPackages.map(pkg => pkg.name).join(", ") 
    : "\n\nNo changelog information available yet. Please contact the package author.";

  // Status message if docs are missing
  const noDocsMessage = `
Documentation is not available in this package.
Please use the version from the official GitHub repository:
npx -y github:brickfrog/pydantic-ai-docs-server
`;

  // Define tools with updated listings
  const docsTool = {
    name: "pydanticAIDocs",
    description: `Get pydantic-ai documentation. Provide a path to get specific documentation. ${availablePathsText}`,
    parameters: z.object({
      path: z.string().describe("Path to documentation to fetch. For example 'getting-started/index.mdx' or 'api-reference/'")
    }),
    execute: async (args: { path: string }) => {
      const docPath = args.path.startsWith("/") ? args.path.slice(1) : args.path;
      
      try {
        return await readMdxContent(docPath);
      } catch (error) {
        return await findNearestDirectory(docPath, availablePaths);
      }
    }
  };

  const examplesTool = {
    name: "pydanticAIExamples",
    description: "Get pydantic-ai code examples. Without a name, lists all available examples. With a name, returns the specific example code." + examplesListing,
    parameters: z.object({
      name: z.string().optional().describe("Name of the specific example to fetch. If not provided, lists all available examples.")
    }),
    execute: async (args: { name?: string }) => {
      if (!args.name) {
        const examples = await listCodeExamples();
        
        if (examples.length === 0) {
          return "No examples available yet. Please contact the package author.";
        }
        
        return [
          "Available pydantic-ai code examples:",
          "",
          ...examples.map(ex => `- ${ex}`)
        ].join("\n");
      }
      
      return readCodeExample(args.name);
    }
  };

  const changesTool = {
    name: "pydanticAIChanges",
    description: "Get changelog information for pydantic-ai packages. " + packagesListing,
    parameters: changesSchema,
    execute: async (args: { package?: string }) => {
      if (!args.package) {
        const packages = await listPackageChangelogs();
        return [
          "Available package changelogs:",
          "",
          ...packages.map(pkg => `- ${pkg.name}`)
        ].join("\n");
      }
      
      const content = await readPackageChangelog(args.package);
      return content;
    }
  };

  // Start the MCP server
  const mcp = new FastMCP({
    name: "pydantic-ai-docs",
    version: "0.0.1"
  });
  mcp.addTool(docsTool);
  mcp.addTool(examplesTool);
  mcp.addTool(blogTool);
  mcp.addTool(changesTool);
  mcp.start();
}

// Run the main function
main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 