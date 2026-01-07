// entryEditorUI.js

const {
    createEmptyEntryData,
    parseExportedMarkdown,
    exportMarkdown
} = window.EntryEditorCore;

const entryData = createEmptyEntryData();

/* ------------------------------------------------------------------
   TEMPLATE LOADING
------------------------------------------------------------------ */

const listTemplates = {};

function loadTemplate(type, url) {
    return fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(`Failed to load ${url}`);
            return res.text();
        })
        .then(html => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html.trim();
            listTemplates[type] = wrapper.firstElementChild;
        });
}

function initEditor() {
    wireButtons();
    wireBasicInputs();
    wireImportExport();
    restoreSessionImport();
}

Promise.all([
    loadTemplate('categories', 'list/category.html'),
    loadTemplate('images', 'list/gallery.html'),
    loadTemplate('attributes', 'list/attribute.html')
]).then(initEditor);

/* ------------------------------------------------------------------
   LIST ITEM CREATION (BEHAVIOR IDENTICAL TO MONOLITH)
------------------------------------------------------------------ */

function createListItem(container, type) {
    const itemDiv = listTemplates[type].cloneNode(true);

    if (type === 'categories') {
        const input = itemDiv.querySelector('input[type="text"]');
        input.addEventListener('input', updateList.bind(null, type));
    }

    else if (type === 'images') {
        const fileInput = itemDiv.querySelector('input[type="file"]');
        const titleInput = itemDiv.querySelector('input[type="text"]');

        titleInput.addEventListener('input', updateList.bind(null, type));

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const fileName = fileInput.files[0].name;
                const slug = entryData.slug || 'untitled';
                titleInput.value = titleInput.value || fileName;
                itemDiv.dataset.src =
                    `images/entry_images/${slug}/${fileName}`;
                updateList(type);
            }
        });
    }

    else if (type === 'attributes') {
        const inputs = itemDiv.querySelectorAll('input[type="text"]');
        inputs[0].addEventListener('input', updateList.bind(null, type));
        inputs[1].addEventListener('input', updateList.bind(null, type));
    }

    const removeBtn = itemDiv.querySelector('button');
    removeBtn.addEventListener('click', () => {
        itemDiv.remove();
        updateList(type);
    });

    container.appendChild(itemDiv);
    updateList(type);
}

/* ------------------------------------------------------------------
   UPDATE LISTS (UNCHANGED FROM MONOLITH)
------------------------------------------------------------------ */

function updateList(type) {
    if (type === 'categories') {
        const container = document.getElementById('entry-categories-editor');
        entryData.categories =
            Array.from(container.querySelectorAll('input'))
                .map(input => input.value);

    } else if (type === 'images') {
        const container = document.getElementById('image-list');
        entryData.images =
            Array.from(container.querySelectorAll('.list-item'))
                .map(div => {
                    const titleInput = div.querySelector('input[type=text]');
                    const src = div.dataset.src || '';
                    return { src, title: titleInput.value };
                });

    } else if (type === 'attributes') {
        const container =
            document.getElementById('entry-attributes-editor');
        entryData.attributes =
            Array.from(container.querySelectorAll('.list-item'))
                .map(div => {
                    const inputs = div.querySelectorAll('input');
                    return { [inputs[0].value]: inputs[1].value };
                });
    }
}

/* ------------------------------------------------------------------
   BASIC INPUTS
------------------------------------------------------------------ */

function wireBasicInputs() {
    document.getElementById('input-slug')
        .addEventListener('input', e => entryData.slug = e.target.value);

    document.getElementById('input-title')
        .addEventListener('input', e => entryData.title = e.target.value);

    document.getElementById('input-summary')
        .addEventListener('input', e => entryData.summary = e.target.value);

    document.getElementById('body-text-field')
        .addEventListener('input', e => entryData.body = e.target.value);
}

/* ------------------------------------------------------------------
   BUTTONS
------------------------------------------------------------------ */

function wireButtons() {
    document.getElementById('add-category').addEventListener('click', () => {
        createListItem(
            document.getElementById('entry-categories-editor'),
            'categories'
        );
    });

    document.getElementById('add-image').addEventListener('click', () => {
        createListItem(
            document.getElementById('image-list'),
            'images'
        );
    });

    document.getElementById('add-attribute').addEventListener('click', () => {
        createListItem(
            document.getElementById('entry-attributes-editor'),
            'attributes'
        );
    });
}

/* ------------------------------------------------------------------
   IMPORT (STRUCTURALLY IDENTICAL TO MONOLITH)
------------------------------------------------------------------ */

function importMarkdown(mdText) {
    const data = parseExportedMarkdown(mdText);
    Object.assign(entryData, data);

    document.getElementById('input-title').value = data.title;
    document.getElementById('input-slug').value = data.slug;
    document.getElementById('input-summary').value = data.summary;
    document.getElementById('body-text-field').value = data.body;

    document.getElementById('entry-categories-editor').innerHTML = '';
    document.getElementById('image-list').innerHTML = '';
    document.getElementById('entry-attributes-editor').innerHTML = '';

    data.categories.forEach(cat => {
        createListItem(
            document.getElementById('entry-categories-editor'),
            'categories'
        );
        document.querySelector(
            '#entry-categories-editor .list-item:last-child input'
        ).value = cat;
    });

    data.images.forEach(img => {
        createListItem(
            document.getElementById('image-list'),
            'images'
        );
        const item =
            document.querySelector('#image-list .list-item:last-child');
        item.dataset.src = img.src;
        item.querySelector('input[type=text]').value = img.title;
    });

    data.attributes.forEach(attr => {
        const key = Object.keys(attr)[0];
        const value = attr[key];

        createListItem(
            document.getElementById('entry-attributes-editor'),
            'attributes'
        );
        const inputs =
            document.querySelector(
                '#entry-attributes-editor .list-item:last-child'
            ).querySelectorAll('input');
        inputs[0].value = key;
        inputs[1].value = value;
    });

    updateList('categories');
    updateList('images');
    updateList('attributes');
}

/* ------------------------------------------------------------------
   EXPORT
------------------------------------------------------------------ */

function wireImportExport() {
    document.getElementById('export-btn').addEventListener('click', () => {
        const md = exportMarkdown(
            entryData,
            window.currentUser?.displayName || ''
        );

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = entryData.slug ? `${entryData.slug}.md` : 'entry.md';
        a.click();
        URL.revokeObjectURL(url);
    });

    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file');

    importBtn?.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput?.addEventListener('change', () => {
        const file = importFileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => importMarkdown(reader.result);
        reader.readAsText(file);
        importFileInput.value = '';
    });
}

/* ------------------------------------------------------------------
   SESSION STORAGE IMPORT
------------------------------------------------------------------ */

function restoreSessionImport() {
    const md = sessionStorage.getItem('editorMarkdown');
    if (md) {
        importMarkdown(md);
        sessionStorage.removeItem('editorMarkdown');
    }
}
