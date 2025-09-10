const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const slugify = require('slugify');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const OUT_FILE = path.join(CONTENT_DIR, 'index.json');

function readMarkdownFiles(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const items = files.map(filename => {
    const filepath = path.join(dir, filename);
    const raw = fs.readFileSync(filepath, 'utf8');
    const parsed = matter(raw);
    const nameNoExt = filename.replace(/\.md$/i, '');
    const slug = (parsed.data && parsed.data.slug) ? parsed.data.slug : slugify(nameNoExt, { lower: true });
    return {
      title: parsed.data.title || nameNoExt,
      slug,
      file: filename,
      date: parsed.data.date || null,
      summary: parsed.data.summary || '',
      categories: parsed.data.categories || [],
      tags: parsed.data.tags || [],
      thumbnail: parsed.data.thumbnail || null
    };
  });

  // sort by date (newest first) when available
  items.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });
  return items;
}

const items = readMarkdownFiles(CONTENT_DIR);
fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2));
console.log(`Wrote ${OUT_FILE} with ${items.length} items.`);
