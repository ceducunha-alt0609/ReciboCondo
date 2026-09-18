/* ReciboCondo - splash harmonioso sem flash e sem scale */
(function(){
  if (window.__rcSplashHarmonyV2) return;
  window.__rcSplashHarmonyV2 = true;

  const STYLE_ID = 'rc-splash-harmony-style-v2';

  function ensureStyle(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .rc-splash-harmony{
        --rc-splash-logo: clamp(78px, 7vw, 96px);
        --rc-splash-title: clamp(1.85rem, 2.45vw, 2.25rem);
        --rc-splash-subtitle: clamp(.76rem, 1vw, .9rem);
      }
      .rc-splash-harmony .rc-splash-content-target{
        width:min(92vw, 460px)!important;
        max-width:460px!important;
        margin-left:auto!important;
        margin-right:auto!important;
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        transform:none!important;
        transform-origin:center center!important;
      }
      .rc-splash-harmony img,
      .rc-splash-harmony svg{
        max-width:var(--rc-splash-logo)!important;
        max-height:var(--rc-splash-logo)!important;
        width:auto!important;
        height:auto!important;
        margin-left:auto!important;
        margin-right:auto!important;
      }
      .rc-splash-harmony .rc-splash-title-target{
        font-size:var(--rc-splash-title)!important;
        line-height:1.05!important;
        letter-spacing:-.025em!important;
        margin:.85rem 0 .2rem!important;
        text-align:center!important;
      }
      .rc-splash-harmony .rc-splash-subtitle-target{
        font-size:var(--rc-splash-subtitle)!important;
        line-height:1.35!important;
        opacity:.8!important;
        margin:.18rem auto!important;
        text-align:center!important;
      }
      @media (max-width:640px){
        .rc-splash-harmony{
          --rc-splash-logo: clamp(70px, 20vw, 86px);
          --rc-splash-title: clamp(1.55rem, 6.5vw, 1.85rem);
          --rc-splash-subtitle: clamp(.72rem, 3.2vw, .84rem);
        }
        .rc-splash-harmony .rc-splash-content-target{
          width:min(88vw, 380px)!important;
          max-width:380px!important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function textIsTitle(el){
    if (!el || el.nodeType !== 1) return false;
    const t = (el.textContent || '').trim().replace(/\s+/g,' ');
    return /^recibocondo$/i.test(t) || /^recibo\s*condo$/i.test(t);
  }

  function looksLikeSplashRoot(el){
    if (!el || el === document.body || el === document.documentElement) return false;
    const named = /splash|loading|loader|boot|intro/i.test((el.id||'') + ' ' + (typeof el.className === 'string' ? el.className : ''));
    if (named) return true;
    try {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return (cs.position === 'fixed' || cs.position === 'absolute') &&
             r.width >= innerWidth * .8 &&
             r.height >= innerHeight * .7;
    } catch(_) {
      return false;
    }
  }

  function findRoot(title){
    let el = title;
    let fallback = title.parentElement;
    for (let i = 0; i < 9 && el; i++, el = el.parentElement){
      if (looksLikeSplashRoot(el)) return el;
      if (i === 3 && el) fallback = el;
    }
    return fallback;
  }

  function decorate(title){
    const root = findRoot(title);
    if (!root) return false;
    root.classList.add('rc-splash-harmony');
    title.classList.add('rc-splash-title-target');

    let content = title.parentElement;
    if (content && content !== root) {
      content.classList.add('rc-splash-content-target');
    } else {
      content = root;
      root.classList.add('rc-splash-content-target');
    }

    const candidates = content ? [...content.querySelectorAll('p,span,div,strong,b')] : [];
    for (const el of candidates){
      if (el === title || el.contains(title)) continue;
      const txt = (el.textContent || '').trim().replace(/\s+/g,' ');
      if (!txt || txt.length > 120) continue;
      if (/entrar|login|senha|email/i.test(txt)) continue;
      if (/recibocondo/i.test(txt)) continue;
      el.classList.add('rc-splash-subtitle-target');
    }
    return true;
  }

  function scan(scope){
    ensureStyle();
    const root = scope && scope.querySelectorAll ? scope : document;
    const nodes = root.querySelectorAll ? root.querySelectorAll('h1,h2,h3,strong,b,div,span,p') : [];
    for (const el of nodes){
      if (textIsTitle(el)) return decorate(el);
    }
    return false;
  }

  ensureStyle();
  const run = () => requestAnimationFrame(() => scan(document));

  if (document.documentElement){
    const observer = new MutationObserver(() => run());
    observer.observe(document.documentElement, { childList:true, subtree:true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run, {once:true});
  } else {
    run();
  }
})();