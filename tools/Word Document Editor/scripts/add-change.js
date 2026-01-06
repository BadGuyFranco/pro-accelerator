#!/usr/bin/env node
/**
 * Add a new tracked change to a Word document.
 *
 * Usage:
 *     node add-change.js document.docx --text "New content" --type insertion
 */

import { readDocx, writeDocx, parseXml, serializeXml, select } from './docx-utils.js';
import { existsSync, copyFileSync } from 'fs';

/**
 * Add a tracked change to a Word document
 */
async function addChange(docxPath, text, options = {}) {
  const { type = 'insertion', author = 'AIM', outputPath = null } = options;

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

  const changeDate = new Date().toISOString();
  const nsW = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  // Find body
  const body = select('//w:body', docDoc)[0];
  if (!body) {
    throw new Error('Document body not found');
  }

  // Create the change element based on type
  let changeElem;
  if (type === 'insertion') {
    changeElem = docDoc.createElementNS(nsW, 'w:ins');
  } else if (type === 'deletion') {
    changeElem = docDoc.createElementNS(nsW, 'w:del');
  } else {
    throw new Error(`Unsupported change type: ${type}. Use 'insertion' or 'deletion'.`);
  }

  changeElem.setAttribute('w:author', author);
  changeElem.setAttribute('w:date', changeDate);

  // Create paragraph with run and text
  const para = docDoc.createElementNS(nsW, 'w:p');
  const run = docDoc.createElementNS(nsW, 'w:r');
  const textElem = docDoc.createElementNS(nsW, 'w:t');
  textElem.textContent = text;

  run.appendChild(textElem);

  if (type === 'deletion') {
    // For deletions, use w:delText instead of w:t
    const delTextElem = docDoc.createElementNS(nsW, 'w:delText');
    delTextElem.textContent = text;
    run.removeChild(textElem);
    run.appendChild(delTextElem);
  }

  changeElem.appendChild(run);
  para.appendChild(changeElem);

  // Append to body
  body.appendChild(para);

  // Write back document.xml
  zip.file('word/document.xml', serializeXml(docDoc));

  // Enable track changes in settings.xml if it exists
  const settingsXml = await zip.file('word/settings.xml')?.async('string');
  if (settingsXml && !settingsXml.includes('trackRevisions')) {
    const newSettings = settingsXml.replace(
      '</w:settings>',
      '  <w:trackRevisions/>\n</w:settings>'
    );
    zip.file('word/settings.xml', newSettings);
  }

  // Save
  await writeDocx(zip, finalOutputPath);

  return { type, author, text };
}

// CLI
function showHelp() {
  console.log(`
Add a new tracked change to a Word document

Usage:
  node add-change.js <document> --text "Text" --type <type> [options]

Arguments:
  document        Path to Word document (.docx)

Options:
  --text TEXT     Text to insert or delete (required)
  --type TYPE     Type: 'insertion' or 'deletion' (default: insertion)
  --author NAME   Author name for the change (default: AIM)
  --output, -o    Output file path (default: overwrites original)
  --help, -h      Show this help message

Examples:
  node add-change.js document.docx --text "New content" --type insertion
  node add-change.js document.docx --text "Removed text" --type deletion
  node add-change.js document.docx --text "Edit" --author "Reviewer" --output modified.docx
`);
  process.exit(0);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const docxPath = args[0];
let text = null;
let type = 'insertion';
let author = 'AIM';
let outputPath = null;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--text' && args[i + 1]) {
    text = args[++i];
  } else if (args[i] === '--type' && args[i + 1]) {
    type = args[++i];
  } else if (args[i] === '--author' && args[i + 1]) {
    author = args[++i];
  } else if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
    outputPath = args[++i];
  }
}

if (!text) {
  console.error('Error: --text is required');
  process.exit(1);
}

if (!existsSync(docxPath)) {
  console.error(`Error: File not found: ${docxPath}`);
  process.exit(1);
}

try {
  const result = await addChange(docxPath, text, { type, author, outputPath });
  console.log(`\nSuccess! Change added and saved to: ${outputPath || docxPath}`);
  console.log(`   Type: ${result.type}`);
  console.log(`   Author: ${result.author}`);
  console.log(`   Text: "${result.text}"`);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}

