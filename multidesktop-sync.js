/* ReciboCondo V159 - sincronização segura entre computadores
   Carregado pelo Service Worker para evitar substituir o index.html monolítico. */
(function(){
  if (window.__rcMultiDesktopSyncV159) return;
  window.__rcMultiDesktopSyncV159 = true;

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

  window.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.config-sync-modal p,.config-sync-modal b,.config-sync-modal span').forEach(el=>{
      if(el.textContent.trim()==='PC como origem dos dados e mobile somente para consulta.') el.textContent='Computadores sincronizados pelo Firebase; mobile permanece somente consulta.';
      if(el.textContent.trim()==='PC · leitura e escrita') el.textContent='Computadores · leitura e escrita';
    });
    const syncBtn=[...document.querySelectorAll('.config-sync-actions button')].find(b=>b.textContent.includes('Sincronizar agora'));
    if(syncBtn) syncBtn.innerHTML='<i data-lucide="refresh-cw"></i> Sincronizar este computador';
  },{once:true});
})();