/* ReciboCondo V160 - sincronização segura entre computadores + atalho na topbar
   Carregado pelo Service Worker para evitar substituir o index.html monolítico. */
(function(){
  if (window.__rcMultiDesktopSyncV160) return;
  window.__rcMultiDesktopSyncV160 = true;

  function countSnapshot(s){
    if(!s||typeof s!=='object') return 0;
    return (s.providers?.length||0)+(s.services?.length||0)+(s.payments?.length||0)+(s.receipts?.length||0)+(s.recurrences?.length||0);
  }
  function localCount(ctx){
    return (ctx.providers?.length||0)+(ctx.services?.length||0)+(ctx.payments?.length||0)+(ctx.receipts?.length||0)+(ctx.recurrences?.length||0);
  }
  function rememberRemote(snapshot){
    try{ localStorage.setItem('rc_desktop_last_remote_updated_at',String(snapshot?.updatedAt||'')); }catch(_){}
  }

  const originalApp = window.app;
  if (typeof originalApp !== 'function') return;

  window.app = function(){
    const state = originalApp.apply(this, arguments);
    window.__rcAppState = state;

    state.desktopBootstrapFromCloud = async function(){
      if(this.appPlatform==='Mobile'||!this.firebaseUid||!window.rcFirebaseSync?.configured) return;
      try{
        const snapshot=await window.rcFirebaseSync.pull();
        if(!snapshot){ this.syncState='ready'; this.after(); return; }
        if(localCount(this)===0 && countSnapshot(snapshot)>0){
          await this.applyRemoteSnapshot(snapshot,{notify:false});
          rememberRemote(snapshot);
          this.toast('Dados do Firebase carregados neste computador.');
        }else{
          rememberRemote(snapshot);
          this.syncState='ready';
          this.syncLastAt=new Date().toISOString();
          this.after();
        }
      }catch(e){
        this.syncState='error';
        this.syncError=e?.message||String(e);
        this.after();
      }
    };

    state.desktopPullNow = async function(){
      this.syncState='syncing'; this.syncError='';
      try{
        if(!window.rcFirebaseSync?.configured) throw new Error('Projeto Firebase do ReciboCondo ainda não vinculado.');
        if(!window.rcFirebaseSync.uid&&!this.firebaseUid) throw new Error('Entre com sua conta Google antes de sincronizar.');
        const snapshot=await window.rcFirebaseSync.pull();
        if(!snapshot) throw new Error('Ainda não há uma base salva no Firebase.');
        if(localCount(this)>0 && !window.confirm('Baixar a base do Firebase?\n\nOs dados locais deste computador serão substituídos pela cópia da nuvem.')){
          this.syncState='ready'; return;
        }
        await this.applyRemoteSnapshot(snapshot,{notify:false});
        rememberRemote(snapshot);
        this.toast('Base deste computador atualizada pelo Firebase.');
      }catch(e){
        this.syncState='error'; this.syncError=e?.message||String(e); this.toast(this.syncError,'warning');
      }finally{ this.after(); }
    };

    state.desktopSyncNow = async function(){
      this.syncState='syncing'; this.syncError='';
      try{
        if(!window.rcFirebaseSync?.configured) throw new Error('Projeto Firebase do ReciboCondo ainda não vinculado.');
        if(!window.rcFirebaseSync.uid&&!this.firebaseUid) throw new Error('Entre com sua conta Google antes de sincronizar.');

        const remote=await window.rcFirebaseSync.pull();
        if(localCount(this)===0 && remote && countSnapshot(remote)>0){
          await this.applyRemoteSnapshot(remote,{notify:false});
          rememberRemote(remote);
          this.toast('Este computador estava vazio; a base da nuvem foi carregada em vez de ser sobrescrita.');
          return;
        }

        if(remote){
          let lastKnown='';
          try{ lastKnown=localStorage.getItem('rc_desktop_last_remote_updated_at')||''; }catch(_){}
          const cloudChanged=!!(remote.updatedAt && lastKnown && String(remote.updatedAt)!==String(lastKnown));
          const firstProtected=!!(remote.updatedAt && !lastKnown);
          if(cloudChanged||firstProtected){
            const msg=cloudChanged
              ? 'A base da nuvem foi atualizada desde a última sincronização deste computador.\n\nOK = substituir a nuvem pelos dados deste PC.\nCancelar = manter a nuvem como está.'
              : 'Já existe uma base no Firebase.\n\nOK = substituir a nuvem pelos dados deste PC.\nCancelar = manter a nuvem como está.';
            if(!window.confirm(msg)){ this.syncState='ready'; return; }
          }
        }

        const snapshot=this.buildSyncSnapshot();
        await window.rcFirebaseSync.push(snapshot);
        rememberRemote(snapshot);
        this.syncState='ready';
        this.syncLastAt=new Date().toISOString();
        this.toast('Dados deste computador enviados ao Firebase.');
      }catch(e){
        this.syncState='error'; this.syncError=e?.message||String(e); this.toast(this.syncError,'warning');
      }finally{ this.after(); }
    };

    const baseInit=state.init;
    state.init=async function(){
      window.addEventListener('rc-firebase-auth',async(ev)=>{
        if(this.appPlatform!=='Desktop') return;
        this.firebaseUser=ev.detail||null;
        this.firebaseUid=ev.detail?.uid||'';
        if(this.firebaseUid) await this.desktopBootstrapFromCloud();
      });
      await baseInit.call(this);
      if(this.appPlatform==='Desktop'&&this.firebaseUid) await this.desktopBootstrapFromCloud();
    };

    return state;
  };

  function installTopbarSync(){
    if(document.getElementById('rcTopbarSyncBtn')) return;
    const actionRow=document.querySelector('.app-topbar .flex.justify-end.items-center.gap-2');
    if(!actionRow) return;

    const style=document.createElement('style');
    style.id='rc-topbar-sync-style-v160';
    style.textContent=`
      #rcTopbarSyncBtn{height:3rem;width:3rem;min-width:3rem;padding:0;border-radius:1rem;border:1px solid rgba(47,107,79,.28);background:rgba(255,255,255,.52);color:#183445;position:relative;display:inline-flex;align-items:center;justify-content:center;gap:0;font-size:.76rem;font-weight:900;line-height:1;transition:.18s ease}
      #rcTopbarSyncBtn:hover{background:#fff;box-shadow:0 8px 20px rgba(15,42,58,.10);transform:translateY(-1px)}
      #rcTopbarSyncBtn:disabled{cursor:wait;opacity:.72;transform:none}
      #rcTopbarSyncBtn .rc-tb-sync-dot{position:absolute;right:.45rem;bottom:.42rem;width:.42rem;height:.42rem;border-radius:999px;background:#94a3b8;box-shadow:0 0 0 2px rgba(255,255,255,.9)}
      #rcTopbarSyncBtn.is-ready .rc-tb-sync-dot{background:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.12)}
      #rcTopbarSyncBtn.is-error .rc-tb-sync-dot{background:#dc2626;box-shadow:0 0 0 3px rgba(220,38,38,.12)}
      #rcTopbarSyncBtn.is-syncing .rc-tb-sync-dot{background:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,.12)}
      #rcTopbarSyncBtn .rc-tb-spin{animation:rcTbSyncSpin .8s linear infinite}
      @keyframes rcTbSyncSpin{to{transform:rotate(360deg)}}
      html.dark #rcTopbarSyncBtn{background:#22364a;border-color:#3b5168;color:#eef2f7}
      html.dark #rcTopbarSyncBtn:hover{background:#2a4056}
      @media(max-width:1023px){#rcTopbarSyncBtn{display:none!important}}
    `;
    document.head.appendChild(style);

    const btn=document.createElement('button');
    btn.type='button';
    btn.id='rcTopbarSyncBtn';
    btn.innerHTML='<i data-lucide="refresh-cw" class="w-4 h-4"></i><span class="rc-tb-sync-dot" aria-hidden="true"></span>';
    actionRow.insertBefore(btn,actionRow.firstChild);

    const paint=()=>{
      const s=window.__rcAppState;
      if(!s) return;
      const state=s.syncState||'pending';
      btn.classList.toggle('is-ready',state==='ready');
      btn.classList.toggle('is-error',state==='error');
      btn.classList.toggle('is-syncing',state==='syncing');
      btn.disabled=state==='syncing';
      const icon=btn.querySelector('svg')||btn.querySelector('i');
      if(icon) icon.classList.toggle('rc-tb-spin',state==='syncing');
      btn.title=s.firebaseUser
        ? (state==='syncing'?'Sincronizando…':'Sincronizar este computador')
        : 'Conectar Google para sincronizar';
    };

    btn.addEventListener('click',async()=>{
      const s=window.__rcAppState;
      if(!s) return;
      if(!s.firebaseUser){
        if(typeof s.go==='function') s.go('config'); else s.view='config';
        s.configModal='sync';
        if(typeof s.after==='function') s.after();
        return;
      }
      if(typeof s.desktopSyncNow==='function'){
        paint();
        await s.desktopSyncNow.call(s);
        paint();
      }
    });

    window.addEventListener('rc-firebase-auth',()=>setTimeout(paint,0));
    setInterval(paint,900);
    setTimeout(()=>{ if(window.lucide) lucide.createIcons(); paint(); },50);
  }

  function bootTopbarSyncPatch(){
    const refreshCopy=()=>{
      document.querySelectorAll('.config-sync-modal p,.config-sync-modal b,.config-sync-modal span').forEach(el=>{
        if(el.textContent.trim()==='PC como origem dos dados e mobile somente para consulta.') el.textContent='Computadores sincronizados pelo Firebase; mobile permanece somente consulta.';
        if(el.textContent.trim()==='PC · leitura e escrita') el.textContent='Computadores · leitura e escrita';
      });
      const syncBtn=[...document.querySelectorAll('.config-sync-actions button')].find(b=>b.textContent.includes('Sincronizar agora'));
      if(syncBtn) syncBtn.innerHTML='<i data-lucide="refresh-cw"></i> Sincronizar este computador';
    };

    const tryInstall=()=>{
      refreshCopy();
      installTopbarSync();
    };

    tryInstall();
    const timer=setInterval(()=>{
      tryInstall();
      if(document.getElementById('rcTopbarSyncBtn')) clearInterval(timer);
    },500);
    setTimeout(()=>clearInterval(timer),30000);

    const observer=new MutationObserver(()=>{
      if(!document.getElementById('rcTopbarSyncBtn')) tryInstall();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),60000);
  }

  if(document.readyState==='loading'){
    window.addEventListener('DOMContentLoaded',bootTopbarSyncPatch,{once:true});
  }else{
    bootTopbarSyncPatch();
  }
})();