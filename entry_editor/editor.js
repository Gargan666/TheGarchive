const entryData = {
    slug: "",
    title: "",
    summary: "",
    categories: [],
    images: [],
    attributes: [],
    body: ""
};

// Utility to create list items
function createListItem(container, type) {
    let itemDiv = document.createElement('div');
    itemDiv.className = 'list-item';

    if (type === 'categories') {
        let input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Category';
        input.addEventListener('input', updateList.bind(null, type));
        itemDiv.appendChild(input);
    } else if (type === 'images') {
        let fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        let titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.placeholder = 'Image title';
        titleInput.addEventListener('input', updateList.bind(null, type));

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                const fileName = fileInput.files[0].name;
                const slug = entryData.slug ? entryData.slug : 'untitled';
                titleInput.value = titleInput.value || fileName;
                const src = `images/entry_images/${slug}/${fileName}`;
                itemDiv.dataset.src = src;
                updateList(type);
            }
        });

        itemDiv.appendChild(fileInput);
        itemDiv.appendChild(titleInput);
    } else if (type === 'attributes') {
        let keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = 'Key';
        keyInput.addEventListener('input', updateList.bind(null, type));
        let valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.placeholder = 'Value';
        valueInput.addEventListener('input', updateList.bind(null, type));
        itemDiv.appendChild(keyInput);
        itemDiv.appendChild(valueInput);
    }

    let removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
        itemDiv.remove();
        updateList(type);
    });

    itemDiv.appendChild(removeBtn);
    container.appendChild(itemDiv);
    updateList(type);
}

// Update arrays in entryData from DOM
function updateList(type) {
    if (type === 'categories') {
        const container = document.getElementById('entry-categories-editor');
        entryData.categories = Array.from(container.querySelectorAll('input')).map(input => input.value);
    } else if (type === 'images') {
        const container = document.getElementById('image-list');
        entryData.images = Array.from(container.querySelectorAll('.list-item')).map(div => {
            const titleInput = div.querySelector('input[type=text]');
            const src = div.dataset.src || '';
            return { src, title: titleInput.value };
        });
    } else if (type === 'attributes') {
        const container = document.getElementById('entry-attributes-editor');
        entryData.attributes = Array.from(container.querySelectorAll('.list-item')).map(div => {
            const inputs = div.querySelectorAll('input');
            return { [inputs[0].value]: inputs[1].value };
        });
    }
}

// Initialize list buttons
document.getElementById('add-category').addEventListener('click', () => {
    createListItem(document.getElementById('entry-categories-editor'), 'categories');
});

document.getElementById('add-image').addEventListener('click', () => {
    createListItem(document.getElementById('image-list'), 'images');
});

document.getElementById('add-attribute').addEventListener('click', () => {
    createListItem(document.getElementById('entry-attributes-editor'), 'attributes');
});

// Bind basic inputs
document.getElementById('input-slug').addEventListener('input', e => { entryData.slug = e.target.value; });
document.getElementById('input-title').addEventListener('input', e => { entryData.title = e.target.value; });
document.getElementById('input-summary').addEventListener('input', e => { entryData.summary = e.target.value; });
document.getElementById('body-text-field').addEventListener('input', e => { entryData.body = e.target.value; });

// Export function
function exportMarkdown() {
    updateList('categories');
    updateList('images');
    updateList('attributes');

    const bodyWithBr = entryData.body.replace(/([^\n])\n(?!\n)/g, '$1<br>\n');

    const md = `---
` +
        `title: '${entryData.title}'
` +
        `slug: '${entryData.slug}'
` +
        `categories:
` + entryData.categories.map(cat => `  - ${cat}`).join('') +
        `summary: '${entryData.summary}'
` +
        `date: ''
` +
        `---
___
` +
        `images=
[
` + entryData.images.map(img => `  { "src": "${img.src}", "title": "${img.title}" }`).join('') + `]
` +
        `attributes=
[
` + entryData.attributes.map(attr => `  ${JSON.stringify(attr)}`).join('') + `]
___
` +
        `${bodyWithBr}`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = entryData.slug ? `${entryData.slug}.md` : 'entry.md';
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('export-btn').addEventListener('click', exportMarkdown);
