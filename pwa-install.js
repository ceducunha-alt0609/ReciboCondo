(() => {
  'use strict';

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone()) return;

  let deferredPrompt = null;
  let button = null;

  function ensureButton() {
    if (button || isStandalone()) return button;

    button = document.createElement('button');
    button.id = 'rc-pwa-install';
    button.type = 'button';
    button.setAttribute('aria-label', 'Instalar ReciboCondo');
    button.innerHTML = '<span aria-hidden="true">⬇</span><span>Instalar app</span>';

    Object.assign(button.style, {
      position: 'fixed',
      right: '18px',
      bottom: '18px',
      zIndex: '2147483000',
      display: 'none',
      alignItems: 'center',
      gap: '8px',
      minHeight: '42px',
      padding: '10px 14px',
      border: '1px solid rgba(255,255,255,.18)',
      borderRadius: '999px',
      background: '#0F2A3A',
      color: '#fff',
      font: '600 13px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      boxShadow: '0 10px 28px rgba(0,0,0,.28)',
      cursor: 'pointer'
    });

    button.addEventListener('click', async () => {
      if (deferredPrompt) {
        const promptEvent = deferredPrompt;
        deferredPrompt = null;
        button.style.display = 'none';
        try {
          await promptEvent.prompt();
          await promptEvent.userChoice;
        } catch (_) {}
        return;
      }

      const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isiOS) {
        alert('No iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.');
      }
    });

    document.body.appendChild(button);
    return button;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    const installButton = ensureButton();
    if (installButton) installButton.style.display = 'inline-flex';
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (button) button.remove();
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (isStandalone()) return;
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isiOS) {
      const installButton = ensureButton();
      if (installButton) installButton.style.display = 'inline-flex';
    }
  }, { once: true });
})();
