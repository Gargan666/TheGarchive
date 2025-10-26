(() => {
  if (!window.__conditionEngine) window.__conditionEngine = {};

  const engine = window.__conditionEngine;

  engine.check = (trigger) => {
    if (!trigger || !trigger.type) return false;

    switch (trigger.type) {
      case "none":
      case "always":
        return true;

      case "clicks":
        const currentClicks = window.__gameState.clickCount || 0;
        const requiredClicks = trigger.required || 0;
        return currentClicks >= requiredClicks;

      case "flag":
  const flags = window.__gameState.flags || {};
  const actualValue = !!flags[trigger.flag];

  // Normalize expected state from string or boolean
  let expectedValue = true; // default
  if (typeof trigger.state === "string") {
    expectedValue = trigger.state.toLowerCase() === "true";
  } else if (typeof trigger.state === "boolean") {
    expectedValue = trigger.state;
  }

  return actualValue === expectedValue;

      case "codeword":
        const buffer = (window.__gameState.inputBuffer || '').toLowerCase();
        if (!Array.isArray(trigger.required)) return false;

        for (const option of trigger.required) {
          if (buffer.includes(option.string.toLowerCase())) {
            trigger.matched = option.string; // store the matched codeword
            return true;
          }
        }
        return false;

      default:
        console.warn("Unknown trigger type:", trigger.type);
        return false;
    }
  };
  engine.checkAll = (triggers) => {
  const arr = Array.isArray(triggers) ? triggers : (triggers ? [triggers] : []);
  if (!arr.length) return false;

  // Separate special "none" triggers
  const noneTriggers = arr.filter(t => t && t.type === "none");

  // Separate flag triggers from the rest
  const flagTriggers = arr.filter(t => t && t.type === "flag");
  const otherTriggers = arr.filter(t => t && t.type && t.type !== "none" && t.type !== "flag");

  // 1) If there are flag triggers, they are required.
  if (flagTriggers.length > 0) {
    // Evaluate flags first; if any fail -> group is not available
    for (const ft of flagTriggers) {
      if (!window.__conditionEngine.check(ft)) {
        return false;
      }
    }
    // All flags passed. Now evaluate the other triggers (if any).
    if (otherTriggers.length === 0) {
      // Only flags were required and they passed
      return true;
    } else {
      // All *other* triggers must succeed (same semantics as before)
      for (const ot of otherTriggers) {
        if (!window.__conditionEngine.check(ot)) return false;
      }
      return true;
    }
  }

  // 2) No flag triggers: use existing semantics
  const other = arr.filter(t => t && t.type && t.type !== "none");
  if (other.length === 0) {
    // only 'none' triggers exist -> pass if there are none (or treat as always)
    return noneTriggers.length > 0 ? true : false;
  }

  // Evaluate other triggers, but be careful to not call check() twice for logging clarity:
  const successful = [];
  const failed = [];
  for (const t of other) {
    const ok = window.__conditionEngine.check(t);
    if (ok) successful.push(t);
    else failed.push(t);
  }

  // If any 'none' triggers exist, they should pass only if no other triggers passed
  if (noneTriggers.length > 0) {
    return successful.length === 0;
  }

  // Otherwise require all non-none triggers to pass
  return failed.length === 0;
  };
  engine.addCondition = (id, fn) => {
    engine[id] = fn;
  };


  // Expose codeword matched callback
  window.__onConditionMatched = (trigger) => {
    console.log("[DIALOGUE] Condition matched:", trigger);
    if (window.__dialogueEngine && !window.__dialogueEngine.isTyping) {
      window.__dialogueEngine.startNextGroup();
      window.__gameState.inputBuffer = '';
      console.log(window.__gameState);
    }
  };
})();
