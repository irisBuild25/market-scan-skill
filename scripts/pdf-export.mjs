#!/usr/bin/env node
/**
 * PDF export wrapper using Puppeteer (portable).
 * Usage: node scripts/pdf-export.mjs <html-file-path> <pdf-output-path>
 *
 * Resolves puppeteer from standard node_modules (local install or NODE_PATH),
 * so it works in any environment where `npm i puppeteer` has been run.
 * Install deps once: npm install  (see package.json in the plugin root)
 */

import path from 'node:path';

const [, , htmlPath, pdfPath] = process.argv;

if (!htmlPath || !pdfPath) {
  console.error('Usage: node scripts/pdf-export.mjs <html-path> <pdf-path>');
  process.exit(1);
}

async function loadPuppeteer() {
  try {
    return (await import('puppeteer')).default;
  } catch (err) {
    console.error(
      'pdf-export: could not load "puppeteer". Run `npm install` in the plugin ' +
        'directory (or `npm i -g puppeteer` and set NODE_PATH). Original error: ' +
        err.message
    );
    process.exit(1);
  }
}

const puppeteer = await loadPuppeteer();

try {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const absHtml = path.isAbsolute(htmlPath)
    ? htmlPath
    : path.join(process.cwd(), htmlPath);
  const fileUrl = 'file://' + encodeURI(absHtml);

  await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();
  console.log('PDF saved → ' + pdfPath);
} catch (err) {
  console.error('pdf-export error: ' + err.message);
  process.exit(1);
}
