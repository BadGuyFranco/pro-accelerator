/**
 * Shared utilities for Word document track changes operations.
 */

import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import xpath from 'xpath';
import { readFileSync, writeFileSync } from 'fs';

// Word XML namespace
const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

// XPath select with namespace
const select = xpath.useNamespaces({ w: NS_W });

/**
 * Parse Word date string to readable format
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    if (dateStr.includes('T')) {
      const dt = new Date(dateStr);
      return dt.toISOString().slice(0, 19).replace('T', ' ');
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Extract text content from a Word XML element
 */
export function getTextFromElement(elem) {
  const textNodes = select('.//w:t/text()', elem);
  return textNodes.map(n => n.nodeValue || '').join('');
}

/**
 * Read a docx file and return JSZip instance
 */
export async function readDocx(docxPath) {
  const data = readFileSync(docxPath);
  return await JSZip.loadAsync(data);
}

/**
 * Write JSZip instance to docx file
 */
export async function writeDocx(zip, outputPath) {
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  writeFileSync(outputPath, content);
}

/**
 * Parse XML string to document
 */
export function parseXml(xmlString) {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, 'application/xml');
}

/**
 * Serialize document to XML string
 */
export function serializeXml(doc) {
  const serializer = new XMLSerializer();
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + serializer.serializeToString(doc);
}

/**
 * List all track changes in a Word document
 */
export async function listTrackChanges(docxPath) {
  const zip = await readDocx(docxPath);

  // Read document.xml
  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) {
    throw new Error('Invalid Word document structure');
  }

  const doc = parseXml(docXml);
  const changes = [];
  let changeId = 1;

  // Find all insertions (w:ins)
  const insertions = select('//w:ins', doc);
  for (const ins of insertions) {
    const author = ins.getAttribute('w:author') || 'Unknown';
    const date = ins.getAttribute('w:date') || '';
    const text = getTextFromElement(ins);

    changes.push({
      id: changeId++,
      type: 'Insertion',
      author,
      date: parseDate(date),
      text,
      status: 'Pending',
      element: 'ins'
    });
  }

  // Find all deletions (w:del)
  const deletions = select('//w:del', doc);
  for (const del of deletions) {
    const author = del.getAttribute('w:author') || 'Unknown';
    const date = del.getAttribute('w:date') || '';
    const text = getTextFromElement(del);

    changes.push({
      id: changeId++,
      type: 'Deletion',
      author,
      date: parseDate(date),
      text,
      status: 'Pending',
      element: 'del'
    });
  }

  // Find formatting changes (w:rPrChange)
  const rPrChanges = select('//w:rPrChange', doc);
  for (const fmt of rPrChanges) {
    const author = fmt.getAttribute('w:author') || 'Unknown';
    const date = fmt.getAttribute('w:date') || '';

    changes.push({
      id: changeId++,
      type: 'Formatting (Run)',
      author,
      date: parseDate(date),
      text: '[Formatting change]',
      status: 'Pending',
      element: 'rPrChange'
    });
  }

  // Find paragraph formatting changes (w:pPrChange)
  const pPrChanges = select('//w:pPrChange', doc);
  for (const fmt of pPrChanges) {
    const author = fmt.getAttribute('w:author') || 'Unknown';
    const date = fmt.getAttribute('w:date') || '';

    changes.push({
      id: changeId++,
      type: 'Formatting (Paragraph)',
      author,
      date: parseDate(date),
      text: '[Formatting change]',
      status: 'Pending',
      element: 'pPrChange'
    });
  }

  return changes;
}

/**
 * List all comments in a Word document
 */
export async function listComments(docxPath) {
  const zip = await readDocx(docxPath);

  // Check if comments.xml exists
  const commentsXml = await zip.file('word/comments.xml')?.async('string');
  if (!commentsXml) {
    return []; // No comments
  }

  const commentsDoc = parseXml(commentsXml);
  const comments = [];
  let commentNum = 1;

  // Find all comment elements
  const commentElems = select('//w:comment', commentsDoc);
  for (const comment of commentElems) {
    const commentId = comment.getAttribute('w:id');
    const author = comment.getAttribute('w:author') || 'Unknown';
    const date = comment.getAttribute('w:date') || '';
    const initials = comment.getAttribute('w:initials') || '';
    const text = getTextFromElement(comment);

    comments.push({
      id: commentNum++,
      commentId,
      author,
      initials,
      date: parseDate(date),
      text,
      commentedText: '' // Would need to cross-reference with document.xml
    });
  }

  return comments;
}

export { select, NS_W };

