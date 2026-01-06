#!/usr/bin/env node
/**
 * List all comments in a Word document.
 *
 * Usage:
 *     node list-comments.js document.docx
 */

import { listComments } from './docx-utils.js';
import { existsSync } from 'fs';

// CLI
function showHelp() {
  console.log(`
List all comments in a Word document

Usage:
  node list-comments.js <document>

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
  const comments = await listComments(docxPath);

  if (comments.length === 0) {
    console.log('No comments found in document.');
    process.exit(0);
  }

  console.log(`\nFound ${comments.length} comment(s):\n`);
  console.log('='.repeat(80));

  for (const comment of comments) {
    console.log(`\nComment ID: ${comment.id}`);
    console.log(`Author: ${comment.author}`);
    if (comment.initials) {
      console.log(`Initials: ${comment.initials}`);
    }
    if (comment.date) {
      console.log(`Date: ${comment.date}`);
    }
    console.log(`Text: "${comment.text}"`);
    console.log('-'.repeat(80));
  }
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}

