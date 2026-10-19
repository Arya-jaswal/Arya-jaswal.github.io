(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Light / dark toggle ---------- */
  const themeBtn = document.getElementById('theme-toggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');
  const updateThemeLabel = () =>
    themeBtn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');

  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    updateThemeLabel();
  });
  systemDark.addEventListener('change', updateThemeLabel);
  updateThemeLabel();

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Fade sections in as they scroll into view ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    root.classList.add('js-reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  }

  /* ---------- Project details: click a card to open its dialog ---------- */
  document.querySelectorAll('[data-dialog]').forEach((btn) => {
    const dialog = document.getElementById(btn.dataset.dialog);
    if (!dialog || typeof dialog.showModal !== 'function') return;
    btn.addEventListener('click', () => {
      dialog.querySelector('.dialog-scroll').scrollTop = 0;
      dialog.showModal();
    });
  });
  document.querySelectorAll('.project-dialog').forEach((dialog) => {
    // Close on the X, or on a click outside the panel (a backdrop click targets the dialog itself).
    // Checking where the press started stops a text selection that ends outside from closing it.
    let pressedBackdrop = false;
    dialog.addEventListener('pointerdown', (e) => { pressedBackdrop = e.target === dialog; });
    dialog.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]') || (pressedBackdrop && e.target === dialog)) dialog.close();
    });
  });

  /* ---------- Terminal replay in the hero ---------- */
  // Without JS (or with reduced motion) the full session is shown as static text.
  const term = document.getElementById('term');
  if (!term || reduceMotion) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const lines = [...term.querySelectorAll('.ln')];
  const commands = lines.map((l) => l.querySelector('.tx')?.textContent ?? null);
  const cursor = term.querySelector('.cursor') || document.createElement('span');
  cursor.className = 'cursor';
  cursor.remove();

  lines.forEach((l) => {
    l.hidden = true;
    const tx = l.querySelector('.tx');
    if (tx) tx.textContent = '';
  });

  (async () => {
    await sleep(600);
    for (const [i, line] of lines.entries()) {
      const tx = line.querySelector('.tx');
      if (tx) {
        // A command: type it out character by character.
        line.hidden = false;
        tx.after(cursor);
        await sleep(450);
        for (const ch of commands[i]) {
          tx.textContent += ch;
          await sleep(30 + Math.random() * 50);
        }
        await sleep(300);
      } else {
        // Output: appears after a short (or, for slow steps, longer) pause.
        cursor.remove();
        await sleep(Number(line.dataset.delay) || 90);
        line.hidden = false;
      }
    }
  })();
})();
