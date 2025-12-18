// Global settings schema registry
window.settingsSchema = {};

/**
 * Load settings schema JSON and register all settings
 * @param {string} url - Path to settings.json
 */
export async function loadSettingsSchema(url = "./javascript/settings/setting_list.json") {
  let rawList;

  try {
    const res = await fetch("./javascript/settings/setting_list.json");
    if (!res.ok) throw new Error("Failed to load settings.json");
    rawList = await res.json();
  } catch (err) {
    console.error("❌ Error loading settings schema:", err);
    return;
  }

  if (!Array.isArray(rawList)) {
    console.error("❌ settings.json must contain an array.");
    return;
  }

  rawList.forEach((setting, index) => {
    try {
      registerSetting(setting);
    } catch (e) {
      console.error(`❌ Error in settings.json at index ${index}:`, e);
    }
  });

  console.log("✔ Settings schema loaded:", window.settingsSchema);
}

/**
 * Validate & register an individual setting
 */
function registerSetting(setting) {
  if (!setting.name || typeof setting.name !== "string") {
    throw new Error("Setting has no valid 'name' field.");
  }

  if (!setting.mode || typeof setting.mode !== "string") {
    throw new Error("Setting has no valid 'mode' field.");
  }

  const allowedModes = ["bool", "multistate", "value", "store"];
  if (!allowedModes.includes(setting.mode)) {
    throw new Error(`Invalid mode '${setting.mode}'`);
  }

  const normalized = {
    name: setting.name,
    mode: setting.mode,
    default: null,
    options: {}
  };

  switch (setting.mode) {
    case "bool":
      normalized.default = false;
      break;

    case "multistate":
      if (!Array.isArray(setting.states) || setting.states.length < 2) {
        throw new Error("Multistate settings require an array of states.");
      }
      normalized.options.states = setting.states;
      normalized.default = setting.states[0];
      break;

    case "value":
      if (
        !Array.isArray(setting.between) ||
        setting.between.length !== 2
      ) {
        throw new Error("Value settings require 'between: [min,max]'");
      }
      const [min, max] = setting.between;
      normalized.options.min = (min === "none") ? null : min;
      normalized.options.max = (max === "none") ? null : max;
      normalized.default = normalized.options.min ?? 0;
      break;

    case "store":
      normalized.default = null; // nothing stored by default
      break;
  }

  // Register it globally
  window.settingsSchema[setting.name] = normalized;
}