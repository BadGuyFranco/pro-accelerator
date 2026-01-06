#!/usr/bin/env node
/**
 * List all track changes in a Word document.
 *
 * Usage:
 *     node list-changes.js document.docx
 */

import { listTrackChanges } from './docx-utils.js';
import { existsSync } from 'fs';

// CLI
function showHelp() {
  console.log(`
List all track changes in a Word document

Usage:
  node list-changes.js <document>

Arguments:
  document    Path to Word document (.docx)

Options:
  --help, -h  Show this help message
`);
  process.exit(0);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const docxPath = args[0];

if (!existsSync(docxPath)) {
  console.error(`Error: File not found: ${docxPath}`);
  process.exit(1);
}

try {
  const changes = await listTrackChanges(docxPath);

  if (changes.length === 0) {
    console.log('No track changes found in document.');
    process.exit(0);
  }

  console.log(`\nFound ${changes.length} track change(s):\n`);
  console.log('='.repeat(80));

  for (const change of changes) {
    console.log(`\nChange ID: ${change.id}`);
    console.log(`Type: ${change.type}`);
    console.log(`Author: ${change.author}`);
    if (change.date) {
      console.log(`Date: ${change.date}`);
    }
    const textPreview = change.text.length > 100 ? change.text.slice(0, 100) + '...' : change.text;
    console.log(`Text: "${textPreview}"`);
    console.log(`Status: ${change.status}`);
    console.log('-'.repeat(80));
  }
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}

