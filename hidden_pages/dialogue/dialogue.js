(() => {
  const DIALOGUE_JSON = 'dialogue/dialogue.json';
  const EFFECTS_JSON = 'dialogue/effects.json';
  const CHAR_INTERVAL = 50;

  // punctuation pauses
  const CHAR_PAUSE_RULES_ALONE = { ".": 300, "!": 300, "?": 300, ",": 150 };
  const CHAR_PAUSE_RULES_COMBO = { ".": 50, "!": 50, "?": 50, ",": 50 };

  const container = document.getElementById('dialogue-text');

  let dialogueGroups = [];
  let EFFECT_REGISTRY = {};
  let currentGroupIndex = 0;
  let currentLineIndex = 0;
  let nodesForCurrentLine = [];
  let typingIndex = 0;
  let typingTimer = null;
  let isTyping = false;
  let lastPrintedChar = null;

// loaders //
// dialogue
fetch(DIALOGUE_JSON)
.then(r => r.json())
.then(data => {
if (!Array.isArray(data.groups)) throw new Error("Dialogue JSON must have 'groups' array");
dialogueGroups = data.groups;
startNextGroup();
})
.catch(err => console.error(err));

// dialogue effects
fetch(EFFECTS_JSON)
.then(r => r.json())
.then(data => { EFFECT_REGISTRY = data; })
.catch(err => console.error(err));

  // ---------------------------
  // functions
  // ---------------------------
  function checkGroupTriggers(triggers) {
    return window.__conditionEngine.checkAll(triggers);
  }

  // next dialogue group
  function startNextGroup() {
    const availableGroups = dialogueGroups.filter(g => checkGroupTriggers(g.trigger));
    if (!availableGroups.length) return;

    const group = availableGroups.find(g => !g._displayed);
    if (!group) return;

    group._displayed = true;
    currentGroupIndex = dialogueGroups.indexOf(group);
    currentLineIndex = 0;
    startLine(currentLineIndex);
  }

  // v LINE INDEX AND TYPEWRITER STUFF v //

  // parser to make every character in the text into individual objects
  // also detects § to determine areas to apply effects to and which effects to apply (makes sure they dont render)
  function parseTextToNodes(raw) {
    const nodes = [];
    let i = 0;
    const len = raw.length;

    while (i < len) {
      const ch = raw[i];

      if (ch === '§') {
        i++;
        let codes = '';
        while (i < len && /[a-zA-Z0-9]/.test(raw[i])) codes += raw[i++];
        if (i < len && raw[i] === ' ') i++;

        // Pause or break commands
        if (codes.startsWith('p') || codes.startsWith('b') || codes.startsWith('n')) {
          let numStr = '';
          for (let j = 1; j < codes.length; j++) {
            if (/\d/.test(codes[j])) numStr += codes[j];
            else break;
          }
          const value = parseInt(numStr, 10) || 0;
          if (codes.startsWith('p')) nodes.push({ type: 'pause', time: value });
          if (codes.startsWith('b')) nodes.push({ type: 'break', count: value || 1 });
          if (codes.startsWith('n')) nodes.push({ type: 'next', count: value || 1 });
          continue;
        }

        // Normal effect letters
        let segment = '';
        while (i < len && raw[i] !== '§') segment += raw[i++];
        if (i < len && raw[i] === '§') i++;

        const classes = codes.split('').map(c => EFFECT_REGISTRY[c]?.className).filter(Boolean);
        classes.push('char');

        segment.split('').forEach(c => {
          const span = document.createElement('span');
          span.className = classes.join(' ');
          span.textContent = c === ' ' ? '\u00A0' : c;
          nodes.push(span);
        });
        continue;
      }

      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      nodes.push(span);
      i++;
    }

    return nodes;
  }

  // next line function
  function startLine(index) {
    clearTypingTimer();
    container.innerHTML = '';
    container.className = '';
    lastPrintedChar = null;

    const group = dialogueGroups[currentGroupIndex];
    if (!group || !group.lines[index]) return;

    const lineData = group.lines[index];
    const rawText = lineData.text || '';
    if (lineData.texteffect) container.classList.add(`effect-${lineData.texteffect}`);

    nodesForCurrentLine = parseTextToNodes(rawText);
    typingIndex = 0;
    isTyping = true;
    scheduleNextChar();
  }
  // typewriter effect
  function scheduleNextChar() {
    if (typingIndex >= nodesForCurrentLine.length) { 
      isTyping = false; 
      typingTimer = null; 
      lastPrintedChar = null; 
      return; 
    }

    const node = nodesForCurrentLine[typingIndex];

    if (node.type === 'pause') {
      typingTimer = setTimeout(() => {
        typingIndex++;
        scheduleNextChar();
      }, node.time);
      return;
    }

    if (node.type === 'break') {
      for (let j = 0; j < node.count; j++) container.appendChild(document.createElement('br'));
      typingIndex++;
      scheduleNextChar();
      return;
    }

    if (node.type === 'next') {
      for (let j = 0; j < node.count; j++) nextLine();
      return;
    }

    let interval = CHAR_INTERVAL;
    if (lastPrintedChar) {
      const nextChar = node.textContent ?? node.data;
      const isNextSpace = nextChar === '\u00A0' || nextChar === ' ';
      if (isNextSpace && CHAR_PAUSE_RULES_ALONE[lastPrintedChar]) interval += CHAR_PAUSE_RULES_ALONE[lastPrintedChar];
      else if (!isNextSpace && CHAR_PAUSE_RULES_COMBO[lastPrintedChar]) interval += CHAR_PAUSE_RULES_COMBO[lastPrintedChar];
    }

    typingTimer = setTimeout(() => {
      appendNode(node);
      lastPrintedChar = node.textContent ?? node.data;
      typingIndex++;
      scheduleNextChar();
    }, interval);
  }
  function appendNode(node) { container.appendChild(node.cloneNode(true)); }
  function clearTypingTimer() { if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; } }

  // skip typewriter
  function revealLineInstantly() {
    clearTypingTimer();
    while (typingIndex < nodesForCurrentLine.length) {
      const node = nodesForCurrentLine[typingIndex];
      if (node.type === 'break') {
        for (let j = 0; j < node.count; j++) container.appendChild(document.createElement('br'));
      } else if (!node.type) {
        appendNode(node);
      }
      typingIndex++;
    }
    isTyping = false;
    lastPrintedChar = null;
  }
  function nextLine() {
  const group = dialogueGroups[currentGroupIndex];
  if (!group) return;

  // Check if this line is the last line
  const isLastLine = currentLineIndex === group.lines.length - 1;

  if (!isLastLine) {
    currentLineIndex++;
    startLine(currentLineIndex);

    // Optional: pre-check if the NEXT line is last
    const nextIsLast = currentLineIndex === group.lines.length - 1;
    if (nextIsLast && group.onCompleteFlag) {
      // Set flag immediately as we're now on the last line
      window.__gameState.flags[group.onCompleteFlag] = true;
      window.__saveGameState();
      console.log(`[DIALOGUE] Flag set: ${group.onCompleteFlag} = true`);
    }

  } else {
    isTyping = false;
    startNextGroup();
  }
  }

// ---------------------------
// event listeners
// ---------------------------
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (isTyping) {
      // Finish typing current line instantly
      revealLineInstantly();
    } else {
      // Move to next line or next group
      nextLine();
    }
  } else {
    if (!window.__gameState.flags.talkReveal && window.__gameState.flags.seenIntro) {
      window.__gameState.flags.talkReveal = true; 
      window.__saveGameState();
      startNextGroup();
    };
    // Track codeword inputs for other keys
    if (e.key.length === 1 && /^[a-zA-Z0-9?!.,'"]$/.test(e.key)) {
      window.__gameState.inputBuffer += e.key.toLowerCase();
    } else if (e.key === 'Enter') {
      window.__gameState.inputBuffer = '';
    }
    // Check codeword triggers after each key
    dialogueGroups.forEach(g => {
      if (!g._displayed) {
        g.trigger?.forEach(t => {
          if (t.type === 'codeword' && window.__conditionEngine.check(t)) {
            console.log("[DIALOGUE] Codeword matched:", t.matched, "for group:", g.name);
            window.__onConditionMatched(t);
            startNextGroup();
          }
        });
      }
    });
  }
});
document.body.addEventListener('click', () => {
  window.__gameState.clickCount++;
  if (!isTyping) startNextGroup(); // doesn't initialize new groups if it is still the same one
});


// expose
window.__dialogueEngine = {
parseTextToNodes,
revealLineInstantly,
nextLine,
startLine,
startNextGroup,
getState: () => ({ currentGroupIndex, currentLineIndex, isTyping, EFFECT_REGISTRY })
};
})();