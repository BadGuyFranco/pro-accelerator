#!/usr/bin/env node
/**
 * Add a new comment to a Word document.
 *
 * Usage:
 *     node add-comment.js document.docx --text "This is a comment" --author "AIM"
 */

import { readDocx, writeDocx, parseXml, serializeXml, select } from './docx-utils.js';
import { existsSync, copyFileSync } from 'fs';

/**
 * Add a comment to a Word document
 */
async function addComment(docxPath, text, options = {}) {
  const { author = 'AIM', initials = null, outputPath = null } = options;

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

  // Read or create comments.xml
  let commentsDoc;
  const commentsXml = await zip.file('word/comments.xml')?.async('string');
  if (commentsXml) {
    commentsDoc = parseXml(commentsXml);
  } else {
    commentsDoc = parseXml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:comments>`);
  }

  // Find highest comment ID
  let maxId = 0;
  const existingComments = select('//w:comment', commentsDoc);
  for (const c of existingComments) {
    const id = parseInt(c.getAttribute('w:id') || '0', 10);
    if (id > maxId) maxId = id;
  }

  const newCommentId = String(maxId + 1);
  const commentDate = new Date().toISOString();
  const commentInitials = initials || author.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();

  // Create comment element
  const commentsRoot = commentsDoc.documentElement;
  const commentElem = commentsDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:comment');
  commentElem.setAttribute('w:id', newCommentId);
  commentElem.setAttribute('w:author', author);
  commentElem.setAttribute('w:date', commentDate);
  commentElem.setAttribute('w:initials', commentInitials);

  // Add comment text as paragraph
  const para = commentsDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:p');
  const run = commentsDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:r');
  const textElem = commentsDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:t');
  textElem.textContent = text;
  run.appendChild(textElem);
  para.appendChild(run);
  commentElem.appendChild(para);
  commentsRoot.appendChild(commentElem);

  // Add comment reference to document.xml (at end of last paragraph)
  const body = select('//w:body', docDoc)[0];
  if (body) {
    const paragraphs = select('.//w:p', body);
    const targetPara = paragraphs[paragraphs.length - 1] || body;

    // Create comment range start
    const commentStart = docDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:commentRangeStart');
    commentStart.setAttribute('w:id', newCommentId);
    targetPara.appendChild(commentStart);

    // Create comment reference
    const commentRef = docDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:commentReference');
    commentRef.setAttribute('w:id', newCommentId);
    targetPara.appendChild(commentRef);

    // Create comment range end
    const commentEnd = docDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:commentRangeEnd');
    commentEnd.setAttribute('w:id', newCommentId);
    targetPara.appendChild(commentEnd);
  }

  // Update content types if needed (for new comments.xml)
  if (!commentsXml) {
    const contentTypesXml = await zip.file('[Content_Types].xml')?.async('string');
    if (contentTypesXml && !contentTypesXml.includes('comments.xml')) {
      const newContentTypes = contentTypesXml.replace(
        '</Types>',
        '  <Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>\n</Types>'
      );
      zip.file('[Content_Types].xml', newContentTypes);
    }

    // Update document relationships
    const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string');
    if (relsXml && !relsXml.includes('comments.xml')) {
      // Find next available rId
      const rIdMatch = relsXml.match(/rId(\d+)/g);
      const maxRId = rIdMatch
        ? Math.max(...rIdMatch.map(r => parseInt(r.replace('rId', ''), 10)))
        : 0;
      const newRId = `rId${maxRId + 1}`;

      const newRels = relsXml.replace(
        '</Relationships>',
        `  <Relationship Id="${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>\n</Relationships>`
      );
      zip.file('word/_rels/document.xml.rels', newRels);
    }
  }

  // Write back files
  zip.file('word/comments.xml', serializeXml(commentsDoc));
  zip.file('word/document.xml', serializeXml(docDoc));

  // Save
  await writeDocx(zip, finalOutputPath);

  return { commentId: newCommentId, author, text };
}

// CLI
function showHelp() {
  console.log(`
Add a new comment to a Word document

Usage:
  node add-comment.js <document> --text "Comment text" [options]

Arguments:
  document        Path to Word document (.docx)

Options:
  --text TEXT     Comment text content (required)
  --author NAME   Author name (default: AIM)
  --initials STR  Author initials (default: derived from author)
  --output, -o    Output file path (default: overwrites original)
  --help, -h      Show this help message

Examples:
  node add-comment.js document.docx --text "This needs review"
  node add-comment.js document.docx --text "Check this" --author "Reviewer"
  node add-comment.js document.docx --text "Comment" --output modified.docx
`);
  process.exit(0);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
}

const docxPath = args[0];
let text = null;
let author = 'AIM';
let initials = null;
let outputPath = null;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--text' && args[i + 1]) {
    text = args[++i];
  } else if (args[i] === '--author' && args[i + 1]) {
    author = args[++i];
  } else if (args[i] === '--initials' && args[i + 1]) {
    initials = args[++i];
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
  const result = await addComment(docxPath, text, { author, initials, outputPath });
  console.log(`\nSuccess! Comment added and saved to: ${outputPath || docxPath}`);
  console.log(`   Author: ${result.author}`);
  console.log(`   Text: "${result.text}"`);
  console.log(`   Comment ID: ${result.commentId}`);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}

