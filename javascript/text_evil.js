  function randomizeLetters(element) {
    const text = element.textContent;
    element.textContent = ''; // Clear original text

    for (let char of text) {
      const span = document.createElement('span');
      span.textContent = char;
      span.classList.add('random-letter');

      // Random offsets: -5px to +5px
      const x = Math.floor(Math.random() * 11) - 5;
      const y = Math.floor(Math.random() * 11) - 5;
      span.style.transform = `translate(${x}px, ${y}px)`;

      element.appendChild(span);
    }
  }

  const paragraph = document.getElementById('text');
  randomizeLetters(paragraph);