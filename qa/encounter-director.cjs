const fs=require('fs'),vm=require('vm');const sandbox={console};vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('runtime/shipforge-catalog.js','utf8'),sandbox);vm.runInContext(fs.readFileSync('runtime/shipforge.js','utf8'),sandbox);
sandbox.DeadlockRavenVisual={partState:()=>({parts:{core:'core_twinboom_09',cockpit:'cockpit_armored_05',engine:'engine_military_06',weapon:'weapon_rotary_09',cargo:'cargo_modular_08',utility:'utility_smuggler_06'}})};
sandbox.DeadlockStoryDirector={recordChoice:()=>{}};vm.runInContext(fs.readFileSync('runtime/encounter-director.js','utf8'),sandbox);
const E=sandbox.DeadlockEncounterDirector,data={created:'qa',story:{director:{turn:7}},apex:{influence:8,members:[1,2,3]}},ctx={location:'The Raven / orbit',contract:{id:'qa-contract'}};
const a=E.generate(data,ctx);if(!a||a.options.length<3)throw Error('encounter options missing');if(!a.options.some(x=>x.source==='apex:leader'))throw Error('Apex option missing');if(!a.options.some(x=>String(x.source).startsWith('raven:')))throw Error('Raven capability option missing');
const res=E.resolve(data,a.id,a.options[0].id,{success:true});if(!res||data.story.encounters.history.length!==1)throw Error('encounter resolution not persisted');
console.log(JSON.stringify({ok:true,version:E.version,kind:a.kind,options:a.options.map(x=>x.source),history:data.story.encounters.history.length}));