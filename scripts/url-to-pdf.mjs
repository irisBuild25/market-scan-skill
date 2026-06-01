#!/usr/bin/env node
/**
 * URL to PDF exporter using Puppeteer (portable).
 * Usage: node scripts/url-to-pdf.mjs <url> <output-pdf-path>
 * Renders a full JS-heavy page (e.g. X/Twitter) and exports as PDF.
 *
 * Resolves puppeteer from standard node_modules. Install deps once: npm install.
 */

const [, , url, pdfPath] = process.argv;

if (!url || !pdfPath) {
  console.error('Usage: node scripts/url-to-pdf.mjs <url> <pdf-path>');
  process.exit(1);
}

async function loadPuppeteer() {
  try {
    return (await import('puppeteer')).default;
  } catch (err) {
    console.error(
      'url-to-pdf: could not load "puppeteer". Run `npm install` in the plugin ' +
        'directory. Original error: ' + err.message
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

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Extra delay for late-rendering JS (SPAs like X/Twitter)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();
  console.log('PDF saved → ' + pdfPath);
} catch (err) {
  console.error('url-to-pdf error: ' + err.message);
  process.exit(1);
}
