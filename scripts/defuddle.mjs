#!/usr/bin/env node
/**
 * Defuddle CLI wrapper (portable).
 * Usage: node scripts/defuddle.mjs <url>
 * Fetches a URL, strips clutter with Defuddle, and outputs clean markdown.
 *
 * Resolves defuddle + jsdom from standard node_modules. Install deps once: npm install.
 */

const url = process.argv[2];

if (!url) {
  console.error('Usage: node scripts/defuddle.mjs <url>');
  process.exit(1);
}

// Defuddle's node entry point has shifted across versions; try the known specifiers in order.
async function loadDefuddle() {
  const candidates = ['defuddle/node', 'defuddle/dist/node.js', 'defuddle'];
  for (const spec of candidates) {
    try {
      const mod = await import(spec);
      if (mod?.Defuddle) return mod.Defuddle;
      if (mod?.default?.Defuddle) return mod.default.Defuddle;
      if (typeof mod?.default === 'function') return mod.default;
    } catch {
      // try next specifier
    }
  }
  throw new Error('could not load "defuddle" — run `npm install` in the plugin directory');
}

async function loadJSDOM() {
  try {
    return (await import('jsdom')).JSDOM;
  } catch (err) {
    throw new Error('could not load "jsdom" — run `npm install` in the plugin directory (' + err.message + ')');
  }
}

try {
  const Defuddle = await loadDefuddle();
  const JSDOM = await loadJSDOM();

  const dom = await JSDOM.fromURL(url, {
    userAgent: 'Mozilla/5.0 (compatible; defuddle-cli/1.0)',
    resources: 'usable',
  });

  const result = await Defuddle(dom, url, { markdown: true });

  if (!result || !result.content) {
    console.error('defuddle returned empty content');
    process.exit(1);
  }

  if (result.title) process.stdout.write(`# ${result.title}\n\n`);
  process.stdout.write(result.content + '\n');
} catch (err) {
  console.error(`defuddle error: ${err.message}`);
  process.exit(1);
}
