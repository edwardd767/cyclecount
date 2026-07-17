import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const files = (await readdir(root)).filter(name => name.endsWith('.html'));

for (const name of files) {
  const filePath = path.join(root, name);
  let html = await readFile(filePath, 'utf8');
  let changed = false;

  if (!html.includes('responsive.css')) {
    html = html.replace('</head>', '  <link rel="stylesheet" href="responsive.css?v=20260717">\n</head>');
    changed = true;
  }

  if (!html.includes('responsive.js')) {
    html = html.replace('</body>', '  <script src="responsive.js?v=20260717"></script>\n</body>');
    changed = true;
  }

  if (changed) {
    await writeFile(filePath, html, 'utf8');
    console.log(`Updated ${name}`);
  }
}
