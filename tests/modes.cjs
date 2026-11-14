const fs=require('fs'),vm=require('vm'),assert=require('assert');
const els=new Map(),storage=new Map();let raf;
function el(id){if(!els.has(id))els.set(id,{id,value:({count:'12',speed:'5',voice:'reader',size:'5'})[id]||'',hidden:false,style:{},dataset:{},options:[],classList:{toggle(){},contains(){return false}},checkValidity(){const n=Number(this.value);return this.value!==''&&Number.isFinite(n)&&(this.id==='count'?Number.isInteger(n)&&n>=1&&n<=100:n>=0.5&&n<=300&&Number.isInteger(n*2))},reportValidity(){return false},setAttribute(){},append(){},replaceChildren(){},addEventListener(){},showModal(){},close(){},getBoundingClientRect(){return {left:0,top:0,width:1000,height:1000}},setPointerCapture(){},getContext(){return new Proxy({},{get:()=>()=>{}})},toDataURL(){return 'data:image/png;base64,'}});return els.get(id)}
const sandbox={console,performance:{now:()=>0},document:{getElementById:el,querySelectorAll:()=>[],querySelector:()=>el('close'),body:el('body'),addEventListener(){},createElement:()=>el(Math.random())},window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:f=>{raf=f;return 1},cancelAnimationFrame(){},setTimeout(){},SpeechSynthesisUtterance:function(){}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../app.js'),'utf8'),sandbox);

vm.runInContext(`
$('count').value='3';$('speed').value='5';choose('guess');fresh();
if(state.phase!=='ready'||!paused)throw Error('secret gate');
if(state.voice!=='reader')throw Error('voice leaks');
if($('word').textContent===state.words[0])throw Error('public prompt leaks');
$('peek-secret').onclick();if($('private-word').textContent!==state.words[0])throw Error('private preview');
$('begin-secret').onclick();if(state.phase!=='drawing'||paused||$('private-word').textContent!=='')throw Error('hide before drawing');
tick(6000);if(state.phase!=='review'||!paused||!$('guess-answer').hidden)throw Error('timeout leaks answer');
$('reveal-guess').onclick();if($('guess-answer').textContent!==state.words[0])throw Error('manual reveal');
$('guess-no').onclick();if(state.index!==1||state.phase!=='ready'||!paused)throw Error('next secret gate');
$('peek-secret').onclick();$('restore').onclick();if(!$('private-word').hidden||state.phase!=='ready')throw Error('restore leaks');
$('peek-secret').onclick();$('begin-secret').onclick();$('next').onclick();if(state.index!==2||!state.correct[1]||state.phase!=='ready')throw Error('early success');
$('peek-secret').onclick();$('begin-secret').onclick();tick(6000);$('guess-yes').onclick();if(!state.done)throw Error('guess finish');
choose('story');fresh();state.drawings[0].push({erase:false,size:5,points:[[1,2]]});next();if(state.drawings[1].length!==1||state.drawings[0]===state.drawings[1])throw Error('story canvas copy');state.drawings[1].push({erase:false,size:5,points:[[3,4]]});if(state.drawings[0].length!==1)throw Error('story snapshot mutated');next();next();if(!state.done||!$('score').textContent.includes('без очков'))throw Error('story result');
choose('tt');fresh();next();if(state.drawings[1].length!==0)throw Error('base blank canvas');
`,sandbox);
console.log('PASS: secret word gate, muted voice, hide before drawing, manual answer on timeout, per-word gate, safe restore, early guess, end round, cumulative story snapshots, base mode');
