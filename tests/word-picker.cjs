const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const app=fs.readFileSync(require('path').join(__dirname,'../app.js'),'utf8');
const bank=app.slice(app.indexOf('const WORD_BANK='),app.indexOf("let mode='tt'"));
const picker=app.slice(app.indexOf("const HISTORY_KEY="),app.indexOf('function fresh(){'));
function boot(storage=new Map(),blocked=false){const s={Math,Map,Set,read:k=>blocked?null:storage.get(k),store:(k,v)=>{if(blocked)return false;storage.set(k,JSON.parse(JSON.stringify(v)));return true}};vm.createContext(s);vm.runInContext(bank+'\n'+picker+'\nglobalThis.pick=pickWords;globalThis.bank=WORD_BANK;globalThis.words=WORDS;',s);return s}
const storage=new Map();let s=boot(storage);const n=s.words.length;
assert(n>=1500);assert.equal(new Set(s.words).size,n);assert(s.bank.every(e=>e.word.trim()===e.word&&e.category));
const first=Array.from(s.pick(24)),counts=new Map();for(const w of first){const c=s.bank.find(e=>e.word===w).category;counts.set(c,(counts.get(c)||0)+1)}assert.equal(counts.size,12);assert([...counts.values()].every(n=>n===2));
const all=[...first];for(let i=0;i<Math.ceil(n/100)+1;i++){s=boot(storage);const round=Array.from(s.pick(100));assert.equal(new Set(round).size,100);all.push(...round)}
assert.equal(new Set(all.slice(0,n)).size,n,'no repeats during first complete dictionary cycle, including after reload');
for(let i=0;i<100;i++){const before=storage.get('stroke.word-history.v1').recent;const round=Array.from(s.pick(100));assert.equal(new Set(round).size,100);assert(!round.some(w=>before.includes(w)),'adjacent rounds must not overlap');}
const migrated=new Map([['stroke.round.v1',{words:first}]]);const upgrade=boot(migrated);assert(!Array.from(upgrade.pick(100)).some(w=>first.includes(w)),'old saved round is excluded');
const fallback=boot(new Map(),true),a=Array.from(fallback.pick(100)),b=Array.from(fallback.pick(100));assert(!b.some(w=>a.includes(w)),'memory fallback');
const broken=boot(new Map([['stroke.word-history.v1',{used:'bad',recent:[null,123,'obsolete']}]]));assert.equal(broken.pick(100).length,100);
console.log('PASS: unique prompts, balanced themes, no repeats through a full cycle with reloads, 100 successive rounds, cycle boundary, old-round migration, unavailable/corrupt storage');
