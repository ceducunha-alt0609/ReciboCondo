/* ReciboCondo - refino visual seguro do splash */
(function(){
  if (window.__rcSplashHarmonyV1) return;
  window.__rcSplashHarmonyV1 = true;

  const STYLE_ID = 'rc-splash-harmony-style';
  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .rc-splash-harmony{
        --rc-splash-logo: clamp(76px, 8vw, 108px);
        --rc-splash-title: clamp(1.65rem, 2.7vw, 2.35rem);
        --rc-splash-subtitle: clamp(.78rem, 1.2vw, .95rem);
      }
      .rc-splash-harmony img,
      .rc-splash-harmony svg{
        max-width:var(--rc-splash-logo)!important;
        max-height:var(--rc-splash-logo)!important;
        width:auto!important;
        height:auto!important;
      }
      .rc-splash-harmony .rc-splash-title-target{
        font-size:var(--rc-splash-title)!important;
        line-height:1.08!important;
        letter-spacing:-.025em!important;
        margin-top:.9rem!important;
        margin-bottom:.25rem!important;
      }
      .rc-splash-harmony .rc-splash-subtitle-target{
        font-size:var(--rc-splash-subtitle)!important;
        line-height:1.4!important;
        opacity:.78!important;
        margin-top:.25rem!important;
      }
      .rc-splash-harmony .rc-splash-content-target{
        transform:scale(.94);
        transform-origin:center center;
      }
      @media (max-width: 640px){
        .rc-splash-harmony{
          --rc-splash-logo: clamp(68px, 22vw, 92px);
          --rc-splash-title: clamp(1.45rem, 7vw, 1.9rem);
        }
        .rc-splash-harmony .rc-splash-content-target{transform:scale(.92)}
      }
    `;
    document.head.appendChild(style);
  }

  function isFullScreenLike(el){
    if(!el || el===document.body || el===document.documentElement) return false;
    const cs=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    const fullSize = r.width >= innerWidth*.82 && r.height >= innerHeight*.72;
    const overlay = cs.position==='fixed' || cs.position==='absolute';
    const named = /splash|loading|loader|boot|intro/i.test((el.id||'')+' '+(el.className||''));
    return named || (overlay && fullSize);
  }

  function findRoot(titleEl){
    let el=titleEl;
    for(let i=0;i<8 && el;i++,el=el.parentElement){
      if(isFullScreenLike(el)) return el;
    }
    return null;
  }

  function apply(){
    ensureStyle();
    const candidates=[...document.querySelectorAll('h1,h2,h3,strong,b,div,span,p')]
      .filter(el=>{
        const t=(el.textContent||'').trim().replace(/\s+/g,' ');
        return /^recibocondo$/i.test(t) || /^recibo\s*condo$/i.test(t);
      });

    for(const title of candidates){
      const root=findRoot(title);
      if(!root) continue;
      root.classList.add('rc-splash-harmony');
      title.classList.add('rc-splash-title-target');

      let content=title.parentElement;
      if(content && content!==root) content.classList.add('rc-splash-content-target');

      const siblings=content ? [...content.children] : [];
      for(const el of siblings){
        if(el===title) continue;
        const txt=(el.textContent||'').trim();
        if(txt && txt.length<120 && !/entrar|login|senha|email/i.test(txt)){
          el.classList.add('rc-splash-subtitle-target');
        }
      }
      return true;
    }
    return false;
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',apply,{once:true});
  } else apply();

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(apply() || tries>30) clearInterval(timer);
  },250);
})();