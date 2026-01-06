#!/usr/bin/env node
/**
 * Apply all track changes in a Word document.
 *
 * Usage:
 *     node apply-all-changes.js document.docx
 */

import { readDocx, writeDocx, parseXml, serializeXml, select, listTrackChanges } from './docx-utils.js';
import { existsSync, copyFileSync } from 'fs';
import { createInterface } from 'readline';

/**
 * Prompt user for confirmation
 */
async function confirm(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${message} (y/N): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Apply all track changes in a Word document
 */
async function applyAllChanges(docxPath, options = {}) {
  const { outputPath = null, filterAuthor = null, filterType = null, skipConfirmation = false } = options;

  // List all changes
  let changes = await listTrackChanges(docxPath);

  // Apply filters
  if (filterAuthor) {
    changes = changes.filter(c => c.author === filterAuthor);
  }
  if (filterType) {
    changes = changes.filter(c => c.type.toLowerCase().includes(filterType.toLowerCase()));
  }

  if (changes.length === 0) {
    console.log('No track changes found (or none match filters).');
    return { applied: 0 };
  }

  // Show summary
  console.log(`\nFound ${changes.length} change(s) to apply:\n`);
  console.log('='.repeat(60));

  for (const change of changes) {
    console.log(`  ${change.id}. ${change.type} by ${change.author}`);
    console.log(`     "${change.text.slice(0, 50)}${change.text.length > 50 ? '...' : ''}"`);
  }

  console.log('='.repeat(60));

  // Confirm
  if (!skipConfirmation) {
    const confirmed = await confirm(`\nApply all ${changes.length} changes?`);
    if (!confirmed) {
      console.log('Operation cancelled.');
      process.exit(0);
    }
  }

  // Determine output path
  const finalOutputPath = outputPath || docxPath;

  // Copy file if output is different
  if (outputPath && outputPath !== docxPath) {
    copyFileSync(docxPath, outputPath);
  }

  // Read document
  const zip = await readDocx(outputPath || docxPath);

  // Read document.xml
  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) {
    throw new Error('Invalid Word document structure');
  }
  const docDoc = parseXml(docXml);

  // Apply all insertions (accept them - keep content, remove w:ins wrapper)
  const insertions = select('//w:ins', docDoc);
  for (const ins of insertions) {
    const parent = ins.parentNode;
    const children = Array.from(ins.childNodes);
    for (const child of children) {
      parent.insertBefore(child.cloneNode(true), ins);
    }
    parent.removeChild(ins);
  }

  // Apply all deletions (accept them - remove content)
  const deletions = select('//w:del', docDoc);
  for (const del of deletions) {
    del.parentNode.removeChild(del);
  }

  // Apply formatting changes (accept them - remove the change markers)
  const rPrChanges = select('//w:rPrChange', docDoc);
  for (const fmt of rPrChanges) {
    fmt.parentNode.removeChild(fmt);
  }

  const pPrChanges = select('//w:pPrChange', docDoc);
  for (const fmt of pPrChanges) {
    fmt.parentNode.removeChild(fmt);
  }

  // Write back document.xml
  zip.file('word/document.xml', serializeXml(docDoc));

  // Save
  await writeDocx(zip, finalOutputPath);

  return { applied: changes.length };
}

// CLI
function showHelp() {
  console.log(`
Apply all track changes in a Word document

Usage:
  node apply-all-changes.js <document> [options]

Arguments:
  document            Path to Word document (.docx)

Options:
  --output, -o        Output file path (default: overwrites original)
  --filter-author     Only apply changes by specific author
  --filter-type       Only apply specific change types (insertion, deletion, formatting)
  --yes, -y           Skip confirmation prompt
  --help, -h          Show this help message

Examples:
  node apply-all-changes.js document.docx
  node apply-all-changes.js document.docx --output clean.docx
  node apply-all-changes.js document.docx --filter-author "AIM"
`);
  process.exit(0);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const docxPath = args[0];
let outputPath = null;
let filterAuthor = null;
let filterType = null;
let skipConfirmation = false;

for (let i = 1; i < args.length; i++) {
  if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
    outputPath = args[++i];
  } else if (args[i] === '--filter-author' && args[i + 1]) {
    filterAuthor = args[++i];
  } else if (args[i] === '--filter-type' && args[i + 1]) {
    filterType = args[++i];
  } else if (args[i] === '--yes' || args[i] === '-y') {
    skipConfirmation = true;
  }
}

if (!existsSync(docxPath)) {
  console.error(`Error: File not found: ${docxPath}`);
  process.exit(1);
}

try {
  const result = await applyAllChanges(docxPath, { outputPath, filterAuthor, filterType, skipConfirmation });
  console.log(`\nSuccess! ${result.applied} change(s) applied.`);
  console.log(`Saved to: ${outputPath || docxPath}`);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}

