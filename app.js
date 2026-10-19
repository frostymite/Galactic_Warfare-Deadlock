
const STORAGE_KEY="deadlock_dashboard_v3";
let DATA=null,GALAXY=null,ASSET_MANIFEST=null,SCENES=null,currentPage="Overview",diceHistory=[],deferredInstall=null,wakeLock=null;
let uiSound=true;
let AMBIENT=null;
let AUDIO_UNLOCKED=false;
let WORLD_AUDIO=null;
let LAST_SPOKEN={speaker:"",text:"",at:0};
let SCENE_LAST_DIALOGUE={speaker:"",text:"",at:0};
let SCENE_RUNTIME={raf:0,el:null,pointerX:0,pointerY:0};
const NPC_VOICE_PROFILES={
 dren:{pitch:.76,rate:.96,index:0},
 nera:{pitch:1.08,rate:.91,index:1},
 renn:{pitch:.91,rate:.94,index:2},
 jessa:{pitch:1.02,rate:1.04,index:3},
 unknown:{pitch:.82,rate:.89,index:4}
};
let lastCredits=0;
let notificationLog=[];
let currentTargetLock=null;
let selectedCombatWeapon="blackwake";
let selectedCombatTarget=null;
const pages=["Overview","Story","Holonet","Combat","Targets","Bounties","Galaxy","HQ","Dogfight","Character","Identities","Gear","Weapons","Ship","Contracts","Contacts","Inventory","Journal","Factions","Dice","GM Controls","Settings"];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const pct=(v,max)=>max?clamp(Math.round(v/max*100),0,100):0;
const uid=(p="id")=>p+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7);
const money=n=>new Intl.NumberFormat("en-US").format(Number(n||0))+" cr";
function assetEntry(group,id){return ASSET_MANIFEST?.[group]?.[id]||null}
function assetUrl(group,id,state="neutral"){
 const e=assetEntry(group,id);if(!e)return null;
 if(typeof e==="string")return e;
 return e[state]||e.neutral||e.hero||e.flight||e.exterior||e.fallback||null;
}
function assetFallback(group,id){const e=assetEntry(group,id);return typeof e==="object"?(e.fallback||e.neutral||e.hero||null):null}
function imgTag(src,alt="",fallback=null,cls=""){
 const safe=esc(src||fallback||"");const fb=esc(fallback||"");
 return `<img ${cls?`class="${esc(cls)}"`:""} src="${safe}" alt="${esc(alt)}" loading="lazy" ${fb&&fb!==safe?`onerror="this.onerror=null;this.src='${fb}'"`:""}>`;
}
function characterVisual(id,state="neutral",alt=""){
 const e=assetEntry("characters",id)||{};return imgTag(e[state]||e.neutral||e.fallback,alt||id,e.fallback||null,"character-visual");
}
function ravenVisual(state="flight",alt="The Raven"){
 if(state!=="schematic")return imgTag("assets/ships/raven_cutout_v15.svg",alt,null,"raven-visual");
 const e=assetEntry("ships","raven")||{};return imgTag(e[state]||e.flight||e.fallback,alt,e.fallback||null,"raven-visual");
}
function validCampaignSave(value){return !!value&&typeof value==="object"&&!Array.isArray(value)&&!!value.character&&Number.isFinite(value.character.health)&&Number.isFinite(value.character.credits)&&!!value.ship&&Number.isFinite(value.ship.hull)&&!!value.combat&&Array.isArray(value.combat.participants)&&["weapons","contracts","targets","contacts","inventory","gear","identities","factions","journal","locations"].every(k=>Array.isArray(value[k]));}
function save(){const raw=JSON.stringify(DATA);try{localStorage.setItem(STORAGE_KEY,raw);window.DEADLOCK_SAVE_FAILED=false;}catch(err){window.DEADLOCK_SAVE_FAILED=true;document.getElementById("saveStatus")?.remove();const warning=document.createElement("div");warning.id="saveStatus";warning.setAttribute("role","alert");warning.textContent="Saving is unavailable. Use Export to keep your progress before closing.";document.querySelector("main")?.prepend(warning);}window.DeadlockNative?.persistSave?.(STORAGE_KEY,raw)?.catch?.(()=>{});}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");navigator.vibrate?.(20);uiBeep(520,.035,.035);setTimeout(()=>t.classList.remove("show"),1500)}
let AUDIO_CTX=null;
function audioContext(){
 if(!uiSound)return null;
 try{
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return null;
  if(!AUDIO_CTX)AUDIO_CTX=new C();
  if(AUDIO_CTX.state==="suspended")AUDIO_CTX.resume().catch(()=>{});
  return AUDIO_CTX;
 }catch(e){return null}
}
function uiBeep(freq=440,dur=.05,vol=.025,type="sine"){
 const ctx=audioContext();if(!ctx)return;
 try{
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+Math.max(.02,dur));
  o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur+.01);
 }catch(e){}
}

function audioPrefs(){return DATA?.settings||{}}
function ambientGainTarget(){
 const v=clamp(Number(audioPrefs().musicVolume??55),0,100)/100;
 // Direct volume mapping: the Music Volume slider is the sole music-level control.
 // 100% slider = unity gain, 50% = 0.5, 0% = silent.
 return v;
}
function midiFreq(n){return 440*Math.pow(2,(Number(n)-69)/12)}
function scoreProfile(){
 const danger=clamp(Number(DATA?.story?.danger||0),0,100);
 const profiles={
  Overview:{bpm:72,chords:[[50,53,57],[46,50,53],[53,57,60],[48,52,55]],melody:[62,null,65,64,62,69,67,null,65,64,62,null,57,60,62,null],energy:.38},
  Story:{bpm:76,chords:[[50,53,57],[46,50,53],[53,57,60],[48,52,55]],melody:[62,null,69,65,64,null,62,57,60,null,65,67,64,null,62,null],energy:.46},
  Holonet:{bpm:68,chords:[[52,55,59],[48,52,55],[55,59,62],[50,54,57]],melody:[64,null,null,67,71,null,69,null,64,null,62,64,67,null,null,null],energy:.30},
  Ship:{bpm:82,chords:[[55,58,62],[51,55,58],[58,62,65],[53,57,60]],melody:[67,null,70,69,67,74,72,null,70,69,67,null,62,65,67,null],energy:.44},
  Combat:{bpm:118,chords:[[50,53,57],[48,52,55],[46,50,53],[45,50,53]],melody:[62,65,69,67,65,62,60,62,65,69,72,69,67,65,62,60],energy:.90},
  Dogfight:{bpm:132,chords:[[45,48,52],[43,47,50],[41,45,48],[40,45,48]],melody:[69,72,76,74,72,69,67,69,72,76,79,76,74,72,69,67],energy:1.0}
 };
 const base=profiles[currentPage]||profiles.Overview;
 return {...base,danger,energy:clamp(base.energy+danger/220,0,1)};
}
function makeImpulse(ctx,seconds=2.2,decay=2.4){
 const rate=ctx.sampleRate,len=Math.floor(rate*seconds),buf=ctx.createBuffer(2,len,rate);
 for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay)}
 return buf;
}
function scoreBus(ctx){
 const master=ctx.createGain(),dry=ctx.createGain(),wet=ctx.createGain(),verb=ctx.createConvolver(),tone=ctx.createBiquadFilter();
 master.gain.value=.0001;dry.gain.value=.78;wet.gain.value=.28;tone.type='lowpass';tone.frequency.value=5200;tone.Q.value=.3;verb.buffer=makeImpulse(ctx);
 tone.connect(dry);tone.connect(verb);verb.connect(wet);dry.connect(master);wet.connect(master);master.connect(ctx.destination);
 return {master,tone,dry,wet,verb};
}
function scoreOsc(ctx,type,freq,start,dur,vol,attack=.03,release=.2,detune=0,dest=null){
 const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,start);o.detune.value=detune;
 g.gain.setValueAtTime(.0001,start);g.gain.linearRampToValueAtTime(Math.max(.0002,vol),start+Math.min(attack,dur*.4));
 g.gain.setValueAtTime(Math.max(.0002,vol),Math.max(start+attack,start+dur-release));g.gain.exponentialRampToValueAtTime(.0001,start+dur);
 o.connect(g);g.connect(dest||ctx.destination);o.start(start);o.stop(start+dur+.03);return o;
}
function strings(notes,start,dur,vol=.03){
 if(!AUDIO_CTX||!AMBIENT)return;notes.forEach((m,i)=>{const f=midiFreq(m);scoreOsc(AUDIO_CTX,'sawtooth',f,start,dur,vol/(notes.length||1),.55,.65,-5+i*4,AMBIENT.tone);scoreOsc(AUDIO_CTX,'triangle',f*.5,start,dur,vol*.42/(notes.length||1),.65,.7,3-i*2,AMBIENT.tone)})
}
function brass(notes,start,dur,vol=.038){
 if(!AUDIO_CTX||!AMBIENT)return;notes.forEach((m,i)=>{const f=midiFreq(m);scoreOsc(AUDIO_CTX,'sawtooth',f,start,dur,vol/(notes.length||1),.045,.24,i*3-3,AMBIENT.tone);scoreOsc(AUDIO_CTX,'square',f*.5,start,dur,vol*.24/(notes.length||1),.03,.18,0,AMBIENT.tone)})
}
function bassNote(m,start,dur,vol=.035){if(!AUDIO_CTX||!AMBIENT)return;const f=midiFreq(m);scoreOsc(AUDIO_CTX,'triangle',f,start,dur,vol,.025,.18,0,AMBIENT.tone);scoreOsc(AUDIO_CTX,'sine',f*.5,start,dur,vol*.48,.02,.22,0,AMBIENT.tone)}
function melodyNote(m,start,dur,vol=.025){if(!AUDIO_CTX||!AMBIENT||m==null)return;const f=midiFreq(m);scoreOsc(AUDIO_CTX,'triangle',f,start,dur,vol,.055,.22,-3,AMBIENT.tone);scoreOsc(AUDIO_CTX,'sine',f*2,start,dur,vol*.18,.03,.18,4,AMBIENT.tone)}
function pizzNote(m,start,dur=.16,vol=.018){if(!AUDIO_CTX||!AMBIENT)return;const f=midiFreq(m);scoreOsc(AUDIO_CTX,'triangle',f,start,dur,vol,.006,.12,0,AMBIENT.tone)}
function timpani(m,start,vol=.04){if(!AUDIO_CTX||!AMBIENT)return;const ctx=AUDIO_CTX,f=midiFreq(m),o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f*1.5,start);o.frequency.exponentialRampToValueAtTime(f,start+.14);g.gain.setValueAtTime(vol,start);g.gain.exponentialRampToValueAtTime(.0001,start+.65);o.connect(g);g.connect(AMBIENT.tone);o.start(start);o.stop(start+.7)}
function noiseHit(start,dur=.12,vol=.012,high=false){
 if(!AUDIO_CTX||!AMBIENT)return;const ctx=AUDIO_CTX,len=Math.max(1,Math.floor(ctx.sampleRate*dur)),buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
 const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buf;f.type=high?'highpass':'bandpass';f.frequency.value=high?4200:900;f.Q.value=high?.2:1.2;g.gain.setValueAtTime(vol,start);g.gain.exponentialRampToValueAtTime(.0001,start+dur);src.connect(f);f.connect(g);g.connect(AMBIENT.tone);src.start(start);src.stop(start+dur+.02)
}
function setAmbientDuck(ducked){
 if(!AMBIENT?.master||!AUDIO_CTX)return;AMBIENT.ducked=!!ducked;const now=AUDIO_CTX.currentTime,target=ambientGainTarget()*(ducked?.18:1);AMBIENT.master.gain.cancelScheduledValues(now);AMBIENT.master.gain.setTargetAtTime(Math.max(.0001,target),now,.18)
}
function scheduleScoreStep(step,time,p){
 const beat=60/p.bpm,barStep=step%16,bar=Math.floor(step/16),ch=p.chords[(bar%p.chords.length)];
 if(barStep===0){strings(ch,time,beat*4*.98,.038*(.65+p.energy*.45));bassNote(ch[0]-12,time,beat*2.8,.035);if(p.energy>.65)brass(ch,time,beat*.72,.034*p.energy);timpani(ch[0]-12,time,.028+.025*p.energy)}
 if(barStep===8){strings(p.chords[((bar+1)%p.chords.length)],time,beat*2.0,.020*(.7+p.energy*.4));if(p.energy>.72)brass(ch,time,beat*.48,.024*p.energy)}
 const melody=p.melody[barStep%p.melody.length];if(melody!=null&&barStep%2===0)melodyNote(melody,time,beat*1.55,.018+.011*p.energy);
 if(p.energy>.52){const arp=ch[(barStep/2|0)%ch.length]+12;if(barStep%2===0)pizzNote(arp,time,beat*.34,.010+.010*p.energy)}
 if(p.energy>.70){if(barStep%4===0)timpani(ch[0]-12,time,.025+.02*p.energy);if(barStep===4||barStep===12)noiseHit(time,.11,.006+.008*p.energy,false)}
 if(p.energy>.88){if(barStep%2===0)noiseHit(time,.055,.004+.005*p.energy,true);if(barStep===15)noiseHit(time,.42,.012,true)}
}
function scoreTick(){
 if(!AMBIENT?.running||!AUDIO_CTX)return;const p=scoreProfile();AMBIENT.profile=currentPage;AMBIENT.tone.frequency.setTargetAtTime(3400+p.energy*3000,AUDIO_CTX.currentTime,.8);
 while(AMBIENT.nextTime<AUDIO_CTX.currentTime+.55){scheduleScoreStep(AMBIENT.step,AMBIENT.nextTime,p);const subdivision=(60/p.bpm)/2;AMBIENT.nextTime+=subdivision;AMBIENT.step=(AMBIENT.step+1)%64}
}
function retuneAmbient(){
 if(!AMBIENT?.running||!AUDIO_CTX)return;AMBIENT.step=0;AMBIENT.nextTime=AUDIO_CTX.currentTime+.08;if(!AMBIENT.ducked)AMBIENT.master.gain.setTargetAtTime(ambientGainTarget(),AUDIO_CTX.currentTime,.45);scoreTick()
}
function startAmbientMusic(){
 if(!uiSound||audioPrefs().music===false)return;const ctx=audioContext();if(!ctx)return;if(AMBIENT?.running)return;
 try{const bus=scoreBus(ctx);AMBIENT={...bus,running:true,ducked:false,timer:null,step:0,nextTime:ctx.currentTime+.08,profile:currentPage};bus.master.gain.setTargetAtTime(ambientGainTarget(),ctx.currentTime,.7);AMBIENT.timer=setInterval(scoreTick,90);scoreTick()}catch(e){AMBIENT=null}
}
function stopAmbientMusic(){
 if(!AMBIENT)return;const old=AMBIENT;AMBIENT=null;try{if(old.timer)clearInterval(old.timer);if(AUDIO_CTX&&old.master){const now=AUDIO_CTX.currentTime;old.master.gain.cancelScheduledValues(now);old.master.gain.setTargetAtTime(.0001,now,.08);setTimeout(()=>{try{old.master.disconnect();old.tone.disconnect();old.verb.disconnect()}catch(e){}},320)}}catch(e){}
}
function unlockGameAudio(){AUDIO_UNLOCKED=true;if(uiSound&&audioPrefs().music!==false)startAmbientMusic();if(uiSound&&audioPrefs().worldAudio!==false)startWorldAudio()}
function syncAudioState(){if(!uiSound){stopAmbientMusic();stopWorldAudio();try{window.speechSynthesis?.cancel()}catch(e){};return}if(audioPrefs().music===false)stopAmbientMusic();else if(AUDIO_UNLOCKED)startAmbientMusic();if(audioPrefs().worldAudio===false)stopWorldAudio();else if(AUDIO_UNLOCKED)startWorldAudio();retuneWorldAudio()}
function worldAudioTarget(){return clamp(Number(audioPrefs().effectsVolume??42),0,100)/100*.16}
function makeLoopNoise(ctx,seconds=2){const len=Math.floor(ctx.sampleRate*seconds),b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;return b}
function worldAudioProfile(){const theme=document.body.dataset.sceneTheme||scenePresetFor?.(currentPage)||'ambient';const map={hq:{hum:54,noise:520,noiseGain:.10},ship:{hum:68,noise:760,noiseGain:.055},cockpit:{hum:74,noise:900,noiseGain:.045},urban:{hum:43,noise:1250,noiseGain:.09},combat:{hum:46,noise:680,noiseGain:.12},desert:{hum:38,noise:1550,noiseGain:.065},jungle:{hum:36,noise:900,noiseGain:.07},ice:{hum:42,noise:2200,noiseGain:.055},volcanic:{hum:34,noise:430,noiseGain:.11},ocean:{hum:39,noise:1100,noiseGain:.08},asteroid:{hum:58,noise:700,noiseGain:.045},orbit:{hum:66,noise:1000,noiseGain:.035},unknown:{hum:47,noise:820,noiseGain:.07}};return map[theme]||map.ship}
function startWorldAudio(){if(!uiSound||audioPrefs().worldAudio===false)return;const ctx=audioContext();if(!ctx||WORLD_AUDIO)return;try{const master=ctx.createGain(),hum=ctx.createOscillator(),humGain=ctx.createGain(),noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),noiseGain=ctx.createGain();master.gain.value=.0001;hum.type='sine';hum.frequency.value=60;humGain.gain.value=.34;noise.buffer=makeLoopNoise(ctx);noise.loop=true;filter.type='bandpass';filter.frequency.value=850;filter.Q.value=.55;noiseGain.gain.value=.06;hum.connect(humGain);humGain.connect(master);noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(master);master.connect(ctx.destination);hum.start();noise.start();WORLD_AUDIO={master,hum,humGain,noise,filter,noiseGain};retuneWorldAudio();}catch(e){WORLD_AUDIO=null}}
function stopWorldAudio(){if(!WORLD_AUDIO)return;const w=WORLD_AUDIO;WORLD_AUDIO=null;try{const now=AUDIO_CTX?.currentTime||0;w.master.gain.setTargetAtTime(.0001,now,.07);setTimeout(()=>{try{w.hum.stop();w.noise.stop();w.master.disconnect()}catch(e){}},260)}catch(e){}}
function retuneWorldAudio(){if(!WORLD_AUDIO||!AUDIO_CTX)return;const p=worldAudioProfile(),now=AUDIO_CTX.currentTime;WORLD_AUDIO.hum.frequency.setTargetAtTime(p.hum,now,.8);WORLD_AUDIO.filter.frequency.setTargetAtTime(p.noise,now,.9);WORLD_AUDIO.noiseGain.gain.setTargetAtTime(p.noiseGain,now,.7);WORLD_AUDIO.master.gain.setTargetAtTime(worldAudioTarget(),now,.7)}
function gameSfx(type='ui',strength=1){if(!uiSound||audioPrefs().worldAudio===false)return;const ctx=audioContext();if(!ctx)return;strength=clamp(Number(strength||1),.1,2);const now=ctx.currentTime,vol=(clamp(Number(audioPrefs().effectsVolume??42),0,100)/100)*.12*strength;const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.connect(f);f.connect(g);g.connect(ctx.destination);g.gain.setValueAtTime(Math.max(.0001,vol),now);g.gain.exponentialRampToValueAtTime(.0001,now+.28);if(type==='blaster'){o.type='sawtooth';o.frequency.setValueAtTime(480,now);o.frequency.exponentialRampToValueAtTime(92,now+.16);f.type='bandpass';f.frequency.value=1300}else if(type==='impact'){o.type='square';o.frequency.setValueAtTime(120,now);o.frequency.exponentialRampToValueAtTime(48,now+.21);f.type='lowpass';f.frequency.value=700}else if(type==='door'){o.type='triangle';o.frequency.setValueAtTime(145,now);o.frequency.linearRampToValueAtTime(210,now+.18);f.type='lowpass';f.frequency.value=850}else if(type==='engine'){o.type='sawtooth';o.frequency.setValueAtTime(64,now);o.frequency.linearRampToValueAtTime(128,now+.25);f.type='lowpass';f.frequency.value=520}else if(type==='hyperspace'){o.type='sawtooth';o.frequency.setValueAtTime(90,now);o.frequency.exponentialRampToValueAtTime(820,now+.24);f.type='bandpass';f.frequency.value=1100}else{o.type='sine';o.frequency.value=320;f.type='lowpass';f.frequency.value=1800}o.start(now);o.stop(now+.3)}
window.DeadlockSFX={play:gameSfx,retune:retuneWorldAudio,start:startWorldAudio,stop:stopWorldAudio};
function availableSpeechVoices(){
 try{return (window.speechSynthesis?.getVoices?.()||[]).filter(v=>/^en([_-]|$)/i.test(v.lang||"en"))}catch(e){return []}
}
function speakerNpcId(speaker=""){
 const s=String(speaker).toLowerCase();
 if(/dren/.test(s))return "dren";
 if(/nera|kade/.test(s))return "nera";
 if(/renn/.test(s))return "renn";
 if(/jessa/.test(s))return "jessa";
 if(/unknown|unidentified/.test(s))return "unknown";
 return null;
}
function speechVoiceFor(id){
 const voices=availableSpeechVoices();if(!voices.length)return null;
 const p=NPC_VOICE_PROFILES[id]||NPC_VOICE_PROFILES.unknown;
 // Prefer local/device voices so installed Android TTS packs can keep working offline.
 const local=voices.filter(v=>v.localService!==false);
 const pool=local.length?local:voices;
 return pool[p.index%pool.length]||pool[0]||null;
}
function cleanSpokenText(text=""){
 return String(text).replace(/[⌖⟐⌁⫷◆]+/g," ").replace(/\s+/g," ").trim().slice(0,650);
}
function speakCharacter(speaker,text,{force=false}={}){
 const id=speakerNpcId(speaker);
 if(!id||!uiSound||audioPrefs().characterVoices===false||!("speechSynthesis" in window))return false;
 const clean=cleanSpokenText(text);if(!clean)return false;
 const now=Date.now();
 if(!force&&LAST_SPOKEN.speaker===speaker&&LAST_SPOKEN.text===clean&&now-LAST_SPOKEN.at<2500)return false;
 LAST_SPOKEN={speaker,text:clean,at:now};
 try{
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(clean),p=NPC_VOICE_PROFILES[id]||NPC_VOICE_PROFILES.unknown;
  const voice=speechVoiceFor(id);if(voice)u.voice=voice;
  u.lang=voice?.lang||"en-US";u.pitch=p.pitch;u.rate=p.rate;u.volume=clamp(Number(audioPrefs().voiceVolume??78),0,100)/100;
  u.onstart=()=>{setAmbientDuck(true);setSceneSpeaker(id,true);window.DeadlockActors?.setSpeaking?.(id,true)};
  u.onboundary=e=>{if(e.name==="word"||Number.isFinite(e.charIndex))window.DeadlockActors?.pulseSpeech?.(id,.55+Math.random()*.75)};
  u.onend=u.onerror=()=>{setAmbientDuck(false);setSceneSpeaker(id,false);window.DeadlockActors?.setSpeaking?.(id,false)};
  window.speechSynthesis.speak(u);return true;
 }catch(e){setAmbientDuck(false);return false}
}
window.speechSynthesis?.addEventListener?.("voiceschanged",()=>availableSpeechVoices());
document.addEventListener("pointerdown",unlockGameAudio,{passive:true,once:true});
function weaponSound(id){gameSfx('blaster',id==='blackwake'?1.35:.85);
 if(id==="blackwake"){uiBeep(92,.10,.055,"square");setTimeout(()=>uiBeep(58,.09,.035,"sawtooth"),35)}
 else{uiBeep(id==="luna"?310:270,.075,.04,"square");setTimeout(()=>uiBeep(170,.045,.02,"sawtooth"),25)}
}
function fx(type){
 const f=$("#flashFx");f.className="flash-fx";void f.offsetWidth;f.classList.add(type);
 if(type==="hit"){document.body.classList.remove("screen-shake");void document.body.offsetWidth;document.body.classList.add("screen-shake");setTimeout(()=>document.body.classList.remove("screen-shake"),350)}
}
function gpuPulse(kind="impact"){try{window.DeadlockGPU?.pulse?.(kind)}catch{}}
function floatNumber(text,type="damage",x=window.innerWidth*.74,y=window.innerHeight*.42){
 const el=document.createElement("div");el.className=`float-num ${type}`;el.textContent=text;el.style.left=x+"px";el.style.top=y+"px";$("#floatingLayer").appendChild(el);setTimeout(()=>el.remove(),950)
}
function eventBanner(text){gpuPulse(/CRITICAL|COMBAT|AMBUSH|HOSTILE/i.test(String(text))?"critical":"impact");
 $("#eventText").textContent=text;const b=$("#levelBanner");b.classList.remove("show");void b.offsetWidth;b.classList.add("show");fx("level");uiBeep(660,.08,.03);setTimeout(()=>uiBeep(880,.12,.035),100)
}
function glitch(){const g=$("#screenFx");g.classList.remove("glitch");void g.offsetWidth;g.classList.add("glitch")}
function modeEffect(weapon){
 const m=String(weapon.mode||"").toLowerCase().replace(/[^a-z]/g,"");
 const map={energy:"energy",lethal:"lethal",explosive:"explosive",shieldpunch:"shieldpunch",heavy:"heavy"};
 const fxName=map[m]||"energy",el=$("#modeFx");el.className="mode-fx";void el.offsetWidth;el.classList.add(fxName);
 if(fxName==="explosive"||fxName==="heavy"){document.body.classList.remove("screen-shake");void document.body.offsetWidth;document.body.classList.add("screen-shake");setTimeout(()=>document.body.classList.remove("screen-shake"),420)}
}
function criticalFx(){
 const c=$("#critOverlay");c.classList.remove("show");void c.offsetWidth;c.classList.add("show");navigator.vibrate?.([35,35,80]);uiBeep(980,.07,.04,"square");setTimeout(()=>uiBeep(1320,.12,.035,"sawtooth"),85)
}
function showBountyCinematic(b){
 $("#bountyTarget").textContent=b.name||b.title||"UNKNOWN TARGET";
 $("#bountyStatus").textContent=b.status||"CONTRACT ACCEPTED";
 $("#bountyReward").textContent=money(b.reward||0);
 const el=$("#bountyCinematic");el.classList.add("show");navigator.vibrate?.([30,40,30]);uiBeep(180,.12,.035,"sawtooth");setTimeout(()=>uiBeep(520,.1,.03),120);setTimeout(()=>uiBeep(760,.14,.03),240)
}
function closeBountyCinematic(){ $("#bountyCinematic").classList.remove("show") }
function openWeaponWheel(){
 const enemies=DATA.combat.participants.filter(x=>x.side==="Enemy"&&x.hp>0);
 if(enemies.length&&!selectedCombatTarget)selectedCombatTarget=enemies[0].id;
 $("#weaponWheel").classList.add("open");syncWeaponWheel();navigator.vibrate?.(18);uiBeep(360,.04,.02)
}
function closeWeaponWheel(){ $("#weaponWheel").classList.remove("open") }
function syncWeaponWheel(){
 $$("#weaponWheel [data-wheelweapon]").forEach(b=>b.classList.toggle("selected",b.dataset.wheelweapon===selectedCombatWeapon));
 const w=DATA.weapons.find(x=>x.id===selectedCombatWeapon);if(!w)return;
 $("#wheelSelected").textContent=`${w.name} // ${w.mode}`;
 $("#wheelMode").textContent=`MODE: ${w.mode}`;
}
function cycleSelectedWeaponMode(){
 const w=DATA.weapons.find(x=>x.id===selectedCombatWeapon);if(!w)return;
 let i=w.modes.indexOf(w.mode);w.mode=w.modes[(i+1)%w.modes.length];save();syncWeaponWheel();uiBeep(610,.035,.018)
}
function addNotification(text,type="info"){notificationLog.unshift({text,type,ts:new Date().toLocaleTimeString()});notificationLog=notificationLog.slice(0,12)}

function meter(v,max=100,k=""){return `<div class="meter ${k}"><span style="width:${pct(v,max)}%"></span></div>`}
function statusClass(v,max=100){let p=pct(v,max);return p<25?"danger":p<55?"warn":"good"}
function rollDie(s){return 1+Math.floor(Math.random()*s)}
function parseDice(expr){
  let m=String(expr||"").replace(/\s+/g,"").match(/^(\d*)d(\d+)([+-]\d+)?$/i);
  if(!m)return {rolls:[],mod:0,total:0,expr};
  let count=Number(m[1]||1),sides=Number(m[2]),mod=Number(m[3]||0);
  let rolls=Array.from({length:Math.min(count,30)},()=>rollDie(sides));
  return {rolls,mod,total:rolls.reduce((a,b)=>a+b,0)+mod,expr};
}
function logCombat(text){DATA.combat.log.unshift({ts:new Date().toLocaleTimeString(),text});DATA.combat.log=DATA.combat.log.slice(0,100)}
function logDogfight(text){DATA.dogfight.log.unshift({ts:new Date().toLocaleTimeString(),text});DATA.dogfight.log=DATA.dogfight.log.slice(0,100)}

/* ===== v10.1 FORCED ENCOUNTER ENGINE ===== */
function ensureEncounterState(){
 const c=DATA.combat||(DATA.combat={});
 c.active=!!c.active;c.round=Number(c.round||0);c.turnIndex=Number(c.turnIndex||0);c.log=c.log||[];c.participants=c.participants||[];
 let r=c.participants.find(x=>x.id==="rovan");
 if(!r){r={id:"rovan",name:"Rovan Kes",side:"Ally",initiative:0,initiativeBonus:0,hp:DATA.character.health,hpMax:DATA.character.healthMax,conditions:[]};c.participants.unshift(r)}
 r.name="Rovan Kes";r.side="Ally";r.hpMax=DATA.character.healthMax;r.hp=clamp(Number(DATA.character.health||r.hp||1),0,r.hpMax);r.conditions=r.conditions||[];
 c.forced=!!c.forced;c.source=c.source||null;c.reason=c.reason||null;c.objective=c.objective||null;c.returnPage=c.returnPage||"Story";c.escapeDC=Number(c.escapeDC||12);c.context=c.context||null;c.resolved=!!c.resolved;
 const d=DATA.dogfight||(DATA.dogfight={active:false,round:0,enemyIndex:0,log:[],enemies:[]});
 d.enemies=d.enemies||[];d.log=d.log||[];d.forced=!!d.forced;d.source=d.source||null;d.reason=d.reason||null;d.returnPage=d.returnPage||"Galaxy";d.escapeDC=Number(d.escapeDC||13);d.context=d.context||null;
}
function liveCombatEnemies(){return (DATA.combat?.participants||[]).filter(x=>x.side==="Enemy"&&Number(x.hp||0)>0)}
function liveDogfightEnemies(){return (DATA.dogfight?.enemies||[]).filter(x=>Number(x.hp||0)>0)}
function forcedEncounterPage(){
 if(DATA?.combat?.active&&DATA.combat.forced&&liveCombatEnemies().length)return "Combat";
 if(DATA?.dogfight?.active&&DATA.dogfight.forced&&liveDogfightEnemies().length)return "Dogfight";
 return null;
}
function threatBand(value=0){const d=Number(value||0);return d>=85?"COMBAT IMMINENT":d>=65?"HIGH THREAT":d>=40?"ACTIVE THREAT":"LOW THREAT"}
function threatClass(value=0){const d=Number(value||0);return d>=65?"danger":d>=40?"warn":"good"}
function skillBonus(name){return Math.round(Number(DATA.character.skills?.[name]||50)/10)}
function groundDefense(){return 10+Math.max(0,Math.floor((Number(DATA.character.attributes?.Agility||10)-10)/2))}
function syncRovanCombatant(){
 const c=DATA.combat;let r=c.participants.find(x=>x.id==="rovan");if(!r)return;
 r.hp=clamp(Number(DATA.character.health??r.hp),0,DATA.character.healthMax);r.hpMax=DATA.character.healthMax;r.conditions=r.conditions||[];
}
function encounterEnemyTemplates(source="danger"){
 const table={
  rival_hunter:["Rival Hunter","Hunter Gunhand","Contract Spotter"],
  patrol_scan:["Security Enforcer","Patrol Trooper","Patrol Specialist"],
  target_capture:["Target Escort","Armed Lookout","Recovery Blocker"],
  local_ambush:["Local Gunman","Ambusher","Street Enforcer"],
  player_attack:["Armed Opposition","Hostile Gunhand","Security Response"],
  danger:["Hostile Gunman","Armed Pursuer","Contract Muscle"]
 };
 return table[source]||table.danger;
}
function makeGroundEnemies(source="danger",danger=50,count=null){
 const names=encounterEnemyTemplates(source),n=count??(danger>=80?3:danger>=55?2:1),out=[];
 for(let i=0;i<n;i++){
  const threat=clamp(1+Math.floor(danger/25)+(i===0&&danger>=70?1:0),1,5);
  out.push({id:uid("enemy"),name:names[i%names.length]+(i>=names.length?` ${i+1}`:""),side:"Enemy",initiative:0,initiativeBonus:Math.max(0,threat-2),hp:22+threat*8,hpMax:22+threat*8,conditions:[],defense:10+threat,attackMod:1+threat,damage:threat>=4?"1d10+3":threat>=2?"1d8+2":"1d6+1",threat});
 }
 return out;
}
function startForcedCombat(ctx={}){
 ensureEncounterState();const c=DATA.combat;if(c.active&&liveCombatEnemies().length)return false;
 const danger=clamp(Number(ctx.danger??DATA.story?.danger??50),0,100),source=ctx.source||"danger";
 syncRovanCombatant();const rovan=c.participants.find(x=>x.id==="rovan");
 c.participants=[rovan,...(ctx.enemies||makeGroundEnemies(source,danger,ctx.count))];
 c.participants.forEach(p=>p.initiative=rollDie(20)+Number(p.initiativeBonus||0));c.participants.sort((a,b)=>b.initiative-a.initiative);
 c.active=true;c.forced=true;c.resolved=false;c.round=1;c.turnIndex=0;c.source=source;c.reason=ctx.reason||"Hostile contact has escalated beyond dialogue.";c.objective=ctx.objective||"Neutralize the threat or break contact.";c.returnPage=ctx.returnPage||"Story";c.escapeDC=Number(ctx.escapeDC||12)+Math.floor(danger/30);c.context=ctx;
 selectedCombatTarget=liveCombatEnemies()[0]?.id||null;
 DATA.story.danger=clamp(Math.max(Number(DATA.story.danger||0),danger)+5,0,100);
 storyPush("system","TACTICAL ALERT",`COMBAT INITIATED — ${c.reason}`);storyPush("narration","Narrator",ctx.narration||"Weapons clear holsters and the situation goes loud. Deadlock no longer has the luxury of treating this as conversation.");
 logCombat(`FORCED ENCOUNTER: ${c.reason}`);addNotification(`Combat initiated: ${c.reason}`,"danger");eventBanner("COMBAT INITIATED");navigator.vibrate?.([60,35,80]);save();if(DATA.settings.cinematicSequences!==false)window.DeadlockCinematics?.play?.("combat",{reason:c.reason});
 setTimeout(()=>{render("Combat");autoEnemyTurns()},80);return true;
}
function finishForcedCombat(outcome="victory"){
 const c=DATA.combat,ctx=c.context||{},returnPage=c.returnPage||"Story";
 c.active=false;c.forced=false;c.resolved=true;c.turnIndex=0;c.round=0;
 if(outcome==="victory"){
  DATA.story.danger=clamp(Number(DATA.story.danger||0)-14,0,100);addConsequence("Hostile encounter won",c.reason||"Threat neutralized.","good",{source:c.source});storyPush("narration","Narrator","The last immediate threat drops out of the fight. Deadlock has control of the scene again.");
  if(ctx.contractId&&ctx.source==="target_capture"){
   const contract=contractById(ctx.contractId),target=targetById(contract?.targetId);if(contract&&Number(contract.progress||0)>=90){contract.progress=100;if(target)target.status=target.status?.includes("Wanted Alive")?"Secured Alive":"Secured";addFlag(`${contract.id.toUpperCase()}_TARGET_SECURED`);DATA.story.objective=contractStageInfo(contract).goal;DATA.story.choices=missionChoices(contract);storyPush("system","Mission Guidance",`${contract.title}: target secured through combat. Turn-in unlocked.`)}
  }
 }else if(outcome==="escape"){
  DATA.story.danger=clamp(Number(DATA.story.danger||0)+4,0,100);addConsequence("Broke contact",`Deadlock escaped ${c.reason||"the encounter"}, but the threat remains active.`,"warn",{source:c.source});storyPush("narration","Narrator","Deadlock breaks line of fire and gets clear, but the opposition is still out there.");
 }else{
  DATA.character.health=Math.max(1,Math.round(DATA.character.healthMax*.15));syncRovanCombatant();DATA.story.danger=clamp(Number(DATA.story.danger||0)+16,0,100);addConsequence("Forced retreat",`Deadlock was overwhelmed and escaped injured.`,"danger",{source:c.source});storyPush("narration","Narrator","The fight turns against Deadlock. An emergency retreat keeps the campaign alive, but the price is blood, lost momentum, and a hotter situation.");
 }
 window.DeadlockPolish?.combatOutcome(ctx,outcome);window.DeadlockPort?.combatOutcome(ctx,outcome);
 c.context=null;save();eventBanner(outcome==="victory"?"THREAT NEUTRALIZED":outcome==="escape"?"CONTACT BROKEN":"FORCED RETREAT");if(DATA.settings.cinematicSequences!==false)window.DeadlockCinematics?.play?.(outcome==="victory"?"victory":"defeat",{reason:c.reason});render(returnPage);
}
function checkCombatResolution(){
 if(!DATA.combat.active)return true;
 if(Number(DATA.character.health||0)<=0){finishForcedCombat("defeat");return true}
 if(!liveCombatEnemies().length){finishForcedCombat("victory");return true}
 return false;
}
function enemyCombatAttack(enemy){
 if(!enemy||enemy.hp<=0||!DATA.combat.active)return;
 const natural=rollDie(20),attack=natural+Number(enemy.attackMod||1),def=groundDefense();let dmg=0;
 sceneActionFx("enemy-shot",enemy.id);if(natural===20||attack>=def){dmg=parseDice(enemy.damage||"1d6+1").total;const r=DATA.combat.participants.find(x=>x.id==="rovan");const guarded=r?.conditions?.includes("Guarded");if(guarded){dmg=Math.max(1,Math.floor(dmg/2));r.conditions=r.conditions.filter(x=>x!=="Guarded")};DATA.character.health=clamp(DATA.character.health-dmg,0,DATA.character.healthMax);if(r)r.hp=DATA.character.health;fx("hit");floatNumber("-"+dmg,"damage");logCombat(`${enemy.name} attack ${attack} vs DEF ${def}: HIT for ${dmg}.`);addNotification(`${enemy.name} hit Rovan for ${dmg}.`,"danger")}
 else logCombat(`${enemy.name} attack ${attack} vs DEF ${def}: MISS.`);
}
function advanceCombatTurn(){
 const c=DATA.combat;if(!c.active||checkCombatResolution())return;
 c.turnIndex++;if(c.turnIndex>=c.participants.length){c.turnIndex=0;c.round++}
 save();setTimeout(()=>autoEnemyTurns(),120);
}
function autoEnemyTurns(){
 const c=DATA.combat;if(!c.active||checkCombatResolution())return;
 const current=c.participants[c.turnIndex];if(!current||current.hp<=0){advanceCombatTurn();return}
 if(current.side!=="Enemy"){save();if(currentPage!=="Combat")render("Combat");else render("Combat");return}
 enemyCombatAttack(current);if(checkCombatResolution())return;advanceCombatTurn();
}
function combatPlayerGuard(){
 const c=DATA.combat,current=c.participants[c.turnIndex];if(!c.active||current?.id!=="rovan")return toast("Wait for Rovan's turn");const r=c.participants.find(x=>x.id==="rovan");if(!r.conditions.includes("Guarded"))r.conditions.push("Guarded");logCombat("Rovan takes cover. Next incoming hit is reduced.");DATA.character.stamina=clamp(Number(DATA.character.stamina||0)+3,0,DATA.character.staminaMax);save();advanceCombatTurn();
}
function attemptCombatFlee(){
 const c=DATA.combat,current=c.participants[c.turnIndex];if(!c.active||current?.id!=="rovan")return toast("Wait for Rovan's turn");const total=rollDie(20)+skillBonus("Survival"),dc=Number(c.escapeDC||13);logCombat(`Break contact: ${total} vs DC ${dc}.`);if(total>=dc){finishForcedCombat("escape");return}addNotification("Escape failed — hostiles get another opening.","danger");DATA.story.danger=clamp(Number(DATA.story.danger||0)+3,0,100);save();advanceCombatTurn();
}
function hostileTravelEncounter(e){return ["rival_hunter","pirate_probe"].includes(e?.id)}
function makeDogfightEnemies(source="travel",risk=40){
 const n=risk>=65?3:risk>=35?2:1,names=source==="rival_hunter"?["Hunter Interceptor","Contract Wingman","Pursuit Craft"]:["Pirate Interceptor","Raider Wingman","Cutthroat Fighter"],out=[];
 for(let i=0;i<n;i++){const threat=clamp(1+Math.floor(risk/25),1,5),hp=24+threat*10;out.push({id:uid("ship"),name:names[i%names.length],hp,hpMax:hp,attackMod:1+threat,damage:threat>=4?"1d12+4":"1d10+2",threat})}return out;
}
function startForcedDogfight(ctx={}){
 ensureEncounterState();const d=DATA.dogfight;if(d.active&&liveDogfightEnemies().length)return false;const risk=clamp(Number(ctx.risk??ctx.danger??50),0,100);
 d.active=true;d.forced=true;d.round=1;d.enemyIndex=0;d.source=ctx.source||"travel";d.reason=ctx.reason||"Hostile craft have weapons lock.";d.returnPage=ctx.returnPage||"Galaxy";d.escapeDC=Number(ctx.escapeDC||12)+Math.floor(risk/30);d.context=ctx;d.enemies=ctx.enemies||makeDogfightEnemies(d.source,risk);
 logDogfight(`FORCED DOGFIGHT: ${d.reason}`);storyPush("system","Raven Tactical",`DOGFIGHT INITIATED — ${d.reason}`);addNotification(`Dogfight initiated: ${d.reason}`,"danger");eventBanner("DOGFIGHT");navigator.vibrate?.([70,30,70]);save();if(DATA.settings.cinematicSequences!==false)window.DeadlockCinematics?.play?.("combat",{reason:d.reason});setTimeout(()=>render("Dogfight"),60);return true;
}
function enemyDogfightVolley(){
 const d=DATA.dogfight,s=DATA.ship;if(!d.active)return;
 for(const e of liveDogfightEnemies()){
  sceneActionFx("enemy-flyby",e.id);
  const attack=rollDie(20)+Number(e.attackMod||1),evade=12+Math.round(Number(DATA.character.skills?.Piloting||50)/25);if(attack<evade){logDogfight(`${e.name} attack ${attack} vs EVADE ${evade}: MISS.`);continue}
  let dmg=parseDice(e.damage||"1d10+2").total;if(s.shields>0){const absorbed=Math.min(s.shields,dmg);s.shields-=absorbed;dmg-=absorbed}if(dmg>0)s.hull=clamp(s.hull-dmg,0,s.hullMax);logDogfight(`${e.name} scores a hit. Raven shields ${s.shields}/${s.shieldsMax}, hull ${s.hull}/${s.hullMax}.`);fx("hit");sceneActionFx("ship-hit");
 }
 if(s.hull<=0){finishForcedDogfight("defeat");return}d.round++;save();render("Dogfight");
}
function finishForcedDogfight(outcome="victory"){
 const d=DATA.dogfight,ctx=d.context||{},returnPage=d.returnPage||"Galaxy";d.active=false;d.forced=false;
 const g=galaxyState();if(ctx.travelEncounter&&g.transit)g.transit.encounterResolved=true;
 if(outcome==="victory"){DATA.story.danger=clamp(Number(DATA.story.danger||0)-8,0,100);storyPush("narration","Narrator","The last hostile craft falls off the Raven's scope. The route is clear again.");addConsequence("Dogfight won",d.reason||"Hostile craft neutralized.","good")}
 else if(outcome==="escape"){DATA.story.danger=clamp(Number(DATA.story.danger||0)+3,0,100);storyPush("narration","Narrator","The Raven breaks weapons lock and disappears back into the route.");addConsequence("Broke pursuit",d.reason||"Hostiles left behind.","warn")}
 else{DATA.ship.hull=Math.max(1,Math.round(DATA.ship.hullMax*.2));DATA.story.danger=clamp(Number(DATA.story.danger||0)+14,0,100);storyPush("narration","Narrator","The Raven takes a brutal beating and limps clear under emergency power. The route survives, but the ship needs attention.");addConsequence("Raven forced retreat","Ship combat ended with heavy damage.","danger")}
 d.context=null;save();eventBanner(outcome==="victory"?"SPACE CLEAR":outcome==="escape"?"PURSUIT BROKEN":"RAVEN DAMAGED");if(DATA.settings.cinematicSequences!==false)window.DeadlockCinematics?.play?.(outcome==="victory"?"victory":"defeat",{reason:d.reason});render(returnPage);
}
function attemptDogfightEscape(){
 const d=DATA.dogfight,total=rollDie(20)+skillBonus("Piloting"),dc=Number(d.escapeDC||13);logDogfight(`Break pursuit: ${total} vs DC ${dc}.`);if(total>=dc)return finishForcedDogfight("escape");addNotification("Could not shake pursuit.","danger");enemyDogfightVolley();
}

function migrateOfflineData(current,defaults){
 if(!current)return defaults;
 current.story=current.story||structuredClone(defaults.story);
 current.settings=current.settings||structuredClone(defaults.settings||{});
 for(const [k,v] of Object.entries(defaults.settings||{}))if(current.settings[k]===undefined)current.settings[k]=structuredClone(v);
 current.settings.shipScene=current.settings.shipScene||"cockpit";
 if(current.settings.cinematicSequences===undefined)current.settings.cinematicSequences=true;
 if(current.settings.actorRigs===undefined)current.settings.actorRigs=true;
 if(current.settings.worldFx===undefined)current.settings.worldFx=true;
 const s=current.story, ds=defaults.story;

 if(s.provider==="local")s.provider="offline";
 s.offlineFirst=true;
 s.offlineTables=s.offlineTables||structuredClone(ds.offlineTables);
 s.director=s.director||structuredClone(ds.director);
 s.director.activeThreads=(s.director.activeThreads&&s.director.activeThreads.length)?s.director.activeThreads:structuredClone(ds.director.activeThreads);

 s.npcs=s.npcs||[];
 for(const dn of ds.npcs||[]){
   let n=s.npcs.find(x=>x.id===dn.id);
   if(!n){s.npcs.push(structuredClone(dn));continue}
   n.mood=n.mood||structuredClone(dn.mood);
   n.memories=n.memories||structuredClone(dn.memories);
   n.speech=n.speech||structuredClone(dn.speech);
   n.portrait=n.portrait||dn.portrait||`assets/npc_${n.id}.svg`;
   n.portraitType=n.portraitType||dn.portraitType||"Abstract holographic dossier — appearance not canon";
 }

 if(!Array.isArray(s.campaignMemory)||!s.campaignMemory.length)s.campaignMemory=structuredClone(ds.campaignMemory);
 if(!Array.isArray(s.gmNotes)||!s.gmNotes.length)s.gmNotes=structuredClone(ds.gmNotes);
 if(!Array.isArray(s.choices)||!s.choices.length)s.choices=structuredClone(ds.choices);
 if(!Array.isArray(s.history))s.history=[];

 // v9.2 canon cleanup for saves migrated from earlier dashboard builds.
 const blackwake=(current.weapons||[]).find(w=>w.id==="blackwake");
 if(blackwake&&Array.isArray(blackwake.features)){
   blackwake.features=blackwake.features.filter(f=>f!=="Tracker removed");
 }
 const legacyPlaceIds=new Set(["tatooine","nal_hutta","coruscant"]);
 const legacyPlaces=(current.locations||[]).filter(l=>legacyPlaceIds.has(l.id));
 const legacyLooksUnedited=legacyPlaces.length>0 && legacyPlaces.every(l=>
   ["Tatooine","Nal Hutta","Coruscant"].includes(l.name)
 );
 if(legacyLooksUnedited){
   current.locations=structuredClone(defaults.locations);
   for(const m of current.missions||[]){
     if(legacyPlaceIds.has(m.locationId))m.locationId="unknown";
     if(m.id==="marr_mission")m.notes="Track the recovery contract and secure Marr alive. Current location is not yet established.";
     if(m.id==="kade_mission")m.notes="Contract details remain operationally sensitive. Current location is not yet established.";
   }
 }
 const rifleFact="Rovan does not currently own a rifle; the tracker was removed from his old rifle before that rifle was returned to Dren Voss.";
 if(!s.campaignMemory.includes(rifleFact))s.campaignMemory.push(rifleFact);
 current.meta=current.meta||{};
 current.holonet=current.holonet||structuredClone(defaults.holonet);
 current.holonet.transmissions=current.holonet.transmissions||structuredClone(defaults.holonet.transmissions);
 current.holonet.route=current.holonet.route||structuredClone(defaults.holonet.route);
 current.ship=current.ship||structuredClone(defaults.ship);
 current.ship.visualAsset="assets/raven_dedicated.jpg";
 current.ship.visualNote="Dedicated cinematic Raven image; diagnostic schematic remains interactive separately.";
 const drenNpc=(current.story?.npcs||[]).find(n=>n.id==="dren");
 if(drenNpc){drenNpc.portrait="assets/contact_dren.jpg";drenNpc.portraitType="Established Holonet portrait from user-approved reference";}
 s.interruptions=s.interruptions||[];
 s.consequences=s.consequences||structuredClone(defaults.story.consequences);
 s.gmState=s.gmState||structuredClone(defaults.story.gmState||{version:2,recentNpcLines:[],recentStageBeats:[],recentTopics:[],npcTurns:{},lastAnalysis:null});
 s.activeContractId=s.activeContractId||"marr";
 const marrChoice=(s.choices||[]).find(c=>/marr/i.test(c.label||""));
 if(marrChoice){marrChoice.contractId="marr";marrChoice.actionType=marrChoice.actionType||"contract_review";}
 current.meta.version="17.0.0";
 window.ApexEngine?.ensure(current);
 return current;
}

let foldResizeTimer=null;
function viewportSize(){
 const vv=window.visualViewport;
 return {w:Math.round(vv?.width||window.innerWidth),h:Math.round(vv?.height||window.innerHeight)};
}
function detectFoldLayout(){
 const {w,h}=viewportSize(),ratio=w/Math.max(1,h);
 const enabled=DATA?.settings?.foldOptimization!==false;
 const unfolded=enabled && w>=680 && w<=1100 && ratio>=0.78 && ratio<=1.42;
 const flexMode=enabled && w>=620 && h<=560 && ratio>=1.15;
 document.documentElement.style.setProperty("--vvw",`${w}px`);
 document.documentElement.style.setProperty("--vvh",`${h}px`);
 document.documentElement.style.setProperty("--hinge-gutter",`${Number(DATA?.settings?.hingeGutter||22)}px`);
 document.body.classList.toggle("fold-unfolded",unfolded&&!flexMode);
 document.body.classList.toggle("fold-flex",flexMode);
 const badge=$("#layoutBadge");
 if(badge){badge.textContent=flexMode?"FLEX":unfolded?"UNFOLDED":"PHONE";badge.title=`Viewport ${w}×${h}`}
 return {w,h,unfolded,flexMode};
}
function handleFoldResize(){
 document.body.classList.add("fold-transitioning");
 clearTimeout(foldResizeTimer);
 foldResizeTimer=setTimeout(()=>{detectFoldLayout();document.body.classList.remove("fold-transitioning")},140);
}
window.addEventListener("resize",handleFoldResize,{passive:true});
window.addEventListener("orientationchange",handleFoldResize,{passive:true});
window.visualViewport?.addEventListener("resize",handleFoldResize,{passive:true});


function galaxyLocation(id){return GALAXY?.locations?.find(x=>x.id===id)||null}
function galaxySystem(id){return GALAXY?.systems?.find(x=>x.id===id)||null}
function galaxySystemForLocation(id){const l=galaxyLocation(id);return l?galaxySystem(l.systemId):null}
function galaxyState(){return DATA.galaxyState}
function ensureGalaxyState(){
 const known=(GALAXY?.locations||[]).filter(x=>x.known).map(x=>x.id);
 const home=GALAXY?.home?.locationId||"blackglass_station";
 DATA.galaxyState=DATA.galaxyState||{version:1,homeId:home,currentLocationId:home,selectedLocationId:home,phase:"docked",route:null,transit:null,currentSiteId:"blackglass_hq",discovered:known,visited:[home],scanIntel:{},travelLog:[]};
 const g=DATA.galaxyState;g.version=1;g.homeId=home;g.discovered=[...new Set([...(g.discovered||[]),...known,home])];g.visited=[...new Set(g.visited||[home])];g.selectedLocationId=g.selectedLocationId||g.currentLocationId||home;g.phase=g.phase||"idle";g.scanIntel=g.scanIntel||{};g.travelLog=g.travelLog||[];
 DATA.locations=DATA.locations||[];
 for(const l of GALAXY?.locations||[]){
  const sys=galaxySystem(l.systemId);let existing=DATA.locations.find(x=>x.id===l.id);
  if(!existing)DATA.locations.push({id:l.id,name:l.name,region:sys?.region||sys?.name||"Unknown",x:sys?.x??50,y:sys?.y??50,known:g.discovered.includes(l.id),notes:l.description});
  else if(existing.id!=="unknown"){existing.x=sys?.x??existing.x;existing.y=sys?.y??existing.y;if(g.discovered.includes(l.id))existing.known=true}
 }
}
function galaxyRouteEdges(id){return (GALAXY?.routes||[]).filter(r=>r.a===id||r.b===id).map(r=>({to:r.a===id?r.b:r.a,route:r}))}
function galaxyPath(from,to){
 if(!from||!to)return null;if(from===to)return {nodes:[from],routes:[],distance:0,fuel:0,risk:0,time:0};
 const dist=new Map([[from,0]]),prev=new Map(),used=new Set();
 while(true){let cur=null,best=Infinity;for(const [k,v] of dist)if(!used.has(k)&&v<best){cur=k;best=v}if(!cur)break;if(cur===to)break;used.add(cur);for(const e of galaxyRouteEdges(cur)){const nv=best+Number(e.route.distance||1);if(nv<(dist.get(e.to)??Infinity)){dist.set(e.to,nv);prev.set(e.to,{from:cur,route:e.route})}}}
 if(!dist.has(to))return null;let nodes=[to],routes=[];let c=to;while(c!==from){const p=prev.get(c);if(!p)break;routes.unshift(p.route);c=p.from;nodes.unshift(c)}
 return {nodes,routes,distance:Math.round(routes.reduce((a,r)=>a+Number(r.distance||0),0)),fuel:Math.round(routes.reduce((a,r)=>a+Number(r.fuel||0),0)),risk:Math.min(95,Math.round(routes.reduce((a,r)=>a+Number(r.risk||0),0)/Math.max(1,routes.length))),time:routes.reduce((a,r)=>a+Number(r.time||1),0)};
}
function selectedGalaxyLocation(){return galaxyLocation(galaxyState()?.selectedLocationId)||galaxyLocation(galaxyState()?.homeId)}
function currentGalaxyLocation(){return galaxyLocation(galaxyState()?.currentLocationId)}
function locationHeroAsset(loc){
 if(!loc)return null;
 if(loc.id==="blackglass_station")return assetEntry("blackglass","exterior");
 const key=loc.asset;return ASSET_MANIFEST?.locations?.[key]?.hero||null;
}
function locationHero(loc){return imgTag(locationHeroAsset(loc),loc?.name||"Location",assetEntry("effects","starfield"),"location-hero-img")}
function plotLivingRoute(destinationId){
 const g=galaxyState(),from=g.currentLocationId||g.homeId,dest=galaxyLocation(destinationId);if(!dest)return toast("Destination unavailable");
 const path=galaxyPath(from,destinationId);if(!path)return toast("No mapped route from current position");
 g.selectedLocationId=destinationId;g.route={originId:from,destinationId,path:path.nodes,distance:path.distance,fuelCost:path.fuel,risk:path.risk,time:path.time,phase:"plotted"};g.phase="plotted";
 if(DATA.holonet){const sys=galaxySystemForLocation(destinationId);DATA.holonet.route={status:"CALCULATED",originName:galaxyLocation(from)?.name||"The Raven",destinationId,destinationName:dest.name,quality:Math.max(35,100-path.risk),risk:path.risk,points:(path.nodes||[]).map(id=>{const s=galaxySystemForLocation(id);return [s?.x??50,s?.y??50]})}}
 g.travelLog.unshift({ts:new Date().toLocaleString(),text:`Course plotted: ${galaxyLocation(from)?.name||"Current Position"} → ${dest.name}. ${path.fuel} fuel // ${path.risk}% risk.`});g.travelLog=g.travelLog.slice(0,40);save();storyCinematic("hyperspace",`${dest.name} // route ready`);render("Galaxy");
}
function chooseTravelEncounter(risk=0){
 if(Math.random()*100>Math.max(18,risk))return null;
 const pool=GALAXY?.encounters||[];const weighted=[];for(const e of pool)for(let i=0;i<Number(e.weight||1);i++)weighted.push(e);return structuredClone(weighted[Math.floor(Math.random()*weighted.length)]||null);
}
function beginLivingTravel(){
 const g=galaxyState(),r=g.route;if(!r||r.phase!=="plotted")return toast("Plot a route first");
 if(DATA.ship.fuel<r.fuelCost)return toast(`Need ${r.fuelCost} fuel`);
 DATA.ship.fuel-=r.fuelCost;r.phase="transit";g.phase="transit";g.transit={progress:0,encounter:chooseTravelEncounter(r.risk),encounterResolved:false};if(DATA.settings.cinematicSequences!==false)window.DeadlockCinematics?.play?.("departure",{destination:galaxyLocation(r.destinationId)?.name});gameSfx('engine',1.0);
 g.travelLog.unshift({ts:new Date().toLocaleString(),text:`The Raven departed for ${galaxyLocation(r.destinationId)?.name}.`});storyPush("system","Navigation",`The Raven departs ${galaxyLocation(r.originId)?.name||"the current position"} for ${galaxyLocation(r.destinationId)?.name}.`);save();eventBanner("HYPERSPACE");render("Galaxy");
}
function resolveTravelEncounter(mode){
 const g=galaxyState(),t=g.transit,e=t?.encounter;if(!t||!e)return;
 const skill=mode==="evade"?"Piloting":mode==="investigate"?"Investigation":"Survival",score=skillBonus(skill),total=rollDie(20)+score,dc=10+Math.round(Number(e.danger||0)/4),ok=mode==="ignore"?!hostileTravelEncounter(e):total>=dc;
 if(hostileTravelEncounter(e)&&(!ok||mode==="ignore")){
  g.travelLog.unshift({ts:new Date().toLocaleString(),text:`${e.name}: contact escalated to weapons lock.`});DATA.story.danger=clamp(Number(DATA.story.danger||0)+6,0,100);save();startForcedDogfight({source:e.id,risk:Math.max(Number(g.route?.risk||0),Number(e.danger||0)*5),reason:`${e.name} has the Raven under weapons lock.`,returnPage:"Galaxy",travelEncounter:true});return render("Dogfight")
 }
 if(!ok){DATA.story.danger=clamp(Number(DATA.story.danger||0)+4,0,100);if(mode==="evade")DATA.ship.shields=clamp(DATA.ship.shields-8,0,DATA.ship.shieldsMax);g.travelLog.unshift({ts:new Date().toLocaleString(),text:`${e.name}: ${skill} check ${total} vs ${dc} failed.`})}
 else g.travelLog.unshift({ts:new Date().toLocaleString(),text:`${e.name}: ${mode} resolved (${total}${mode==="ignore"?"":" vs "+dc}).`});
 storyPush("narration","Narrator",ok?`The Raven clears the ${e.name.toLowerCase()} without losing the route.`:`The ${e.name.toLowerCase()} complicates the crossing before the Raven breaks free.`);t.encounterResolved=true;save();render("Galaxy")
}
function continueLivingTravel(){
 const g=galaxyState(),t=g.transit,r=g.route;if(!t||!r||r.phase!=="transit")return;
 if(t.encounter&&!t.encounterResolved)return toast("Resolve the transit event first");
 t.progress=Math.min(100,Number(t.progress||0)+50);if(t.progress<100){g.travelLog.unshift({ts:new Date().toLocaleString(),text:`Transit ${t.progress}% — route stable.`});if(DATA.settings.cinematicSequences!==false)window.DeadlockCinematics?.play?.("hyperspace",{destination:galaxyLocation(r.destinationId)?.name});gameSfx('hyperspace',.85);save();return render("Galaxy")}
 r.phase="arrived";g.phase="orbit";g.currentLocationId=r.destinationId;if(DATA.settings.cinematicSequences!==false)window.DeadlockCinematics?.play?.("arrival",{destination:galaxyLocation(r.destinationId)?.name});g.selectedLocationId=r.destinationId;g.discovered=[...new Set([...(g.discovered||[]),r.destinationId])];g.visited=[...new Set([...(g.visited||[]),r.destinationId])];const l=galaxyLocation(r.destinationId);const dl=DATA.locations.find(x=>x.id===r.destinationId);if(dl)dl.known=true;g.travelLog.unshift({ts:new Date().toLocaleString(),text:`Arrived in orbit: ${l?.name}.`});storyPush("system","Navigation",`The Raven arrives in orbit of ${l?.name}.`);g.transit=null;save();storyCinematic("hyperspace",`${l?.name} // ARRIVAL`);render("Galaxy");
}
function commitGalaxyLocationToStory(){const l=currentGalaxyLocation();if(!l)return;DATA.story.location=l.name;storyPush("narration","Narrator",`The current operation is now established at ${l.name}.`);save();toast(`${l.name} committed to Story`);render("Story")}
function performLocalAction(action){
 if(galaxyState().phase==="transit")return toast("Finish the transit encounter and arrival before local operations.");
 const g=galaxyState(),l=currentGalaxyLocation();if(!l)return toast("No current destination");
 if(action==="scan"){g.scanIntel[l.id]=(g.scanIntel[l.id]||0)+1;g.travelLog.unshift({ts:new Date().toLocaleString(),text:`Orbital scan completed at ${l.name}.`});storyPush("system","The Raven",`Orbital scan of ${l.name} completed. Traffic, local services, and approach vectors updated.`)}
 if(action==="dock"){g.phase=l.type.includes("Station")?"docked":"surface";g.currentSiteId=l.id==="blackglass_station"?"blackglass_hq":null;if(DATA.settings.cinematicSequences!==false)window.DeadlockCinematics?.play?.(l.type.includes("Station")?"docking":"landing",{destination:l.name});g.travelLog.unshift({ts:new Date().toLocaleString(),text:`${l.landing||"Approach"} completed at ${l.name}.`});storyPush("system","Navigation",`${l.landing||"Landing"} completed at ${l.name}.`)}
 if(action==="hq")return render("HQ");
 if(action==="story")return commitGalaxyLocationToStory();
 save();render("Galaxy");
}
function startLocalSite(siteName){return window.DeadlockWorld?.previewSite(siteName)}
function enterLocalSite(siteName){
 const g=galaxyState(),l=currentGalaxyLocation();if(!l)return toast("No current location");if(!["docked","surface"].includes(g.phase))return toast(`Dock or land at ${l.name} first`);
 DATA.story.sceneNumber=Number(DATA.story.sceneNumber||1)+1;DATA.story.currentSceneId=uid("scene");DATA.story.location=`${l.name} — ${siteName}`;const localContract=contractById(DATA.story.activeContractId);DATA.story.objective=localContract?contractStageInfo(localContract).goal:`Operate at ${siteName}.`;
 storyPush("narration","Narrator",`The Raven's local operation shifts to ${siteName} on ${l.name}. The location is now part of the active scene.`);g.travelLog.unshift({ts:new Date().toLocaleString(),text:`Local operation opened: ${l.name} / ${siteName}.`});
 const d=clamp(Number(l.danger||0),0,100),ambushChance=d<35?0:d<55?.12:d<75?.24:.38;if(l.id!==g.homeId&&chance(ambushChance)){save();startForcedCombat({source:"local_ambush",danger:d,reason:`Hostile contact at ${siteName}, ${l.name}.`,objective:`Survive the ambush at ${siteName} or break contact.`,returnPage:"Story",narration:`The moment Deadlock enters ${siteName}, movement turns into muzzle flashes. Someone was waiting.`});return render("Combat")}
 save();eventBanner(String(siteName).toUpperCase());render("Story")
}
function handleWorldService(service){
 if(window.DeadlockWorld?.service(service))return;
 const s=String(service||"").toLowerCase();if(/bounty/.test(s))return render("Bounties");if(/repair|parts|salvage/.test(s))return render("Ship");if(/black market|market|trade|broker/.test(s))return render("Inventory");if(/medical/.test(s))return render("Character");if(/research|information|forged|smuggler/.test(s)){const l=currentGalaxyLocation();DATA.story.objective=`Gather local intelligence on ${l?.name||"the current world"}.`;storyPush("system","Local Network",`Deadlock opens a local intelligence channel through ${service}.`);save();return render("Story")};return toast(`${service}: local hook ready`)
}
function hqSite(id){return GALAXY?.hq?.sites?.find(x=>x.id===id)||null}
function hqSiteAsset(site){if(!site)return assetEntry("blackglass","hq");const key=site.asset?.replace("blackglass_","")||"hq";return assetEntry("blackglass",key)||assetEntry("blackglass","hq")}
function handleHqSite(id){const g=galaxyState();g.currentSiteId=id;save();render("HQ")}
function handleHqAction(action){
 if(action==='Open Syndicate command')return render('Syndicate');
 const a=String(action).toLowerCase();if(/contract/.test(a))return render("Contracts");if(/target/.test(a))return render("Targets");if(/journal/.test(a))return render("Journal");if(/identity/.test(a))return render("Identities");if(/gear/.test(a))return render("Gear");if(/diagnostic|repair|raven/.test(a))return render("Ship");if(/contact|call/.test(a))return render("Holonet");if(/galaxy|intel/.test(a))return render("Galaxy");return toast(action)
}
function galaxyMapSvg(){
 const g=galaxyState(),route=g.route?.path||[];
 const routeIds=new Set(route);const lines=(GALAXY?.routes||[]).map(r=>{const a=galaxySystemForLocation(r.a),b=galaxySystemForLocation(r.b);return `<line x1="${a?.x}" y1="${a?.y}" x2="${b?.x}" y2="${b?.y}" class="galaxy-link ${routeIds.has(r.a)&&routeIds.has(r.b)?"active":""}"/>`}).join("");
 const nodes=(GALAXY?.locations||[]).map(l=>{const sys=galaxySystemForLocation(l.id),disc=g.discovered.includes(l.id),current=g.currentLocationId===l.id,selected=g.selectedLocationId===l.id,home=l.id===g.homeId;return `<button class="galaxy-node ${disc?"known":"unknown"} ${current?"current":""} ${selected?"selected":""} ${home?"home":""}" style="left:${sys?.x}%;top:${sys?.y}%" data-galaxy-node="${l.id}" title="${esc(l.name)}"><i></i><span>${disc?esc(l.name):"UNKNOWN"}</span></button>`}).join("");
 return `<div class="living-galaxy-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${nodes}<div class="galaxy-map-legend"><span><i class="legend-dot home"></i>HQ</span><span><i class="legend-dot current"></i>Raven</span><span><i class="legend-dot unknown"></i>Unverified</span></div></div>`
}

async function load(){
 const [defaults,galaxy,assets,scenes]=await Promise.all([fetch("character-data.json").then(r=>r.json()),fetch("galaxy-data.json").then(r=>r.json()),fetch("asset-manifest.json").then(r=>r.json()),fetch("scene-data.json").then(r=>r.json())]);
 GALAXY=galaxy;ASSET_MANIFEST=assets;SCENES=scenes;
 const nativeLocal=await window.DeadlockNative?.readSave?.(STORAGE_KEY);
 const local=nativeLocal||localStorage.getItem(STORAGE_KEY);
 let restored=defaults;try{if(local){restored=JSON.parse(local);if(!validCampaignSave(restored))throw new Error("Invalid save");}}catch(err){try{localStorage.setItem(STORAGE_KEY+"_recovery",local||"")}catch{}window.DEADLOCK_RECOVERED=true;restored=structuredClone(defaults);}
 DATA=migrateOfflineData(restored,defaults);ensureGalaxyState();ensureMissionLoopState();ensureEncounterState();
 uiSound=DATA.settings.sound!==false;
 save();document.body.classList.toggle("compact",!!DATA.settings.compact);document.body.classList.toggle("no-anim",DATA.settings.animations===false);document.body.dataset.graphics=DATA.settings.graphicsQuality||"high";window.DeadlockGPU?.setEnabled?.(DATA.settings.gpuBackdrop!==false);window.DeadlockHUD?.setEnabled?.(DATA.settings.diegeticHud!==false);lastCredits=DATA.character.credits;detectFoldLayout();buildNav();render("Overview");
 if($("#soundBtn"))$("#soundBtn").textContent=`Sound: ${uiSound?"On":"Off"}`;
 requestAnimationFrame(detectFoldLayout);
 if(DATA.combat?.active&&DATA.combat.forced)setTimeout(autoEnemyTurns,150);
}
function buildNav(){
 $("#nav").innerHTML="";
 pages.forEach(p=>{let b=document.createElement("button");b.textContent=p;b.dataset.short=p.replace(/\s/g,"").slice(0,3).toUpperCase();b.onclick=()=>render(p);$("#nav").appendChild(b)})
}
function runtimeStateSnapshot(){
 const g=typeof galaxyState==="function"?galaxyState():{};
 const enc=DATA?.encounter||DATA?.combat?.forcedEncounter||{};
 const route=g?.route;
 const loc=(typeof currentGalaxyLocation==="function"?currentGalaxyLocation():null);
 return {
  page:currentPage,
  character:{name:DATA?.character?.name,callsign:DATA?.character?.callsign,health:DATA?.character?.health,healthMax:DATA?.character?.healthMax,stamina:DATA?.character?.stamina,staminaMax:DATA?.character?.staminaMax,credits:DATA?.character?.credits},
  ship:{name:DATA?.ship?.name,class:DATA?.ship?.class,hull:DATA?.ship?.hull,hullMax:DATA?.ship?.hullMax,shields:DATA?.ship?.shields,shieldsMax:DATA?.ship?.shieldsMax,fuel:DATA?.ship?.fuel,fuelMax:DATA?.ship?.fuelMax},
  story:{location:DATA?.story?.location,objective:DATA?.story?.objective,danger:DATA?.story?.danger,turn:DATA?.story?.director?.turn||0},
  encounter:{active:!!(enc?.active||forcedEncounterPage()),reason:enc?.reason||DATA?.combat?.encounter?.reason||'',objective:enc?.objective||'',source:enc?.source||'',groundEnemies:typeof liveCombatEnemies==="function"?liveCombatEnemies().length:0,spaceEnemies:typeof liveDogfightEnemies==="function"?liveDogfightEnemies().length:0},
  galaxy:{phase:g?.phase||'idle',location:loc?.name||'Unknown Space',route:route?.destinationId||route?.phase||'none'},
  weapon:(DATA?.weapons||[]).find(w=>w.id===selectedCombatWeapon)||(DATA?.weapons||[])[0]||{},
  npc:(typeof currentStoryVisualNpc==="function"?currentStoryVisualNpc():null),
  presentation:{shipScene:DATA?.settings?.shipScene||"cockpit",graphics:DATA?.settings?.graphicsQuality||"high"}
 };
}
window.getDeadlockRuntimeState=runtimeStateSnapshot;
function render(page=currentPage){
 window.DeadlockEngagement?.cleanup();
 window.DeadlockPolish?.closeViewer();
 const locked=forcedEncounterPage();if(locked&&page!==locked){page=locked;}
 currentPage=page;document.body.dataset.page=page;delete document.body.dataset.sceneTheme;let activeNav=null;$$('#nav button').forEach(b=>{const active=b.textContent===page;b.classList.toggle("active",active);if(active)activeNav=b});
 if(activeNav)requestAnimationFrame(()=>activeNav.scrollIntoView({block:"nearest",inline:"nearest"}));
 $("#title").textContent=page;$("#crumb").textContent=`DEADLOCK // ${page.toUpperCase()}`;
 const content=$("#content");content.classList.remove("page-transition");void content.offsetWidth;content.classList.add("page-transition");
 let key="page"+page.replace(/\s/g,"");content.innerHTML=(window[key]||(()=>`<div class="card">No renderer.</div>`))();wire();enhanceLivingScene(page);
 window.DeadlockGPU?.setEnabled?.(DATA.settings.gpuBackdrop!==false);window.DeadlockGPU?.setPage?.(page);window.DeadlockHUD?.setEnabled?.(DATA.settings.diegeticHud!==false);window.DeadlockHUD?.update?.(page,runtimeStateSnapshot());
 window.dispatchEvent(new CustomEvent("deadlock:page-rendered",{detail:{page,state:runtimeStateSnapshot()}}));
 window.DeadlockPolish?.afterRender(page);window.DeadlockWorld?.afterRender(page);window.DeadlockEngagement?.afterRender(page);window.DeadlockPort?.afterRender(page);window.DeadlockApex?.afterRender(page);
 if(AMBIENT?.running)retuneAmbient();if(WORLD_AUDIO)retuneWorldAudio();
 setTimeout(()=>content.classList.remove("page-transition"),300)
}
function healthControls(key,maxKey,label){
 let c=DATA.character;return `<div class="card span4"><h3>${label}</h3><div class="kpi"><b>${c[key]}</b><span>/ ${c[maxKey]}</span></div>${meter(c[key],c[maxKey],statusClass(c[key],c[maxKey]))}<div class="controls">
 <button class="btn step" data-charstep="${key}:-10">-10</button><button class="btn step" data-charstep="${key}:-1">-1</button><button class="btn step" data-charstep="${key}:1">+1</button><button class="btn step" data-charstep="${key}:10">+10</button></div></div>`
}
function pageOverview(){
 let c=DATA.character,s=DATA.ship;
 return `<div class="grid">
 <div class="card hero">${characterVisual("rovan","neutral","Rovan Kes")}<div class="overlay"><div class="micro">${esc(c.species)} // ${esc(c.role)}</div><h2>${esc(c.name)}</h2><div class="cyan">CALLSIGN: ${esc(c.callsign)}</div><p>${esc(c.appearance)}</p></div></div>
 <div class="card span3"><h3>Status</h3><div class="row"><span class="muted">Level</span><b>${c.level}</b></div><div class="row"><span class="muted">XP</span><b>${c.xp}/${c.xpNext}</b></div>${meter(c.xp,c.xpNext)}
 <div class="row"><span class="muted">Credits</span><b class="reward">${money(c.credits)}</b></div><div class="controls"><button class="btn" data-open="credits">Adjust Credits</button><button class="btn" data-open="xp">Add XP</button></div></div>
 <div class="card span4"><h3>Loadout</h3>${DATA.weapons.map(w=>`<div class="tile" data-weapon="${w.id}"><div class="name">${w.name}</div><div class="sub">${w.type}</div><div class="row small"><span>Mode</span><b>${w.mode}</b></div>${meter(w.charge,w.chargeMax)}</div>`).join("")}</div>
 ${healthControls("health","healthMax","Health")}${healthControls("stamina","staminaMax","Stamina")}
 <div class="card span4"><h3>The Raven</h3><div class="row"><span>Hull</span><b>${s.hull}/${s.hullMax}</b></div>${meter(s.hull,s.hullMax,statusClass(s.hull,s.hullMax))}<div class="row"><span>Shields</span><b>${s.shields}/${s.shieldsMax}</b></div>${meter(s.shields,s.shieldsMax,statusClass(s.shields,s.shieldsMax))}<div class="controls"><button class="btn" onclick="render('Dogfight')">Dogfight HUD</button></div></div>
 <div class="card span7"><h3>Active Contracts</h3>${DATA.contracts.filter(x=>x.status==="Active").map(contractHTML).join("")}</div>
 <div class="card span5"><h3>Quick Actions</h3><div class="pill cyan">OFFLINE READY</div><div class="controls"><button class="btn" onclick="render('Combat')">Enter Combat</button><button class="btn" onclick="render('Targets')">Target Dossiers</button><button class="btn" onclick="render('Bounties')">Generate Bounty</button><button class="btn" onclick="render('Galaxy')">Galaxy Map</button></div></div>
 <div class="card full"><h3>System Feed</h3><div class="notification-stack">${notificationLog.length?notificationLog.map(n=>`<div class="notif ${n.type}"><span class="small muted">${n.ts}</span> — ${esc(n.text)}</div>`).join(""):'<div class="muted">No new tactical events.</div>'}</div></div>
 </div>`
}
function pageCombat(){
 let c=DATA.combat;ensureEncounterState();c.participants.sort((a,b)=>b.initiative-a.initiative);c.turnIndex=clamp(c.turnIndex,0,Math.max(0,c.participants.length-1));
 let active=c.participants[c.turnIndex]||null,enemies=liveCombatEnemies();if(enemies.length&&!enemies.some(x=>x.id===selectedCombatTarget))selectedCombatTarget=enemies[0].id;
 const selectedW=DATA.weapons.find(x=>x.id===selectedCombatWeapon)||DATA.weapons[0],forced=c.active&&c.forced;
 return `<div class="grid">
 ${forced?`<div class="card full forced-encounter-banner"><div><div class="micro">STORY FLOW LOCKED // FORCED ENCOUNTER</div><h3>${esc(c.reason||"HOSTILE CONTACT")}</h3><p>${esc(c.objective||"Neutralize the threat or break contact.")}</p></div><div class="forced-threat"><span>ESCAPE DC</span><b>${c.escapeDC}</b></div></div>`:""}
 <div class="card full"><div class="row"><h3>Initiative Timeline</h3><span class="pill ${c.active?'danger':'cyan'}">${c.active?`ROUND ${c.round}`:"IDLE"}</span></div><div class="initiative-timeline">${c.participants.map((p,i)=>`<div class="init-chip ${p.side==="Enemy"?"enemy":"ally"} ${c.active&&i===c.turnIndex?"active":""}"><div class="init-order">${c.active&&i===c.turnIndex?"CURRENT":`ORDER ${i+1}`}</div><div class="init-name">${esc(p.name)}</div><div class="small muted">${p.hp}/${p.hpMax} HP${p.defense?` // DEF ${p.defense}`:""}</div><div class="init-value">${p.initiative}</div></div>`).join("")}</div></div>
 <div class="card full"><div class="row"><h3>Encounter Roster</h3><span class="pill ${c.active?'danger':''}">${forced?"NO SAFE EXIT":c.active?"LIVE":"MANUAL"}</span></div>
 <div class="encounter-cards">${c.participants.map((p,i)=>`<div class="enemy-portrait-card ${p.side==="Enemy"?"enemy-card":"ally-card"} ${c.active&&i===c.turnIndex?"active":""}" data-combatcard="${p.id}"><div class="enemy-holo">${esc((p.name||"?").slice(0,1))}</div><div class="enemy-card-body"><div class="enemy-threat">${p.side==="Enemy"?`HOSTILE // THREAT ${p.threat||1}`:"DEADLOCK // PLAYER"}</div><div class="name">${esc(p.name)}</div><div class="sub">INIT ${p.initiative} • ${p.hp}/${p.hpMax} HP</div>${meter(p.hp,p.hpMax,statusClass(p.hp,p.hpMax))}<div>${(p.conditions||[]).map(x=>`<span class="condition">${esc(x)}</span>`).join("")}</div></div></div>`).join("")}</div>
 <div class="combat-toolbar">${forced?`<button class="btn good" data-combat-action="guard">Take Cover / End Turn</button><button class="btn warn" data-combat-action="flee">Break Contact</button>`:`<button class="btn" data-combatcmd="add">Add Combatant</button><button class="btn" data-combatcmd="rollinit">Roll Initiative</button><button class="btn good" data-combatcmd="start">${c.active?"Restart Encounter":"Start Encounter"}</button><button class="btn" data-combatcmd="next">Next Turn</button><button class="btn danger" data-combatcmd="end">End</button>`}</div></div>
 <div class="card span8"><h3>Combatants</h3><div class="initiative-list">${c.participants.map((p,i)=>`<div class="combatant ${p.side==="Enemy"?"enemy":"ally"} ${c.active&&i===c.turnIndex?"active-turn":""}"><div class="init-num">${p.initiative}</div><div><b>${esc(p.name)}</b><div class="small muted">${p.side} • ${p.side==="Enemy"?`DEF ${p.defense||11} • ${esc(p.damage||"")}`:`DEF ${groundDefense()}`}</div><div>${(p.conditions||[]).map(x=>`<span class="condition">${esc(x)}</span>`).join("")}</div></div><div class="hpbar"><div class="small">${p.hp}/${p.hpMax} HP</div>${meter(p.hp,p.hpMax,statusClass(p.hp,p.hpMax))}</div>${forced?"":`<div class="combat-actions controls"><button class="btn" data-combat="${p.id}:damage">Damage</button><button class="btn good" data-combat="${p.id}:heal">Heal</button><button class="btn" data-combat="${p.id}:cond">Condition</button>${p.id!=="rovan"?`<button class="btn danger" data-combat="${p.id}:remove">×</button>`:""}</div>`}</div>`).join("")}</div></div>
 <div class="card span4"><h3>Deadlock Fire Control</h3>${active?`<div class="big-number">${esc(active.name)}</div><div class="muted">${active.id==="rovan"?"YOUR TURN":active.side==="Enemy"?"HOSTILE ACTING":"ALLY ACTING"} // Round ${c.round}</div>`:"<p class='muted'>No active encounter.</p>"}<div class="reticle"><div class="lock"></div></div><div class="field"><label>Target</label><select id="combatTarget" class="target-select">${enemies.map(e=>`<option value="${e.id}" ${e.id===selectedCombatTarget?"selected":""}>${esc(e.name)} // ${e.hp} HP // DEF ${e.defense||11}</option>`).join("")||'<option value="">No enemy target</option>'}</select></div><div class="weapon-readout">${selectedW.name} // ${selectedW.mode}</div><div class="controls"><button class="btn" id="openWeaponWheelBtn" ${active?.id!=="rovan"?"disabled":""}>Weapon Wheel</button><button class="btn good" id="quickFireBtn" ${!c.active||active?.id!=="rovan"?"disabled":""}>Fire ${selectedW.name}</button></div><p class="small muted">Enemy turns resolve automatically. A miss costs the turn. Take Cover halves the next incoming hit; Break Contact rolls Survival against the encounter's escape DC.</p></div>
 <div class="card full"><h3>Combat Log</h3><div class="log">${c.log.map(x=>`<div>${x.ts} — ${esc(x.text)}</div>`).join("")||"No combat events yet."}</div></div></div>`
}
function targetCard(t){
 return `<div class="tile target-card ${currentTargetLock===t.id?"locked":""}" data-target="${t.id}"><div class="row"><div style="display:flex;gap:10px;align-items:center"><div class="holo-avatar">${esc((t.name||"?").slice(0,1))}</div><div><div class="name">${esc(t.name)}</div><div class="sub">${esc(t.status)}</div></div></div><span class="reward">${money(t.reward)}</span></div>
 <div class="row small"><span>Danger</span><span>${"◆".repeat(t.danger||1)}</span></div><div class="row small"><span>Location</span><span>${esc(t.location)}</span></div>
 <p>${esc(t.notes)}</p><div class="pills">${(t.tags||[]).map(x=>`<span class="pill">${esc(x)}</span>`).join("")}</div></div>`
}
function pageTargets(){return `<div class="card"><div class="row"><h3>Target Dossiers</h3><button class="btn" data-open="newTarget">New Dossier</button></div><div class="tile-grid">${DATA.targets.map(targetCard).join("")}</div></div>`}
function genBounty(){
 const first=["Vex","Karo","Serrin","Tala","Brax","Nira","Jek","Ralo","Mira","Kess","Tor","Syla"];
 const last=["Vann","Korr","Senn","Dray","Merek","Vale","Rusk","Tarn","Kade","Voss","Ren","Daro"];
 const crimes=["weapons smuggling","data theft","contract murder","cargo hijacking","black-market cybernetics","bounty jumping","slicing a protected network","stealing a syndicate shipment"];
 const locs=DATA.locations.filter(x=>x.known);
 const danger=1+Math.floor(Math.random()*5), reward=(danger*5000)+Math.floor(Math.random()*5)*2500;
 const loc=locs[Math.floor(Math.random()*locs.length)];
 return {id:uid("bounty"),name:first[Math.floor(Math.random()*first.length)]+" "+last[Math.floor(Math.random()*last.length)],species:"Unknown",status:Math.random()>.45?"Wanted Alive":"Dead or Alive",danger,reward,location:loc?.name||"Unknown",notes:"Generated bounty lead. Review before treating as campaign canon.",intel:[crimes[Math.floor(Math.random()*crimes.length)]],tags:["Generated","Unverified"]};
}

function holoContact(id){return (DATA.story?.npcs||[]).find(n=>n.id===id)||DATA.contacts.find(c=>c.id===id)||null}
function holoInitial(name="UNKNOWN"){return String(name).trim().slice(0,1).toUpperCase()||"?"}
function holoTimestamp(){return new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}
function generateHolonetTransmission(senderId=null){
 const ids=["dren","nera","renn","jessa","unknown"];
 const id=senderId||ids[Math.floor(Math.random()*ids.length)];
 let sender="UNKNOWN SIGNAL",subject="Encrypted incoming signal",body="";
 if(id==="unknown"){
  const bodies=[
   "A narrow-band transmission repeats a Deadlock-specific handshake without identifying its source.",
   "An encrypted packet requests a private channel and includes no return identity.",
   "A burst transmission contains coordinates too incomplete to treat as a confirmed location."
  ];
  body=pick(bodies);subject="Unidentified encrypted ping";
 }else{
  const n=holoContact(id);sender=n?.name||id;
  subject=id==="dren"?"Marr thread // private channel":id==="nera"?"Contract channel update":id==="renn"?"Operational contact ping":"Field comm check";
  body=proceduralNpcDialogue(id,DATA.story?.director?.lastTopic||"open")||`${sender} is waiting on an encrypted channel.`;
 }
 const tx={id:uid("tx"),senderId:id,sender,channel:"ENCRYPTED HOLO",subject,body,unread:true,verified:false,ts:holoTimestamp()};
 DATA.holonet.transmissions.unshift(tx);DATA.holonet.transmissions=DATA.holonet.transmissions.slice(0,30);save();return tx
}

function holoContactMeta(tx){
 const npc=holoContact(tx.senderId);
 const contact=DATA.contacts.find(c=>c.id===tx.senderId);
 if(tx.senderId==="dren")return {portrait:assetUrl("characters","dren","holo")||assetUrl("characters","dren","neutral"),role:"RIVAL // OCCASIONAL ALLY",origin:"ENCRYPTED RELAY",identityChannel:"COVERT",priority:"NORMAL",verification:"KNOWN CONTACT",known:"IDENTITY VERIFIED",trust:`TRUST ${npc?.mood?.trust??contact?.trust??50}%`};
 if(tx.senderId==="nera")return {portrait:assetUrl("characters","nera","holo")||npc?.portrait,role:"CONTRACT ISSUER",origin:"PRIVATE CONTRACT RELAY",identityChannel:"SECURE",priority:"BUSINESS",verification:"KNOWN CONTACT",known:"IDENTITY VERIFIED",trust:`TRUST ${npc?.mood?.trust??contact?.trust??40}%`};
 if(tx.senderId==="renn")return {portrait:assetUrl("characters","renn","holo")||npc?.portrait,role:"OPERATIONAL CONTACT",origin:"MASKED FIELD RELAY",identityChannel:"COVERT",priority:"NORMAL",verification:"KNOWN CONTACT",known:"IDENTITY VERIFIED",trust:`TRUST ${npc?.mood?.trust??contact?.trust??45}%`};
 if(tx.senderId==="jessa")return {portrait:assetUrl("characters","jessa","holo")||npc?.portrait,role:"GUNNER // ALLY",origin:"FIELD COMMS",identityChannel:"SECURE",priority:"TACTICAL",verification:"KNOWN CONTACT",known:"IDENTITY VERIFIED",trust:`TRUST ${npc?.mood?.trust??contact?.trust??55}%`};
 return {portrait:assetEntry("effects","starfield"),role:"UNVERIFIED SOURCE",origin:"UNKNOWN RELAY",identityChannel:"MASKED",priority:"UNKNOWN",verification:"UNVERIFIED",known:"IDENTITY UNKNOWN",trust:"NO DOSSIER MATCH"};
}
function holoReplyChoices(tx){
 const turn=(tx.exchange||[]).filter(x=>x.speaker==="Deadlock").length;
 if(tx.senderId==="unknown"){
  return [
   {label:"Identify yourself.",sub:"Demand a sender identity before continuing.",tone:"DIRECT",intent:"investigate"},
   {label:"Send the data first.",sub:"Request proof without exposing anything.",tone:"CAUTIOUS",intent:"investigate"},
   {label:"Trace the relay while they talk.",sub:"Keep the channel open and work the signal.",tone:"TECHNICAL",intent:"ship"},
   {label:"End the channel.",sub:"Do not engage the unknown source.",tone:"DISENGAGE",intent:"end"}
  ];
 }
 if(turn===0){
  return [
   {label:"Tell me what you know.",sub:"Get the useful version first.",tone:"DIRECT",intent:"investigate"},
   {label:"Send me the details.",sub:"Request hard data, names, and coordinates.",tone:"PROFESSIONAL",intent:"contracts"},
   {label:"Any risks I should be aware of?",sub:"Push for the complication they have not mentioned.",tone:"CAUTIOUS",intent:"investigate"},
   {label:"Keep the channel open.",sub:"Stay connected while Deadlock evaluates the situation.",tone:"NEUTRAL",intent:"dialogue"}
  ];
 }
 return [
  {label:"What aren't you telling me?",sub:"Pressure the contact for the missing piece.",tone:"PRESSURE",intent:"investigate"},
  {label:"Send everything you have.",sub:"Pull the complete data package to The Raven.",tone:"PROFESSIONAL",intent:"contracts"},
  {label:"What's the payoff?",sub:"Bring the conversation back to credits and leverage.",tone:"BUSINESS",intent:"bounty"},
  {label:"That's enough. Stand by.",sub:"End this exchange without burning the contact.",tone:"DISENGAGE",intent:"end"}
 ];
}
function renderHoloChoices(tx){
 const choices=holoReplyChoices(tx);
 $("#holoTxChoices").innerHTML=choices.map((c,i)=>`<button class="holocall-response" data-holoreply="${i}"><span class="holocall-response-index">${i+1}</span><span><b>${esc(c.label)}</b><small>${esc(c.sub)}</small></span><span class="holocall-response-tone">${esc(c.tone)}</span></button>`).join("");
 $$("[data-holoreply]").forEach(btn=>btn.onclick=()=>handleHoloReply(tx.id,Number(btn.dataset.holoreply)));
}
function currentTxLine(tx){
 const x=tx.exchange?.length?tx.exchange[tx.exchange.length-1]:null;
 return x?.text||tx.body;
}
function renderHoloTransmission(tx){
 const meta=holoContactMeta(tx);
 $("#holoTxSender").textContent=tx.sender;
 $("#holoTxRole").textContent=meta.role;
 $("#holoTxPortrait").src=meta.portrait;
 $("#holoTxPortrait").onerror=()=>{const id=tx.senderId==="kade"?"nera":tx.senderId;const fb=assetFallback("characters",id)||assetUrl("characters","unknown","holo");if(fb&&$("#holoTxPortrait").src!==fb)$("#holoTxPortrait").src=fb};
 $("#holoTxPortrait").alt=`${tx.sender} Holonet portrait`;
 $("#holoTxOrigin").textContent=meta.origin;
 $("#holoTxChannel").textContent=tx.channel||"ENCRYPTED HOLO";
 $("#holoTxIdentityChannel").textContent=meta.identityChannel;
 $("#holoTxPriority").textContent=meta.priority;
 $("#holoTxVerification").textContent=tx.verified?"VERIFIED / LOGGED":meta.verification;
 $("#holoTxVerification").className=tx.senderId==="unknown"&&!tx.verified?"warn-text":"good-text";
 $("#holoTxKnown").textContent=meta.known;
 $("#holoTxTrust").textContent=meta.trust;
 $("#holoTxTime").textContent=tx.ts||holoTimestamp();
 $("#holoTxDialogueSpeaker").textContent=`${tx.sender}:`;
 $("#holoTxDialogueText").textContent=currentTxLine(tx);
 $("#holoTxDialogueState").textContent=tx.verified?"LOGGED TO CAMPAIGN":"LIVE // LOCAL HOLONET";
 $("#holoTxDialogueState").className=`holocall-dialogue-state ${tx.verified?"good-text":"warn-text"}`;
 $("#holoTxWaveStatus").textContent="RECEIVING";
 const wave=$("#holoTxWave");wave.innerHTML="<i></i>".repeat(44);
 renderHoloChoices(tx);
}
function openHoloTransmission(id){
 const tx=DATA.holonet.transmissions.find(x=>x.id===id);if(!tx)return;
 tx.unread=false;tx.exchange=tx.exchange||[{speaker:tx.sender,type:"contact",text:tx.body,ts:tx.ts||holoTimestamp()}];save();
 $("#holoTransmission").dataset.tx=id;
 renderHoloTransmission(tx);
 $("#holoTransmission").classList.add("open");
 uiBeep(520,.06,.025);navigator.vibrate?.(18);
 setTimeout(()=>speakCharacter(tx.sender,currentTxLine(tx)),90)
}
function closeHoloTransmission(){$("#holoTransmission").classList.remove("open")}
function commitHoloTransmission(){
 const id=$("#holoTransmission").dataset.tx,tx=DATA.holonet.transmissions.find(x=>x.id===id);if(!tx)return;
 if(!tx.verified){
  tx.verified=true;
  const exchanged=tx.exchange?.length?tx.exchange:[{speaker:tx.sender,type:"contact",text:tx.body}];
  exchanged.forEach(line=>storyPush(line.type==="player"?"player":tx.senderId==="unknown"?"narration":"dialogue",line.speaker,line.text,{source:"holonet",txId:tx.id}));
  addNotification(`Holonet exchange logged to story: ${tx.sender}`,"info");
  save();
 }
 renderHoloTransmission(tx);toast("Holonet exchange logged to Story")
}
function handleHoloReply(txId,index){
 const tx=DATA.holonet.transmissions.find(x=>x.id===txId);if(!tx)return;
 const choices=holoReplyChoices(tx),choice=choices[index];if(!choice)return;
 if(choice.intent==="end"){closeHoloTransmission();toast("Transmission ended");return}
 tx.exchange=tx.exchange||[];
 tx.exchange.push({speaker:"Deadlock",type:"player",text:choice.label,ts:holoTimestamp()});
 $("#holoTxDialogueSpeaker").textContent="DEADLOCK:";
 $("#holoTxDialogueText").textContent=choice.label;
 $("#holoTxWaveStatus").textContent="TRANSMITTING";
 uiBeep(690,.035,.015);navigator.vibrate?.(12);

 setTimeout(()=>{
   let reply;
   if(tx.senderId==="unknown"){
     const unknownReplies={
       investigate:[
         "The source pauses. “Names cost trust. You don't have mine yet. Data packet incoming.”",
         "A burst of encrypted telemetry hits the buffer. “Verify that first. Then decide whether you want the rest.”",
         "The signal shifts frequencies twice. “You're asking the right question. Keep listening.”"
       ],
       ship:[
         "The relay fractures across three carrier bands. Whoever is transmitting knows they're being traced.",
         "The signal keeps moving. The Raven gets fragments, but no clean origin."
       ]
     };
     reply=pick(unknownReplies[choice.intent]||unknownReplies.investigate);
   }else{
     reply=proceduralNpcDialogue(tx.senderId,choice.intent)||`${tx.sender} stays on the channel.`;
   }
   tx.exchange.push({speaker:tx.sender,type:"contact",text:reply,ts:holoTimestamp()});
   tx.body=reply;
   tx.verified=true; // Rovan actively engaged; the exchange is now part of play.
   const hnpc=storyNpc(tx.senderId);
   if(hnpc){
     if(choice.tone==="PROFESSIONAL"||choice.tone==="DIRECT"){adjustNpcMood(hnpc,{respect:1,trust:1});addConsequence(`${hnpc.name}: Holonet rapport`,"Professional contact improved slightly.","good",{npcId:hnpc.id})}
     if(choice.tone==="PRESSURE"){adjustNpcMood(hnpc,{fear:2,irritation:2});addConsequence(`${hnpc.name}: pressure applied`,"Fear and irritation increased.","warn",{npcId:hnpc.id})}
   }
   storyPush("player","Deadlock",choice.label,{source:"holonet",txId:tx.id});
   storyPush(tx.senderId==="unknown"?"narration":"dialogue",tx.sender,reply,{source:"holonet",txId:tx.id});
   save();
   renderHoloTransmission(tx);
   $("#holoTxWaveStatus").textContent="RECEIVING";
 },260);
}

function plotHyperspaceRoute(destinationId=null){
 const h=DATA.holonet, dest=DATA.locations.find(l=>l.id===(destinationId||h.route.destinationId))||DATA.locations[0];
 const sx=14,sy=76,dx=Number(dest?.x??50),dy=Number(dest?.y??50);
 const jitter=()=>Math.floor(Math.random()*13)-6;
 const p1=[clamp(Math.round(sx+(dx-sx)*.34+jitter()),5,95),clamp(Math.round(sy+(dy-sy)*.34+jitter()),5,95)];
 const p2=[clamp(Math.round(sx+(dx-sx)*.68+jitter()),5,95),clamp(Math.round(sy+(dy-sy)*.68+jitter()),5,95)];
 h.route={status:"CALCULATED",originName:"The Raven — Current Position",destinationId:dest?.id||"unknown",destinationName:dest?.name||"Uncharted / Unknown",quality:72+Math.floor(Math.random()*27),risk:4+Math.floor(Math.random()*28),points:[[sx,sy],p1,p2,[dx,dy]]};
 save();storyCinematic("hyperspace",`${h.route.destinationName} // corridor ${h.route.quality}%`);return h.route
}
function routeSvg(){
 const r=DATA.holonet.route||{},pts=r.points||[[14,76],[50,50]];
 if(pts.length<2)return "";
 const path=pts.map((p,i)=>(i?"L":"M")+p[0]+" "+p[1]).join(" ");
 return `<svg class="hyperspace-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path class="hyperspace-path-shadow" d="${path}"/><path class="hyperspace-path" d="${path}"/>${pts.map(p=>`<circle class="route-node" cx="${p[0]}" cy="${p[1]}" r="1.2"/>`).join("")}</svg>`
}
function showBountyPuck(b){
 DATA.holonet.lastPuck={name:b.name,reward:b.reward,status:b.status,danger:b.danger};
 $("#puckTargetMark").textContent=holoInitial(b.name);
 $("#puckTargetName").textContent=b.name;
 $("#puckTargetMeta").textContent=`${money(b.reward)} // ${b.status} // DANGER ${b.danger}`;
 $("#bountyPuckOverlay").classList.add("open");weaponSound("luna");navigator.vibrate?.([20,25,20]);save()
}
function closeBountyPuck(){$("#bountyPuckOverlay").classList.remove("open")}
function holonetMessageHTML(tx){
 return `<div class="holo-message ${tx.unread?"unread":""}" data-holotx="${tx.id}"><div class="holo-sender-icon">${holoInitial(tx.sender)}</div><div><b>${esc(tx.sender)}</b><div class="small cyan">${esc(tx.subject)}</div><div class="small muted">${esc(tx.body.slice(0,88))}${tx.body.length>88?"…":""}</div></div><div class="tx-time">${esc(tx.ts||"")}</div></div>`
}
function pageHolonet(){
 const h=DATA.holonet||{}, unread=(h.transmissions||[]).filter(x=>x.unread).length, active=activeContracts();
 return `<div class="holonet-shell">
 <div class="holonet-header"><div><div class="micro">OFFLINE LOCAL NETWORK // ENCRYPTION ${esc(h.encryption||"DEADLOCK")}</div><div class="holonet-title">HOLONET OPERATIONS</div><div class="aurebesh-strip">⌖ 7A // ⟐ KR-19 // ⌁ DEADLOCK // ⫷ LOCAL RELAY // 4C</div></div>
 <div class="holonet-status"><span class="pill cyan">LOCAL SIM</span><span class="pill">${unread} UNREAD</span><span class="pill">NO SIGNAL REQUIRED</span></div></div>
 <div class="holonet-grid">
  <div class="card"><div class="row"><h3>Encrypted Transmissions</h3><button class="btn" id="generateTransmission">Scan Channel</button></div><div class="holonet-feed">${(h.transmissions||[]).map(holonetMessageHTML).join("")}</div></div>
  <div>
   <div class="card"><h3>Local Relay Mesh</h3><div class="holonet-network">
    <span class="holonet-node" style="left:18%;top:68%"></span><span class="holonet-node" style="left:46%;top:34%"></span><span class="holonet-node" style="left:76%;top:58%"></span><span class="holonet-node" style="left:60%;top:80%"></span>
    <span class="holonet-link" style="left:20%;top:68%;width:33%;transform:rotate(-39deg)"></span><span class="holonet-link" style="left:47%;top:36%;width:32%;transform:rotate(32deg)"></span><span class="holonet-link" style="left:60%;top:78%;width:22%;transform:rotate(-61deg)"></span>
   </div><div class="row"><span class="muted">Signal simulation</span><b>${h.signal||100}%</b></div><div class="holonet-mini"><div class="row"><span>Offline cache integrity</span><div class="signal-bars"><i></i><i></i><i></i><i></i></div></div></div></div>
   <div class="card"><h3>BountyNet Snapshot</h3>${(DATA.targets||[]).slice(0,3).map(t=>`<div class="row"><span>${esc(t.name)}</span><b class="reward">${money(t.reward)}</b></div>`).join("")||"<p class='muted'>No saved target dossiers.</p>"}<div class="controls"><button class="btn" onclick="render('Bounties')">Open BountyNet</button></div></div>
   <div class="card"><h3>Hyperspace Navigation</h3><div class="row"><span class="muted">Destination</span><b>${esc(h.route?.destinationName||"Uncharted / Unknown")}</b></div><div class="route-readout"><div><span class="small muted">QUALITY</span><div class="big">${h.route?.quality||0}%</div></div><div><span class="small muted">RISK</span><div class="big">${h.route?.risk||0}%</div></div><div><span class="small muted">STATE</span><div class="big">${esc(h.route?.status||"STANDBY")}</div></div></div><div class="controls"><button class="btn good" id="holoPlotRoute">Plot Course</button><button class="btn" onclick="render('Galaxy')">Nav Map</button></div></div>
  </div>
 </div></div>`
}

function pageBounties(){
 return `<div class="grid"><div class="card span5"><h3>BountyNet / Holo-Puck Terminal</h3><div class="aurebesh-strip">BOUNTYNET // ⟐ 9C // ⌖ UNVERIFIED TARGET FEED // LOCAL CACHE</div><p>Generate a procedural lead, reveal it through the holo-puck, then discard it or save it as a target dossier.</p><button class="btn" id="generateBounty">Generate Lead</button><div id="generatedBounty" style="margin-top:12px"></div></div>
 <div class="card span7"><h3>Generator Notes</h3><p class="muted">Generated names, crimes, danger ratings, and rewards are intentionally marked unverified so they do not overwrite established campaign lore unless you save them.</p><div class="pills"><span class="pill">Unverified Leads</span><span class="pill">Alive / Dead-or-Alive</span><span class="pill">Editable Reward</span></div></div></div>`
}
function pageGalaxy(){
 const g=galaxyState(),sel=selectedGalaxyLocation(),cur=currentGalaxyLocation(),route=g.route,path=sel?galaxyPath(g.currentLocationId||g.homeId,sel.id):null,sys=galaxySystemForLocation(sel?.id),scan=Number(g.scanIntel?.[sel?.id]||0);
 const inTransit=g.phase==="transit"&&g.transit;
 return `<div class="grid living-galaxy-shell">
  <div class="card span8 galaxy-map-card"><div class="row"><div><div class="micro">LIVING GALAXY // NAVIGATION NETWORK</div><h3>Deadlock Reach</h3></div><span class="pill cyan">${cur?`RAVEN // ${esc(cur.name)}`:"POSITION UNKNOWN"}</span></div>${galaxyMapSvg()}</div>
  <div class="card span4 galaxy-dossier">${locationHero(sel)}<div class="galaxy-dossier-body"><div class="micro">${esc(sys?.region||"UNKNOWN REGION")}</div><h3>${esc(sel?.name||"Unknown")}</h3><div class="cyan">${esc(sel?.type||"")} ${sel?.home?"// HOME BASE":""}</div><p>${esc(sel?.description||"")}</p><div class="pills">${(sel?.services||[]).map(x=>`<span class="pill">${esc(x)}</span>`).join("")}</div><div class="row"><span class="muted">Danger</span><b>${Number(sel?.danger||0)}%</b></div>${meter(sel?.danger||0,100,statusClass(sel?.danger||0,100))}<div class="small muted">ORBITAL SCANS: ${scan} // VISITED: ${g.visited.includes(sel?.id)?"YES":"NO"}</div></div></div>
  <div class="card span8"><div class="row"><h3>Flight Plan</h3><span class="pill ${g.phase==="transit"?"warn":"cyan"}">${String(g.phase||"idle").toUpperCase()}</span></div>
   ${inTransit?`<div class="transit-stage"><div class="transit-stars"></div><div class="transit-raven">${ravenVisual("flight","The Raven in hyperspace")}</div><div class="micro">HYPERSPACE TRANSIT</div><div class="big-number">${g.transit.progress}%</div>${meter(g.transit.progress,100,"good")}${g.transit.encounter&&!g.transit.encounterResolved?`<div class="travel-event"><b>${esc(g.transit.encounter.name)}</b><p>Something has entered the route. Resolve it before continuing.</p><div class="controls"><button class="btn good" data-travel-encounter="evade">Evade</button><button class="btn" data-travel-encounter="investigate">Investigate</button><button class="btn warn" data-travel-encounter="ignore">Stay on Course</button></div></div>`:`<button class="btn good" data-travel="continue">Continue Transit</button>`}</div>`:
   `<div class="route-summary"><div><span class="small muted">ORIGIN</span><b>${esc(cur?.name||"Unknown")}</b></div><div><span class="small muted">DESTINATION</span><b>${esc(sel?.name||"Unknown")}</b></div><div><span class="small muted">DISTANCE</span><b>${path?.distance??0}</b></div><div><span class="small muted">FUEL</span><b>${path?.fuel??0}</b></div><div><span class="small muted">RISK</span><b>${path?.risk??0}%</b></div></div><div class="controls"><button class="btn" data-travel="plot">Plot Course</button>${route?.phase==="plotted"?`<button class="btn good" data-travel="depart">Depart // ${route.fuelCost} Fuel</button>`:""}</div>`}
  </div>
  <div class="card span4"><h3>Local Operations</h3>${cur?`<div class="name">${esc(cur.name)}</div><p class="small muted">${esc(cur.subtitle||cur.type)}</p><div class="controls"><button class="btn" data-local-action="scan">Orbital Scan</button><button class="btn good" data-local-action="dock">${cur.type.includes("Station")?"Dock":"Land"}</button>${cur.id==="blackglass_station"?'<button class="btn" data-local-action="hq">Enter HQ</button>':""}<button class="btn" data-local-action="story">Commit to Story</button></div><h4>Local Services</h4><div class="world-service-grid">${(cur.services||[]).map(x=>`<button class="world-service" data-world-service="${esc(x)}">${esc(x)}</button>`).join("")}</div><h4>Sites</h4><div class="world-site-grid">${(cur.sites||[]).map(x=>{const n=hqSite(x)?.name||x;return `<button class="world-site" data-world-site="${esc(n)}" ${!["docked","surface"].includes(g.phase)?"disabled":""}><b>${esc(n)}</b><small>${["docked","surface"].includes(g.phase)?"Start local scene":"Dock / land to access"}</small></button>`}).join("")}</div>`:'<p class="muted">Plot and complete a route to establish a local operating area.</p>'}<h4>Travel Log</h4><div class="log galaxy-log">${(g.travelLog||[]).slice(0,8).map(x=>`<div>${esc(x.ts)} — ${esc(x.text)}</div>`).join("")||"No travel events yet."}</div></div>
 </div>`
}
function pageHQ(){
 const g=galaxyState(),atHome=g.currentLocationId===g.homeId&&['docked','surface'].includes(g.phase),site=hqSite(g.currentSiteId)||GALAXY.hq.sites[0];
 return `<div class="grid hq-shell"><div class="card full hq-hero"><div class="hq-image">${imgTag(hqSiteAsset(site),site.name,assetEntry("blackglass","hq"),"hq-scene-img")}<div class="hq-ambient"><i></i><i></i><i></i></div></div><div class="hq-copy"><div class="micro">BLACKGLASS STATION // APEX HEADQUARTERS</div><h2>${esc(site.name)}</h2><div class="cyan">${atHome?"PHYSICAL ACCESS":"REMOTE SECURE LINK"}</div><p>${esc(site.description)}</p><div class="controls">${(site.actions||[]).map(a=>`<button class="btn" data-hq-action="${esc(a)}">${esc(a)}</button>`).join("")}</div></div></div>
 <div class="card span8"><h3>HQ Spaces</h3><div class="hq-site-grid">${GALAXY.hq.sites.map(x=>`<button class="hq-site ${x.id===site.id?"active":""}" data-hq-site="${x.id}">${imgTag(hqSiteAsset(x),x.name,assetEntry("blackglass","hq"))}<span><b>${esc(x.name)}</b><small>${esc(x.description)}</small></span></button>`).join("")}</div></div>
 <div class="card span4"><h3>Blackglass Status</h3><div class="row"><span class="muted">Home Base</span><b>BLACKGLASS</b></div><div class="row"><span class="muted">Raven</span><b>${atHome?"DOCKED":"AWAY"}</b></div><div class="row"><span class="muted">Active Contracts</span><b>${activeContracts().length}</b></div><div class="row"><span class="muted">Known Systems</span><b>${g.discovered.length}/${GALAXY.locations.length}</b></div><div class="controls">${atHome?'<button class="btn good" onclick="render(\'Ship\')">Board The Raven</button>':'<button class="btn" onclick="galaxyState().selectedLocationId=galaxyState().homeId;save();render(\'Galaxy\')">Plot Course Home</button>'}<button class="btn" onclick="render('Contracts')">Contract Board</button></div><div class="holonet-mini"><div class="small muted">HQ CANON</div><p class="small">Blackglass Station belongs to The 3.2 Apex Protocol. Its lab, armory, workshop, hangar, defenses and isolated vault are established campaign assets. Open Syndicate for the full record.</p></div></div></div>`
}
function pageDogfight(){
 let s=DATA.ship,d=DATA.dogfight;ensureEncounterState();const forced=d.active&&d.forced;
 return `<div class="grid">${forced?`<div class="card full forced-encounter-banner"><div><div class="micro">NAVIGATION LOCKED // FORCED DOGFIGHT</div><h3>${esc(d.reason||"HOSTILE CRAFT")}</h3><p>Destroy the attackers or break pursuit before travel can continue.</p></div><div class="forced-threat"><span>ESCAPE DC</span><b>${d.escapeDC}</b></div></div>`:""}<div class="card span7"><div class="row"><h3>The Raven — Dogfight HUD</h3><span class="pill ${d.active?'danger':''}">${d.active?`ROUND ${d.round}`:"STANDBY"}</span></div>
 <div class="ship-layout">${ravenVisual("flight","The Raven") }<div><div class="row"><span>Hull</span><b>${s.hull}/${s.hullMax}</b></div>${meter(s.hull,s.hullMax,statusClass(s.hull,s.hullMax))}<div class="row"><span>Shields</span><b>${s.shields}/${s.shieldsMax}</b></div>${meter(s.shields,s.shieldsMax,statusClass(s.shields,s.shieldsMax))}<div class="row"><span>Fuel</span><b>${s.fuel}/${s.fuelMax}</b></div>${meter(s.fuel,s.fuelMax,statusClass(s.fuel,s.fuelMax))}</div></div>
 <div class="controls">${forced?`<button class="btn good" data-dogcmd="fire">Fire Forward Cannons</button><button class="btn" data-dogcmd="evade">Evasive Maneuvers</button><button class="btn warn" data-dogcmd="boost">Boost</button><button class="btn" data-dogcmd="overcharge">Shield Overcharge</button><button class="btn warn" data-dogcmd="escape">Break Pursuit</button>`:`<button class="btn good" data-dogcmd="start">${d.active?"Restart":"Start Dogfight"}</button><button class="btn" data-dogcmd="fire">Fire Forward Cannons</button><button class="btn" data-dogcmd="evade">Evasive Maneuvers</button><button class="btn warn" data-dogcmd="boost">Boost</button><button class="btn" data-dogcmd="overcharge">Shield Overcharge</button><button class="btn danger" data-dogcmd="end">End</button>`}</div></div>
 <div class="card span5"><h3>Tactical Radar</h3><div class="reticle"><div class="lock"></div></div><div class="radar"><div class="ship-blip"></div>${d.enemies.filter(e=>e.hp>0).map((e,i)=>`<div class="blip" style="left:${28+(i*19)%55}%;top:${24+(i*27)%58}%" title="${esc(e.name)}"></div>`).join("")}</div>${!forced?'<div class="controls"><button class="btn" data-open="newEnemyShip">Add Enemy Ship</button></div>':""}</div>
 <div class="card span6"><h3>Hostiles</h3>${d.enemies.map(e=>`<div class="tile no-click"><div class="row"><b>${esc(e.name)}</b><span>${e.hp}/${e.hpMax}</span></div>${meter(e.hp,e.hpMax,statusClass(e.hp,e.hpMax))}<div class="small muted">THREAT ${e.threat||1} // ${esc(e.damage||"unknown weapons")}</div>${!forced?`<div class="controls"><button class="btn" data-dogenemy="${e.id}:damage">Damage</button><button class="btn danger" data-dogenemy="${e.id}:remove">Remove</button></div>`:""}</div>`).join("")||"<p class='muted'>No hostile craft tracked.</p>"}</div>
 <div class="card span6"><h3>Flight Log</h3><div class="log">${d.log.map(x=>`<div>${x.ts} — ${esc(x.text)}</div>`).join("")||"No dogfight events yet."}</div></div></div>`
}
function pageCharacter(){
 let c=DATA.character;return `<div class="grid"><div class="card hero">${characterVisual("rovan","neutral","Rovan Kes")}<div class="overlay"><h2>${c.name}</h2><div class="cyan">“${c.callsign}”</div><p>${esc(c.armor)}</p></div></div><div class="card span7"><h3>Profile</h3>
 ${["species","role","affiliation","status"].map(k=>`<div class="row"><span class="muted">${k.toUpperCase()}</span><b>${esc(c[k])}</b></div>`).join("")}
 <div class="field"><label>Appearance</label><textarea data-bind="character.appearance">${esc(c.appearance)}</textarea></div><div class="field"><label>Armor / Clothing</label><textarea data-bind="character.armor">${esc(c.armor)}</textarea></div></div>
 <div class="card full"><h3>Attributes</h3><div class="tile-grid">${Object.entries(c.attributes).map(([k,v])=>`<div class="tile no-click"><div class="row"><b>${k}</b><b>${v}</b></div>${meter(v,20)}<div class="controls"><button class="btn step" data-attr="${k}:-1">-</button><button class="btn step" data-attr="${k}:1">+</button></div></div>`).join("")}</div></div>
 <div class="card full"><h3>Skills</h3><div class="tile-grid">${Object.entries(c.skills).map(([k,v])=>`<div class="tile no-click"><div class="row"><b>${k}</b><b>${v}</b></div>${meter(v)}<div class="controls"><button class="btn step" data-skill="${k}:-1">-</button><button class="btn step" data-skill="${k}:1">+</button></div></div>`).join("")}</div></div></div>`
}
function pageIdentities(){return `<div class="card identity-zone"><div class="row"><h3>Clawdite Identities</h3><button class="btn" data-open="newIdentity">Add Identity</button></div><div class="tile-grid">${DATA.identities.map(i=>`<div class="tile ${i.active?'identity-morph':''}" data-identity="${i.id}"><div class="row"><div><div class="name">${esc(i.name)}</div><div class="sub">${esc(i.type)}</div></div>${i.active?'<span class="pill cyan">ACTIVE</span>':""}</div><p>${esc(i.notes)}</p></div>`).join("")}</div></div>`}
function pageGear(){return `<div class="card"><h3>Armor / Clothing / Field Gear</h3><p class="muted">Clothing and leather dominate the kit; hard armor stays limited to vitals, shoulders, and knees.</p><div class="tile-grid">${DATA.gear.map(g=>`<div class="tile" data-gear="${g.id}"><div class="row"><div><div class="name">${esc(g.name)}</div><div class="sub">${esc(g.slot)}</div></div><span class="pill ${g.equipped?'cyan':''}">${g.equipped?'EQUIPPED':'STOWED'}</span></div><p>${esc(g.notes)}</p>${meter(g.condition,100,statusClass(g.condition))}</div>`).join("")}</div></div>`}
function weaponCard(w){return `<div class="card weapon-card-v4" id="weapon-${w.id}"><div class="row"><div><div class="name">${w.name}</div><div class="sub">${w.type}</div></div><span class="pill cyan">${w.mode}</span></div><p>${esc(w.description)}</p><div class="field"><label>Mode</label><select data-mode="${w.id}">${w.modes.map(m=>`<option ${m===w.mode?"selected":""}>${m}</option>`).join("")}</select></div>${meter(w.charge,w.chargeMax,statusClass(w.charge,w.chargeMax))}<div class="controls"><button class="btn step" data-charge="${w.id}:-10">-10</button><button class="btn step" data-charge="${w.id}:10">+10</button><button class="btn" data-fire="${w.id}">Test Fire</button></div><div class="pills">${w.features.map(f=>`<span class="pill">${esc(f)}</span>`).join("")}</div></div>`}
function pageWeapons(){return `<div class="grid">${DATA.weapons.map(w=>`<div class="span4">${weaponCard(w)}</div>`).join("")}</div>`}
function pageShip(){
 let s=DATA.ship;
 const node=(id,label,left,top)=>{let x=s.systems.find(q=>q.id===id);return `<button class="schematic-node ${!x?.online?"offline":Number(x?.condition||100)<70?"warn":""}" style="left:${left}%;top:${top}%" data-hotspot="${id}" title="${esc(x?.name||label)}">${label}</button>`};
 return `<div class="grid"><div class="card full ship-interior-selector"><div class="row"><div><div class="micro">THE RAVEN // PHYSICAL INTERIOR</div><h3>Current View: ${esc(String(DATA.settings.shipScene||"cockpit").replace(/_/g," ").toUpperCase())}</h3></div><span class="pill cyan">LIVE SCENE</span></div><div class="ship-room-tabs">${[["cockpit","Cockpit"],["cargo","Cargo Bay"],["engineering","Engineering"],["weapons","Weapons Bench"],["prisoner","Prisoner Area"],["quarters","Living Quarters"]].map(([id,label])=>`<button class="btn ${DATA.settings.shipScene===id?"good":""}" data-ship-scene="${id}">${label}</button>`).join("")}</div></div><div class="card full"><div class="ship-layout"><div class="raven-hero-frame">${ravenVisual("landed","The Raven in hangar")}<div class="raven-hero-code">RVN // DEADLOCK // CUSTOM HULL</div><div class="raven-hero-label"><div><div class="raven-hero-name">THE RAVEN</div><div class="small cyan">DEADLOCK'S PERSONAL SHIP</div></div><div class="raven-hero-type">LIGHT FREIGHTER / FIGHTER HYBRID<br>BOUNTY RECOVERY CONFIGURATION</div></div></div><div><h3>${s.name}</h3><div class="cyan">${esc(s.class)}</div><p>${esc(s.role)}</p><div class="row"><span>Hull</span><b>${s.hull}/${s.hullMax}</b></div>${meter(s.hull,s.hullMax,statusClass(s.hull,s.hullMax))}<div class="controls"><button class="btn step" data-shipstep="hull:-5">-5</button><button class="btn step" data-shipstep="hull:5">+5</button></div><div class="row"><span>Shields</span><b>${s.shields}/${s.shieldsMax}</b></div>${meter(s.shields,s.shieldsMax,statusClass(s.shields,s.shieldsMax))}<div class="controls"><button class="btn step" data-shipstep="shields:-5">-5</button><button class="btn step" data-shipstep="shields:5">+5</button></div><div class="row"><span>Fuel</span><b>${s.fuel}/${s.fuelMax}</b></div>${meter(s.fuel,s.fuelMax,statusClass(s.fuel,s.fuelMax))}<div class="controls"><button class="btn step" data-shipstep="fuel:-5">-5</button><button class="btn step" data-shipstep="fuel:5">+5</button></div></div></div></div>
 <div class="card span6"><h3>Ship Systems</h3>${s.systems.map(x=>`<div class="system-row ${!x.online?"offline":""}" data-system="${x.id}"><div><b>${esc(x.name)}</b><div class="small">${x.online?"ONLINE":"OFFLINE"} • ${x.condition}%</div></div>${meter(x.condition,100,statusClass(x.condition))}</div>`).join("")}</div>
 <div class="card span6"><h3>Raven Specs</h3>${Object.entries(s.specs).map(([k,v])=>`<div class="row"><span class="muted">${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</div>
 <div class="card full"><div class="row"><h3>Holographic Diagnostic Schematic</h3><span class="pill cyan">LIVE TELEMETRY</span></div><div class="aurebesh-strip">RAVEN // ⌖ SYS-7 // ⟐ POWER BUS // ⌁ FLIGHT CONTROL // DEADLOCK</div><div class="raven-schematic">${ravenVisual("schematic","The Raven holographic schematic")}<div class="schematic-sweep"></div>
 ${node("engines","ENG",15,61)}${node("thrusters","THR",35,72)}${node("hyperdrive","HYP",49,55)}${node("comms","COM",70,26)}${node("overcharge","SHD",55,39)}${node("bench","WPN",66,68)}${node("cells","CEL",43,31)}${node("smuggling","HID",28,42)}
 <div class="schematic-caption"><div><div class="schematic-title">THE RAVEN // SYSTEM MAP</div><div class="schematic-code">HOLOGRAPHIC DIAGNOSTIC // TAP NODES FOR CONTROL</div></div><button class="btn" onclick="render('Dogfight')">FLIGHT HUD</button></div></div></div>
 </div>`
}
function contractHTML(c){
 if(c.id==="v14_signal_in_the_rain")return `<div class="contract"><h3>Signal in the Rain</h3><p>Guided recovery contract · ${esc(c.status)} · 2,400 cr</p><button class="btn" data-contract="${c.id}:story">${c.status==="Completed"?"View mission record":"Continue guided mission"}</button></div>`;
 const st=contractStageInfo(c),active=DATA.story?.activeContractId===c.id,p=Number(c.progress||0),confidence=contractConfidenceLabel(c);
 return `<div class="contract mission-contract ${active?"active-contract":""}"><div class="contract-top"><div><b>${esc(c.title)}</b><div class="small cyan">STAGE ${st.index}/6 // ${esc(st.title)}</div><div class="small muted">${esc(st.goal)}</div></div><div class="reward">${money(c.reward)}</div><div class="${c.status==='Completed'?'good-text':c.status==='Failed'?'danger-text':'cyan'}">${c.status}</div></div>${missionStageStripHTML(c)}<div class="mission-contract-progress"><span>${confidence}</span><b>${p}%</b></div>${meter(p)}<div class="controls">${c.status==="Active"?`<button class="btn ${active?'good':''}" data-contract="${c.id}:track">${active?'TRACKING':'TRACK THIS JOB'}</button>`:""}${p>=100&&c.status==="Active"?`<button class="btn good" data-contract="${c.id}:turnin">TURN IN</button>`:""}<button class="btn" data-contract="${c.id}:story">OPEN IN STORY</button><button class="btn" data-contract="${c.id}:edit">Details</button></div></div>`
}
function pageContracts(){return `<div class="card"><div class="row"><h3>Contract Board</h3><button class="btn" data-open="newContract">New Contract</button></div>${DATA.contracts.map(contractHTML).join("")}</div>`}
function pageContacts(){return `<div class="card"><div class="row"><h3>Contacts</h3><button class="btn" data-open="newContact">Add Contact</button></div><div class="tile-grid">${DATA.contacts.map(c=>`<div class="tile" data-contact="${c.id}"><div class="name">${esc(c.name)}</div><div class="sub">${esc(c.role)}</div>${meter(c.trust)}<p>${esc(c.notes)}</p></div>`).join("")}</div></div>`}
function pageInventory(){return `<div class="card"><div class="row"><h3>Inventory</h3><button class="btn" data-open="newItem">Add Item</button></div><div class="tile-grid">${DATA.inventory.map(i=>`<div class="tile no-click"><div class="name">${esc(i.name)}</div><div class="sub">${esc(i.category)}</div><div class="kpi"><b>${i.qty}</b><span>/ ${i.max}</span></div><p>${esc(i.notes)}</p><div class="controls"><button class="btn step" data-item="${i.id}:-1">-</button><button class="btn step" data-item="${i.id}:1">+</button></div></div>`).join("")}</div></div>`}
function pageJournal(){return `<div class="card"><div class="row"><h3>Journal</h3><button class="btn" data-open="newJournal">New Entry</button></div>${[...DATA.journal].reverse().map(j=>`<div class="journal"><div class="small cyan">${esc(j.ts)}</div><b>${esc(j.title)}</b><p>${esc(j.text)}</p></div>`).join("")}</div>`}
function pageFactions(){return `<div class="card"><h3>Faction Reputation</h3>${DATA.factions.map(f=>`<div class="tile no-click"><div class="row"><b>${esc(f.name)}</b><b class="${f.score<0?'danger-text':'good-text'}">${f.score>0?'+':''}${f.score}</b></div><div class="small muted">${esc(f.status)}</div>${meter(f.score+100,200)}<div class="controls"><button class="btn step" data-faction="${f.id}:-5">-5</button><button class="btn step" data-faction="${f.id}:5">+5</button></div></div>`).join("")}</div>`}
function pageDice(){return `<div class="grid"><div class="card span5"><h3>Dice Roller</h3><div class="field"><label>Die</label><select id="dieSides">${[4,6,8,10,12,20,100].map(n=>`<option value="${n}" ${n===20?'selected':''}>d${n}</option>`).join("")}</select></div><div class="field"><label>Number of Dice</label><input id="dieCount" type="number" min="1" max="20" value="1"></div><div class="field"><label>Modifier</label><input id="dieMod" type="number" value="0"></div><button class="btn" id="rollBtn">Roll</button><div class="dice" id="diceResult">—</div></div><div class="card span7"><h3>Roll History</h3><div class="log">${diceHistory.map(r=>`<div>${r.time} — ${r.count}d${r.sides}${r.mod>=0?'+':''}${r.mod}: [${r.rolls.join(", ")}] = <b>${r.total}</b></div>`).join("")||"No rolls yet."}</div></div></div>`}
function pageGMControls(){
 return `<div class="grid"><div class="card span6"><h3>Combat Mechanics</h3><p class="muted">${esc(DATA.meta.rulesNote)}</p>
 ${DATA.weapons.map(w=>`<div class="tile no-click"><b>${w.name}</b><div class="field"><label>Attack modifier</label><input type="number" data-gmweapon="${w.id}:attackMod" value="${w.combat.attackMod}"></div><div class="field"><label>Damage formula</label><input data-gmweapon="${w.id}:damage" value="${esc(w.combat.damage)}"></div></div>`).join("")}</div>
 <div class="card span6"><h3>Raven Dogfight Mechanics</h3><div class="field"><label>Attack modifier</label><input type="number" data-gmship="attackMod" value="${DATA.ship.dogfight.attackMod}"></div><div class="field"><label>Forward cannon damage</label><input data-gmship="damage" value="${esc(DATA.ship.dogfight.damage)}"></div><div class="field"><label>Boost fuel cost</label><input type="number" data-gmship="boostFuelCost" value="${DATA.ship.dogfight.boostFuelCost}"></div><div class="field"><label>Shield overcharge fuel cost</label><input type="number" data-gmship="shieldOverchargeCost" value="${DATA.ship.dogfight.shieldOverchargeCost}"></div></div>
 <div class="card full"><h3>Raw Campaign Data</h3><p class="muted">Advanced: edit the entire save. This is the fastest way to change anything the UI does not expose yet.</p><button class="btn" id="rawEdit">Open Raw JSON Editor</button></div></div>`
}
function pageSettings(){return `<div class="grid"><div class="card span6"><h3>Android / PWA</h3><p>This build is installable as a Progressive Web App when served over HTTPS. On Android Chrome, use <b>Install App</b> or <b>Add to Home screen</b>.</p><div class="controls"><button class="btn" id="installSettings">Install App</button><button class="btn" id="wakeSettings">Keep Screen Awake</button></div></div>
 <div class="card span6"><h3>Interface / Renderer</h3><div class="row"><span>Compact mode</span><input id="compactToggle" type="checkbox" ${DATA.settings.compact?'checked':''} style="width:auto"></div><div class="row"><span>Animations</span><input id="animToggle" type="checkbox" ${DATA.settings.animations!==false?'checked':''} style="width:auto"></div><div class="row"><span>GPU cinematic backdrop</span><input id="gpuToggle" type="checkbox" ${DATA.settings.gpuBackdrop!==false?'checked':''} style="width:auto"></div><div class="row"><span>Diegetic game HUD</span><input id="hudToggle" type="checkbox" ${DATA.settings.diegeticHud!==false?'checked':''} style="width:auto"></div><div class="row"><span>Cinematic travel / encounter sequences</span><input id="cinematicToggle" type="checkbox" ${DATA.settings.cinematicSequences!==false?'checked':''} style="width:auto"></div><div class="row"><span>Living character rigs</span><input id="actorRigToggle" type="checkbox" ${DATA.settings.actorRigs!==false?'checked':''} style="width:auto"></div><div class="row"><span>Environmental weather / particles</span><input id="worldFxToggle" type="checkbox" ${DATA.settings.worldFx!==false?'checked':''} style="width:auto"></div><div class="field"><label>Graphics profile</label><select id="graphicsQuality"><option value="performance" ${DATA.settings.graphicsQuality==='performance'?'selected':''}>Performance</option><option value="balanced" ${DATA.settings.graphicsQuality==='balanced'?'selected':''}>Balanced</option><option value="high" ${DATA.settings.graphicsQuality!=='performance'&&DATA.settings.graphicsQuality!=='balanced'?'selected':''}>High</option></select></div><div class="row"><span>Fold Optimization</span><input id="foldToggle" type="checkbox" ${DATA.settings.foldOptimization!==false?'checked':''} style="width:auto"></div><div class="field"><label>Center-crease gutter (px)</label><input id="hingeGutterInput" type="number" min="12" max="48" value="${Number(DATA.settings.hingeGutter||22)}"></div><div class="small muted">v13 keeps game logic separate from presentation. Cinematics, actor rigs, environmental FX, GPU, and HUD layers can be disabled without affecting saves, combat, story, or galaxy state.</div></div>
 <div class="card span6 audio-settings"><h3>Audio</h3><div class="row"><span>Master sound</span><input id="soundToggle" type="checkbox" ${uiSound?'checked':''} style="width:auto"></div><div class="row"><span>Cinematic orchestral score</span><input id="musicToggle" type="checkbox" ${DATA.settings.music!==false?'checked':''} style="width:auto"></div><div class="field"><label>Music volume <span id="musicVolumeLabel">${Number(DATA.settings.musicVolume??55)}%</span></label><input id="musicVolumeInput" type="range" min="0" max="100" step="1" value="${Number(DATA.settings.musicVolume??55)}"></div><div class="row"><span>Environmental audio / effects</span><input id="worldAudioToggle" type="checkbox" ${DATA.settings.worldAudio!==false?'checked':''} style="width:auto"></div><div class="field"><label>Effects volume <span id="effectsVolumeLabel">${Number(DATA.settings.effectsVolume??42)}%</span></label><input id="effectsVolumeInput" type="range" min="0" max="100" step="1" value="${Number(DATA.settings.effectsVolume??42)}"></div><div class="row"><span>NPC spoken dialogue</span><input id="voiceToggle" type="checkbox" ${DATA.settings.characterVoices!==false?'checked':''} style="width:auto"></div><div class="field"><label>Voice volume <span id="voiceVolumeLabel">${Number(DATA.settings.voiceVolume??78)}%</span></label><input id="voiceVolumeInput" type="range" min="0" max="100" step="1" value="${Number(DATA.settings.voiceVolume??78)}"></div><div class="controls"><button class="btn" id="testNpcVoice">Test Dren Voice</button></div><div class="small muted">Dialogue uses your device's installed text-to-speech voices. Offline speech depends on having an Android TTS voice downloaded; the procedural orchestral score itself needs no network or audio files.</div></div>
 <div class="card full"><h3>Data</h3><p class="muted">Campaign state auto-saves locally. Export a JSON backup before major changes.</p><div class="controls"><button class="btn" id="saveNow">Save Now</button><button class="btn warn" id="resetData">Reset Included Data</button></div></div></div>`}

function roll(sides=20,count=1,mod=0){let rolls=Array.from({length:count},()=>rollDie(sides)),total=rolls.reduce((a,b)=>a+b,0)+mod;diceHistory.unshift({sides,count,mod,rolls,total,time:new Date().toLocaleTimeString()});diceHistory=diceHistory.slice(0,25);return {rolls,total}}
function openModal(t,b){$("#modalTitle").textContent=t;$("#modalBody").innerHTML=b;$("#modal").showModal()}
$("#closeModal").onclick=()=>$("#modal").close();

function wire(){
 wireStory();
 $$("[data-holotx]").forEach(el=>el.onclick=()=>openHoloTransmission(el.dataset.holotx));
 if($("#generateTransmission"))$("#generateTransmission").onclick=()=>{const tx=generateHolonetTransmission();render("Holonet");setTimeout(()=>openHoloTransmission(tx.id),80)};
 if($("#holoPlotRoute"))$("#holoPlotRoute").onclick=()=>{plotHyperspaceRoute(DATA.holonet.route?.destinationId);render("Holonet")};
 if($("#plotRoute"))$("#plotRoute").onclick=()=>{plotHyperspaceRoute($("#routeDestination").value);render("Galaxy")};
 $$("[data-galaxy-node]").forEach(b=>b.onclick=()=>{galaxyState().selectedLocationId=b.dataset.galaxyNode;save();render("Galaxy")});
 $$("[data-travel]").forEach(b=>b.onclick=()=>{const a=b.dataset.travel;if(a==="plot")plotLivingRoute(galaxyState().selectedLocationId);if(a==="depart")beginLivingTravel();if(a==="continue")continueLivingTravel()});
 $$("[data-travel-encounter]").forEach(b=>b.onclick=()=>resolveTravelEncounter(b.dataset.travelEncounter));
 $$("[data-local-action]").forEach(b=>b.onclick=()=>performLocalAction(b.dataset.localAction));
 $$("[data-hq-site]").forEach(b=>b.onclick=()=>handleHqSite(b.dataset.hqSite));
 $$("[data-hq-action]").forEach(b=>b.onclick=()=>handleHqAction(b.dataset.hqAction));
 $$("[data-ship-scene]").forEach(b=>b.onclick=()=>{DATA.settings.shipScene=b.dataset.shipScene;save();render("Ship")});
 $$("[data-world-site]").forEach(b=>b.onclick=()=>startLocalSite(b.dataset.worldSite));
 $$("[data-world-service]").forEach(b=>b.onclick=()=>handleWorldService(b.dataset.worldService));

 $$("[data-charstep]").forEach(b=>b.onclick=()=>{let[k,d]=b.dataset.charstep.split(":");let c=DATA.character;c[k]=clamp(c[k]+Number(d),0,c[k+"Max"]||9999);if(k==="health"){let r=DATA.combat.participants.find(x=>x.id==="rovan");if(r){r.hp=c[k];r.hpMax=c[k+"Max"]}}save();render()});
 $$("[data-attr]").forEach(b=>b.onclick=()=>{let[k,d]=b.dataset.attr.split(":");DATA.character.attributes[k]=clamp(DATA.character.attributes[k]+Number(d),1,30);save();render()});
 $$("[data-skill]").forEach(b=>b.onclick=()=>{let[k,d]=b.dataset.skill.split(":");DATA.character.skills[k]=clamp(DATA.character.skills[k]+Number(d),0,100);save();render()});
 $$("[data-bind]").forEach(el=>el.onchange=()=>{let[a,b]=el.dataset.bind.split(".");DATA[a][b]=el.value;save();toast("Saved")});
 $$("[data-mode]").forEach(sel=>sel.onchange=()=>{DATA.weapons.find(w=>w.id===sel.dataset.mode).mode=sel.value;save();toast("Weapon mode changed")});
 $$("[data-charge]").forEach(b=>b.onclick=()=>{let[id,d]=b.dataset.charge.split(":");let w=DATA.weapons.find(w=>w.id===id);w.charge=clamp(w.charge+Number(d),0,w.chargeMax);save();render()});
 $$("[data-fire]").forEach(b=>b.onclick=()=>{let w=DATA.weapons.find(w=>w.id===b.dataset.fire),cost=w.id==="blackwake"?8:5;if(w.charge<cost)return toast("Insufficient charge");w.charge-=cost;weaponSound(w.id);modeEffect(w);save();toast(`${w.name} test-fired`);render()});
 $$("[data-shipstep]").forEach(b=>b.onclick=()=>{let[k,d]=b.dataset.shipstep.split(":");let s=DATA.ship;s[k]=clamp(s[k]+Number(d),0,s[k+"Max"]||100);save();render()});
 $$("[data-system]").forEach(el=>el.onclick=()=>{let s=DATA.ship.systems.find(x=>x.id===el.dataset.system);s.online=!s.online;save();toast(`${s.name}: ${s.online?'online':'offline'}`);render()});
 $$("[data-item]").forEach(b=>b.onclick=()=>{let[id,d]=b.dataset.item.split(":");let i=DATA.inventory.find(x=>x.id===id);i.qty=clamp(i.qty+Number(d),0,i.max);save();render()});
 $$("[data-faction]").forEach(b=>b.onclick=()=>{let[id,d]=b.dataset.faction.split(":");let f=DATA.factions.find(x=>x.id===id);f.score=clamp(f.score+Number(d),-100,100);save();render()});
 $$("[data-contract]").forEach(b=>b.onclick=()=>handleContract(b.dataset.contract));
 $$("[data-weapon]").forEach(el=>el.onclick=()=>openWeapon(el.dataset.weapon));
 $$("[data-gear]").forEach(el=>el.onclick=()=>openGear(el.dataset.gear));
 $$("[data-identity]").forEach(el=>el.onclick=()=>openIdentity(el.dataset.identity));
 $$("[data-contact]").forEach(el=>el.onclick=()=>openContact(el.dataset.contact));
 $$("[data-target]").forEach(el=>el.onclick=()=>openTarget(el.dataset.target));
 $$("[data-location]").forEach(el=>el.onclick=()=>openLocation(el.dataset.location));
 $$("[data-mission]").forEach(el=>el.onclick=()=>openMission(el.dataset.mission));
 $$("[data-open]").forEach(el=>el.onclick=()=>openForm(el.dataset.open));
 $$("[data-combatcmd]").forEach(b=>b.onclick=()=>combatCommand(b.dataset.combatcmd));
 $$("[data-combat-action]").forEach(b=>b.onclick=()=>{if(b.dataset.combatAction==="guard")combatPlayerGuard();if(b.dataset.combatAction==="flee")attemptCombatFlee()});
 $$("[data-combatcard]").forEach(el=>el.onclick=()=>{let p=DATA.combat.participants.find(x=>x.id===el.dataset.combatcard);if(p?.side==="Enemy"){selectedCombatTarget=p.id;toast(`Target selected: ${p.name}`);render("Combat")}});
 if($("#combatTarget"))$("#combatTarget").onchange=e=>{selectedCombatTarget=e.target.value};
 if($("#openWeaponWheelBtn"))$("#openWeaponWheelBtn").onclick=openWeaponWheel;
 if($("#quickFireBtn"))$("#quickFireBtn").onclick=()=>weaponAttack(selectedCombatWeapon,selectedCombatTarget);

 $$("[data-combat]").forEach(b=>b.onclick=()=>combatantAction(b.dataset.combat));
 $$("[data-attack]").forEach(b=>b.onclick=()=>weaponAttack(b.dataset.attack));
 $$("[data-dogcmd]").forEach(b=>b.onclick=()=>dogCommand(b.dataset.dogcmd));
 $$("[data-dogenemy]").forEach(b=>b.onclick=()=>dogEnemyAction(b.dataset.dogenemy));
 $$("[data-gmweapon]").forEach(el=>el.onchange=()=>{let[id,k]=el.dataset.gmweapon.split(":");let w=DATA.weapons.find(x=>x.id===id);w.combat[k]=k==="attackMod"?Number(el.value):el.value;save();toast("GM mechanic saved")});

 $$("[data-hotspot]").forEach(b=>b.onclick=()=>{let s=DATA.ship.systems.find(x=>x.id===b.dataset.hotspot);if(!s)return;openModal(s.name,`<div class="${s.online?'good-text':'danger-text'}">${s.online?'ONLINE':'OFFLINE'}</div><p>Condition: ${s.condition}%</p><button class="btn" id="toggleHotspot">${s.online?'Take Offline':'Bring Online'}</button>`);setTimeout(()=>$("#toggleHotspot").onclick=()=>{s.online=!s.online;uiBeep(s.online?620:210,.07,.03);save();$("#modal").close();render("Ship")},0)});

 $$("[data-gmship]").forEach(el=>el.onchange=()=>{let k=el.dataset.gmship;DATA.ship.dogfight[k]=["attackMod","boostFuelCost","shieldOverchargeCost"].includes(k)?Number(el.value):el.value;save();toast("GM mechanic saved")});

 if($("#generateBounty"))$("#generateBounty").onclick=()=>{let b=genBounty();DATA.holonet.lastPuck={name:b.name,reward:b.reward,status:b.status,danger:b.danger};$("#generatedBounty").innerHTML=`${targetCard(b)}<div class="controls"><button class="btn good" id="acceptGenerated">ACCEPT CONTRACT</button><button class="btn" id="saveGenerated">Save as Target</button><button class="btn" id="regen">Reroll</button></div>`;showBountyPuck(b);
 $("#acceptGenerated").onclick=()=>{DATA.targets.push(b);DATA.contracts.push({id:uid("contract"),title:`Bounty: ${b.name}`,client:"Generated bounty network",reward:b.reward,status:"Active",objective:`Locate and recover ${b.name}.`,notes:`Generated lead: ${(b.intel||[]).join("; ")}`,progress:0,targetId:b.id});addNotification(`New bounty accepted: ${b.name}.`,"warn");save();showBountyCinematic(b);};
 $("#saveGenerated").onclick=()=>{DATA.targets.push(b);save();toast("Target dossier saved");render("Targets")};$("#regen").onclick=()=>render("Bounties")};
 if($("#rollBtn"))$("#rollBtn").onclick=()=>{let r=roll(Number($("#dieSides").value),Number($("#dieCount").value),Number($("#dieMod").value));$("#diceResult").textContent=r.total;render("Dice")};
 if($("#compactToggle"))$("#compactToggle").onchange=e=>{DATA.settings.compact=e.target.checked;document.body.classList.toggle("compact",e.target.checked);save()};
 if($("#animToggle"))$("#animToggle").onchange=e=>{DATA.settings.animations=e.target.checked;document.body.classList.toggle("no-anim",!e.target.checked);save()};
 if($("#gpuToggle"))$("#gpuToggle").onchange=e=>{DATA.settings.gpuBackdrop=e.target.checked;window.DeadlockGPU?.setEnabled?.(e.target.checked);save()};
 if($("#hudToggle"))$("#hudToggle").onchange=e=>{DATA.settings.diegeticHud=e.target.checked;window.DeadlockHUD?.setEnabled?.(e.target.checked);save();render()};
 if($("#cinematicToggle"))$("#cinematicToggle").onchange=e=>{DATA.settings.cinematicSequences=e.target.checked;save()};
 if($("#actorRigToggle"))$("#actorRigToggle").onchange=e=>{DATA.settings.actorRigs=e.target.checked;save();render()};
 if($("#worldFxToggle"))$("#worldFxToggle").onchange=e=>{DATA.settings.worldFx=e.target.checked;save();render()};
 if($("#graphicsQuality"))$("#graphicsQuality").onchange=e=>{DATA.settings.graphicsQuality=e.target.value;document.body.dataset.graphics=e.target.value;save();toast(`Graphics: ${e.target.value}`)};
 if($("#soundToggle"))$("#soundToggle").onchange=e=>{uiSound=e.target.checked;DATA.settings.sound=uiSound;$("#soundBtn").textContent=`Sound: ${uiSound?"On":"Off"}`;save();syncAudioState()};
 if($("#musicToggle"))$("#musicToggle").onchange=e=>{DATA.settings.music=e.target.checked;save();syncAudioState()};
 if($("#voiceToggle"))$("#voiceToggle").onchange=e=>{DATA.settings.characterVoices=e.target.checked;if(!e.target.checked)window.speechSynthesis?.cancel();save()};
 if($("#musicVolumeInput"))$("#musicVolumeInput").oninput=e=>{DATA.settings.musicVolume=clamp(Number(e.target.value),0,100);$("#musicVolumeLabel").textContent=DATA.settings.musicVolume+"%";if(AMBIENT?.running)setAmbientDuck(false);save()};
 if($("#voiceVolumeInput"))$("#voiceVolumeInput").oninput=e=>{DATA.settings.voiceVolume=clamp(Number(e.target.value),0,100);$("#voiceVolumeLabel").textContent=DATA.settings.voiceVolume+"%";save()};
 if($("#testNpcVoice"))$("#testNpcVoice").onclick=()=>{unlockGameAudio();speakCharacter("Dren Voss","Channel's open, Deadlock. Try not to make me regret it.",{force:true})};
 if($("#foldToggle"))$("#foldToggle").onchange=e=>{DATA.settings.foldOptimization=e.target.checked;if(!e.target.checked){document.body.classList.remove("fold-unfolded","fold-flex")}else detectFoldLayout();save()};
 if($("#hingeGutterInput"))$("#hingeGutterInput").onchange=e=>{DATA.settings.hingeGutter=clamp(Number(e.target.value||22),12,48);save();detectFoldLayout();toast("Fold gutter updated")};
 if($("#saveNow"))$("#saveNow").onclick=()=>{save();toast("Dashboard saved")};
 if($("#resetData"))$("#resetData").onclick=()=>{if(confirm("Reset all local changes to the included campaign data?")){localStorage.removeItem(STORAGE_KEY);location.reload()}};
 if($("#installSettings"))$("#installSettings").onclick=triggerInstall;
 if($("#wakeSettings"))$("#wakeSettings").onclick=toggleWake;
 if($("#rawEdit"))$("#rawEdit").onclick=rawEditor;
}

function combatCommand(cmd){
 let c=DATA.combat;
 if(cmd==="add")return openForm("newCombatant");
 if(cmd==="rollinit"){c.participants.forEach(p=>p.initiative=rollDie(20)+Number(p.initiativeBonus||0));c.participants.sort((a,b)=>b.initiative-a.initiative);c.turnIndex=0;logCombat("Initiative rolled.");save();return render()}
 if(cmd==="start"){c.active=true;c.round=1;c.turnIndex=0;c.participants.sort((a,b)=>b.initiative-a.initiative);logCombat("Encounter started.");save();return render()}
 if(cmd==="next"){if(!c.active)return toast("Start the encounter first");if(c.forced)return advanceCombatTurn();c.turnIndex++;if(c.turnIndex>=c.participants.length){c.turnIndex=0;c.round++}save();return render()}
 if(cmd==="end"){if(c.forced)return toast("Forced encounter: win the fight or break contact");c.active=false;c.round=0;c.turnIndex=0;logCombat("Encounter ended.");save();return render()}
}
function combatantAction(spec){
 let[id,act]=spec.split(":"),p=DATA.combat.participants.find(x=>x.id===id);if(!p)return;
 if(act==="remove"){DATA.combat.participants=DATA.combat.participants.filter(x=>x.id!==id);save();return render()}
 if(act==="damage"||act==="heal"){openModal(`${act==="damage"?"Damage":"Heal"} ${p.name}`,`<div class="field"><label>Amount</label><input id="hpAmount" type="number" value="5"></div><button class="btn" id="applyHp">Apply</button>`);setTimeout(()=>$("#applyHp").onclick=()=>{let a=Math.max(0,Number($("#hpAmount").value||0));p.hp=clamp(p.hp+(act==="heal"?a:-a),0,p.hpMax);if(p.id==="rovan")DATA.character.health=p.hp;logCombat(`${p.name} ${act==="heal"?"healed":"took"} ${a} HP.`);
 if(act==="heal"){fx("heal");floatNumber("+"+a,"heal")}else{fx("hit");floatNumber("-"+a,"damage")}
 save();$("#modal").close();render()},0)}
 if(act==="cond"){openModal(`Condition — ${p.name}`,`<div class="field"><label>Condition</label><input id="condName" placeholder="Stunned, restrained..."></div><button class="btn" id="addCond">Add</button><div class="pills">${(p.conditions||[]).map((x,i)=>`<button class="pill" data-remcond="${i}">${esc(x)} ×</button>`).join("")}</div>`);setTimeout(()=>{$("#addCond").onclick=()=>{let v=$("#condName").value.trim();if(v)(p.conditions||(p.conditions=[])).push(v);save();$("#modal").close();render()};$$("[data-remcond]").forEach(b=>b.onclick=()=>{p.conditions.splice(Number(b.dataset.remcond),1);save();$("#modal").close();render()})},0)}
}
function weaponAttack(id,targetId=null){
 let w=DATA.weapons.find(x=>x.id===id),c=DATA.combat,enemies=liveCombatEnemies();if(!enemies.length)return toast("No hostile combatants");
 const current=c.participants[c.turnIndex];if(c.active&&current?.id!=="rovan")return toast("Wait for Rovan's turn");
 let target=c.participants.find(x=>x.id===(targetId||selectedCombatTarget))||enemies[0],natural=rollDie(20),attack=natural+skillBonus("Marksmanship")+Number(w.combat.attackMod||0),def=Number(target.defense||11),dmg=parseDice(w.combat.damage),isCrit=natural===20,hit=isCrit||attack>=def;
 if(c.forced){
  const damage=hit?dmg.total*(isCrit?2:1):0;
  sceneActionFx("player-shot",w.id);weaponSound(w.id);
  if(hit){target.hp=clamp(target.hp-damage,0,target.hpMax);sceneActionFx("hit");floatNumber("-"+damage,"damage");if(isCrit)criticalFx();}
  logCombat(`${w.name}: ${attack} vs DEF ${def} — ${hit?`${isCrit?"CRITICAL ":""}HIT for ${damage}`:"MISS"}.`);
  toast(hit?`${w.name}: ${damage} damage to ${target.name}`:`${w.name} misses — turn spent`);
  save();if(checkCombatResolution())return;advanceCombatTurn();render("Combat");return;
 }
 sceneActionFx("player-shot",w.id);if(isCrit){criticalFx();addNotification(`CRITICAL opportunity with ${w.name} against ${target.name}.`,"warn")}
 openModal(`${w.name} // ${isCrit?"CRITICAL ":""}${hit?"HIT":"MISS"}`, `<div class="big-number">${attack}</div><p>Attack roll against <b>${esc(target.name)}</b> // DEF <b>${def}</b>.</p><p>${hit?`Damage roll: <b>${dmg.total}</b> (${esc(w.combat.damage)})`:'<b class="danger-text">The shot misses. The turn is spent.</b>'}</p><div class="field"><label>Target</label><select id="attackTarget">${enemies.map(e=>`<option value="${e.id}" ${e.id===target.id?"selected":""}>${esc(e.name)}</option>`).join("")}</select></div><div class="controls">${hit?`<button class="btn good" id="applyAttackDamage">Apply ${dmg.total} Damage</button>${isCrit?`<button class="btn warn" id="applyCritDamage">Apply Critical ×2 (${dmg.total*2})</button>`:""}`:'<button class="btn" id="finishMiss">Continue</button>'}</div><p class="small muted">${esc(w.combat.note||"")}</p>`);
 setTimeout(()=>{
   const finishTurn=()=>{save();$("#modal").close();if(checkCombatResolution())return;if(c.active)advanceCombatTurn();else render()};
   const apply=(amount,crit=false)=>{let t=c.participants.find(x=>x.id===$("#attackTarget").value);t.hp=clamp(t.hp-amount,0,t.hpMax);selectedCombatTarget=t.id;weaponSound(w.id);modeEffect(w);fx("hit");floatNumber("-"+amount,"damage");if(crit)criticalFx();logCombat(`${w.name} ${crit?"critical ":""}attack ${attack} vs DEF ${t.defense||11}; ${amount} damage to ${t.name}.`);addNotification(`${w.name} ${crit?"CRITICAL ":""}hit ${t.name} for ${amount}.`,"danger");finishTurn()};
   if($("#applyAttackDamage"))$("#applyAttackDamage").onclick=()=>apply(dmg.total,false);
   if($("#applyCritDamage"))$("#applyCritDamage").onclick=()=>apply(dmg.total*2,true);
   if($("#finishMiss"))$("#finishMiss").onclick=()=>{weaponSound(w.id);logCombat(`${w.name} attack ${attack} vs DEF ${def}: MISS.`);finishTurn()};
 },0)
}
function dogCommand(cmd){
 let d=DATA.dogfight,s=DATA.ship;
 if(cmd==="start"){d.active=true;d.round=1;logDogfight("Dogfight started.");save();return render()}
 if(cmd==="end"){if(d.forced)return toast("Forced dogfight: destroy hostiles or break pursuit");d.active=false;logDogfight("Dogfight ended.");save();return render()}
 if(!d.active)return toast("Start the dogfight first");
 if(cmd==="escape")return attemptDogfightEscape();
 if(cmd==="fire"){sceneActionFx("ship-fire");let live=liveDogfightEnemies();if(!live.length)return finishForcedDogfight("victory");let target=live[0],atk=rollDie(20)+skillBonus("Piloting")+Number(s.dogfight.attackMod||0),def=10+Number(target.threat||1),dmg=parseDice(s.dogfight.damage);if(atk>=def){target.hp=clamp(target.hp-dmg.total,0,target.hpMax);uiBeep(120,.12,.055,"square");fx("hit");floatNumber("-"+dmg.total,"damage");logDogfight(`Forward cannons: attack ${atk} vs DEF ${def}, ${dmg.total} damage to ${target.name}.`);addNotification(`Raven cannons struck ${target.name} for ${dmg.total}.`,"danger")}else logDogfight(`Forward cannons: attack ${atk} vs DEF ${def}: MISS.`);if(!liveDogfightEnemies().length)return finishForcedDogfight("victory");save();return setTimeout(()=>enemyDogfightVolley(),220)}
 if(cmd==="evade"){let r=rollDie(20)+Number(s.dogfight.evasionBonus||0);logDogfight(`Evasive maneuver roll: ${r}.`);if(r>=15){s.shields=clamp(s.shields+5,0,s.shieldsMax);logDogfight("The Raven gains separation; shields recover 5.")}save();return setTimeout(()=>enemyDogfightVolley(),220)}
 if(cmd==="boost"){let cost=Number(s.dogfight.boostFuelCost||0);if(s.fuel<cost)return toast("Not enough fuel");s.fuel-=cost;logDogfight(`Engine boost engaged. Fuel -${cost}.`);glitch();uiBeep(145,.18,.035,"sawtooth");addNotification("Raven boost engaged.","warn");save();return setTimeout(()=>enemyDogfightVolley(),220)}
 if(cmd==="overcharge"){let cost=Number(s.dogfight.shieldOverchargeCost||0);if(s.fuel<cost)return toast("Not enough fuel");s.fuel-=cost;s.shields=clamp(s.shields+20,0,s.shieldsMax);logDogfight(`Shield overcharge engaged. Shields +20, fuel -${cost}.`);fx("heal");uiBeep(760,.16,.03,"sine");floatNumber("+20 SHIELD","heal");addNotification("Shield overcharge engaged.","info");save();return setTimeout(()=>enemyDogfightVolley(),220)}
}
function dogEnemyAction(spec){let[id,act]=spec.split(":"),e=DATA.dogfight.enemies.find(x=>x.id===id);if(!e)return;if(act==="remove"){DATA.dogfight.enemies=DATA.dogfight.enemies.filter(x=>x.id!==id);save();return render()}if(act==="damage"){openModal(`Damage ${e.name}`,`<div class="field"><label>Damage</label><input id="shipDmg" type="number" value="10"></div><button class="btn" id="applyShipDmg">Apply</button>`);setTimeout(()=>$("#applyShipDmg").onclick=()=>{e.hp=clamp(e.hp-Number($("#shipDmg").value||0),0,e.hpMax);save();$("#modal").close();render()},0)}}
function handleContract(spec){
 let[id,act]=spec.split(":"),c=DATA.contracts.find(x=>x.id===id);if(!c)return;
 if(id==="v14_signal_in_the_rain")return render("First Flight");
 if(act==="track"){setActiveContract(c);DATA.story.objective=contractStageInfo(c).goal;DATA.story.choices=missionChoices(c);save();toast(`Tracking ${c.title}`);return render("Contracts")}
 if(act==="story"){setActiveContract(c);DATA.story.objective=contractStageInfo(c).goal;DATA.story.choices=missionChoices(c);save();return render("Story")}
 if(act==="turnin"){turnInContract(c);save();return render("Story")}
 if(act==="progress"){c.progress=clamp(c.progress+10,0,100);save();return render()}
 if(act==="complete"){if(!confirm(`Complete "${c.title}" and add ${money(c.reward)}?`))return;c.status="Completed";c.progress=100;DATA.character.credits+=Number(c.reward||0);DATA.journal.push({id:uid("j"),ts:new Date().toLocaleString(),title:`Contract completed: ${c.title}`,text:`Reward received: ${money(c.reward)}.`});floatNumber("+"+money(c.reward),"credits",window.innerWidth*.78,window.innerHeight*.3);eventBanner("CONTRACT COMPLETE");addNotification(`Contract completed: ${c.title}. Reward ${money(c.reward)}.`,"info");save();toast("Contract completed");return render()}
 if(act==="edit")openModal(c.title,`<div class="field"><label>Objective</label><textarea id="cObj">${esc(c.objective)}</textarea></div><div class="field"><label>Notes</label><textarea id="cNotes">${esc(c.notes)}</textarea></div><div class="field"><label>Reward</label><input id="cReward" type="number" value="${c.reward}"></div><div class="field"><label>Status</label><select id="cStatus">${["Available","Active","Completed","Failed"].map(s=>`<option ${s===c.status?"selected":""}>${s}</option>`).join("")}</select></div><p class="small muted">Advanced editing only. Normal gameplay progress is handled in Story Mode.</p><button class="btn" id="saveContract">Save</button>`),setTimeout(()=>$("#saveContract").onclick=()=>{c.objective=$("#cObj").value;c.notes=$("#cNotes").value;c.reward=Number($("#cReward").value);c.status=$("#cStatus").value;save();$("#modal").close();render()},0)
}
function openWeapon(id){let w=DATA.weapons.find(x=>x.id===id);openModal(w.name,`<div class="cyan">${w.type}</div><p>${esc(w.description)}</p><ul>${w.features.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`)}
function openGear(id){let g=DATA.gear.find(x=>x.id===id);openModal(g.name,`<div class="cyan">${g.slot}</div><p>${esc(g.notes)}</p><div class="field"><label>Condition</label><input id="editGearCond" type="number" value="${g.condition}" min="0" max="100"></div><div class="row"><span>Equipped</span><input id="editGearEq" type="checkbox" ${g.equipped?'checked':''} style="width:auto"></div><button class="btn" id="saveGear">Save</button>`);setTimeout(()=>$("#saveGear").onclick=()=>{g.condition=clamp(Number($("#editGearCond").value),0,100);g.equipped=$("#editGearEq").checked;save();$("#modal").close();render()},0)}
function openIdentity(id){let i=DATA.identities.find(x=>x.id===id);openModal(i.name,`<div class="field"><label>Name / Alias</label><input id="identName" value="${esc(i.name)}"></div><div class="field"><label>Type</label><input id="identType" value="${esc(i.type)}"></div><div class="field"><label>Notes</label><textarea id="identNotes">${esc(i.notes)}</textarea></div><div class="row"><span>Set active</span><input id="identActive" type="checkbox" ${i.active?'checked':''} style="width:auto"></div><button class="btn" id="saveIdent">Save</button>`);setTimeout(()=>$("#saveIdent").onclick=()=>{if($("#identActive").checked)DATA.identities.forEach(x=>x.active=false);i.name=$("#identName").value;i.type=$("#identType").value;i.notes=$("#identNotes").value;i.active=$("#identActive").checked;save();$("#modal").close();render()},0)}
function openContact(id){let c=DATA.contacts.find(x=>x.id===id);openModal(c.name,`<div class="cyan">${esc(c.role)}</div><p>${esc(c.notes)}</p><div class="field"><label>Trust</label><input id="trust" type="number" min="0" max="100" value="${c.trust}"></div><button class="btn" id="saveTrust">Save</button>`);setTimeout(()=>$("#saveTrust").onclick=()=>{c.trust=clamp(Number($("#trust").value),0,100);save();$("#modal").close();render()},0)}
function openTarget(id){let t=DATA.targets.find(x=>x.id===id);openModal(t.name,`<div class="row"><span>${esc(t.status)}</span><b class="reward">${money(t.reward)}</b></div><p>${esc(t.notes)}</p><h4>Intel</h4><ul>${(t.intel||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul><div class="field"><label>Status</label><input id="tStatus" value="${esc(t.status)}"></div><div class="field"><label>Location</label><input id="tLoc" value="${esc(t.location)}"></div><div class="field"><label>Notes</label><textarea id="tNotes">${esc(t.notes)}</textarea></div><div class="controls"><button class="btn" id="saveTarget">Save</button><button class="btn warn" id="lockTarget">Target Lock</button></div>`);
 setTimeout(()=>{
   $("#saveTarget").onclick=()=>{t.status=$("#tStatus").value;t.location=$("#tLoc").value;t.notes=$("#tNotes").value;save();$("#modal").close();render()};
   $("#lockTarget").onclick=()=>{currentTargetLock=t.id;glitch();uiBeep(720,.05,.03);setTimeout(()=>uiBeep(980,.07,.025),70);addNotification(`Target lock acquired: ${t.name}`,"warn");$("#modal").close();render("Targets")}
 },0)}
function openLocation(id){let l=DATA.locations.find(x=>x.id===id),missions=DATA.missions.filter(m=>m.locationId===id);openModal(l.name,`<div class="cyan">${esc(l.region)}</div><p>${esc(l.notes)}</p><h4>Missions</h4>${missions.map(m=>`<div class="journal"><b>${esc(m.title)}</b><div class="small">${esc(m.status)}</div></div>`).join("")||"<p class='muted'>None recorded.</p>"}`)}
function openMission(id){let m=DATA.missions.find(x=>x.id===id),l=DATA.locations.find(x=>x.id===m.locationId);openModal(m.title,`<div class="cyan">${esc(l?.name||"Unknown")}</div><p>${esc(m.notes)}</p><div class="field"><label>Status</label><select id="mStatus">${["Active","Paused","Completed","Failed"].map(s=>`<option ${s===m.status?"selected":""}>${s}</option>`).join("")}</select></div><button class="btn" id="saveMission">Save</button>`);setTimeout(()=>$("#saveMission").onclick=()=>{m.status=$("#mStatus").value;save();$("#modal").close();render()},0)}

function openForm(kind){
 if(kind==="credits"){openModal("Adjust Credits",`<div class="big-number">${money(DATA.character.credits)}</div><div class="field"><label>Amount (+ or -)</label><input id="creditDelta" type="number" value="0"></div><div class="field"><label>Reason</label><input id="creditReason"></div><button class="btn" id="applyCredits">Apply</button>`);setTimeout(()=>$("#applyCredits").onclick=()=>{let d=Number($("#creditDelta").value||0),r=$("#creditReason").value||"Credit adjustment";DATA.character.credits=Math.max(0,DATA.character.credits+d);floatNumber((d>=0?"+":"")+money(d),"credits");addNotification(`${r}: ${(d>=0?"+":"")}${money(d)}.`,"info");DATA.journal.push({id:uid("j"),ts:new Date().toLocaleString(),title:r,text:`Credits ${d>=0?"+":""}${money(d)}. New balance: ${money(DATA.character.credits)}.`});save();$("#modal").close();render()},0);return}
 if(kind==="xp"){openModal("Add XP",`<div class="field"><label>XP gained</label><input id="xpAdd" type="number" value="0"></div><button class="btn" id="applyXp">Apply</button>`);setTimeout(()=>$("#applyXp").onclick=()=>{DATA.character.xp+=Math.max(0,Number($("#xpAdd").value||0));while(DATA.character.xp>=DATA.character.xpNext){DATA.character.xp-=DATA.character.xpNext;DATA.character.level++;DATA.character.xpNext=Math.round(DATA.character.xpNext*1.35);eventBanner(`LEVEL ${DATA.character.level}`);addNotification(`Rovan reached level ${DATA.character.level}.`,"info")}save();$("#modal").close();render()},0);return}
 if(kind==="newCombatant"){openModal("Add Combatant",`<div class="field"><label>Name</label><input id="pName"></div><div class="field"><label>Side</label><select id="pSide"><option>Enemy</option><option>Ally</option></select></div><div class="field"><label>Max HP</label><input id="pHp" type="number" value="30"></div><div class="field"><label>Initiative Bonus</label><input id="pInit" type="number" value="0"></div><button class="btn" id="addP">Add</button>`);setTimeout(()=>$("#addP").onclick=()=>{let hp=Math.max(1,Number($("#pHp").value||1));DATA.combat.participants.push({id:uid("p"),name:$("#pName").value||"Unknown Combatant",side:$("#pSide").value,initiative:0,initiativeBonus:Number($("#pInit").value||0),hp,hpMax:hp,conditions:[]});save();$("#modal").close();render()},0);return}
 if(kind==="newEnemyShip"){openModal("Add Hostile Craft",`<div class="field"><label>Name</label><input id="esName" placeholder="Interceptor"></div><div class="field"><label>Hull / HP</label><input id="esHp" type="number" value="40"></div><button class="btn" id="addEnemyShip">Add</button>`);setTimeout(()=>$("#addEnemyShip").onclick=()=>{let hp=Math.max(1,Number($("#esHp").value||40));DATA.dogfight.enemies.push({id:uid("ship"),name:$("#esName").value||"Hostile Craft",hp,hpMax:hp});save();$("#modal").close();render()},0);return}
 if(kind==="newTarget"){openModal("New Target Dossier",`<div class="field"><label>Name</label><input id="ntName"></div><div class="field"><label>Status</label><input id="ntStatus" value="Wanted Alive"></div><div class="field"><label>Reward</label><input id="ntReward" type="number" value="0"></div><div class="field"><label>Location</label><input id="ntLoc"></div><div class="field"><label>Notes</label><textarea id="ntNotes"></textarea></div><button class="btn" id="createTarget">Create</button>`);setTimeout(()=>$("#createTarget").onclick=()=>{DATA.targets.push({id:uid("target"),name:$("#ntName").value||"Unnamed Target",species:"Unknown",status:$("#ntStatus").value,danger:1,reward:Number($("#ntReward").value||0),location:$("#ntLoc").value||"Unknown",notes:$("#ntNotes").value,intel:[],tags:["Manual"]});save();$("#modal").close();render()},0);return}
 if(kind==="newLocation"){openModal("Add Location",`<div class="field"><label>Name</label><input id="nlName"></div><div class="field"><label>Region</label><input id="nlRegion"></div><div class="field"><label>Map X (0–100)</label><input id="nlX" type="number" value="50"></div><div class="field"><label>Map Y (0–100)</label><input id="nlY" type="number" value="50"></div><div class="field"><label>Notes</label><textarea id="nlNotes"></textarea></div><button class="btn" id="createLocation">Create</button>`);setTimeout(()=>$("#createLocation").onclick=()=>{DATA.locations.push({id:uid("loc"),name:$("#nlName").value||"Unknown Location",region:$("#nlRegion").value||"Unknown",x:clamp(Number($("#nlX").value||50),0,100),y:clamp(Number($("#nlY").value||50),0,100),known:true,notes:$("#nlNotes").value});save();$("#modal").close();render()},0);return}
 if(kind==="newMission"){openModal("Add Mission",`<div class="field"><label>Title</label><input id="nmTitle"></div><div class="field"><label>Location</label><select id="nmLoc">${DATA.locations.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join("")}</select></div><div class="field"><label>Notes</label><textarea id="nmNotes"></textarea></div><button class="btn" id="createMission">Create</button>`);setTimeout(()=>$("#createMission").onclick=()=>{DATA.missions.push({id:uid("mission"),title:$("#nmTitle").value||"New Mission",locationId:$("#nmLoc").value,contractId:null,status:"Active",notes:$("#nmNotes").value});save();$("#modal").close();render()},0);return}
 if(kind==="newIdentity"){openModal("New Clawdite Identity",`<div class="field"><label>Name / Alias</label><input id="nName"></div><div class="field"><label>Type</label><input id="nType" value="Cover identity"></div><div class="field"><label>Notes</label><textarea id="nNotes"></textarea></div><button class="btn" id="createIdentity">Create</button>`);setTimeout(()=>$("#createIdentity").onclick=()=>{DATA.identities.push({id:uid("ident"),name:$("#nName").value||"Unnamed identity",type:$("#nType").value||"Cover identity",active:false,notes:$("#nNotes").value});save();$("#modal").close();render()},0);return}
 if(kind==="newContract"){openModal("New Contract",`<div class="field"><label>Title</label><input id="ncTitle"></div><div class="field"><label>Client</label><input id="ncClient"></div><div class="field"><label>Reward</label><input id="ncReward" type="number" value="0"></div><div class="field"><label>Objective</label><textarea id="ncObjective"></textarea></div><button class="btn" id="createContract">Create</button>`);setTimeout(()=>$("#createContract").onclick=()=>{DATA.contracts.push({id:uid("contract"),title:$("#ncTitle").value||"New contract",client:$("#ncClient").value||"Unknown",reward:Number($("#ncReward").value||0),status:"Active",objective:$("#ncObjective").value,notes:"",progress:0,targetId:null});save();$("#modal").close();render()},0);return}
 if(kind==="newContact"){openModal("Add Contact",`<div class="field"><label>Name</label><input id="ctName"></div><div class="field"><label>Role</label><input id="ctRole"></div><div class="field"><label>Trust</label><input id="ctTrust" type="number" min="0" max="100" value="50"></div><div class="field"><label>Notes</label><textarea id="ctNotes"></textarea></div><button class="btn" id="createContact">Create</button>`);setTimeout(()=>$("#createContact").onclick=()=>{DATA.contacts.push({id:uid("contact"),name:$("#ctName").value||"Unknown contact",role:$("#ctRole").value||"Contact",trust:clamp(Number($("#ctTrust").value),0,100),notes:$("#ctNotes").value});save();$("#modal").close();render()},0);return}
 if(kind==="newItem"){openModal("Add Inventory Item",`<div class="field"><label>Name</label><input id="itName"></div><div class="field"><label>Category</label><input id="itCat"></div><div class="field"><label>Quantity</label><input id="itQty" type="number" value="1"></div><div class="field"><label>Max</label><input id="itMax" type="number" value="10"></div><div class="field"><label>Notes</label><textarea id="itNotes"></textarea></div><button class="btn" id="createItem">Create</button>`);setTimeout(()=>$("#createItem").onclick=()=>{DATA.inventory.push({id:uid("item"),name:$("#itName").value||"New item",category:$("#itCat").value||"Misc",qty:Number($("#itQty").value||0),max:Number($("#itMax").value||99),notes:$("#itNotes").value});save();$("#modal").close();render()},0);return}
 if(kind==="newJournal"){openModal("New Journal Entry",`<div class="field"><label>Title</label><input id="jTitle"></div><div class="field"><label>Entry</label><textarea id="jText" rows="7"></textarea></div><button class="btn" id="createJournal">Save Entry</button>`);setTimeout(()=>$("#createJournal").onclick=()=>{DATA.journal.push({id:uid("j"),ts:new Date().toLocaleString(),title:$("#jTitle").value||"Journal entry",text:$("#jText").value});save();$("#modal").close();render()},0);return}
}
function rawEditor(){openModal("Raw Campaign JSON",`<textarea id="rawJSON" rows="24">${esc(JSON.stringify(DATA,null,2))}</textarea><button class="btn" id="applyRaw">Apply JSON</button>`);setTimeout(()=>$("#applyRaw").onclick=()=>{try{DATA=JSON.parse($("#rawJSON").value);save();$("#modal").close();render("Overview");toast("Raw JSON applied")}catch(e){alert("Invalid JSON: "+e.message)}},0)}

async function toggleWake(){
 try{
  if(!("wakeLock" in navigator))return toast("Wake Lock not supported on this browser");
  if(wakeLock){await wakeLock.release();wakeLock=null;$("#wakeBtn").textContent="Keep Awake";return toast("Screen may sleep normally")}
  wakeLock=await navigator.wakeLock.request("screen");$("#wakeBtn").textContent="Release Wake";toast("Screen will stay awake");
  wakeLock.addEventListener("release",()=>{wakeLock=null;$("#wakeBtn").textContent="Keep Awake"})
 }catch(e){toast("Could not keep screen awake")}
}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installBtn").hidden=false});
async function triggerInstall(){if(!deferredInstall)return toast("Use Chrome menu → Add to Home screen / Install app");deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#installBtn").hidden=true}
$("#installBtn").onclick=triggerInstall;$("#wakeBtn").onclick=toggleWake;
$("#quickRoll").onclick=()=>{let r=roll(20,1,0);toast(`d20: ${r.total}`);if(currentPage==="Dice")render("Dice")};
$("#exportBtn").onclick=()=>{let blob=new Blob([JSON.stringify(DATA,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="deadlock-campaign-save-v3.json";a.click();URL.revokeObjectURL(a.href)};
$("#importBtn").onclick=()=>$("#importFile").click();
$("#importFile").onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=async()=>{try{let imported=JSON.parse(r.result);if(!validCampaignSave(imported))throw new Error("Not a campaign save");let defaults=await fetch("character-data.json").then(x=>x.json());const upgraded=migrateOfflineData(imported,defaults);DATA=upgraded;ensureGalaxyState();ensureMissionLoopState();ensureEncounterState();save();render("Overview");if(DATA.combat?.active&&DATA.combat.forced)setTimeout(autoEnemyTurns,150);toast("Campaign save imported + upgraded for offline play")}catch(err){alert("Invalid JSON save file.")}};r.readAsText(f)};
document.addEventListener("visibilitychange",async()=>{
 if(document.visibilityState==="visible"){
  if(wakeLock){try{wakeLock=await navigator.wakeLock.request("screen")}catch(e){}}
  if(uiSound&&audioPrefs().music!==false&&AUDIO_UNLOCKED)startAmbientMusic();
 }else{
  try{window.speechSynthesis?.cancel()}catch(e){}
  stopAmbientMusic();
 }
});


$("#dismissBounty").onclick=()=>{closeBountyCinematic();render("Contracts")};
$("#weaponWheelBackdrop").onclick=closeWeaponWheel;
$("#wheelClose").onclick=closeWeaponWheel;
$("#wheelMode").onclick=cycleSelectedWeaponMode;
$("#wheelFire").onclick=()=>{closeWeaponWheel();weaponAttack(selectedCombatWeapon,selectedCombatTarget)};
$$("[data-wheelweapon]").forEach(b=>b.onclick=()=>{selectedCombatWeapon=b.dataset.wheelweapon;syncWeaponWheel();navigator.vibrate?.(12);uiBeep(480,.03,.018)});


$("#closeTransmission").onclick=closeHoloTransmission;
$("#endTransmission").onclick=closeHoloTransmission;
$("#commitTransmission").onclick=commitHoloTransmission;
$("#closePuck").onclick=closeBountyPuck;
$("#bountyPuckOverlay").onclick=e=>{if(e.target===$("#bountyPuckOverlay")||e.target===$(".puck-field"))closeBountyPuck()};

let bootRan=false;
function runBoot(){
 if(bootRan)return;bootRan=true;
 const lines=["INITIALIZING...","LINKING RAVEN TELEMETRY...","SYNCING BOUNTY NETWORK...","VERIFYING BLACKWAKE / LUNA / SOL...","CLAWDITE BIOMETRICS ONLINE","TACTICAL OS READY"];
 let i=0,bar=$("#bootBar"),line=$("#bootLine");
 const timer=setInterval(()=>{i++;bar.style.width=(i/lines.length*100)+"%";line.textContent=lines[Math.min(i-1,lines.length-1)];uiBeep(220+i*70,.025,.012);if(i>=lines.length){clearInterval(timer);setTimeout(()=>{$("#bootScreen").classList.add("hidden");document.body.classList.add("game-ready")},280)}},180)
}
window.addEventListener("load",runBoot);

$("#fullscreenBtn").onclick=async()=>{
 try{
  if(!document.fullscreenElement){await document.documentElement.requestFullscreen();document.body.classList.add("fullscreen-ui");$("#fullscreenBtn").textContent="Exit Immersive"}
  else{await document.exitFullscreen();document.body.classList.remove("fullscreen-ui");$("#fullscreenBtn").textContent="Immersive"}
 }catch(e){toast("Fullscreen unavailable")}
};
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement){document.body.classList.remove("fullscreen-ui");$("#fullscreenBtn").textContent="Immersive"}});

$("#soundBtn").onclick=()=>{uiSound=!uiSound;if(DATA?.settings)DATA.settings.sound=uiSound;$("#soundBtn").textContent=`Sound: ${uiSound?"On":"Off"}`;if(uiSound){unlockGameAudio();uiBeep(560,.06,.025)}syncAudioState();save()};

load().catch(()=>{document.getElementById("content").innerHTML='<div class="card"><h3>Unable to load the game</h3><p>Check your connection for the first launch, then reload. Your saved campaign has not been reset.</p><button class="btn" onclick="location.reload()">Retry</button></div>';});
function storyNpc(id){
 return (DATA.story?.npcs||[]).find(x=>x.id===id) || DATA.contacts.find(x=>x.id===id) || null;
}
function storyPush(type,speaker,text,extra={}){
 if(!DATA.story.history)DATA.story.history=[];
 DATA.story.history.push({
  id:uid("story"),
  scene:DATA.story.sceneNumber||1,
  type,
  speaker,
  text:String(text||""),
  ts:new Date().toLocaleTimeString(),
  ...extra
 });
 if(DATA.story.history.length>200)DATA.story.history=DATA.story.history.slice(-200);
 if(type==="dialogue"){SCENE_LAST_DIALOGUE={speaker,text:String(text||""),at:Date.now()};setTimeout(()=>{speakCharacter(speaker,text);setSceneSpeaker(speakerNpcId(speaker),true);setTimeout(()=>setSceneSpeaker(speakerNpcId(speaker),false),Math.min(5200,1200+String(text||"").length*32))},30);}else if(type==="narration")setTimeout(()=>sceneActionFx("narration"),20);
}
function storyTranscript(){
 return (DATA.story.history||[]).slice(-40).map(h=>{
  const cls=h.type==="player"?"player":h.type==="dialogue"?"npc":h.type==="system"?"system":"narrator";
  return `<div class="story-line ${cls}">
    <div class="story-speaker">${esc(h.speaker||"Narrator")}</div>
    <div class="story-text">${esc(h.text||"")}</div>
    ${h.roll?`<div class="story-roll">${esc(h.roll)}</div>`:""}
  </div>`;
 }).join("");
}
function choiceEffectHint(c){
 if(c.contractId)return `THREAD: ${contractById(c.contractId)?.title||c.contractId}`;
 if(c.systemId)return `SYSTEM: ${shipSystemById(c.systemId)?.name||c.systemId}`;
 if(c.actionType==="repair")return "SHIP REPAIR";
 if(c.intent==="deception")return "RELATIONSHIP / RISK";
 if(c.intent==="dialogue")return "RELATIONSHIP";
 return "";
}
function storyChoiceButtons(){
 return (DATA.story.choices||[]).slice(0,5).map((c,i)=>{const meta=missionChoiceMeta(c),purpose=c.purpose||meta.purpose;return `<button class="story-choice" data-storychoice="${c.id}">
   <span class="choice-num">${i+1}</span>
   <span class="choice-copy"><span class="choice-purpose">${esc(purpose)}</span><span class="choice-main">${esc(c.label)}</span><span class="choice-outcome">${esc(meta.outcome)}</span></span>
   ${c.skill?`<span class="choice-check">${esc(c.skill)}${c.dc!=null?` DC ${c.dc}`:""}</span>`:""}
 </button>`}).join("");
}
function storyInterruptionButtons(){
 return (DATA.story.interruptions||[]).map(it=>{
  const urgent=(it.urgency||0)>=8;
  return `<div class="story-interruption ${urgent?"urgent":""}">
   <div class="story-interrupt-head"><b>${urgent?"URGENT INTERRUPTION":"INTERRUPTION"} // ${esc(it.label)}</b><span class="pill">${Math.round(it.danger||0)} RISK</span></div>
   <div class="small muted">${esc(it.summary||"A new complication demands attention, but your previous options remain available.")}</div>
   <div class="story-interrupt-actions">${(it.choices||[]).slice(0,4).map((c,i)=>`<button class="story-interrupt-choice" data-storyinterrupt="${it.id}:${c.id}"><span class="story-interrupt-num">${i+1}</span><span>${esc(c.label)}</span>${c.skill?`<span class="story-interrupt-check">${esc(c.skill)}${c.dc!=null?` DC ${c.dc}`:""}</span>`:""}</button>`).join("")}</div>
  </div>`
 }).join("");
}


function currentStoryVisualNpc(){
 const s=DATA.story;
 // Prefer an NPC who spoke recently.
 const recent=[...(s.history||[])].reverse().find(h=>h.type==="dialogue");
 if(recent){
   const n=(s.npcs||[]).find(x=>x.name===recent.speaker);
   if(n)return n;
 }
 return storyNpc(s.currentNpc);
}
function storyPortrait(npc){
 if(npc){const id=npc.id==="kade"?"nera":npc.id;const mood=npcMood(npc);const state=mood==="irritated"?"angry":mood==="highRespect"?"talking":"neutral";return npc.portrait||assetUrl("characters",id,state)||assetFallback("characters",id)||assetUrl("characters","unknown","holo");}
 return assetUrl("characters","dren","holo")||"assets/npc_unknown.svg";
}
function speakerVisualHTML(){
 const s=DATA.story,npc=currentStoryVisualNpc();
 if(!npc){
  return `<div class="story-stage-visual">
   <div class="story-speaker-portrait">${characterVisual("rovan","focused","Rovan Kes")}</div>
   <div class="story-speaker-info"><div class="micro">ACTIVE DOSSIER</div><div class="story-speaker-name">ROVAN KES</div><div class="story-speaker-role">DEADLOCK // PLAYER CHARACTER</div><div class="story-speaker-tone">Clawdite bounty hunter. Player-controlled dialogue and decisions.</div><div class="dialogue-wave">${"<i></i>".repeat(18)}</div></div>
  </div>`;
 }
 return `<div class="story-stage-visual">
  <div class="story-speaker-portrait">${imgTag(storyPortrait(npc),`${npc.name} dossier`,assetFallback("characters",npc.id==="kade"?"nera":npc.id)||assetUrl("characters","unknown","holo"))}</div>
  <div class="story-speaker-info">
   <div class="micro">DIALOGUE FOCUS // ABSTRACT DOSSIER</div>
   <div class="story-speaker-name">${esc(npc.name)}</div>
   <div class="story-speaker-role">${esc(npc.role||npc.relationship||"CONTACT")}</div>
   <div class="story-speaker-tone">${esc(npc.voice||"")}</div>
   <div class="dialogue-wave">${"<i></i>".repeat(18)}</div>
  </div>
 </div>`;
}
function storyLocationVisual(){
 const s=DATA.story;
 return `<div class="story-location-strip"><div class="story-location-content">
   <div class="micro">CURRENT LOCATION</div>
   <div class="story-location-name">${esc(s.location)}</div>
   <div class="story-location-sub">${esc(s.sceneType)} // SCENE ${s.sceneNumber}</div>
   <div class="story-location-coords"><span class="pill cyan">DANGER ${s.danger}%</span><span class="pill">TURN ${s.director?.turn||0}</span><span class="pill">TENSION ${Math.round(s.director?.tension||0)}%</span></div>
 </div></div>`;
}
function storyBeatTimeline(){
 const recent=(DATA.story.history||[]).slice(-9);
 return `<div class="story-scene-timeline">${recent.map(h=>`<span class="story-beat-chip ${h.type}">${esc(h.speaker)} // ${esc(String(h.text).slice(0,34))}${String(h.text).length>34?"…":""}</span>`).join("")}</div>`;
}
const STORY_EVENT_VISUALS={
 rival_hunter:{title:"RIVAL HUNTER",sub:"Another hunter is moving on the same target",icon:"⌖",tone:"danger"},
 anonymous_ping:{title:"UNKNOWN SIGNAL",sub:"Encrypted transmission detected",icon:"⌁",tone:"warning"},
 ship_fault:{title:"SYSTEM FAULT",sub:"The Raven reports degraded hardware",icon:"⚠",tone:"danger"},
 false_bounty:{title:"SUSPICIOUS BOUNTY",sub:"Contract verification recommended",icon:"◇",tone:"warning"},
 patrol_scan:{title:"PATROL SCAN",sub:"Security sweep entering the sector",icon:"◉",tone:"danger"},
 informant_offer:{title:"INFORMANT OFFER",sub:"Paid intelligence channel opened",icon:"◆",tone:"warning"},
 new_intel:{title:"NEW INTEL",sub:"Campaign information updated",icon:"◆",tone:""},
 target_located:{title:"TARGET LOCATED",sub:"Target trail resolved",icon:"⌖",tone:"danger"},
 target_secured:{title:"TARGET SECURED",sub:"Contract objective resolved — turn-in available",icon:"✓",tone:""},
 mission_phase:{title:"MISSION PHASE ADVANCED",sub:"A new hunt phase is available",icon:"◆",tone:""},
 betrayal:{title:"BETRAYAL",sub:"Relationship state compromised",icon:"⚠",tone:"danger"},
 hyperspace:{title:"HYPERSPACE ARRIVAL",sub:"The Raven has entered a new operational zone",icon:"✦",tone:""}
};
function storyCinematic(eventId,overrideSub=null){
 const v=STORY_EVENT_VISUALS[eventId]||STORY_EVENT_VISUALS.new_intel;
 const el=$("#storyCinematic");
 $("#storyCineKicker").textContent="OFFLINE NARRATIVE DIRECTOR";
 $("#storyCineIcon").textContent=v.icon;
 $("#storyCineTitle").textContent=v.title;
 $("#storyCineSub").textContent=overrideSub||v.sub;
 el.className="story-cinematic";
 if(v.tone)el.classList.add(v.tone);
 void el.offsetWidth;el.classList.add("show");
 uiBeep(v.tone==="danger"?180:520,.08,.03,v.tone==="danger"?"sawtooth":"sine");
 if(v.tone==="danger")navigator.vibrate?.([35,25,55]);
 setTimeout(()=>el.classList.remove("show"),1900);
}
function recentVisualEvents(){
 const recent=(DATA.story.history||[]).slice(-12).filter(h=>h.eventId).slice(-3).reverse();
 return recent.map(h=>{
  const v=STORY_EVENT_VISUALS[h.eventId]||STORY_EVENT_VISUALS.new_intel;
  return `<div class="visual-event-mini"><div class="visual-event-icon">${v.icon}</div><div><strong>${v.title}</strong><span>${v.sub}</span></div></div>`;
 }).join("")||'<div class="muted small">No major visual events in the current scene.</div>';
}

function pageStory(){
 const s=DATA.story;
 const npc=storyNpc(s.currentNpc);
 const offline=s.provider!=="ai";
 return `<div class="story-shell">
  <div class="story-topbar">
    <div><div class="micro">INTERACTIVE NARRATIVE // SCENE ${s.sceneNumber||1}</div><h3>${esc(s.sessionTitle||"Deadlock Campaign")}</h3></div>
    <div class="story-status">
      <span class="pill cyan director-pulse">${offline?"OFFLINE GM // PERSONALITY":"ONLINE AI ENHANCEMENT"}</span>
      <span class="pill">${esc(s.location||"Unknown")}</span>
    </div>
  </div>
  <div class="grid">
    <div class="card span8 story-stage">
      <div class="story-stage-head">
        <div><div class="micro">CURRENT OBJECTIVE</div><div class="story-objective">${esc(s.objective||"Choose the next move.")}</div></div>
        <div class="danger-meter"><span>DANGER ${Math.round(s.danger||0)}% // ${threatBand(s.danger)}</span>${meter(s.danger||0,100,threatClass(s.danger))}<small>${Number(s.danger||0)>=85?"Hostile escalation can force combat on the next dangerous beat.":Number(s.danger||0)>=65?"Hostile complications may become forced encounters.":"Danger affects ambushes, hostile complications, and combat escalation."}</small></div>
      </div>
      <div id="storyTranscript" class="story-transcript">${storyTranscript()}</div>
      <div class="story-composer">
        <textarea id="storyInput" rows="3" placeholder='Say or do anything as Rovan. Example: “Dren, tell me what you know about Marr.”'></textarea>
        <div class="story-compose-actions">
          <button class="btn good" id="storySend">Do / Say It</button>
          <button class="btn" id="storyContinue">Continue Scene</button>
          <button class="btn" id="storyRollBtn">Skill Check</button>
        </div>
      </div>
    </div>
    <div class="card span4">
      ${consequenceActiveThreadHTML()}
      ${(s.interruptions||[]).length?`<h3>Active Interruptions</h3><div class="story-interruptions">${storyInterruptionButtons()}</div>`:""}
      <h3>Choose Your Approach</h3>
      <div class="small muted mission-choice-guide">Each option tells you what it is trying to accomplish. You can also ignore them and type any action.</div>
      <div class="story-choices">${storyChoiceButtons()}</div>
      <h3 style="margin-top:18px">Dialogue Focus</h3>
      <select id="storyNpcSelect">
        ${(s.npcs||[]).map(n=>`<option value="${n.id}" ${n.id===s.currentNpc?"selected":""}>${esc(n.name)} — ${esc(n.role)}</option>`).join("")}
      </select>
      ${npc?`<div class="npc-focus"><div class="holo-avatar">${esc((npc.name||"?").slice(0,1))}</div><div><b>${esc(npc.name)}</b><div class="small cyan">${esc(npc.relationship||npc.role||"Contact")}</div><div class="small muted">${esc(npc.voice||"")}</div></div></div>`:""}
      <div class="controls">
        <button class="btn" id="storyTalk">Start Dialogue</button>
        <button class="btn" id="storySceneSettings">Scene Setup</button>
      </div>
    </div>
    <div class="card span6">
      <h3>Interactive Consequences</h3>
      ${consequenceFeedHTML()}
      <div class="row"><span class="muted">Reliability</span><b>${Math.round(s.consequences?.reputation?.reliability||50)}</b></div>
      <div class="row"><span class="muted">Underworld Standing</span><b>${Math.round(s.consequences?.reputation?.underworld||40)}</b></div>
    </div>
    <div class="card span6">
      <h3>Story Tools</h3>
      <div class="controls">
        <button class="btn" id="storyRecap">Session Recap</button>
        <button class="btn" id="storyNewScene">New Scene</button>
        <button class="btn" id="storyMemory">Campaign Memory</button>
        <button class="btn" id="storyProvider">Narrative Engine</button><button class="btn" onclick="render('Holonet')">Holonet Ops</button>
      </div>
      <p class="small muted">${offline?"Everything on this screen is generated on-device and remains playable without a signal.":"Online AI is enabled, with offline fallback if the bridge disappears."}</p>
    </div>
  </div>
 </div>`;
}
function storySkillCheck(skill=null,dc=12,label="Skill check"){
 const skills=DATA.character.skills||{};
 const names=Object.keys(skills);
 if(!skill)skill=names[0]||"Skill";
 const score=Number(skills[skill]||50);
 const bonus=Math.floor((score-50)/10);
 const natural=rollDie(20);
 const total=natural+bonus;
 const success=total>=Number(dc||12);
 const text=`${skill}: d20 ${natural} ${bonus>=0?"+":""}${bonus} = ${total} vs DC ${dc} — ${success?"SUCCESS":"FAILURE"}`;
 storyPush("system","Dice",text,{roll:text});
 if(natural===20)criticalFx();
 if(natural===1)fx("hit");
 DATA.story.pendingRoll={skill,dc:Number(dc||12),natural,total,success,label};
 return DATA.story.pendingRoll;
}
function applyOfflineAiResponse(out){
 const s=DATA.story;
 if(out?.scene){
  if(out.scene.location)s.location=String(out.scene.location);
  if(out.scene.sceneType)s.sceneType=String(out.scene.sceneType);
  if(out.scene.objective)s.objective=String(out.scene.objective);
  if(Number.isFinite(Number(out.scene.danger)))s.danger=clamp(Number(out.scene.danger),0,100);
 }
 if(out?.narration)storyPush("narration","Narrator",out.narration);
 (out?.dialogue||[]).forEach(d=>storyPush("dialogue",d.speaker||"Unknown",d.text||""));
 if(Array.isArray(out?.choices)&&out.choices.length){
  s.choices=out.choices.slice(0,5).map(c=>({
   id:uid("choice"),label:String(c.label||"Continue"),intent:String(c.intent||"action"),
   npcId:c.npcId||null,skill:c.skill||null,dc:c.dc??null
  }));
 }
}
async function aiStoryGenerate(action="",choice=null){
 try{
  const endpoint=(DATA.story.aiEndpoint||"/api/story").trim();
  const response=await fetch(endpoint,{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({state:{character:DATA.character,weapons:DATA.weapons,ship:DATA.ship,syndicate:DATA.apex,contracts:DATA.contracts,contacts:DATA.contacts,targets:DATA.targets,story:{location:DATA.story.location,objective:DATA.story.objective,danger:DATA.story.danger,campaignMemory:DATA.story.campaignMemory,recentHistory:DATA.story.history.slice(-18)}},action,choice,pendingRoll:DATA.story.pendingRoll})
  });
  if(!response.ok)throw new Error(`Bridge ${response.status}`);
  applyOfflineAiResponse(await response.json());
  DATA.story.pendingRoll=null;save();render("Story");
 }catch(e){
  DATA.story.provider="offline";
  storyPush("system","Story Engine","Online enhancement unavailable. Offline Narrative Director resumed automatically.");
  localStoryGenerate(action,choice);save();render("Story");
 }
}
function storySubmit(action="",choice=null){
 const text=(action||choice?.label||"").trim();
 if(text)storyPush("player","Rovan Kes",text);
 if(choice?.skill&&choice?.dc){
  const r=storySkillCheck(choice.skill,choice.dc,choice.label);
  storyPush("system","Story Engine",r.success?"The check succeeds; the consequence engine applies the advantage.":"The check fails; the story continues and the failure can change the state.");
 }
 DATA.story.lastPlayerAction=text;
 if(choice?.npcId)DATA.story.currentNpc=choice.npcId;
 if(choice?.contractId)setActiveContract(contractById(choice.contractId));
 if(DATA.story.provider==="ai"){save();render("Story");return aiStoryGenerate(action,choice)}
 localStoryGenerate(action,choice);save();render("Story");
}
function storyRecapText(){
 return `DEADLOCK // SCENE ${DATA.story.sceneNumber}\nLocation: ${DATA.story.location}\nObjective: ${DATA.story.objective}\n\n`+
  (DATA.story.history||[]).slice(-30).map(h=>`${h.speaker}: ${h.text}`).join("\n");
}
function openStoryRoll(){
 const skills=Object.keys(DATA.character.skills||{});
 openModal("Story Skill Check",`<div class="field"><label>Skill</label><select id="storySkill">${skills.map(x=>`<option>${esc(x)}</option>`).join("")}</select></div><div class="field"><label>Difficulty Class</label><input id="storyDc" type="number" value="12"></div><button class="btn good" id="doStoryRoll">Roll</button>`);
 setTimeout(()=>$("#doStoryRoll").onclick=()=>{const r=storySkillCheck($("#storySkill").value,Number($("#storyDc").value));save();$("#modal").close();render("Story");toast(r.success?"SUCCESS":"FAILURE")},0);
}
function openStorySceneSettings(){
 const s=DATA.story;
 openModal("Scene Setup",`<div class="field"><label>Location</label><input id="sceneLoc" value="${esc(s.location||"")}"></div><div class="field"><label>Scene Type</label><input id="sceneType" value="${esc(s.sceneType||"")}"></div><div class="field"><label>Objective</label><textarea id="sceneObj">${esc(s.objective||"")}</textarea></div><div class="field"><label>Danger 0–100</label><input id="sceneDanger" type="number" min="0" max="100" value="${s.danger||0}"></div><button class="btn" id="saveSceneSetup">Save Scene</button>`);
 setTimeout(()=>$("#saveSceneSetup").onclick=()=>{s.location=$("#sceneLoc").value;s.sceneType=$("#sceneType").value;s.objective=$("#sceneObj").value;s.danger=clamp(Number($("#sceneDanger").value),0,100);save();$("#modal").close();render("Story")},0);
}
function openStoryMemory(){
 const s=DATA.story;
 openModal("Campaign Memory",`<p class="small muted">One established fact per line.</p><textarea id="memoryText" rows="20">${esc((s.campaignMemory||[]).join("\n"))}</textarea><button class="btn" id="saveMemory">Save Memory</button>`);
 setTimeout(()=>$("#saveMemory").onclick=()=>{s.campaignMemory=$("#memoryText").value.split("\n").map(x=>x.trim()).filter(Boolean);save();$("#modal").close();render("Story")},0);
}
function startNewStoryScene(){
 DATA.story.sceneNumber=Number(DATA.story.sceneNumber||1)+1;
 DATA.story.currentSceneId=uid("scene");
 DATA.story.pendingRoll=null;
 storyPush("system","Story Engine",`Scene ${DATA.story.sceneNumber} started.`);
 localStoryGenerate("Begin a new scene based on the current campaign state.",null);
 save();eventBanner(`SCENE ${DATA.story.sceneNumber}`);render("Story");setTimeout(()=>storyCinematic("hyperspace",`${DATA.story.location} // Scene ${DATA.story.sceneNumber}`),120);
}
function wireStory(){
 if($("#storySend"))$("#storySend").onclick=()=>{const v=$("#storyInput").value.trim();if(v)storySubmit(v,null)};
 if($("#storyContinue"))$("#storyContinue").onclick=()=>{const c=contractById(DATA.story.activeContractId);if(c){DATA.story.objective=contractStageInfo(c).goal;DATA.story.choices=missionChoices(c);storyPush("narration","Narrator",`Deadlock refocuses on the job. ${contractStageInfo(c).goal}`);save();render("Story")}else storySubmit("Continue from the current situation.",null)};
 if($("#storyRollBtn"))$("#storyRollBtn").onclick=openStoryRoll;
 $$("[data-storychoice]").forEach(b=>b.onclick=()=>{const c=DATA.story.choices.find(x=>x.id===b.dataset.storychoice);if(c)storySubmit("",c)});
 $$("[data-storyinterrupt]").forEach(b=>b.onclick=()=>{const [iid,cid]=b.dataset.storyinterrupt.split(":");const it=interruptionById(iid);const c=it?.choices?.find(x=>x.id===cid);if(c)storySubmit("",c)});
 if($("#storyNpcSelect"))$("#storyNpcSelect").onchange=e=>{DATA.story.currentNpc=e.target.value;save();render("Story")};
 if($("#storyTalk"))$("#storyTalk").onclick=()=>{const n=storyNpc(DATA.story.currentNpc);storySubmit(`“${n?.name||"You"}, talk to me. What's changed?”`,{intent:"dialogue",npcId:n?.id})};
 if($("#storySceneSettings"))$("#storySceneSettings").onclick=openStorySceneSettings;
 if($("#storyRecap"))$("#storyRecap").onclick=()=>openModal("Session Recap",`<textarea rows="22">${esc(storyRecapText())}</textarea>`);
 if($("#storyNewScene"))$("#storyNewScene").onclick=startNewStoryScene;
 if($("#storyMemory"))$("#storyMemory").onclick=openStoryMemory;
 if($("#storyProvider"))$("#storyProvider").onclick=openStoryProvider;
 const tr=$("#storyTranscript");if(tr)tr.scrollTop=tr.scrollHeight;
}

function weightedPick(items,weightFn=(x)=>x.weight||1){
 const pool=items.filter(Boolean);if(!pool.length)return null;
 const total=pool.reduce((s,x)=>s+Math.max(0,Number(weightFn(x)||0)),0);
 if(total<=0)return pool[Math.floor(Math.random()*pool.length)];
 let r=Math.random()*total;
 for(const x of pool){r-=Math.max(0,Number(weightFn(x)||0));if(r<=0)return x}
 return pool[pool.length-1];
}
function pick(arr){return arr&&arr.length?arr[Math.floor(Math.random()*arr.length)]:null}
function chance(p){return Math.random()<p}

function contractById(id){return (DATA.contracts||[]).find(c=>c.id===id)||null}
function shipSystemById(id){return (DATA.ship?.systems||[]).find(s=>s.id===id)||null}
function targetById(id){return (DATA.targets||[]).find(t=>t.id===id)||null}


function contractStageInfo(contract){
 const p=clamp(Number(contract?.progress||0),0,100),target=targetById(contract?.targetId),isHunt=!!target;
 if(contract?.status==="Completed")return {index:6,key:"complete",title:"CONTRACT COMPLETE",goal:"This contract is closed. Choose the next job or follow up on unresolved relationships.",nextTitle:"NONE",nextAt:100,start:100,end:100,isHunt};
 const huntStages=[
  {index:1,key:"lead",title:"LEAD GATHERING",goal:`Find a credible starting lead on ${target?.name||"the target"}.`,nextTitle:"BUILD THE TRAIL",nextAt:25,start:0,end:25},
  {index:2,key:"trail",title:"BUILD THE TRAIL",goal:`Turn scattered information into one reliable direction on ${target?.name||"the target"}.`,nextTitle:"TRAIL NARROWED",nextAt:50,start:25,end:50},
  {index:3,key:"narrow",title:"TRAIL NARROWED",goal:`Confirm where ${target?.name||"the target"} is moving and rule out bad leads.`,nextTitle:"SEARCH WINDOW",nextAt:75,start:50,end:75},
  {index:4,key:"window",title:"SEARCH WINDOW",goal:`Close the distance before ${target?.name||"the target"} moves again.`,nextTitle:"TARGET LOCATED",nextAt:90,start:75,end:90},
  {index:5,key:"located",title:"TARGET LOCATED",goal:`Choose how Deadlock will secure ${target?.name||"the target"} and satisfy the contract terms.`,nextTitle:"TARGET SECURED",nextAt:100,start:90,end:100},
  {index:6,key:"secured",title:"TARGET SECURED",goal:`Deliver ${target?.name||"the target"} and collect the contract payout.`,nextTitle:"TURN-IN",nextAt:100,start:100,end:100}
 ];
 const opStages=[
  {index:1,key:"brief",title:"BRIEFING",goal:"Establish the contract terms and identify a usable starting angle.",nextTitle:"BUILD LEVERAGE",nextAt:25,start:0,end:25},
  {index:2,key:"leverage",title:"BUILD LEVERAGE",goal:"Gather enough leverage or intelligence to make the job actionable.",nextTitle:"OPERATIONAL PICTURE",nextAt:50,start:25,end:50},
  {index:3,key:"picture",title:"OPERATIONAL PICTURE",goal:"Confirm the strongest path forward and eliminate weak assumptions.",nextTitle:"ACTION WINDOW",nextAt:75,start:50,end:75},
  {index:4,key:"actionwindow",title:"ACTION WINDOW",goal:"Act while the contract conditions are favorable.",nextTitle:"RESOLUTION READY",nextAt:90,start:75,end:90},
  {index:5,key:"resolution",title:"RESOLUTION READY",goal:"Resolve the contract terms and prepare the handoff.",nextTitle:"TERMS SATISFIED",nextAt:100,start:90,end:100},
  {index:6,key:"satisfied",title:"TERMS SATISFIED",goal:"Complete the handoff and collect the payout.",nextTitle:"TURN-IN",nextAt:100,start:100,end:100}
 ];
 const stages=isHunt?huntStages:opStages;
 let st=p>=100?stages[5]:stages.find(x=>p>=x.start&&p<x.end)||stages[0];
 return {...st,isHunt,target};
}
function contractConfidenceLabel(contract){return contract?.targetId?"TRAIL CONFIDENCE":"OPERATION CONFIDENCE"}
function missionStageStripHTML(contract){
 const st=contractStageInfo(contract);
 return `<div class="mission-stage-strip">${Array.from({length:6},(_,i)=>{const n=i+1,cls=n<st.index?"done":n===st.index?"current":"";return `<span class="${cls}" title="Stage ${n}"><i>${n<st.index?"✓":n}</i></span>`}).join("")}</div>`;
}
function missionKnownIntelHTML(contract){
 const t=targetById(contract?.targetId),items=[];
 if(contract?.objective)items.push(contract.objective);
 for(const x of (t?.intel||[]))if(x&&!items.includes(x))items.push(x);
 if(contract?.notes&&!items.includes(contract.notes))items.push(contract.notes);
 return items.slice(0,4).map(x=>`<li>${esc(x)}</li>`).join("")||"<li>No reliable intel recorded yet.</li>";
}
function missionBriefHTML(contract){
 if(!contract)return '<div class="small muted">No active contract. Open Contracts and choose a job to track.</div>';
 const st=contractStageInfo(contract),p=clamp(Number(contract.progress||0),0,100),confidence=contractConfidenceLabel(contract);
 const remaining=Math.max(0,Number(st.nextAt||100)-p),target=targetById(contract.targetId);
 const req=target?.status?.includes("Wanted Alive")?"ALIVE REQUIRED":target?"RECOVERY TERMS ACTIVE":"CONTRACT TERMS ACTIVE";
 return `<div class="mission-brief">
  <div class="mission-brief-head"><div><div class="micro">${st.isHunt?"ACTIVE HUNT":"ACTIVE CONTRACT"}</div><div class="mission-title">${esc(contract.title)}</div></div><div class="mission-reward">${money(contract.reward)}</div></div>
  <div class="mission-stage-name"><span>STAGE ${st.index} / 6</span><b>${esc(st.title)}</b></div>
  ${missionStageStripHTML(contract)}
  <div class="mission-now"><span>WHAT YOU'RE DOING NOW</span><b>${esc(st.goal)}</b></div>
  <div class="mission-confidence"><div class="row"><span>${confidence}</span><b>${p}%</b></div>${meter(p,100,statusClass(p,100))}<div class="small muted">${p>=100?"The objective is resolved. Turn-in is available.":`Next unlock: ${esc(st.nextTitle)}${remaining?` in ${remaining} confidence point${remaining===1?"":"s"}`:""}.`}</div></div>
  <div class="pills"><span class="pill cyan">${esc(req)}</span><span class="pill">${esc(contract.status)}</span></div>
  <details class="mission-help"><summary>What does ${p}% mean?</summary><p><b>${confidence}</b> measures how much reliable, actionable information Deadlock has for this job. It is not XP. Successful field actions can raise it; failures can raise danger instead. Crossing 25 / 50 / 75 / 90 unlocks new mission phases, and 100 means the contract objective is resolved and ready for turn-in.</p></details>
  <div class="mission-intel"><div class="micro">ESTABLISHED INTEL / TERMS</div><ul>${missionKnownIntelHTML(contract)}</ul></div>
 </div>`;
}
function missionChoiceMeta(choice){
 const intent=choice?.intent||"action";
 if(intent==="turnin")return {purpose:"COMPLETE CONTRACT",outcome:"Closes the job and pays the listed gross reward."};
 if(intent==="resolve")return {purpose:"RESOLVE ENCOUNTER",outcome:"Success secures the objective and unlocks turn-in."};
 if(choice?.actionType==="intel_contact")return {purpose:"WORK THE CONTACT",outcome:"Success can improve the relationship and confirm usable intel."};
 if(intent==="investigate"||choice?.actionType==="contract_review")return {purpose:"GAIN INTEL",outcome:"Success advances the current mission stage."};
 if(intent==="deception")return {purpose:"BAIT / MISDIRECT",outcome:"Higher risk; success can advance the hunt without a direct approach."};
 if(intent==="dialogue")return {purpose:"RELATIONSHIP",outcome:"Changes trust/respect and may open better information later."};
 if(intent==="ship")return {purpose:"PREP THE RAVEN",outcome:"Changes ship readiness, not contract progress."};
 if(intent==="bounty")return {purpose:"NEW WORK",outcome:"Looks for another opportunity instead of advancing this job."};
 return {purpose:"PRESS THE LEAD",outcome:"Success can advance the job; failure can increase danger."};
}
function missionChoices(contract){
 if(!contract)return [];
 const s=DATA.story,st=contractStageInfo(contract),t=targetById(contract.targetId),name=t?.name||"the objective",cid=contract.id;
 if(contract.status==="Completed")return [
  {id:uid("choice"),label:"Review the next active contract.",intent:"bounty",purpose:"NEXT JOB"},
  {id:uid("choice"),label:"Check The Raven before taking more work.",intent:"ship",actionType:"diagnostic",skill:"Technical",dc:10,purpose:"SHIP PREP"}
 ];
 if(Number(contract.progress||0)>=100)return [
  {id:uid("choice"),label:t?`Deliver ${name} and complete the handoff.`:"Complete the contract handoff and collect the payout.",intent:"turnin",contractId:cid,purpose:"TURN IN"},
  ...(cid==="marr"?[{id:uid("choice"),label:"Call Dren before the handoff and acknowledge that his share still has to be settled.",intent:"dialogue",npcId:"dren",contractId:cid,purpose:"RELATIONSHIP"}]:[]),
  {id:uid("choice"),label:"Run a final Raven readiness check before departure.",intent:"ship",actionType:"diagnostic",skill:"Technical",dc:10,purpose:"SHIP PREP"}
 ].slice(0,5);
 if(st.index===5&&t)return [
  {id:uid("choice"),label:`Cut off ${name}'s escape route and force a controlled surrender.`,intent:"resolve",actionType:"contain",contractId:cid,skill:"Survival",dc:13,purpose:"SECURE TARGET"},
  {id:uid("choice"),label:`Shadow ${name} until there is a clean, isolated capture window.`,intent:"resolve",actionType:"shadow_capture",contractId:cid,skill:"Stealth",dc:13,purpose:"SECURE TARGET"},
  {id:uid("choice"),label:`Approach ${name} under a cover identity and get close before revealing the contract.`,intent:"resolve",actionType:"cover_capture",contractId:cid,skill:"Deception",dc:14,purpose:"SECURE TARGET"},
  {id:uid("choice"),label:"Call Dren and coordinate the recovery before making the move.",intent:"dialogue",actionType:"intel_contact",npcId:"dren",contractId:cid,skill:"Negotiation",dc:11,purpose:"WORK CONTACT"}
 ];
 if(st.index===5&&!t)return [
  {id:uid("choice"),label:"Execute the final contract terms exactly as agreed.",intent:"resolve",actionType:"close_terms",contractId:cid,skill:"Survival",dc:13,purpose:"RESOLVE CONTRACT"},
  {id:uid("choice"),label:"Audit the final terms for a trap before committing to the handoff.",intent:"resolve",actionType:"verify_terms",contractId:cid,skill:"Investigation",dc:13,purpose:"VERIFY TERMS"},
  {id:uid("choice"),label:"Close the final handoff terms directly with Nera Kade.",intent:"resolve",actionType:"negotiate_terms",contractId:cid,skill:"Negotiation",dc:13,purpose:"CLOSE TERMS"},
  {id:uid("choice"),label:"Prepare The Raven for a fast exit if the handoff turns ugly.",intent:"ship",actionType:"diagnostic",skill:"Technical",dc:11,purpose:"SHIP PREP"}
 ];
 if(st.index===4)return [
  {id:uid("choice"),label:`Shadow the strongest lead and close the distance on ${name}.`,intent:"investigate",contractId:cid,skill:"Survival",dc:13,purpose:"CLOSE DISTANCE"},
  {id:uid("choice"),label:"Cross-reference the search window against recent contact traffic.",intent:"investigate",contractId:cid,skill:"Investigation",dc:12,purpose:"CONFIRM LOCATION"},
  {id:uid("choice"),label:"Feed a false route into the network and watch who reacts.",intent:"deception",contractId:cid,skill:"Deception",dc:14,purpose:"BAIT NETWORK"},
  {id:uid("choice"),label:"Ask Dren to verify one detail before committing The Raven.",intent:"dialogue",actionType:"intel_contact",npcId:"dren",contractId:cid,skill:"Negotiation",dc:11,purpose:"VERIFY INTEL"}
 ];
 if(st.index===3)return [
  {id:uid("choice"),label:`Compare the narrowed trail against known movements tied to ${name}.`,intent:"investigate",contractId:cid,skill:"Investigation",dc:12,purpose:"CONFIRM TRAIL"},
  {id:uid("choice"),label:"Follow the strongest lead before it goes cold.",intent:"action",contractId:cid,skill:"Survival",dc:12,purpose:"PRESS LEAD"},
  {id:uid("choice"),label:"Ask Dren which part of the trail he actually trusts.",intent:"dialogue",actionType:"intel_contact",npcId:"dren",contractId:cid,skill:"Negotiation",dc:11,purpose:"VERIFY INTEL"},
  {id:uid("choice"),label:"Seed a controlled lie and trace who passes it along.",intent:"deception",contractId:cid,skill:"Deception",dc:13,purpose:"TRACE NETWORK"}
 ];
 if(st.index===2)return [
  {id:uid("choice"),label:`Compare ${name}'s known trail against recent underworld traffic.`,intent:"investigate",contractId:cid,skill:"Investigation",dc:12,purpose:"GAIN INTEL"},
  {id:uid("choice"),label:"Ask Dren to verify which lead he considers real.",intent:"dialogue",actionType:"intel_contact",npcId:"dren",contractId:cid,skill:"Negotiation",dc:11,purpose:"WORK CONTACT"},
  {id:uid("choice"),label:"Shadow the strongest lead before it cools off.",intent:"action",contractId:cid,skill:"Survival",dc:12,purpose:"PRESS LEAD"},
  {id:uid("choice"),label:"Leak a false sighting and watch who reacts to it.",intent:"deception",contractId:cid,skill:"Deception",dc:13,purpose:"BAIT NETWORK"}
 ];
 return [
  {id:uid("choice"),label:`Review ${contract.title} and isolate the first credible lead.`,intent:"investigate",actionType:"contract_review",contractId:cid,skill:"Investigation",dc:11,purpose:"FIND LEAD"},
  {id:uid("choice"),label:"Search the underworld network for a corroborating trace.",intent:"investigate",contractId:cid,skill:"Investigation",dc:12,purpose:"FIND LEAD"},
  {id:uid("choice"),label:"Call the most relevant contact and test what they know.",intent:"dialogue",actionType:"intel_contact",npcId:s.currentNpc||"dren",contractId:cid,skill:"Negotiation",dc:11,purpose:"WORK CONTACT"},
  {id:uid("choice"),label:"Prepare The Raven before committing to the trail.",intent:"ship",actionType:"diagnostic",skill:"Technical",dc:10,purpose:"SHIP PREP"}
 ];
}
function ensureMissionLoopState(){
 const s=DATA?.story;if(!s)return;
 const c=contractById(s.activeContractId)||activeContracts?.()[0]||null;
 if(!c)return;
 if(Number(s.missionLoopVersion||0)<1){
  s.missionLoopVersion=1;
  s.activeContractId=c.id;
  s.objective=contractStageInfo(c).goal;
  s.choices=missionChoices(c);
 }
}
function resolveContractEncounter(contract,choice,roll){
 const s=DATA.story,st=contractStageInfo(contract),target=targetById(contract?.targetId);
 if(!contract)return false;
 if(st.index<5){storyPush("system","Mission Guidance",`The objective is not ready for final resolution yet. Current phase: ${st.title}. ${st.goal}`);s.choices=missionChoices(contract);return true}
 if(!roll){s.choices=missionChoices(contract);return true}
 if(roll.success){
  const before=Number(contract.progress||0);contract.progress=100;
  if(target){
   target.status=target.status?.includes("Wanted Alive")?"Secured Alive":"Secured";
   addFlag(`${contract.id.toUpperCase()}_TARGET_SECURED`);
   addConsequence(`${target.name} secured`,`Contract objective resolved. Turn-in is now available.`,"good",{contractId:contract.id,targetId:target.id});
   storyPush("narration","Narrator",`The hunt stops being a search. Deadlock controls the outcome, and ${target.name} is secured under the contract terms. The only required step left is the handoff.`);
   setTimeout(()=>storyCinematic("target_secured",`${target.name} // TURN-IN READY`),55);
  }else{
   addFlag(`${contract.id.toUpperCase()}_TERMS_SATISFIED`);
   addConsequence(`${contract.title}: terms satisfied`,`The contract objective is resolved. Turn-in is now available.`,"good",{contractId:contract.id});
   storyPush("narration","Narrator",`The final requirement clears. ${contract.title} is no longer an active operation; the remaining step is the handoff and payout.`);
   setTimeout(()=>storyCinematic("target_secured",`${contract.title} // TURN-IN READY`),55);
  }
  storyPush("system","Mission Guidance",`${contractConfidenceLabel(contract)} ${before}% → 100%. OBJECTIVE RESOLVED. Turn-in unlocked.`);
  s.objective=contractStageInfo(contract).goal;s.choices=missionChoices(contract);
 }else{
  s.danger=clamp(Number(s.danger||0)+8,0,100);s.director.tension=clamp(Number(s.director.tension||0)+6,0,100);
  const subject=target?.name||contract.title;
  addConsequence(`${subject}: resolution attempt failed`,`The objective remains actionable, but danger increased. Choose a different approach or try again.`,"danger",{contractId:contract.id,targetId:target?.id||null});
  storyPush("narration","Narrator",`The final approach breaks down before Deadlock can close the job. The objective is still within reach, but the target's side reacts before Deadlock can reset.`);
  s.objective=`Recover control and resolve ${contract.title}.`;s.choices=missionChoices(contract);
  if(target)startForcedCombat({source:"target_capture",danger:Math.max(70,Number(s.danger||0)),reason:`${target.name}'s recovery turns hostile.`,objective:`Subdue the opposition and secure ${target.name}.`,returnPage:"Story",contractId:contract.id,targetId:target.id,narration:`The failed approach burns the quiet option. ${target.name}'s people draw first, and the recovery becomes a live firefight.`});
 }
 return true;
}
function turnInContract(contract){
 if(!contract)return false;
 if(contract.id==="v14_signal_in_the_rain"){toast("Complete the handoff in First Flight.");return false;}
 if(Number(contract.progress||0)<100){const st=contractStageInfo(contract);storyPush("system","Mission Guidance",`Turn-in is locked. ${st.goal}`);DATA.story.objective=st.goal;DATA.story.choices=missionChoices(contract);return false}
 if(contract.status==="Completed")return true;
 contract.status="Completed";contract.progress=100;DATA.character.credits+=Number(contract.reward||0);
 const target=targetById(contract.targetId);if(target)target.status=target.status?.includes("Alive")?"Recovered Alive":"Recovered";
 const splitNote=contract.id==="marr"?" Gross payout recorded; the planned split with Dren remains to be settled because no percentage has been established.":"";
 DATA.journal.push({id:uid("j"),ts:new Date().toLocaleString(),title:`Contract completed: ${contract.title}`,text:`Gross reward received: ${money(contract.reward)}.${splitNote}`});
 addConsequence(`${contract.title} completed`,`${money(contract.reward)} gross payout received.${splitNote}`,"good",{contractId:contract.id});
 storyPush("narration","Narrator",`The handoff clears. ${money(contract.reward)} hits Deadlock's account, and ${contract.title} closes as completed.${splitNote}`);
 eventBanner("CONTRACT COMPLETE");showBountyCinematic({name:contract.title,status:"CONTRACT COMPLETE",reward:contract.reward});
 DATA.story.objective="Choose the next job or settle any loose ends from the completed contract.";
 const next=activeContracts().find(c=>c.id!==contract.id);if(next){setActiveContract(next);DATA.story.objective=`Next available job: ${next.title}. ${contractStageInfo(next).goal}`;DATA.story.choices=[{id:uid("choice"),label:`Review ${next.title}.`,intent:"contracts",contractId:next.id,actionType:"contract_review",skill:"Investigation",dc:11,purpose:"NEXT JOB"},...(contract.id==="marr"?[{id:uid("choice"),label:"Call Dren and settle the unresolved payout share.",intent:"dialogue",npcId:"dren",purpose:"LOOSE END"}]:[]),{id:uid("choice"),label:"Check The Raven before the next contract.",intent:"ship",actionType:"diagnostic",skill:"Technical",dc:10,purpose:"SHIP PREP"}];}
 else DATA.story.choices=missionChoices(contract);
 return true;
}
function addConsequence(title,detail="",tone="info",extra={}){
 const s=DATA.story;
 s.consequences=s.consequences||{version:1,recent:[],flags:[],reputation:{reliability:50,mercy:50,intimidation:35,underworld:40},lastSystemId:null,lastContractId:null};
 s.consequences.recent=s.consequences.recent||[];
 s.consequences.recent.unshift({id:uid("effect"),title,detail,tone,turn:s.director?.turn||0,...extra});
 s.consequences.recent=s.consequences.recent.slice(0,12);
}
function addFlag(flag){
 const f=DATA.story.consequences.flags||(DATA.story.consequences.flags=[]);
 if(!f.includes(flag))f.push(flag);
}
function changeReputation(key,delta){
 const r=DATA.story.consequences.reputation||(DATA.story.consequences.reputation={});
 r[key]=clamp(Number(r[key]??50)+Number(delta||0),0,100);
}
function consequenceFeedHTML(){
 const items=(DATA.story.consequences?.recent||[]).slice(0,5);
 if(!items.length)return '<div class="small muted">No persistent consequences yet.</div>';
 return `<div class="consequence-feed">${items.map(e=>`<div class="consequence-item ${esc(e.tone||"info")}"><span class="consequence-dot"></span><div><b>${esc(e.title)}</b><span>${esc(e.detail||"")}</span></div></div>`).join("")}</div>`;
}
function resolveContractFromAction(action="",choice=null,allowActive=true){
 if(choice?.contractId&&contractById(choice.contractId))return contractById(choice.contractId);
 const text=`${choice?.label||""} ${action||""}`.toLowerCase();
 if(/\bmarr\b/.test(text))return contractById("marr");
 if(/\bkade\b|\bnera\b/.test(text))return contractById("kade");
 const activeId=DATA.story.activeContractId||DATA.story.consequences?.lastContractId;
 if(allowActive&&activeId&&contractById(activeId)?.status==="Active")return contractById(activeId);
 return null;
}
function setActiveContract(contract){
 if(!contract)return;
 DATA.story.activeContractId=contract.id;
 DATA.story.consequences.lastContractId=contract.id;
}
function contractProgress(contract,delta,reason,tone="good"){
 if(!contract||!Number.isFinite(Number(delta)))return 0;
 const before=Number(contract.progress||0),beforeStage=contractStageInfo({...contract,progress:before});
 const max=contract.status==="Active"?95:100;
 contract.progress=clamp(before+Number(delta),0,max);
 const applied=contract.progress-before;
 if(applied!==0){
  const label=contractConfidenceLabel(contract);
  addConsequence(`${contract.title}: ${applied>0?"+":""}${applied} confidence`,reason,tone,{contractId:contract.id});
  storyPush("system","Mission Result",`${label} ${before}% → ${contract.progress}%. ${reason}`);
  if(applied>0)changeReputation("reliability",1);
 }
 const target=targetById(contract.targetId);
 if(target){
  target.intel=target.intel||[];
  if(contract.progress>=50&&!target.intel.some(x=>x.includes("trail narrowed"))){
    target.intel.push("The target trail narrowed after active field investigation.");
    addFlag(`${contract.id.toUpperCase()}_TRAIL_NARROWED`);
  }
  if(contract.progress>=75){
    target.status=target.status.includes("Wanted Alive")?"Trail Narrowed / Wanted Alive":"Trail Narrowed";
    addFlag(`${contract.id.toUpperCase()}_SEARCH_WINDOW`);
  }
  if(contract.progress>=90){
    target.status=target.status.includes("Wanted Alive")?"Located / Wanted Alive":"Located";
    addFlag(`${contract.id.toUpperCase()}_TARGET_LOCATED`);
    setTimeout(()=>storyCinematic("target_located",`${target.name} // CAPTURE OPTIONS UNLOCKED`),60);
  }
 }
 const afterStage=contractStageInfo(contract);
 if(afterStage.index>beforeStage.index){
  DATA.story.objective=afterStage.goal;
  addConsequence(`Phase advanced: ${afterStage.title}`,afterStage.goal,"good",{contractId:contract.id});
  storyPush("narration","Narrator",`The job changes shape. ${afterStage.title}. ${afterStage.goal}`);
  setTimeout(()=>storyCinematic("mission_phase",`${contract.title} // ${afterStage.title}`),90);
 }
 return applied;
}
function weakestShipSystem(){
 return [...(DATA.ship?.systems||[])].filter(s=>s.online).sort((a,b)=>Number(a.condition||100)-Number(b.condition||100))[0]||null
}
function repairSystem(system,roll){
 if(!system)return;
 const before=Number(system.condition||0);
 if(roll?.success){
  const gain=roll.natural===20?18:10+Math.floor(Math.random()*5);
  system.condition=clamp(before+gain,0,100);
  const actual=system.condition-before;
  addConsequence(`${system.name} repaired`,`${before}% → ${system.condition}% condition.`,"good",{systemId:system.id});
  storyPush("system","The Raven",`${system.name} repaired ${actual}% and now reads ${system.condition}%.`);
  DATA.story.director.tension=clamp(Number(DATA.story.director.tension||0)-3,0,100);
  setTimeout(()=>storyCinematic("new_intel",`${system.name} // ${system.condition}%`),50);
 }else{
  const loss=2+Math.floor(Math.random()*3);
  system.condition=clamp(before-loss,0,100);
  addConsequence(`${system.name} repair setback`,`${before}% → ${system.condition}% condition.`,"warn",{systemId:system.id});
  storyPush("system","The Raven",`The repair attempt makes the fault worse. ${system.name} drops to ${system.condition}%.`);
  DATA.story.danger=clamp(Number(DATA.story.danger||0)+4,0,100);
 }
 DATA.story.consequences.lastSystemId=system.id;
}
function applyNpcChoiceConsequence(npc,choice,roll){
 if(!npc)return;
 const intent=choice?.intent||"dialogue";
 if(intent==="deception"){
  if(roll?.success){
   adjustNpcMood(npc,{respect:1,irritation:-1});
   changeReputation("underworld",1);
   addConsequence(`${npc.name}: bluff held`,"No immediate trust loss.","info",{npcId:npc.id});
  }else{
   adjustNpcMood(npc,{trust:-4,respect:-2,irritation:6});
   rememberNpc(npc,"CAUGHT_ROVAN_LYING",`${npc.name} caught Rovan in a lie.`,5);
   changeReputation("underworld",-1);
   addConsequence(`${npc.name} caught the lie`,"Trust fell and irritation increased.","danger",{npcId:npc.id});
   addFlag(`${npc.id.toUpperCase()}_CAUGHT_LIE`);
  }
 }else if(intent==="dialogue"&&roll){
  if(roll.success){
   adjustNpcMood(npc,{trust:2,respect:2,irritation:-1});
   addConsequence(`${npc.name}: relationship improved`,`Trust ${npc.mood.trust}% // Respect ${npc.mood.respect}%`,"good",{npcId:npc.id});
  }else{
   adjustNpcMood(npc,{irritation:3,stress:2});
   addConsequence(`${npc.name}: conversation strained`,`Irritation ${npc.mood.irritation}%`,"warn",{npcId:npc.id});
  }
 }
}
function applyContractRollConsequence(contract,choice,roll){
 if(!contract||!roll)return;
 const intent=choice?.intent||"contracts";
 let delta=0,reason="";
 if(roll.success){
   if(roll.natural===20)delta=15;
   else if(intent==="investigate"||choice?.actionType==="contract_review")delta=8+Math.floor(Math.random()*5);
   else if(intent==="deception")delta=5+Math.floor(Math.random()*4);
   else if(intent==="action")delta=6+Math.floor(Math.random()*4);
   else delta=5+Math.floor(Math.random()*4);
   reason=roll.natural===20?"Critical breakthrough produced high-confidence intelligence.":"The chosen approach produced usable intelligence.";
   contractProgress(contract,delta,reason,"good");
 }else{
   reason="No actionable intel was gained. Danger rises, but the hunt is not lost; choose a different approach or press the same lead again.";
   DATA.story.danger=clamp(Number(DATA.story.danger||0)+4,0,100);
   DATA.story.director.tension=clamp(Number(DATA.story.director.tension||0)+3,0,100);
   addConsequence(`${contract.title}: stalled`,reason,"warn",{contractId:contract.id});
   storyPush("system","Mission Result",`${contractConfidenceLabel(contract)} stays at ${contract.progress}%. ${reason}`);
 }
}
function interruptionById(id){return (DATA.story.interruptions||[]).find(x=>x.id===id)||null}
function removeInterruption(id){DATA.story.interruptions=(DATA.story.interruptions||[]).filter(x=>x.id!==id)}
function applyInterruptionConsequence(choice,roll){
 const id=choice?.interruptId;if(!id)return null;
 const it=interruptionById(id);if(!it)return null;
 const success=!!roll?.success;
 if(success){
  DATA.story.danger=clamp(Number(DATA.story.danger||0)-Math.max(2,Math.round((it.danger||5)*.35)),0,100);
  addConsequence(`${it.label} handled`,choice.label,"good",{eventId:it.eventId});
 }else if(roll){
  DATA.story.danger=clamp(Number(DATA.story.danger||0)+Math.max(2,Math.round((it.danger||5)*.35)),0,100);
  addConsequence(`${it.label} escalated`,choice.label,"danger",{eventId:it.eventId});
 }

 if(it.eventId==="ship_fault"&&choice.systemId){
   const sys=shipSystemById(choice.systemId);
   if(sys&&roll){
     const before=sys.condition;
     sys.condition=clamp(before+(success?5:-3),0,100);
     storyPush("system","The Raven",`${sys.name}: ${before}% → ${sys.condition}% after the interruption response.`);
   }
 }
 if(it.eventId==="rival_hunter"&&choice.contractId&&roll?.success){
   contractProgress(contractById(choice.contractId),4,"Deadlock gained time or intelligence over the rival hunter.","good");
 }
 if(it.eventId==="anonymous_ping"&&roll?.success)addFlag("ANONYMOUS_SIGNAL_HANDLED");
 if(it.eventId==="patrol_scan"&&roll?.success)addFlag("PATROL_SCAN_EVADED");
 if(it.eventId==="false_bounty"&&roll?.success)addFlag("FALSE_BOUNTY_SCREENED");

 removeInterruption(id);
 return it;
}

function consequenceActiveThreadHTML(){
 const c=contractById(DATA.story.activeContractId);
 return missionBriefHTML(c);
}

function activeContracts(){return DATA.contracts.filter(c=>c.status==="Active")}
function npcMood(npc){
 const m=npc?.mood||{};
 const respect=Number(m.respect||50), irritation=Number(m.irritation||0), trust=Number(m.trust||50), stress=Number(m.stress||20);
 if(irritation>=60)return "irritated";
 if(respect>=68||trust>=68)return "highRespect";
 if(stress>=70)return "irritated";
 return "neutral";
}
function rememberNpc(npc,tag,summary,weight=3){
 if(!npc)return;
 npc.memories=npc.memories||[];
 const found=npc.memories.find(m=>m.tag===tag);
 if(found){found.summary=summary;found.weight=Math.max(found.weight||1,weight)}
 else npc.memories.push({tag,summary,weight});
}
function adjustNpcMood(npc,changes={}){
 if(!npc)return;npc.mood=npc.mood||{};
 for(const [k,v] of Object.entries(changes))npc.mood[k]=clamp(Number(npc.mood[k]||0)+Number(v||0),0,100);
 const contact=DATA.contacts.find(c=>c.id===npc.id);
 if(contact&&npc.mood.trust!=null)contact.trust=Math.round(npc.mood.trust);
}
function recentPlayerActionText(){
 return [...(DATA.story?.history||[])].reverse().find(h=>h.type==="player")?.text||"";
}
function ensureGmState(){
 const s=DATA.story;
 s.gmState=s.gmState||{version:2,recentNpcLines:[],recentStageBeats:[],recentTopics:[],npcTurns:{},lastAnalysis:null};
 s.gmState.version=2;
 s.gmState.recentNpcLines=s.gmState.recentNpcLines||[];
 s.gmState.recentStageBeats=s.gmState.recentStageBeats||[];
 s.gmState.recentTopics=s.gmState.recentTopics||[];
 s.gmState.npcTurns=s.gmState.npcTurns||{};
 return s.gmState;
}
function gmFreshPick(items,kind="line",npcId=""){
 const list=(items||[]).filter(Boolean);if(!list.length)return null;
 const state=ensureGmState();
 const key=kind==="beat"?"recentStageBeats":"recentNpcLines";
 const recent=(state[key]||[]).slice(0,8);
 let candidates=list.filter(x=>!recent.includes(`${npcId}:${x}`));
 if(!candidates.length)candidates=list;
 const chosen=pick(candidates);
 state[key].unshift(`${npcId}:${chosen}`);state[key]=state[key].slice(0,12);
 return chosen;
}
function dialogueTopic(context="",action=""){
 const a=String(action||"").toLowerCase(),c=String(context||"").toLowerCase();
 const strong=t=>{
  if(/\bmarr\b|staged turn-?in|turn-?in plan/.test(t))return "marr";
  if(/kade[’'s]*\s+(contract|bounty|job)|nera kade[’'s]*\s+(contract|bounty|job)/.test(t))return "kade";
  if(/credit|pay|money|price|reward|split|cut|fee|seventy thousand|70,?000|forty thousand|40,?000/.test(t))return "credits";
  if(/raven|ship|engine|thruster|hyperdrive|repair|shield|system|diagnostic/.test(t))return "ship";
  if(/trust|lie|lying|honest|truth|believe|loyal|loyalty/.test(t))return "trust";
  if(/deal|agreement|contract|bounty|terms/.test(t))return "deal";
  if(/shoot|fight|hunter|patrol|danger|attack|fire|ambush|threat|goes loud|shooting/.test(t))return "danger";
  return null;
 };
 const explicit=strong(a);if(explicit)return explicit;
 if(/\b(lead|trail|target)\b/.test(a)){const ac=DATA?.story?.activeContractId;if(ac==="marr"||ac==="kade")return ac;}
 const contextTopic=strong(c)||(["marr","kade","ship","credits","trust","deal","danger","intel"].includes(c)?c:null);
 if(contextTopic&&(/\b(him|her|it|them|that|this|lead|trail|job|target)\b/.test(a)||/^(who|what|where|when|why|how)\b/.test(a)||/what am i missing|your instinct|send me|tell me|give me/.test(a)))return contextTopic;
 if(/where|who|what|intel|information|know|proof|trace|lead|name|location|missing/.test(a))return "intel";
 return contextTopic||context||"open";
}
function analyzePlayerSpeech(text="",context="",npcId=null){
 const raw=String(text||"").trim();
 const t=raw.toLowerCase();
 let speechAct="statement";
 if(/\b(sorry|apologize|my fault|i was wrong)\b/.test(t))speechAct="apology";
 else if(/\b(i'?m lying|i lie|bluff|pretend|fake it|tell .* a lie)\b/.test(t))speechAct="bluff";
 else if(/\b(kill you|shoot you|put .* down|break you|hurt you|threat|or else|blackwake .* you)\b/.test(t)||(/blackwake/.test(t)&&/conversation|answer|talk|holding back/.test(t)))speechAct="threat";
 else if(/\b(you'?re lying|you are lying|dodging|hiding .*|holding .* back|avoiding the question|bullshit|not telling me)\b/.test(t))speechAct="accusation";
 else if(/\b(deal|offer|my cut|your cut|split|price|pay you|credits|renegotiate|forty thousand|seventy thousand|40,?000|70,?000)\b/.test(t)&&/\b(if|then|give|want|take|offer|split|pay|price|cut)\b/.test(t))speechAct="bargain";
 else if(/\b(trust me|i trust you|i trust your|we'?re good|i'?ve got you|i got you|we can do this|i need you)\b/.test(t))speechAct="reassure";
 else if(/\b(kidding|joking|joke|funny|cute|relax)\b/.test(t))speechAct="tease";
 else if(/\b(prove it|try me|bet you|you can'?t|challenge)\b/.test(t))speechAct="challenge";
 else if(/^\s*(tell me|give me|send me|show me|stop|quit|answer me)\b/.test(t))speechAct="demand";
 else if(raw.includes("?")||/^\s*(who|what|where|when|why|how|do|does|did|are|is|can|could|would|will)\b/.test(t))speechAct="question";
 let tone="professional";
 if(speechAct==="threat"||speechAct==="accusation"||/\b(damn|hell|shit|screw|pissed)\b/.test(t))tone="hostile";
 else if(speechAct==="apology"||speechAct==="reassure")tone="warm";
 else if(/\b(now|hurry|quick|immediately|no time|running out|before they)\b/.test(t))tone="urgent";
 else if(speechAct==="tease")tone="playful";
 else if(speechAct==="bluff"||speechAct==="challenge")tone="guarded";
 let questionType=null;
 if(/\bwho\b|\bname\b/.test(t))questionType="who";
 else if(/\bwhere\b|\blocation\b/.test(t))questionType="where";
 else if(/\bwhen\b|\btime\b/.test(t))questionType="when";
 else if(/\bwhy\b/.test(t))questionType="why";
 else if(/\bhow\b|\bplan\b/.test(t))questionType="how";
 else if(/\bprice\b|\bpay\b|\bcredits\b|\bcut\b|\bsplit\b/.test(t))questionType="price";
 else if(/\bproof\b|\bevidence\b|\bverify\b/.test(t))questionType="proof";
 else if(raw.includes("?")||speechAct==="demand")questionType="what";
 let topic=dialogueTopic(context,raw);
 if(npcId==="nera"&&/your (contract|bounty)|finish your|your terms|your job/.test(t))topic="kade";
 return {text:raw,speechAct,tone,questionType,topic,npcId};
}
const GM_NPC_STYLE={
 dren:{
  address:"Deadlock",directness:.76,humor:.48,
  stage:{neutral:["Dren lets the silence sit for a beat before answering.","Dren's eyes flick across something off-screen before settling back on Rovan.","Dren leans back, studying Rovan like he is checking the math on a bad idea."],highRespect:["Dren gives a small, reluctant nod before answering.","For once, Dren does not interrupt.","Dren's expression eases by half a degree—the closest thing he gives to approval."],irritated:["Dren exhales through his nose and looks away from the holo for half a second.","Dren's jaw sets before he answers.","Dren rubs a thumb across his lower lip, visibly deciding how much patience is left."]},
  act:{threat:["If that's a threat, make it useful.","There it is. I was wondering when you'd stop being polite."],accusation:["I'm not dodging you. I'm deciding what you can actually use.","You think I'm holding something back? Ask the question cleanly."],apology:["Don't make it weird. We move on.","Fine. Accepted. Now get to the part that matters."],bargain:["Now we're talking numbers.","Good. Put a price on the risk instead of dressing it up."],reassure:["Save the reassurance for somebody who needs it.","I heard you. That doesn't mean I stopped checking the exits."],tease:["Cute. You done?","Keep that up and I'm charging you for morale support."],challenge:["Careful. I might take that personally.","You really want to make this competitive?"],demand:["Then ask for something I can actually give you.","Straight to it. Fine."],question:["Ask it.","Go on."]},
  tail:{marr:["What are you doing with that?","So what's your move?","Are you chasing the lead or waiting for it to cool?"],credits:["What are you actually offering?","You changing the deal?"],ship:["Are we fixing it, or flying it?","How much risk are you willing to put on the Raven?"],trust:["You want honesty or comfort?","Does that answer the question you were really asking?"],intel:["Which piece do you want first?","What do you need badly enough to act on?"],danger:["How close is it?","Who shoots first?"],deal:["Are you changing the terms?","What part of the deal are you trying to move?"]}
 },
 nera:{
  address:"Deadlock",directness:.88,humor:.05,
  stage:{neutral:["Kade pauses just long enough to weigh the value of the question.","Kade's expression remains still; only her attention sharpens.","Kade glances down at a private display before answering."],highRespect:["Kade gives the request more consideration than she usually allows.","A brief silence suggests Kade is actually recalculating.","Kade folds her hands and gives Rovan her full attention."],irritated:["Kade's expression barely changes; her voice gets colder instead.","Kade leaves a deliberate silence before replying.","Kade's eyes narrow by a fraction—the warning is entirely intentional."]},
  act:{threat:["Threats are poor substitutes for leverage.","If you intend to intimidate me, improve the offer."],accusation:["Be precise. What, exactly, are you accusing me of?","Suspicion is useful only when it produces evidence."],apology:["Acknowledged. Continue.","Good. Then we will not spend more time on it."],bargain:["State the revised terms.","If you want the price moved, give me a reason that improves my odds."],reassure:["I do not require reassurance. I require delivery.","Confidence is not a substitute for verification."],tease:["We are not at the part of our relationship where that is useful.","If that was humor, it did not improve the numbers."],challenge:["Do not confuse restraint with reluctance.","If you want a contest, define the stakes."],demand:["You may ask. You may not confuse asking with entitlement.","Then be specific."],question:["Ask the useful version of the question.","Proceed."]},
  tail:{kade:["Does that change how you intend to finish my contract?","What result are you bringing me next?"],credits:["What additional value are you offering?","Are you renegotiating, or merely complaining?"],trust:["Do you need trust, or do you need an answer?"],intel:["What is verified?","Which assumption are you asking me to price?"],danger:["Did the objective change?","Can you still complete the job?"],deal:["Which term are you proposing to change?"]}
 },
 renn:{
  address:"Rovan",directness:.58,humor:.28,
  stage:{neutral:["Renn lowers his voice before answering.","Renn glances off-channel, then back.","Renn shifts like somebody just walked past a door Rovan cannot see."],highRespect:["Renn hesitates, then decides to be candid.","Renn gives a wary nod.","Renn looks uncomfortable, but not dishonest."],irritated:["Renn rubs a hand over his face before answering.","Renn looks like he already regrets staying on the line.","Renn's shoulders tense before the reply comes back."]},
  act:{threat:["Okay. Definitely not loving that tone.","If that's aimed at me, maybe point it somewhere else."],accusation:["I'm not hiding it because it's funny, Rovan.","I'm telling you what I know, not what would make you happy."],apology:["Yeah. Okay. We're fine.","Accepted. Please don't make me regret that immediately."],bargain:["I knew credits were going to show up in this conversation.","Fine. What are you actually asking me to do?"],reassure:["That helps. A little.","I believe you. I just don't trust the universe around you."],tease:["Very funny. I feel safer already.","Great. Jokes. That usually means the plan is terrible."],challenge:["No. Absolutely not. I am not making this a competition.","That sounds like the beginning of something expensive."],demand:["All right. Just—give me a second.","Fine. Straight answer."],question:["Okay. What do you need?","Ask."]},
  tail:{marr:["Tell me this is not another staged-turn-in situation.","What's the exit plan this time?"],credits:["And what exactly is my risk worth?"],trust:["You believe me?","Are we actually being honest now?"],intel:["Do you want the rumor or only what I can verify?","How much uncertainty can you work with?"],danger:["How bad is it?","Am I about to need a new hiding place?"],deal:["What part do you need me to play?"]}
 },
 jessa:{
  address:"Rovan",directness:.9,humor:.35,
  stage:{neutral:["Jessa keeps working while she talks, voice steady over the channel.","Jessa answers without wasting a second.","Jessa glances at the nearest telemetry panel and keeps listening."],highRespect:["Jessa's attention shifts fully to Rovan.","Jessa gives a short nod, ready to move.","Jessa stops what she is doing long enough to make sure Rovan has her full answer."],irritated:["Jessa stops what she's doing and fixes Rovan with a flat look.","Jessa's reply comes back sharper than usual.","Jessa folds her arms, waiting for the useful part."]},
  act:{threat:["Save it for the people shooting at us.","If you're trying to scare me, pick a quieter day."],accusation:["Then ask me straight instead of circling it.","If I knew something you needed, you'd have it."],apology:["We're good. Move.","Accepted. Next problem."],bargain:["If this is about money, make it quick.","Fine. What's the job and what's the risk?"],reassure:["I know, Rovan.","Good. Then give me the plan."],tease:["You can be funny after we survive this.","Keep talking. I'm almost entertained."],challenge:["You really want to make this a contest? Fine.","Careful. I actually enjoy winning."],demand:["Give me the useful version.","Go."],question:["Ask.","What do you need?"]},
  tail:{ship:["Give me the system and the condition.","Can it fly?"],danger:["Range, cover, numbers. Start there.","Who needs shooting?"],intel:["Who, where, and what changes if we wait?","What's the part that changes the plan?"],trust:["You need reassurance or backup?"],credits:["Is the money worth the risk?"],deal:["What's our part?"]}
 }
};
function npcStageBeat(npc,analysis){
 const mood=npcMood(npc),style=GM_NPC_STYLE[npc.id]||{};
 let pool=style.stage?.[mood]||style.stage?.neutral||[];
 let beat=gmFreshPick(pool,"beat",npc.id)||`${npc.name} considers that.`;
 if(analysis.topic==="marr"&&npc.id==="dren"&&chance(.34))beat="Dren's eyes narrow the instant Marr comes up.";
 if(analysis.topic==="ship"&&npc.id==="jessa"&&chance(.34))beat="Jessa's attention snaps to the Raven's telemetry.";
 if(analysis.tone==="hostile"&&npc.id==="nera"&&chance(.45))beat="Kade does not flinch. The silence that follows is colder than an argument.";
 return beat;
}
function npcMemoryCallback(npc,analysis){
 const tags=new Map((npc.memories||[]).map(m=>[m.tag,m]));
 if(tags.has("CAUGHT_ROVAN_LYING")&&(analysis.topic==="trust"||analysis.speechAct==="bluff")){
  return npc.id==="dren"?"Last time you tried to sell me a version of the truth, I caught it.":"I remember the last time your version of events did not survive inspection.";
 }
 if(npc.id==="dren"&&tags.has("MARR_SPLIT")&&["marr","credits","deal"].includes(analysis.topic))return "We talked about splitting Marr's payout. We never locked the percentage.";
 if(npc.id==="dren"&&tags.has("RIFLE_RETURNED")&&analysis.topic==="trust")return "You gave my rifle back when you did not have to. I remember that.";
 if(npc.id==="nera"&&tags.has("ACTIVE_CONTRACT")&&["kade","credits","deal"].includes(analysis.topic))return "You already have forty thousand reasons to finish my contract cleanly.";
 if(npc.id==="renn"&&tags.has("STAGED_TURNIN")&&["marr","deal","danger"].includes(analysis.topic))return "I remember the staged turn-in. I would prefer the next clever plan include an exit.";
 if(npc.id==="jessa"&&tags.has("FIELD_ALLY")&&["danger","trust","ship"].includes(analysis.topic))return "We've been under pressure together before. Give me the useful part and I am with you.";
 return null;
}
function npcKnowledgeLine(npc,analysis){
 const topic=analysis.topic;
 const marr=contractById("marr"),kade=contractById("kade"),active=contractById(DATA.story.activeContractId)||marr;
 const marrTarget=targetById("marr");
 if(topic==="marr"&&marr){
  const p=Number(marr.progress||0),t=String(analysis.text||"").toLowerCase();
  if(npc.id==="nera")return "Marr is not my priority unless that recovery job starts interfering with mine.";
  if(/send me|send it|send what you have|send the (packet|data|intel)/.test(t))return "You'll have the packet. Raw notes, timestamps, and the pieces I do not trust are marked separately.";
  if(/what am i missing|what.*missing|your instinct/.test(t))return "You're missing certainty, not effort. My instinct says the quiet lead matters more than the obvious one, but instinct is not proof.";
  if(/who else|another hunter|other hunter|competition|competing/.test(t)){
   if(npc.id==="dren")return "I do not have a verified name. I do have enough movement around the same trail to assume we are not alone.";
   return "There are signs of competition around the Marr trail, but no verified identity worth treating as fact yet.";
  }
  if(analysis.questionType==="where"||/where (is|would)|location|address/.test(t)){
   if(p>=90)return "The trail is strong enough to move on, but I still want the last location check before we commit.";
   if(p>=75)return "We have a search window, not a door number. That is close enough to stage, not close enough to shoot.";
   if(p>=50)return "Closer than before, but not a location I would hand to a pilot yet.";
   return "Not a location yet. Right now the trail tells us where Marr is not more reliably than where Marr is.";
  }
  if(/what.*trust|part.*trust|strongest lead|prove|proof|evidence|verified/.test(t)){
   return p>=50?"I trust the pattern because independent pieces are starting to point the same way. I still do not trust a final location.":"I trust that the trail is real. I do not trust any single lead enough to make it the whole plan.";
  }
  if(/why.*wide|why.*trail|why.*not|what.*slow/.test(t)){
   return "Because every useful lead still branches before it resolves. Somebody is either moving carefully or feeding the network noise.";
  }
  if(/what would you do|what do you do|your instinct|what.*next|where would you look/.test(t)){
   return "I'd pressure the quietest lead, not the loudest one. Loud leads attract hunters; quiet ones usually belong to people who think nobody noticed them.";
  }
  if(/gets there first|beats us|before us|another hunter.*first/.test(t)){
   return "Then recovery turns into interception. The seventy thousand does not change, and neither does the requirement that Marr comes back alive.";
  }
  if(/knows.*coming|expecting us|aware of us/.test(t)){
   return "I have no proof Marr knows we're coming. That is not the same thing as believing he doesn't.";
  }
  if(/walk away|drop the job|quit/.test(t)){
   return "I walk if the deal stops being the deal or the alive requirement becomes a suicide note. We're not there yet.";
  }
  if(npc.id==="jessa")return p>=75?"The Marr trail is tight enough that I would prep for contact, not another search.":"The Marr trail still looks like a hunt, not an intercept.";
  if(npc.id==="renn")return p>=50?"The trail is narrowing. That makes me feel better about the intel and worse about who else may be watching it.":"We have a real trail, but not one I would bet my life on yet.";
  if(p>=90)return "Marr's trail is hot enough to move on now. Alive still matters.";
  if(p>=75)return "We've got a narrow search window on Marr. Wait too long and it closes.";
  if(p>=50)return "The Marr trail is narrowing. We're past guessing, but not at a clean intercept.";
  return "Marr's trail is still too wide. We have enough to know it is real, not enough to kick in a door.";
 }
 if(topic==="kade"&&kade){
  if(npc.id==="nera")return `My contract is still active. Your payout is forty thousand credits, and I care about the result more than the theater around it.`;
  return `Kade's job is still active. That is a separate forty-thousand-credit thread, and mixing it with Marr would be a mistake.`;
 }
 if(topic==="credits"){
  if(npc.id==="nera")return "My contract pays you forty thousand credits under the current terms. If you want more, show me what changed.";
  if(active?.id==="marr"){
   if(npc.id==="dren")return "Marr is worth seventy thousand. The exact split between us is still not settled.";
   return "The Marr recovery is worth seventy thousand credits, but the alive requirement limits the easy options.";
  }
  if(active?.id==="kade")return "Kade's payout to Rovan is forty thousand credits if the terms are met.";
  return "There is money on the table, but no clean reason to change the numbers yet.";
 }
 if(topic==="ship"){
  const sys=weakestShipSystem();
  if(!sys)return "The Raven is not showing a clear weak system right now.";
  return `${sys.name} is the weakest live system at ${Math.round(sys.condition)} percent. It is usable, but that is the number I would plan around.`;
 }
 if(topic==="trust"){
  const m=npc.mood||{},t=String(analysis.text||"").toLowerCase();
  if(/lead|intel|trail|marr/.test(t)){
   if(npc.id==="nera")return "I trust verified information. This lead is not verified enough to stop checking it.";
   if(npc.id==="renn")return "I trust the lead enough to keep listening. I do not trust it enough to stand in front of it.";
   if(npc.id==="jessa")return "I trust the lead enough to prep for it, not enough to walk in blind.";
   return "I trust the lead enough to keep working it. I do not trust it enough to stop checking for a trap.";
  }
  if(npc.id==="nera")return Number(m.irritation||0)>=60?"My confidence in you is not the same thing as patience. Do not confuse them.":"Trust is not the metric I use. Predictable results are.";
  if(npc.id==="renn")return Number(m.trust||0)>=60?"I trust you. I just don't trust the plans that seem to form around you.":"I trust you more than I trust the situation. That is as generous as I can be right now.";
  if(npc.id==="jessa")return Number(m.trust||0)>=65?"I trust you enough to follow the plan—and enough to tell you when the plan turns stupid.":"I trust you, Rovan. That does not make every idea a good one.";
  if(Number(m.irritation||0)>=60)return "Right now, the problem is not whether I heard you. It is whether I believe the next thing you say will make this simpler.";
  if(Number(m.trust||0)>=65)return "You've earned more room than most people get from me. Do not waste it.";
  if(Number(m.trust||0)<40)return "We are not at trust. We are at mutually useful.";
  return "I trust what you do more than what you promise. Keep it that way.";
 }
 if(topic==="danger"){
  const intr=(DATA.story.interruptions||[])[0],t=String(analysis.text||"").toLowerCase();
  if(intr)return `${intr.label} is the immediate problem. Everything else can wait until that stops getting worse.`;
  if(/goes loud|shooting|fight|fire/.test(t)&&npc.id==="dren")return "If it goes loud, I keep Marr alive, keep you from getting surrounded, and complain about your plan afterward—in that order.";
  if(/goes loud|shooting|fight|fire/.test(t)&&npc.id==="jessa")return "If it goes loud, give me lanes and targets. The alive requirement means we control the room instead of turning it into a crater.";
  if(Number(DATA.story.danger||0)>=65)return "The situation is hot enough that the next choice needs an exit built into it.";
  return "The pressure is real, but we still have room to choose how this gets ugly.";
 }
 if(topic==="deal"){
  const dealContract=npc.id==="nera"?(kade||active):active;
  if(dealContract)return `${dealContract.title} is still ${dealContract.status.toLowerCase()}. The objective has not changed: ${dealContract.objective}`;
  return "There is no active deal on the board that needs rewriting.";
 }
 if(topic==="intel"){
  const target=active?.targetId?targetById(active.targetId):marrTarget,t=String(analysis.text||"").toLowerCase();
  if(/what am i missing|what.*missing|haven't said|part.*not saying/.test(t))return "You're missing certainty. We have enough pieces to make choices, not enough to pretend the choices are safe.";
  const intel=(target?.intel||[]).slice(-2);
  if(intel.length)return `The useful part is this: ${intel.join(" ")}`;
  const recent=(DATA.story.consequences?.recent||[])[0];
  if(recent)return `The newest useful change is ${recent.title.toLowerCase()}. ${recent.detail||""}`.trim();
  return "I have fragments, not a verified breakthrough. Tell me which assumption you want tested.";
 }
 return null;
}
function npcActLead(npc,analysis){
 const style=GM_NPC_STYLE[npc.id]||{};
 const lines=style.act?.[analysis.speechAct]||[];
 return gmFreshPick(lines,"line",npc.id);
}
function npcFollowup(npc,analysis){
 const style=GM_NPC_STYLE[npc.id]||{};
 const pool=style.tail?.[analysis.topic]||[];
 if(!pool.length)return null;
 return gmFreshPick(pool,"line",npc.id);
}
function applyFreeformSocialReaction(npc,analysis){
 if(!npc||!analysis)return;
 const m=npc.mood||{};
 if(analysis.speechAct==="threat"){
  if(npc.id==="dren")adjustNpcMood(npc,{respect:1,fear:1,irritation:1});
  else if(npc.id==="renn")adjustNpcMood(npc,{fear:3,stress:2,irritation:1});
  else if(npc.id==="nera")adjustNpcMood(npc,{fear:1,irritation:2});
  else adjustNpcMood(npc,{irritation:1});
  changeReputation("intimidation",1);
 }
 if(analysis.speechAct==="accusation")adjustNpcMood(npc,{trust:-1,irritation:2});
 if(analysis.speechAct==="apology")adjustNpcMood(npc,{trust:1,irritation:-3,stress:-1});
 if(analysis.speechAct==="reassure")adjustNpcMood(npc,{trust:1,irritation:-1});
 if(analysis.speechAct==="bargain")adjustNpcMood(npc,{respect:1});
 if(analysis.speechAct==="tease"){
  if(npc.id==="dren"||npc.id==="jessa")adjustNpcMood(npc,{respect:1,irritation:-1});
  if(npc.id==="nera")adjustNpcMood(npc,{irritation:1});
 }
}
function proceduralNpcDialogue(npcId,context="",playerAction="",suppliedAnalysis=null){
 const npc=storyNpc(npcId);if(!npc)return null;
 const tables=DATA.story.offlineTables?.dialogue?.[npc.id];
 const analysis=suppliedAnalysis||analyzePlayerSpeech(playerAction||recentPlayerActionText(),context,npc.id);
 const mood=npcMood(npc);
 let parts=[];
 const lead=npcActLead(npc,analysis);if(lead)parts.push(lead);
 const fact=npcKnowledgeLine(npc,analysis);
 const tableFallback=tables?(gmFreshPick(tables[mood]||tables.neutral,"line",npc.id)||gmFreshPick(tables.neutral,"line",npc.id)):null;
 if(fact)parts.push(fact);else if(tableFallback)parts.push(tableFallback);
 const memory=npcMemoryCallback(npc,analysis);
 if(memory&&chance(analysis.topic==="trust"||analysis.topic==="marr"?.65:.38))parts.push(memory);
 const follow=npcFollowup(npc,analysis);
 if(follow&&!parts.some(p=>/[?]\s*$/.test(p))&&chance(.72))parts.push(follow);
 let line=parts.filter(Boolean).join(" ").replace(/\s+/g," ").trim();
 if(!line)line=`${npc.name} waits for Deadlock to continue.`;
 const gm=ensureGmState();gm.lastAnalysis=analysis;gm.npcTurns[npc.id]=Number(gm.npcTurns[npc.id]||0)+1;
 gm.recentTopics.unshift(analysis.topic);gm.recentTopics=gm.recentTopics.slice(0,12);
 return line;
}
function pushNpcExchange(npc,context="",playerAction="",suppliedAnalysis=null){
 const action=playerAction||recentPlayerActionText();
 const analysis=suppliedAnalysis||analyzePlayerSpeech(action,typeof context==="string"?context:"",npc.id);
 storyPush("narration","Narrator",npcStageBeat(npc,analysis));
 storyPush("dialogue",npc.name,proceduralNpcDialogue(npc.id,analysis.topic,action,analysis));
 return analysis;
}
function dialogueChoicesForNpc(npc,context="",playerAction="",suppliedAnalysis=null){
 const s=DATA.story;
 const analysis=suppliedAnalysis||ensureGmState().lastAnalysis||analyzePlayerSpeech(playerAction||recentPlayerActionText(),context,npc.id);
 const active=contractById(s.activeContractId);
 const topic=analysis.topic;
 let labels;
 if(topic==="marr")labels=[
  "“Give me the strongest lead you actually trust.”",
  "“Who else is moving on Marr?”",
  npc.id==="dren"?"“We never settled the split. What are you expecting?”":"“What part of the Marr job worries you most?”",
  "“Send me what you have. I’m moving on it.”"
 ];
 else if(topic==="credits")labels=[
  "“Then name the number you think is fair.”",
  "“Tell me what extra risk you’re pricing in.”",
  "“The payout stays where it is unless you give me a reason.”",
  "“Fine. Forget the credits—what’s the useful intel?”"
 ];
 else if(topic==="ship")labels=[
  "“Give me the weakest system first.”",
  "“Would you fly the Raven like this?”",
  "“Tell me what fails if I push her hard.”",
  "“Good enough. I’ll handle the repair.”"
 ];
 else if(topic==="kade")labels=[
  "“Then tell me what makes your timeline more urgent.”",
  "“What changes if I finish Marr first?”",
  "“Give me a reason your contract moves to the top.”",
  "“Fine. Restate the terms and the deadline.”"
 ];
 else if(topic==="trust")labels=[
  "“Then tell me what you think I’m hiding.”",
  "“I’m asking for the truth, not reassurance.”",
  "“You’ve had chances to burn me. You didn’t.”",
  "“Fine. We don’t need trust—just a deal that holds.”"
 ];
 else if(analysis.speechAct==="accusation"||analysis.speechAct==="threat")labels=[
  "“Then answer me straight. What are you holding back?”",
  "“Fine. Start with what you can prove.”",
  "“I’m not here to fight you. Help me solve this.”",
  "“Keep dodging and I’ll find the answer without you.”"
 ];
 else labels=[
  "“Give me the part you haven’t said yet.”",
  "“I need something concrete—a name, a location, or a time.”",
  "“Tell me what you would do in my place.”",
  "“That’s enough. Send me what you have.”"
 ];
 return [
  {id:uid("choice"),label:labels[0],intent:"dialogue",npcId:npc.id,skill:"Negotiation",dc:12,contractId:active?.id||null},
  {id:uid("choice"),label:labels[1],intent:"dialogue",npcId:npc.id,skill:"Negotiation",dc:13,contractId:active?.id||null},
  {id:uid("choice"),label:labels[2],intent:"dialogue",npcId:npc.id,skill:"Insight",dc:12,contractId:active?.id||null},
  {id:uid("choice"),label:labels[3],intent:labels[3].includes("holding back")?"deception":"action",npcId:labels[3].includes("holding back")?npc.id:null,skill:labels[3].includes("holding back")?"Deception":null,dc:labels[3].includes("holding back")?13:null,contractId:active?.id||null}
 ];
}

function availableComplications(){
 const table=DATA.story.offlineTables?.complications||[];
 const hasActive=activeContracts().length>0;
 return table.filter(e=>{
  if(e.requires==="active_contract"&&!hasActive)return false;
  if(DATA.story.director.lastEventId===e.id&&table.length>1)return false;
  return true;
 });
}
function materializeComplication(event){
 const s=DATA.story,d=s.director;
 d.lastEventId=event.id;d.generatedCanonCount++;
 s.danger=clamp(Number(s.danger)+Number(event.danger||0),0,100);
 setTimeout(()=>storyCinematic(event.id),40);
 storyPush("narration","Narrator",event.label,{eventId:event.id,tags:event.tags||[]});

 const iid=uid("interrupt");
 const threadRelevant=["rival_hunter","informant_offer"].includes(event.id);
 const activeContract=threadRelevant?contractById(s.activeContractId):null;
 const interruption={
  id:iid,eventId:event.id,label:event.label,
  summary:event.id==="anonymous_ping"?"An incoming signal is waiting on a separate channel.":
          event.id==="patrol_scan"?"The patrol is becoming a live tactical problem.":
          event.id==="rival_hunter"?"Competition is moving on the same contract thread.":
          event.id==="ship_fault"?"The Raven needs attention, but your conversation remains available.":
          "A new complication has entered the scene.",
  danger:Number(event.danger||0),
  urgency:["patrol_scan","rival_hunter"].includes(event.id)?8:5,
  choices:(event.choices||[]).slice(0,4).map(c=>({
    id:uid("ichoice"),label:c[0],skill:c[1]||null,dc:c[2]||null,intent:c[3]||"action",
    interruptId:iid,eventId:event.id,contractId:activeContract?.id||null,
    npcId:/\bdren\b/i.test(c[0])?"dren":/\bjessa\b/i.test(c[0])?"jessa":null
  }))
 };
 s.interruptions=s.interruptions||[];
 s.interruptions.push(interruption);
 s.interruptions=s.interruptions.slice(-2);

 if(event.id==="ship_fault"){
  const sys=pick(DATA.ship.systems.filter(x=>x.online));
  if(sys){
   sys.condition=clamp(sys.condition-(4+Math.floor(Math.random()*8)),0,100);
   interruption.systemId=sys.id;
   interruption.choices=interruption.choices.map(c=>({...c,systemId:sys.id}));
   storyPush("system","The Raven",`${sys.name} condition dropped to ${sys.condition}%.`);
   addConsequence(`${sys.name} damaged`,`System fault reduced condition to ${sys.condition}%.`,"warn",{systemId:sys.id});
  }
 }
 const hostile=["rival_hunter","patrol_scan"].includes(event.id),pressure=Number(s.danger||0);
 if(hostile&&(pressure>=85||(pressure>=65&&chance(.55)))){
  removeInterruption(iid);startForcedCombat({source:event.id,danger:pressure,reason:event.id==="rival_hunter"?"A rival hunter has closed the distance and opened fire.":"The security patrol has escalated from scan to armed interception.",objective:"Survive the contact, defeat the opposition, or break away.",returnPage:"Story",contractId:activeContract?.id||null});
 }
 d.lastTopic=event.id==="informant_offer"?"credits":(event.tags?.[0]||"open").toLowerCase();
}

function consequenceFromRoll(roll,choice){
 const tables=DATA.story.offlineTables?.reactions||{};
 if(!roll)return null;
 if(roll.natural===20)return pick(tables.critical);
 return pick(roll.success?tables.success:tables.failure);
}
function inferIntent(text=""){
 const raw=String(text||"");
 const t=raw.toLowerCase();
 let npcId=null;
 if(/\bdren\b/.test(t))npcId="dren";
 else if(/\bnera\b|\bkade\b/.test(t))npcId="nera";
 else if(/\brenn\b/.test(t))npcId="renn";
 else if(/\bjessa\b/.test(t))npcId="jessa";
 const analysis=analyzePlayerSpeech(raw,DATA?.story?.director?.lastTopic||"open",npcId);
 const currentNpc=storyNpc(DATA?.story?.currentNpc);
 const recent=(DATA?.story?.history||[]).slice(-4);
 const conversationActive=!npcId&&currentNpc&&recent.some(h=>h.type==="dialogue"&&h.speaker===currentNpc.name);
 const conversationalActs=new Set(["question","demand","accusation","threat","bargain","reassure","apology","tease","challenge","bluff"]);
 const explicitPhysical=/\b(i|we)\s+(repair|fix|patch|shoot|draw|attack|fire|leave|launch|walk|move|scan|search|investigate|check|open|head|go)\b/.test(t)||/^\s*(repair|fix|patch|shoot|draw|attack|fire|leave|launch|scan|search|investigate|check)\b/.test(t);
 if(conversationActive&&!explicitPhysical){
  const a=analyzePlayerSpeech(raw,DATA?.story?.director?.lastTopic||"open",currentNpc.id);
  return {intent:a.speechAct==="bluff"?"deception":"dialogue",npcId:currentNpc.id,...a};
 }
 if(npcId){
  if(analysis.speechAct==="bluff")return {intent:"deception",npcId,...analysis};
  const explicitKadeContract=npcId==="nera"&&(/kade'?s?\s+(contract|bounty)|nera kade bounty|kade bounty/.test(t));
  if(explicitKadeContract&&!/[?]|\b(tell|ask|say|why|who|where|what|how|need|want|think|trust)\b/.test(t))return {intent:"contracts",contractId:"kade",npcId,...analysis};
  return {intent:"dialogue",npcId,...analysis};
 }
 if(/\bmarr\b/.test(t))return {intent:"contracts",contractId:"marr",...analysis};
 if(/\bkade\b|\bnera\b/.test(t))return {intent:"contracts",contractId:"kade",...analysis};
 if(/turn[ -]?in|handoff|collect (the )?payout|deliver .*client/.test(t))return {intent:"turnin",...analysis};
 if(/capture|secure|confront|force .*surrender|cut off .*escape|take .*alive/.test(t))return {intent:"resolve",...analysis};
 if(/repair|fix|patch/.test(t))return {intent:"ship",actionType:"repair",...analysis};
 if(/raven|ship|engine|thruster|hyperdrive|diagnostic/.test(t))return {intent:"ship",actionType:"diagnostic",...analysis};
 if(/contract|bounty/.test(t))return {intent:"contracts",...analysis};
 if(/scan|trace|investigate|search|check/.test(t))return {intent:"investigate",...analysis};
 if(/shoot|draw|attack|fire|blackwake|luna|sol/.test(t))return {intent:"action",...analysis};
 if(/wait|watch|listen/.test(t))return {intent:"wait",...analysis};
 return {intent:"action",...analysis};
}

function reactToPlayerAction(action,choice,roll){
 const s=DATA.story;
 const inferred={...inferIntent(action||choice?.label||""),...(choice||{})};
 const intent=inferred.intent||"action";
 if(inferred.npcId)s.currentNpc=inferred.npcId;
 const violent=/\b(open fire|shoot|attack|draw (?:blackwake|luna|sol)|fire (?:blackwake|luna|sol)|go loud|start shooting)\b/i.test(String(action||choice?.label||""));
 if(violent&&!DATA.combat.active){startForcedCombat({source:"player_attack",danger:Math.max(55,Number(s.danger||0)),reason:"Deadlock chose to escalate to live fire.",objective:"Finish the fight or break contact.",returnPage:"Story"});return}

 if(inferred.interruptId){
  const it=interruptionById(inferred.interruptId);
  applyInterruptionConsequence(inferred,roll);
  if(inferred.npcId){
    const npc=storyNpc(inferred.npcId);
    if(npc){
      const playerText=action||choice?.label||"";
      const analysis=analyzePlayerSpeech(playerText,it?.eventId||"interrupt",npc.id);
      pushNpcExchange(npc,analysis.topic,playerText,analysis);
      if(!roll)applyFreeformSocialReaction(npc,analysis);
      applyNpcChoiceConsequence(npc,{...inferred,intent:"dialogue"},roll);
    }
  }else{
    const result=roll?(roll.success?"works and stabilizes the immediate problem":"does not resolve cleanly, and the complication gets sharper"):"changes the situation";
    storyPush("narration","Narrator",`Deadlock's response to ${it?.label||"the interruption"} ${result}.`);
  }
  return;
 }

 if(intent==="dialogue"||(intent==="deception"&&inferred.npcId)){
  const npc=storyNpc(inferred.npcId||s.currentNpc);
  if(npc){
   const playerText=action||choice?.label||"";
   const analysis=analyzePlayerSpeech(playerText,inferred.topic||s.director.lastTopic,npc.id);
   pushNpcExchange(npc,analysis.topic,playerText,analysis);
   s.currentSpeaker=npc.name;s.currentNpc=npc.id;
   setTimeout(()=>uiBeep(430,.035,.015),20);
   if(!roll)applyFreeformSocialReaction(npc,analysis);
   applyNpcChoiceConsequence(npc,inferred,roll);
   if(inferred.actionType==="intel_contact"&&inferred.contractId&&roll?.success){
    const linked=contractById(inferred.contractId);
    if(linked)contractProgress(linked,4+Math.floor(Math.random()*3),`${npc.name} confirmed a useful piece of the trail.`,"good");
   }
   s.choices=dialogueChoicesForNpc(npc,analysis.topic,playerText,analysis);
   s.objective=`Continue the conversation with ${npc.name}, or act on what was said.`;
   return;
  }
 }

 if(intent==="turnin"){
  const contract=resolveContractFromAction(action,inferred,true);if(contract){turnInContract(contract);return}
 }
 if(intent==="resolve"){
  const contract=resolveContractFromAction(action,inferred,true);if(contract&&resolveContractEncounter(contract,inferred,roll))return
 }

 if(intent==="ship"){
  const sys=shipSystemById(inferred.systemId)||weakestShipSystem();
  s.consequences.lastSystemId=sys?.id||null;

  if(inferred.actionType==="repair"||/\brepair\b|\bfix\b|\bpatch\b/i.test(inferred.label||action||"")){
   repairSystem(sys,roll||{success:false,natural:0});
   const next=weakestShipSystem();
   storyPush("narration","Narrator",`The Raven's maintenance display refreshes. ${sys?.name||"The subsystem"} now reads ${sys?.condition??"?"}%.`);
   s.choices=[
    {id:uid("choice"),label:`Re-run diagnostics on ${sys?.name||"the repaired system"}.`,intent:"ship",actionType:"diagnostic",systemId:sys?.id||null,skill:"Technical",dc:10},
    ...(next&&next.condition<95?[{id:uid("choice"),label:`Repair ${next.name}.`,intent:"ship",actionType:"repair",systemId:next.id,skill:"Technical",dc:12}]:[]),
    {id:uid("choice"),label:"Launch now and accept the remaining risk.",intent:"action",skill:"Piloting",dc:12,contractId:s.activeContractId||null},
    {id:uid("choice"),label:"Call Jessa and ask for a second opinion.",intent:"dialogue",npcId:"jessa",skill:"Negotiation",dc:10}
   ].slice(0,5);
   s.objective="Decide whether The Raven is ready to move.";
   return;
  }

  const condition=sys?.condition??100;
  if(roll?.success)addConsequence("Raven diagnostic complete",`${sys?.name||"Primary systems"} identified at ${condition}%.`,"info",{systemId:sys?.id});
  storyPush("narration","Narrator",condition<70
    ?`The Raven's diagnostic isolates ${sys.name} as the weak point. At ${condition}% condition, it is still usable, but Deadlock would be betting on it under stress.`
    :`The Raven completes the check. ${sys?.name||"Primary systems"} is currently the weakest relevant system at ${condition}%.`);
  setTimeout(()=>storyCinematic(condition<70?"ship_fault":"new_intel",condition<70?`${sys?.name||"Subsystem"} requires attention`:`${sys?.name||"System"} // ${condition}%`),35);
  s.choices=[
    {id:uid("choice"),label:`Repair ${sys?.name||"the weakest system"} before departure.`,intent:"ship",actionType:"repair",systemId:sys?.id||null,skill:"Technical",dc:12},
    {id:uid("choice"),label:"Leave it alone and launch now.",intent:"action",skill:"Piloting",dc:12,contractId:s.activeContractId||null},
    {id:uid("choice"),label:"Run a weapons and shield readiness test.",intent:"ship",actionType:"diagnostic",systemId:"overcharge",skill:"Technical",dc:11},
    {id:uid("choice"),label:"Call Jessa and ask for a second opinion.",intent:"dialogue",npcId:"jessa",skill:"Negotiation",dc:10}
  ];
  s.objective="Decide whether The Raven is ready to move.";
  return;
 }

 const contractContext=!!inferred.contractId || intent==="contracts" || intent==="bounty" || (intent==="investigate"&&!inferred.interruptId) || (intent==="deception"&&!!inferred.contractId);
 if(contractContext){
  let contract=resolveContractFromAction(action,inferred,!inferred.interruptId);
  if(!contract&&(intent==="contracts"||intent==="bounty"))contract=weightedPick(activeContracts(),c=>Math.max(1,Number(c.reward||0)/10000));
  if(contract){
   setActiveContract(contract);
   applyContractRollConsequence(contract,inferred,roll);
   const stage=contractStageInfo(contract);
   storyPush("narration","Narrator",`Deadlock keeps ${contract.title} pinned to the tactical display. ${stage.title}. ${stage.goal}`);
   setTimeout(()=>storyCinematic("new_intel",`${contract.title} // ${stage.title}`),35);
   s.choices=missionChoices(contract);
   s.objective=stage.goal;
   return;
  }
 }

 const consequence=consequenceFromRoll(roll,inferred);
 const opener=pick(DATA.story.offlineTables?.sceneOpeners)||"The situation shifts.";
 const atmosphere=chance(.5)?pick(DATA.story.offlineTables?.atmosphere):"";
 storyPush("narration","Narrator",`${opener} ${atmosphere||""} ${consequence||"Deadlock's move changes the shape of the next decision."}`.replace(/\s+/g," ").trim());
 s.choices=[
  {id:uid("choice"),label:"Press the advantage before the situation changes.",intent:"action",contractId:s.activeContractId||null,skill:"Survival",dc:12},
  {id:uid("choice"),label:"Stop and gather more information.",intent:"investigate",contractId:s.activeContractId||null,skill:"Investigation",dc:12},
  {id:uid("choice"),label:"Bring a contact into the problem.",intent:"dialogue",npcId:s.currentNpc||"dren",contractId:s.activeContractId||null,skill:"Negotiation",dc:11},
  {id:uid("choice"),label:"Change the plan entirely and look for a more profitable angle.",intent:"bounty",skill:"Investigation",dc:13}
 ];
}

function maybeTriggerEncounter(){
 const s=DATA.story,d=s.director;
 if(d.encounterCooldown>0){d.encounterCooldown--;return false}
 const danger=Number(s.danger||0),tension=clamp(Number(d.tension||0)+danger*.25,0,100);
 const p=danger>=90?.85:danger>=75?.58:.12+(tension/100)*.28;
 if(!chance(p))return false;
 const available=availableComplications(),hostile=available.filter(e=>["rival_hunter","patrol_scan"].includes(e.id));
 const event=danger>=85&&hostile.length?weightedPick(hostile):weightedPick(available);
 if(!event)return false;
 materializeComplication(event);
 d.encounterCooldown=2+Math.floor(Math.random()*3);
 d.tension=clamp(d.tension+Number(event.danger||5),0,100);
 return true;
}
function localStoryGenerate(action="",choice=null){
 const s=DATA.story,d=s.director;
 d.turn++;
 const text=(action||choice?.label||"").trim();
 const roll=s.pendingRoll;
 const preservedChoices=choice?.interruptId?structuredClone(s.choices||[]):null;
 if(text){
  const inferred=choice||inferIntent(text);
  d.lastTopic=inferred.topic||inferred.intent||d.lastTopic;
  if(inferred.npcId)d.lastNpc=inferred.npcId;
 }
 reactToPlayerAction(text,choice,roll);
 if(preservedChoices)s.choices=preservedChoices;

 // Dynamic memory / continuity effects. Pressure can rise OR recover.
 if(roll){
  if(roll.success)d.tension=clamp(d.tension-4,0,100);
  else d.tension=clamp(d.tension+4,0,100);
 }
 const eventTriggered=maybeTriggerEncounter();
 if(!eventTriggered){
  if(chance(.32)){
   const atm=pick(s.offlineTables?.atmosphere);
   if(atm)storyPush("narration","Narrator",atm);
  }
 }
 // Long-session pacing: pressure naturally drifts back toward a playable baseline.
 // Complications can still spike it sharply, but neither 0% nor 100% becomes sticky.
 d.tension=clamp(Math.round((Number(d.tension)*.94)+(32*.06)),0,100);
 const blended=Math.round((Number(s.danger)*.80)+(Number(d.tension)*.20));
 const paced=Math.round((blended*.94)+(30*.06));
 s.danger=clamp(paced,0,eventTriggered?100:94);
 s.pendingRoll=null;
 save();
}

function openStoryProvider(){
 const s=DATA.story;
 openModal("Narrative Engine",`<div class="field"><label>Primary Mode</label><select id="providerMode"><option value="offline" ${s.provider!=="ai"?"selected":""}>Offline Narrative Director — Recommended</option><option value="ai" ${s.provider==="ai"?"selected":""}>Online AI Enhancement</option></select></div><div class="field"><label>Optional AI Bridge URL</label><input id="providerEndpoint" value="${esc(s.aiEndpoint||"/api/story")}" placeholder="/api/story"></div><p class="small muted">Offline mode is the complete default game and needs no connection. AI mode is optional and only enhances open-ended narration when a bridge is reachable.</p><button class="btn good" id="saveProvider">Save</button><button class="btn" id="testProvider">Test Optional Bridge</button>`);
 setTimeout(()=>{
  $("#saveProvider").onclick=()=>{s.provider=$("#providerMode").value==="ai"?"ai":"offline";s.aiEndpoint=$("#providerEndpoint").value.trim();save();$("#modal").close();render("Story")};
  $("#testProvider").onclick=async()=>{try{let r=await fetch($("#providerEndpoint").value.trim().replace(/\/api\/story$/,"/api/health"));if(!r.ok)throw new Error(r.status);let j=await r.json();toast(j.ok?"Optional AI bridge online":"Bridge error")}catch(e){toast("Offline mode unaffected — AI bridge unavailable")}}
 },0)
}




/* ===== v11 LIVING SCENES: 2.5D ANIMATED UNIVERSE ===== */
function sceneLocationId(){
 const g=galaxyState?.();
 const locText=String(DATA?.story?.location||"").toLowerCase();
 if(locText.includes("blackglass"))return "blackglass_station";
 for(const l of GALAXY?.locations||[])if(locText.includes(String(l.name||"").toLowerCase()))return l.id;
 return g?.currentLocationId||g?.homeId||"blackglass_station";
}
function scenePresetFor(page){
 const district=DATA.exploration?.current;if(page==="Story"&&district?.locationId==="veyra_prime"&&DATA.story.location.includes(district.name)){const key={"Upper City":"veyra_upper","Corporate District":"veyra_upper","Undercity":"veyra_undercity","Lower Port":"urban","Orbital Ring":"cockpit"}[district.name];if(key)return key;}
 const g=galaxyState?.(),locId=sceneLocationId(),theme=SCENES?.locationThemes?.[locId]||"unknown";
 if(page==="HQ"){const site=galaxyState?.()?.currentSiteId||"blackglass_hq";return SCENES?.blackglassSitePresets?.[site]||"blackglass"}
 if(page==="Combat")return "combat";
 if(page==="Dogfight")return "orbit";
 if(page==="Ship"){const room=DATA?.settings?.shipScene||"cockpit";return SCENES?.ravenInteriorPresets?.[room]||"cockpit"}
 if(page==="Galaxy"&&g?.phase==="transit")return "cockpit";
 if(page==="Galaxy"&&g?.phase==="orbit")return "orbit";
 if(page==="Story"){
  if(/raven|cockpit|ship/i.test(DATA?.story?.location||""))return "cockpit";
  return theme;
 }
 return theme;
}
function sceneContext(page){
 const presetId=scenePresetFor(page),preset=SCENES?.presets?.[presetId]||SCENES?.presets?.unknown||{};
 const g=galaxyState?.(),loc=galaxyLocation?.(sceneLocationId()),npc=currentStoryVisualNpc?.();
 let title=loc?.name||DATA?.story?.location||"Deadlock Reach",sub="LIVING SCENE";
 if(page==="HQ"){const site=hqSite?.(g?.currentSiteId)||hqSite?.("blackglass_hq");title=site?.name||"Blackglass Station";sub=`DEADLOCK HQ // ${String(preset.room||"COMMAND").toUpperCase()}`}
 if(page==="Ship"){title="The Raven";sub=`INTERIOR // ${String(preset.room||"COCKPIT").toUpperCase()}`}
 if(page==="Combat"){title=DATA?.combat?.reason||"Hostile Contact";sub="GROUND ENCOUNTER // LIVE"}
 if(page==="Dogfight"){title=DATA?.dogfight?.reason||"The Raven";sub="SPACE COMBAT // LIVE"}
 if(page==="Galaxy"&&g?.phase==="transit"){title="Hyperspace Transit";sub=`ROUTE // ${g?.transit?.progress||0}%`}
 if(page==="Story"){title=DATA?.story?.location||title;sub=`SCENE ${DATA?.story?.sceneNumber||1} // ${String(DATA?.story?.sceneType||"INTERACTION").toUpperCase()}`}
 return {page,presetId,preset,loc,npc,title,sub};
}
function sceneActorAsset(id,state="neutral"){
 if(id==="rovan")return assetUrl("characters","rovan",state)||assetUrl("characters","rovan","neutral")||"assets/rovan.jpg";
 const key=id==="kade"?"nera":id;
 return assetUrl("characters",key,state)||assetUrl("characters",key,"neutral")||assetFallback("characters",key)||assetUrl("characters","unknown","holo");
}
function sceneActorState(npc){
 // Dedicated expression art can be swapped into the manifest later. For now keep established character faces stable
 // and express mood through motion, lighting, posture, and voice instead of non-canon placeholder faces.
 return "neutral";
}
function sceneMoodClass(npc){
 if(!npc)return "mood-neutral";const m=npc.mood||{};
 if(Number(m.irritation||0)>=60)return "mood-irritated";
 if(Number(m.fear||0)>=55)return "mood-guarded";
 if(Number(m.trust||50)<35)return "mood-wary";
 if(Number(m.trust||50)>=68||Number(m.respect||50)>=68)return "mood-open";
 return "mood-neutral";
}
function actorMarkup(id,side,state="neutral",label="",mood="mood-neutral"){
 const src=sceneActorAsset(id,state),fallback=assetFallback("characters",id==="kade"?"nera":id)||sceneActorAsset(id,"neutral");
 const injury=id==="rovan"&&Number(DATA?.character?.health||100)<=Math.max(1,Number(DATA?.character?.healthMax||100)*.35)?" actor-injured":"";
 const interactive=side==="right"&&id!=="rovan"?` data-scene-contact="${esc(id)}" role="button" tabindex="0" aria-label="Interact with ${esc(label||id)}"`:"";
 return `<div class="scene-actor actor-${side} ${esc(mood)}${injury}" data-scene-actor="${esc(id)}"${interactive}><div class="actor-shadow"></div><img src="${esc(src)}" alt="${esc(label||id)}" ${fallback&&fallback!==src?`onerror="this.onerror=null;this.src='${esc(fallback)}'"`:""}><div class="actor-rim"></div><div class="actor-breath"></div></div>`;
}
function sceneTraffic(count=3){return Array.from({length:count},(_,i)=>`<i class="scene-ship ship-${i%4}" style="--lane:${i};--delay:${-(i*2.7)}s"></i>`).join("")}
function sceneParticles(count=18,theme="hq"){return Array.from({length:count},(_,i)=>`<i class="scene-particle p-${i%6}" style="--i:${i};--x:${(i*37)%101};--y:${(i*61)%97};--delay:${-(i*.41)}s"></i>`).join("")}
function sceneCrowd(count=4){return `<div class="scene-crowd">${Array.from({length:count},(_,i)=>`<i style="--i:${i};--delay:${-(i*1.7)}s"></i>`).join("")}</div>`}
function sceneHotspots(ctx){
 const id=ctx.presetId;let spots=[];
 if(id==="blackglass")spots=[["Galaxy","HOLO TABLE",50,58],["Holonet","COMMS",20,36],["Contracts","CONTRACT NET",82,42]];
 if(id==="blackglass_briefing")spots=[["Contracts","MISSION FILES",33,43],["Targets","TARGET DOSSIERS",68,43],["Galaxy","TACTICAL MAP",50,62]];
 if(id==="blackglass_hangar")spots=[["Ship","THE RAVEN",50,53],["Galaxy","DEPARTURE CONTROL",79,34],["Weapons","BENCH ACCESS",22,58]];
 if(id==="blackglass_quarters")spots=[["Journal","JOURNAL",72,41],["Gear","GEAR LOCKER",27,47],["Identities","IDENTITIES",76,62]];
 if(id==="blackglass_contracts")spots=[["Contracts","ACTIVE WORK",31,38],["Bounties","BOUNTY NET",51,38],["Targets","DOSSIERS",72,38]];
 if(id==="cockpit")spots=[["Galaxy","NAVCOM",50,64],["Dogfight","FLIGHT HUD",79,47],["Ship","SYSTEMS",20,52]];
 if(id==="raven_cargo")spots=[["Inventory","CARGO MANIFEST",50,58],["Gear","FIELD KIT",22,48]];
 if(id==="raven_engineering")spots=[["Ship","POWER CORE",50,46],["Ship","DIAGNOSTICS",79,48]];
 if(id==="raven_weapons")spots=[["Weapons","WEAPON BENCH",50,52],["Combat","TACTICAL LOADOUT",79,40]];
 if(id==="raven_prisoner")spots=[["Targets","PRISONER DOSSIER",50,48],["Contracts","RECOVERY JOBS",78,55]];
 if(id==="raven_quarters")spots=[["Journal","JOURNAL",73,42],["Gear","GEAR",27,49]];
 return spots.map(([page,label,x,y])=>`<button type="button" class="scene-hotspot" data-scene-page-link="${esc(page)}" style="--hx:${x}%;--hy:${y}%"><i></i><span>${esc(label)}</span></button>`).join("");
}
function livingSceneMarkup(ctx){
 const p=ctx.preset||{},page=ctx.page,theme=p.theme||ctx.presetId;
 const recent=[...(DATA?.story?.history||[])].reverse().find(h=>h.type==="dialogue");
 const npc=ctx.npc, npcId=npc?.id||null, npcState=sceneActorState(npc);
 const actors=[];
 if(page==="Story"){
  actors.push(actorMarkup("rovan","left","focused","Rovan Kes","mood-neutral"));
  if(npcId)actors.push(actorMarkup(npcId,"right",npcState,npc.name,sceneMoodClass(npc)));
 }else if(page==="HQ")actors.push(actorMarkup("rovan","left","neutral","Rovan Kes","mood-neutral"));
 else if(page==="Combat")actors.push(actorMarkup("rovan","left","focused","Rovan Kes","mood-neutral"));
 else if(page==="Ship"||page==="Galaxy"&&ctx.presetId==="cockpit")actors.push(actorMarkup("rovan","left","focused","Rovan Kes","mood-neutral"));
 const danger=clamp(Number(DATA?.story?.danger||0),0,100);
 const groundEnemies=page==="Combat"&&typeof liveCombatEnemies==="function"?liveCombatEnemies().slice(0,5):[];
 const groundEnemyCount=page==="Combat"?Math.max(1,groundEnemies.length||3):0;
 const dogEnemies=page==="Dogfight"&&typeof liveDogfightEnemies==="function"?liveDogfightEnemies().slice(0,5):[];
 const dogEnemyCount=page==="Dogfight"?Math.max(1,dogEnemies.length||3):0;
 const groundEnemyMarkup=groundEnemies.length?groundEnemies.map((e,i)=>`<button class="scene-enemy-unit ${e.id===selectedCombatTarget?"targeted":""}" data-scene-enemy-target="${esc(e.id)}" style="--slot:${i}"><i></i><span>${esc(e.name)}</span><b><em style="width:${clamp(Number(e.hp||0)/Math.max(1,Number(e.hpMax||1))*100,0,100)}%"></em></b></button>`).join(""):Array.from({length:groundEnemyCount},(_,i)=>`<i class="scene-enemy-placeholder" style="--slot:${i}"></i>`).join("");
 const dogEnemyMarkup=dogEnemies.length?dogEnemies.map((e,i)=>`<i class="scene-fighter-unit" data-fighter-id="${esc(e.id)}" style="--slot:${i};--hp:${clamp(Number(e.hp||0)/Math.max(1,Number(e.hpMax||1))*100,0,100)}"><b>${esc(e.name)}</b></i>`).join(""):Array.from({length:dogEnemyCount},(_,i)=>`<i class="scene-fighter-unit" style="--slot:${i}"></i>`).join("");
 const inTransit=page==="Galaxy"&&galaxyState?.()?.phase==="transit";
 return `<section class="living-scene theme-${esc(theme)} camera-${esc(p.camera||"slow")} ${danger>=75?"scene-high-danger":""} ${inTransit?"scene-transit":""}" data-living-scene data-scene-page="${esc(page)}" data-scene-preset="${esc(ctx.presetId)}">
  <div class="scene-camera">
   <div class="scene-world">
    <img class="scene-backdrop" src="${esc(p.background||"assets/scenes/unknown.svg")}" alt="${esc(ctx.title)} environment">
    <div class="scene-stars"></div><div class="scene-depth-haze"></div>
    <div class="scene-traffic">${sceneTraffic(Number(p.traffic||0))}</div>
    <div class="scene-atmosphere">${sceneParticles(Number(p.particles||12),theme)}</div>
    ${theme==="hq"?'<div class="scene-holo-table"><i></i><b></b><em></em></div><div class="scene-window-reflection"></div>':""}
    ${theme==="cockpit"?'<div class="scene-cockpit-glass"></div><div class="scene-instruments"><i></i><i></i><i></i><i></i><i></i></div>':""}
    ${theme==="combat"?`<div class="scene-cover cover-a"></div><div class="scene-cover cover-b"></div><div class="scene-enemies">${groundEnemyMarkup}</div>`:""}
    ${page==="Dogfight"?`<div class="scene-raven-flight"><img src="assets/ships/raven_cutout_v15.svg" alt="The Raven"></div><div class="scene-enemy-fighters">${dogEnemyMarkup}</div>`:""}
    ${inTransit?`<div class="scene-hyperspace">${Array.from({length:28},(_,i)=>`<i style="--i:${i};--a:${(i*47)%360}deg;--delay:${-(i*.11)}s"></i>`).join("")}</div>`:""}
    ${page==="Galaxy"&&ctx.presetId==="orbit"?'<div class="scene-orbit-raven"><img src="assets/raven_dedicated.jpg" alt="The Raven in orbit"></div>':""}
    ${sceneCrowd(Number(p.crowd||0))}
    <div class="scene-actors">${actors.join("")}</div>
    <div class="scene-interactives">${sceneHotspots(ctx)}</div>
    <div class="scene-light-sweep"></div><div class="scene-vignette"></div>
    <div class="scene-muzzle muzzle-player"></div><div class="scene-muzzle muzzle-enemy"></div><div class="scene-hit-flash"></div>
   </div>
  </div>
  <div class="scene-livebar"><div><span class="scene-live-dot"></span><b>${esc(ctx.title)}</b><small>${esc(ctx.sub)}</small></div><div class="scene-live-actions"><button class="scene-cinema-btn" type="button" data-scene-cinema>EXPAND</button></div></div>
 </section>`;
}
function enhanceLivingScene(page){
 if(!SCENES||!DATA)return;
 const allowed=["Story","HQ","Galaxy","Ship","Combat","Dogfight"];
 if(!allowed.includes(page))return stopSceneRuntime();
 const content=$("#content"),ctx=sceneContext(page);if(!content||!ctx)return;document.body.dataset.sceneTheme=ctx.preset?.theme||ctx.presetId||'unknown';
 const wrap=document.createElement("div");wrap.className="living-scene-card";wrap.innerHTML=livingSceneMarkup(ctx);
 if(page==="Story")content.querySelector(".story-topbar")?.after(wrap);
 else {if(page==="HQ")content.querySelector(".hq-shell")?.classList.add("scene-enhanced");const root=content.firstElementChild; if(root)root.insertBefore(wrap,root.firstChild); else content.prepend(wrap)}
 const liveScene=wrap.querySelector("[data-living-scene]");startSceneRuntime(liveScene);
 if(DATA.settings.worldFx!==false&&DATA.settings.animations!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches)window.DeadlockWorldFX?.attach?.(liveScene,ctx.preset);else window.DeadlockWorldFX?.detach?.();
 if(DATA.settings.actorRigs!==false)window.DeadlockActors?.sync?.();
 const recent=[...(DATA.story?.history||[])].reverse().find(h=>h.type==="dialogue");
 if(recent&&Date.now()-Number(SCENE_LAST_DIALOGUE.at||0)<7000){const id=speakerNpcId(recent.speaker);if(id){setSceneSpeaker(id,true);setTimeout(()=>setSceneSpeaker(id,false),1800)}}
}
function startSceneRuntime(el){
 stopSceneRuntime(false);SCENE_RUNTIME.el=el;if(!el)return;
 const move=e=>{const r=el.getBoundingClientRect(),x=((e.clientX-r.left)/Math.max(1,r.width)-.5),y=((e.clientY-r.top)/Math.max(1,r.height)-.5);SCENE_RUNTIME.pointerX=x;SCENE_RUNTIME.pointerY=y;el.style.setProperty("--px",x.toFixed(3));el.style.setProperty("--py",y.toFixed(3))};
 el.addEventListener("pointermove",move,{passive:true});
 el.querySelector("[data-scene-cinema]")?.addEventListener("click",()=>window.DeadlockPolish?.openViewer(el));
 el.querySelectorAll("[data-scene-enemy-target]").forEach(b=>b.addEventListener("click",()=>{selectedCombatTarget=b.dataset.sceneEnemyTarget;window.DeadlockActors?.react?.("rovan","notice");render("Combat")}));
 el.querySelectorAll("[data-scene-page-link]").forEach(b=>b.addEventListener("click",()=>{window.DeadlockNative?.impact?.("light").catch?.(()=>{});gameSfx('door',.55);render(b.dataset.scenePageLink)}));
 el.querySelectorAll("[data-scene-contact]").forEach(actor=>{const engage=()=>{const id=actor.dataset.sceneContact,n=storyNpc(id);if(n&&currentPage==="Story"){DATA.story.currentNpc=id;DATA.story.currentSpeaker=n.name;window.DeadlockActors?.react?.(id,"notice");window.DeadlockNative?.impact?.("light").catch?.(()=>{});gameSfx("ui",.35);toast(`${n.name} has your attention.`);setTimeout(()=>$("#storyInput")?.focus(),40)}};actor.addEventListener("click",engage);actor.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();engage()}})});
 const loop=()=>{if(!SCENE_RUNTIME.el||!document.body.contains(SCENE_RUNTIME.el))return;const t=performance.now()/1000;el.style.setProperty("--scene-time",t.toFixed(2));SCENE_RUNTIME.raf=requestAnimationFrame(loop)};SCENE_RUNTIME.raf=requestAnimationFrame(loop);
}
function stopSceneRuntime(clear=true){if(SCENE_RUNTIME.raf)cancelAnimationFrame(SCENE_RUNTIME.raf);SCENE_RUNTIME.raf=0;if(clear)SCENE_RUNTIME.el=null;window.DeadlockWorldFX?.detach?.();document.body.classList.remove("scene-cinema-open")}
function setSceneSpeaker(id,on=true){
 if(!id)return;const el=document.querySelector(`[data-scene-actor="${CSS.escape(id)}"]`)||document.querySelector(`[data-scene-actor="${CSS.escape(id==="nera"?"kade":id)}"]`);if(!el)return;
 el.classList.toggle("speaking",!!on);el.closest("[data-living-scene]")?.classList.toggle("scene-dialogue-active",!!on);window.DeadlockActors?.setSpeaking?.(id,!!on);
}
function sceneActionFx(type,detail=""){
 const s=document.querySelector("[data-living-scene]");if(!s)return;
 const cls={"player-shot":"scene-fx-player-shot","enemy-shot":"scene-fx-enemy-shot","hit":"scene-fx-hit","ship-fire":"scene-fx-ship-fire","ship-hit":"scene-fx-ship-hit","enemy-flyby":"scene-fx-flyby","narration":"scene-fx-narration"}[type]||"scene-fx-beat";
 s.classList.remove(cls);void s.offsetWidth;s.classList.add(cls);setTimeout(()=>s.classList.remove(cls),type.includes("hit")?700:480);
 window.DeadlockCinematics?.action?.(type,{detail});window.DeadlockEngagement?.feedback(type);if(type==="hit")window.DeadlockActors?.react?.("rovan","hit");if(type==="player-shot"||type==="enemy-shot")window.DeadlockWorldFX?.burst?.("sparks",type==="player-shot"?.62:.38,.47);
}
