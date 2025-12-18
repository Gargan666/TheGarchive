/**
 * Builds the settings UI in the order of the JSON list.
 * Each setting script is injected as a <script> tag and run automatically.
 * @param {string} containerId - The ID of the container to put settings into
 */
export async function buildSettingsUI(containerId = "settingsContainer") {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`❌ Container #${containerId} not found`);
    return;
  }

  // Wait for the settings schema to be loaded
  let tries = 0;
  while (!window.settingsSchema || Object.keys(window.settingsSchema).length === 0) {
    await new Promise(res => setTimeout(res, 50));
    if (++tries > 100) {
      console.error("❌ Failed to load settings schema after 5s");
      return;
    }
  }

  // Load the ordered list of settings from JSON
  const rawList = await loadRawSettingsList();

  for (const setting of rawList) {
    const baseSchema = window.settingsSchema[setting.name];
    if (!baseSchema) continue;

    // Merge JSON with schema to ensure all fields (like 'script') exist
    const schema = { ...baseSchema, ...setting };

    const element = await buildSettingElement(schema);
    container.appendChild(element);
  }

  console.log("✔ Settings UI built.");
}

/**
 * Loads the raw settings list (ordering) from JSON
 */
async function loadRawSettingsList() {
  const res = await fetch("javascript/settings/setting_list.json");
  if (!res.ok) throw new Error("Failed to load setting_list.json");
  return await res.json();
}

/**
 * Loads a template HTML file for a given mode and returns its root element
 */
async function loadTemplate(mode) {
  const path = `javascript/settings/templates/${mode}.html`;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Missing template: ${path}`);
  const html = await res.text();

  const temp = document.createElement("div");
  temp.innerHTML = html.trim();
  return temp.firstElementChild;
}

/**
 * Builds a single setting element
 */
async function buildSettingElement(schema) {
  const root = await loadTemplate(schema.mode);

  // Tag root element for script identification
  if (schema.script) root.dataset.settingRoot = schema.script;

  // Add label
  const label = root.querySelector(".setting-label");
  if (label) label.textContent = schema.label || schema.name;

  // Build core UI
  switch (schema.mode) {
    case "bool": setupBoolUI(root, schema); break;
    case "value": setupValueUI(root, schema); break;
    case "multistate": setupMultistateUI(root, schema); break;
    case "store": setupStoreUI(root, schema); break;
  }

  // Inject the logic script if it exists
  if (schema.script) injectSettingScript(schema.script, root, schema);

  return root;
}

/**
 * Injects a <script> tag for the setting logic and runs it
 */
function injectSettingScript(scriptName, root, schema) {
  if (!scriptName) return;

  // Prevent duplicate injection per root
  if (document.querySelector(`script[data-setting-script="${scriptName}-${root.dataset.settingRootId}"]`)) return;

  if (!root.dataset.settingRootId) root.dataset.settingRootId = Math.random().toString(36).substr(2, 9);

  const script = document.createElement("script");
  script.src = `javascript/settings/scripts/${scriptName}`;
  script.dataset.settingScript = `${scriptName}-${root.dataset.settingRootId}`;
  script.type = "module";

  script.onload = () => {
    console.log(`✔ Loaded setting script: ${scriptName}`);
    if (window[scriptName]?.init) {
      window[scriptName].init(root, schema); // now schema is defined
    }
  };

  script.onerror = (e) => console.error(`❌ Failed to load setting script: ${scriptName}`, e);

  document.body.appendChild(script);
}


/* ------------------------- MODE HANDLERS ------------------------- */

function setupBoolUI(root, schema) {
  const toggle = root.querySelector(".toggle");
  if (!toggle) return;

  let value = schema.default ?? false;
  function apply() {
    toggle.classList.toggle("on", value);
  }

  toggle.addEventListener("click", () => {
    value = !value;
    apply();
  });

  apply();
}

function setupValueUI(root, schema) {
  const slider = root.querySelector(".value-slider");
  const output = root.querySelector(".value-output");
  if (!slider) return;

  slider.min = schema.options?.min ?? 0;
  slider.max = schema.options?.max ?? 100;
  slider.value = schema.default ?? slider.min;
  if (output) output.textContent = slider.value;

  slider.addEventListener("input", () => {
    if (output) output.textContent = slider.value;
  });
}

function setupMultistateUI(root, schema) {
  const list = root.querySelector(".state-list");
  if (!list) return;

  const current = schema.default;
  const states = schema.options?.states || [];

  states.forEach(state => {
    const btn = document.createElement("button");
    btn.className = "state-option";
    btn.textContent = state;
    if (state === current) btn.classList.add("selected");

    btn.addEventListener("click", () => {
      [...list.children].forEach(el => el.classList.remove("selected"));
      btn.classList.add("selected");
    });

    list.appendChild(btn);
  });
}

function setupStoreUI(root, schema) {
  const input = root.querySelector(".file-input");
  const preview = root.querySelector(".file-preview");
  if (!input) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      if (preview) {
        preview.src = e.target.result;
        preview.style.display = "block"; // ensure preview shows
      }
    };
    reader.readAsDataURL(file);
  });
}