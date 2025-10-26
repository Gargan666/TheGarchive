document.addEventListener('keydown', function(event) {
  const key = event.key;

  if (window.__gameState.flags.seenIntro){
  if (/^\S$/.test(key)) {
    const letter = document.createElement('span');
    letter.textContent = key;
    letter.className = 'letter-display';

    // Random horizontal position along the bottom
    const letterWidth = 24; // approximate width
    const maxLeft = window.innerWidth - letterWidth;
    const x = Math.random() * maxLeft;
    letter.style.transform = `translateX(${x}px) translateY(100vh)`; // starting position
    letter.style.setProperty('--x', `${x}px`);

    // Append to body
    document.body.appendChild(letter);
    
    // Remove after animation ends
    letter.addEventListener('animationend', () => {
      letter.remove();
    });
    }}
});
