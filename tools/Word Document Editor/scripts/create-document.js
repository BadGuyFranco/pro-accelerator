#!/usr/bin/env node
/**
 * Create a new Word document from scratch.
 *
 * Usage:
 *     node create-document.js output.docx
 *     node create-document.js output.docx --text "Initial content"
 *     node create-document.js output.docx --title "Document Title"
 */

import JSZip from 'jszip';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

/**
 * Create a new Word document from scratch
 */
async function createWordDocument(outputPath, options = {}) {
  const { initialText = '', title = null } = options;

  // Ensure output directory exists
  const parentDir = dirname(outputPath);
  if (parentDir && !existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }

  const zip = new JSZip();

  // [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  // _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`);

  // word/document.xml
  const bodyContent = initialText
    ? `<w:p><w:r><w:t>${escapeXml(initialText)}</w:t></w:r></w:p>`
    : '';

  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyContent}</w:body>
</w:document>`);

  // word/_rels/document.xml.rels
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  // word/styles.xml
  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr>
      <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="22"/>
      <w:szCs w:val="22"/>
    </w:rPr>
  </w:style>
</w:styles>`);

  // docProps/core.xml
  const now = new Date().toISOString();
  const titleXml = title ? `<dc:title>${escapeXml(title)}</dc:title>` : '';

  zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:dcterms="http://purl.org/dc/terms/"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  ${titleXml}
  <dc:creator>Word Document Editor</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`);

  // Generate and save the file
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  writeFileSync(outputPath, content);
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// CLI
function showHelp() {
  console.log(`
Create a new Word document from scratch

Usage:
  node create-document.js <output> [options]

Arguments:
  output          Output file path (.docx)

Options:
  --text TEXT     Initial text content
  --title TITLE   Document title
  --help, -h      Show this help message

Examples:
  node create-document.js output.docx
  node create-document.js output.docx --text "Initial content"
  node create-document.js output.docx --title "My Document" --text "Content"
`);
  process.exit(0);
}

// Parse CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const outputPath = args[0];
let initialText = '';
let title = null;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--text' && args[i + 1]) {
    initialText = args[++i];
  } else if (args[i] === '--title' && args[i + 1]) {
    title = args[++i];
  }
}

// Validate output path
if (!outputPath.toLowerCase().endsWith('.docx')) {
  console.log('Warning: Output file should have .docx extension');
}

try {
  await createWordDocument(outputPath, { initialText, title });
  console.log(`\nSuccess! New document created: ${outputPath}`);
  if (initialText) {
    const preview = initialText.length > 50 ? initialText.slice(0, 50) + '...' : initialText;
    console.log(`   Initial text: "${preview}"`);
  }
  if (title) {
    console.log(`   Title: ${title}`);
  }
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}

