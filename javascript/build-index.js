import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = "./content";
const OUT_FILE = path.join(CONTENT_DIR, "index.json");

function buildIndex() {
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".md"));

  const entries = files.map(file => {
    const fullPath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");

    const parsed = matter(raw);
    const data = parsed.data;

    // Get last modified date of the file
    const stats = fs.statSync(fullPath);
    const lastModified = stats.mtime.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Only update date if it’s missing or different
    if (data.date !== lastModified) {
      const updatedData = { ...data, date: lastModified };
      const newContent = matter.stringify(parsed.content, updatedData);

      // Only write if content actually changed
      if (newContent !== raw) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated date in ${file}`);
      }
    }

    return {
      title: data.title || path.basename(file, ".md"),
      slug: data.slug || path.basename(file, ".md"),
      file,
      summary: data.summary || "",
      date: lastModified,
      categories: Array.isArray(data.categories) ? data.categories : []
    };
  });

  fs.writeFileSync(OUT_FILE, JSON.stringify(entries, null, 2));
  console.log(`✅ Built index.json with ${entries.length} entries`);
}

buildIndex();
