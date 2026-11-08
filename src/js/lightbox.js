/* ============================================================
   WELLNESS — LIGHTBOX
   Full-screen viewer for the gallery grid.
   ============================================================ */

export function initLightbox() {
  const items = document.querySelectorAll('.g-item');
  if (!items.length) return;

  const lightbox = document.querySelector('.lightbox');
  if (!lightbox) return;

  const img = lightbox.querySelector('img');
  const cap = lightbox.querySelector('.lb-cap');
  const closeBtn = lightbox.querySelector('.lb-close');
  const prevBtn = lightbox.querySelector('.lb-prev');
  const nextBtn = lightbox.querySelector('.lb-next');

  let index = 0;
  let lastFocus = null;

  const render = () => {
    const item = items[index];
    const fullRes = item.dataset.full || item.querySelector('img')?.src;
    if (img) {
      img.src = fullRes;
      img.alt = item.querySelector('img')?.alt || '';
    }
    if (cap) cap.textContent = item.dataset.cap || '';
  };

  const open = (i) => {
    index = i;
    lastFocus = document.activeElement;
    render();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  };

  const close = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    if (img) img.src = '';
    lastFocus?.focus?.();
  };

  const step = (dir) => {
    index = (index + dir + items.length) % items.length;
    render();
  };

  items.forEach((item, i) => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Open image in viewer${item.dataset.cap ? `: ${item.dataset.cap}` : ''}`);
    item.addEventListener('click', () => open(i));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });
  });

  closeBtn?.addEventListener('click', close);
  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
}
