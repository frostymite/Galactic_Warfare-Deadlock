/* Deadlock v12 native bridge. Works in browser/PWA and becomes richer inside Capacitor. */
(() => {
  'use strict';
  class NativeBridge {
    constructor(){this.platform='web';this.native=false;this.ready=false;this.plugins={};}
    async init(){
      this.native=!!window.Capacitor?.isNativePlatform?.();
      this.platform=window.Capacitor?.getPlatform?.()||'web';
      document.documentElement.dataset.runtime=this.native?'native':'web';
      document.documentElement.dataset.platform=this.platform;
      this.ready=true;
      this.plugins=window.Capacitor?.Plugins||{};
      if(this.native){document.body.classList.add('native-shell');await this.configureNativeShell();}
      this.bindHaptics();
      window.dispatchEvent(new CustomEvent('deadlock:native-ready',{detail:{native:this.native,platform:this.platform}}));
    }
    bindHaptics(){
      document.addEventListener('pointerup',e=>{const b=e.target.closest?.('button,[data-weapon],[data-target],[data-galaxy-node]');if(!b)return;const heavy=b.classList.contains('danger')||b.matches('[data-fire],[data-attack]');this.haptic(heavy?'medium':'light');},{passive:true});
    }
    async haptic(level='light'){
      const ms=level==='heavy'?45:level==='medium'?25:12;
      try{const h=this.plugins?.Haptics;if(this.native&&h?.impact){await h.impact({style:level==='heavy'?'HEAVY':level==='medium'?'MEDIUM':'LIGHT'});}else navigator.vibrate?.(ms);}catch{try{navigator.vibrate?.(ms)}catch{}}
      window.dispatchEvent(new CustomEvent('deadlock:haptic',{detail:{level}}));
    }
    async configureNativeShell(){
      try{await this.plugins?.StatusBar?.hide?.()}catch{}
      try{await this.plugins?.ScreenOrientation?.unlock?.()}catch{}
      try{this.plugins?.App?.addListener?.('appStateChange',({isActive})=>window.dispatchEvent(new CustomEvent('deadlock:app-state',{detail:{isActive}})))}catch{}
    }
    async persistSave(key,value){try{if(this.native&&this.plugins?.Preferences?.set)await this.plugins.Preferences.set({key,value});}catch{}}
    async readSave(key){try{if(this.native&&this.plugins?.Preferences?.get){const r=await this.plugins.Preferences.get({key});return r?.value||null}}catch{}return null}
    async networkStatus(){try{if(this.native&&this.plugins?.Network?.getStatus)return await this.plugins.Network.getStatus()}catch{}return {connected:navigator.onLine,connectionType:navigator.onLine?'unknown':'none'}}
    async enterImmersive(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();}catch{} }
    async shareSave(filename,text){
      // Web fallback; native filesystem/share plugin hooks can replace this later without touching game logic.
      const blob=new Blob([text],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2500);
    }
  }
  window.DeadlockNative=new NativeBridge();
  const boot=()=>window.DeadlockNative.init();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
