#!/usr/bin/env node
/**
 * Apply (accept) a track change in a Word document.
 *
 * Usage:
 *     node apply-change.js document.docx --change-id 1
 */

import { readDocx, writeDocx, parseXml, serializeXml, select, listTrackChanges, getTextFromElement } from './docx-utils.js';
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
 * Apply a track change in a Word document
 */
async function applyChange(docxPath, changeId, options = {}) {
  const { outputPath = null, skipConfirmation = false } = options;

  // List changes first
  const changes = await listTrackChanges(docxPath);
  const change = changes.find(c => c.id === changeId);

  if (!change) {
    throw new Error(`Change ID ${changeId} not found. Run list-changes.js to see available changes.`);
  }

  // Show change details
  console.log('\nChange to apply:');
  console.log(`  Type: ${change.type}`);
  console.log(`  Author: ${change.author}`);
  console.log(`  Text: "${change.text.slice(0, 100)}${change.text.length > 100 ? '...' : ''}"`);

  // Confirm
  if (!skipConfirmation) {
    const confirmed = await confirm('\nApply this change?');
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

  // Find the nth change element of the specified type
  const elementTag = change.element === 'ins' ? 'w:ins' : change.element === 'del' ? 'w:del' : `w:${change.element}`;
  const changeElements = select(`//${elementTag}`, docDoc);

  // Track which instance we're looking for based on order in original list
  let targetIndex = 0;
  for (let i = 0; i < changes.length; i++) {
    if (changes[i].id === changeId) break;
    if (changes[i].element === change.element) targetIndex++;
  }

  const targetElement = changeElements[targetIndex];
  if (!targetElement) {
    throw new Error('Could not locate change element in document');
  }

  const parent = targetElement.parentNode;

  if (change.type === 'Insertion') {
    // Accept insertion: replace w:ins with its children (keep the content)
    const children = Array.from(targetElement.childNodes);
    for (const child of children) {
      parent.insertBefore(child.cloneNode(true), targetElement);
    }
    parent.removeChild(targetElement);
  } else if (change.type === 'Deletion') {
    // Accept deletion: remove the w:del and its contents (content is deleted)
    parent.removeChild(targetElement);
  } else if (change.type.startsWith('Formatting')) {
    // Accept formatting: remove the *PrChange element (keep new formatting)
    parent.removeChild(targetElement);
  }

  // Write back document.xml
  zip.file('word/document.xml', serializeXml(docDoc));

  // Save
  await writeDocx(zip, finalOutputPath);

  return { changeId, type: change.type };
}

// CLI
function showHelp() {
  console.log(`
Apply (accept) a track change in a Word document

Usage:
  node apply-change.js <document> --change-id <N> [options]

Arguments:
  document          Path to Word document (.docx)

Options:
  --change-id N     ID of change to apply (from list-changes output)
  --output, -o      Output file path (default: overwrites original)
  --yes, -y         Skip confirmation prompt
  --help, -h        Show this help message

Examples:
  node apply-change.js document.docx --change-id 1
  node apply-change.js document.docx --change-id 2 --output modified.docx
`);
  process.exit(0);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const docxPath = args[0];
let changeId = null;
let outputPath = null;
let skipConfirmation = false;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--change-id' && args[i + 1]) {
    changeId = parseInt(args[++i], 10);
  } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
    outputPath = args[++i];
  } else if (args[i] === '--yes' || args[i] === '-y') {
    skipConfirmation = true;
  }
}

if (changeId === null) {
  console.error('Error: --change-id is required');
  process.exit(1);
}

if (!existsSync(docxPath)) {
  console.error(`Error: File not found: ${docxPath}`);
  process.exit(1);
}

try {
  const result = await applyChange(docxPath, changeId, { outputPath, skipConfirmation });
  console.log(`\nSuccess! Change ${result.changeId} (${result.type}) applied.`);
  console.log(`Saved to: ${outputPath || docxPath}`);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}

