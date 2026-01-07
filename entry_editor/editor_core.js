// editor_core.js

(function () {

    function createEmptyEntryData() {
        return {
            slug: "",
            title: "",
            summary: "",
            categories: [],
            images: [],
            attributes: [],
            body: ""
        };
    }

    /* --------------------------------------------------
       STRING-AWARE ARRAY EXTRACTION
    -------------------------------------------------- */

    function extractArray(meta, key) {
        const startIndex = meta.indexOf(key + '=');
        if (startIndex === -1) return null;

        let i = startIndex + key.length + 1;
        while (meta[i] !== '[' && i < meta.length) i++;
        if (meta[i] !== '[') return null;

        let depth = 0;
        let inString = false;
        let stringChar = '';
        let escaped = false;
        let result = '';

        for (; i < meta.length; i++) {
            const char = meta[i];
            result += char;

            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            if (inString) {
                if (char === stringChar) {
                    inString = false;
                }
                continue;
            }

            if (char === '"' || char === "'") {
                inString = true;
                stringChar = char;
                continue;
            }

            if (char === '[') depth++;
            if (char === ']') {
                depth--;
                if (depth === 0) break;
            }
        }

        return result;
    }

    /* --------------------------------------------------
       PARSE MARKDOWN
    -------------------------------------------------- */

    function parseExportedMarkdown(md) {
        const result = {
            title: "",
            slug: "",
            categories: [],
            summary: "",
            images: [],
            attributes: [],
            body: ""
        };

        // ---------- Frontmatter ----------
        const frontmatterMatch = md.match(/^---([\s\S]*?)---/);
        if (frontmatterMatch) {
            const lines = frontmatterMatch[1].split('\n');
            let inCategories = false;

            lines.forEach(line => {
                if (line.startsWith('categories:')) {
                    inCategories = true;
                    return;
                }

                if (inCategories) {
                    if (line.trim().startsWith('-')) {
                        result.categories.push(
                            line.replace('-', '').trim()
                        );
                    } else {
                        inCategories = false;
                    }
                }

                if (line.startsWith('title:')) result.title = extractValue(line);
                if (line.startsWith('slug:')) result.slug = extractValue(line);
                if (line.startsWith('summary:')) result.summary = extractValue(line);
            });
        }

        // ---------- Meta block ----------
        const metaMatch = md.match(/___([\s\S]*?)___/);
        if (metaMatch) {
            const meta = metaMatch[1];

            const imagesRaw = extractArray(meta, 'images');
            if (imagesRaw) {
                result.images = JSON.parse(imagesRaw);
            }

            const attributesRaw = extractArray(meta, 'attributes');
            if (attributesRaw) {
                result.attributes = JSON.parse(attributesRaw);
            }
        }

        // ---------- Body ----------
        result.body = md
            .replace(/^---[\s\S]*?---/, '')
            .replace(/___[\s\S]*?___/, '')
            .trim()
            .replace(/<br>\s*/g, '\n');

        return result;
    }

    /* --------------------------------------------------
       EXPORT MARKDOWN (UNCHANGED)
    -------------------------------------------------- */

    function exportMarkdown(entryData, author = "") {
        const bodyWithBr =
            entryData.body.replace(
                /([^\n])\n(?!\n)/g,
                '$1<br>\n'
            );

        return `---
title: '${entryData.title}'
slug: '${entryData.slug}'
categories:
${entryData.categories.map(cat => `  - ${cat}`).join('\n')}
summary: '${entryData.summary}'
date: ''
author: '${author}'
---
___
images=
[
${entryData.images
    .map(img => `  { "src": "${img.src}", "title": "${img.title}" }`)
    .join(',\n')}
]
attributes=
[
${entryData.attributes
    .map(attr => `  ${JSON.stringify(attr)}`)
    .join(',\n')}
]
___
${bodyWithBr}`;
    }

    /* --------------------------------------------------
       HELPERS
    -------------------------------------------------- */

    function extractValue(line) {
        return line
            .split(':')
            .slice(1)
            .join(':')
            .trim()
            .replace(/^'|'$/g, '');
    }

    /* --------------------------------------------------
       PUBLIC API
    -------------------------------------------------- */

    window.EntryEditorCore = {
        createEmptyEntryData,
        parseExportedMarkdown,
        exportMarkdown
    };

})();
