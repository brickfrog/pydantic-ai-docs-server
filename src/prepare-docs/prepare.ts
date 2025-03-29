import { log, copyRaw, prepareCodeExamples, preparePackageChanges } from '../utils.js';

export async function prepare() {
  log("Preparing documentation...");
  await copyRaw();
  
  log("Preparing code examples...");
  await prepareCodeExamples();
  
  log("Preparing package changelogs...");
  await preparePackageChanges();
  
  log("Documentation preparation complete!");
}

if (process.env.PREPARE === `true`) {
  try {
    await prepare();
  } catch (error) {
    console.error("Error preparing documentation:", error);
    process.exit(1);
  }
} 