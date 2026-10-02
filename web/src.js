import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/barlow-condensed/900.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/700.css';
import * as THREE from 'three';
import './style.css';

const $ = s => document.querySelector(s);
const canvas = $('#world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.05;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x202934); scene.fog = new THREE.FogExp2(0x202934, .014);
const camera = new THREE.PerspectiveCamera(72, 1, .08, 100); camera.position.set(0, 1.65, 5.7);
const ambient = new THREE.HemisphereLight(0x9db2cf, 0x434a4e, 2.1); scene.add(ambient);
const flashLight = new THREE.PointLight(0xffdfbf, 38, 22, 2); scene.add(flashLight);
const group = new THREE.Group(); scene.add(group);
const mat = (color, roughness=1, metalness=0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const concrete=mat(0x393f45,.96), dark=mat(0x20262e,.9), floorMat=mat(0x292e31,.92), trim=mat(0x6b625a,.47,.5), black=mat(0x111319,.72), brass=mat(0xb8996d,.38,.78);
function proceduralTexture(kind) {
  const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
  g.fillStyle=kind==='wood'?'#594438':'#3e4142';g.fillRect(0,0,512,512);
  let seed=kind==='wood'?71:19;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  for(let i=0;i<(kind==='wood'?950:13000);i++){
    const x=rand()*512,y=rand()*512;
    if(kind==='wood'){g.fillStyle=rand()>.5?'#b4936b14':'#100c081d';g.fillRect(x,y,rand()*280+35,rand()*2+1);}
    else{g.fillStyle=rand()>.5?'#e4d8c20b':'#03080e16';g.fillRect(x,y,rand()*3+1,rand()*3+1);}
  }
  if(kind==='wood'){for(let j=0;j<16;j++){g.strokeStyle='#160f0b35';g.lineWidth=1+rand()*2;g.beginPath();let yy=rand()*512;g.moveTo(0,yy);g.bezierCurveTo(150,yy+rand()*28,300,yy-rand()*25,512,yy+rand()*16);g.stroke();}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
const wood=mat(0xbba38e,.68,.12);wood.map=proceduralTexture('wood');wood.needsUpdate=true;
const stone=mat(0x9a9c9d,.96);stone.map=proceduralTexture('stone');stone.needsUpdate=true;
const geoBox = new THREE.BoxGeometry(1,1,1);
function box(parent, material, x,y,z, w,h,d) { const o = new THREE.Mesh(geoBox, material); o.position.set(x,y,z); o.scale.set(w,h,d); parent.add(o); return o; }
function plane(parent, material, x,y,z, w,h, rotation=0) { const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material); o.position.set(x,y,z); o.rotation.y=rotation; parent.add(o); return o; }
function signTexture(text, tint='#e9d5b6', size=1024) {
  const c=document.createElement('canvas'); c.width=c.height=size; const q=c.getContext('2d');
  q.fillStyle='#202730'; q.fillRect(0,0,size,size); q.strokeStyle='#b59a70'; q.lineWidth=18; q.strokeRect(30,30,size-60,size-60);
  q.fillStyle=tint; q.textAlign='center'; q.textBaseline='middle'; q.font=`bold ${text.length>7?105:text.length>4?145:text.length>2?205:365}px Arial`; const words=text.split(' '); if(words.length>1){const mid=Math.ceil(words.length/2);q.fillText(words.slice(0,mid).join(' '),size/2,size/2-70);q.fillText(words.slice(mid).join(' '),size/2,size/2+95);}else q.fillText(text,size/2,size/2+18);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function labelTexture(text){const c=document.createElement('canvas');c.width=1024;c.height=256;const q=c.getContext('2d');q.fillStyle='#c4bdad';q.font='bold 78px Arial';q.textAlign='center';q.fillText(text,512,155);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const lampMat=new THREE.MeshBasicMaterial({color:0xffd5a4});
const doorPositions=[-4.7,0,4.7]; let doors=[]; let roomNo=0, best=Number(localStorage.getItem('omd-best')||0), correct=0, time=0, limit=0, playing=false, last=performance.now(), yaw=0, pitch=0, px=0, pz=5.7, mouseDown=false, touchLook=null, touchPrev=null, padId=null, axis={x:0,y:0}, keys=new Set();
let lockOpen=false, lockSolved=false, lockTiles=[], lockSeed=[];
$('#best').textContent=String(best).padStart(2,'0');
const puzzles=[
 {q:'I have keys but open no locks. What am I?',a:'PIANO',bad:['MAP','CLOCK']},
 {q:'What gets wetter the more it dries?',a:'TOWEL',bad:['RAIN','SOAP']},
 {q:'I have a neck but no head. What am I?',a:'BOTTLE',bad:['GUITAR','SNAKE']},
 {q:'What has hands but cannot clap?',a:'CLOCK',bad:['TREE','CHAIR']},
 {q:'What has teeth but never bites?',a:'COMB',bad:['FORK','SHARK']},
 {q:'What can travel the world while staying in a corner?',a:'STAMP',bad:['PLANE','SHADOW']},
 {q:'What has one eye but cannot see?',a:'NEEDLE',bad:['OWL','CAMERA']},
 {q:'What goes up but never comes down?',a:'AGE',bad:['SMOKE','BALLOON']},
 {q:'I speak without a mouth and answer when called. What am I?',a:'ECHO',bad:['RADIO','WIND']},
 {q:'I follow you in light but vanish in darkness. What am I?',a:'SHADOW',bad:['MIRROR','FOOTSTEP']},
 {q:'What has a bed but never sleeps?',a:'RIVER',bad:['HOTEL','FLOWER']},
 {q:'The more you take from me, the bigger I become. What am I?',a:'HOLE',bad:['PILE','DEBT']},
 {q:'I am full of holes but still hold water. What am I?',a:'SPONGE',bad:['BUCKET','NET']},
 {q:'What breaks when you say its name?',a:'SILENCE',bad:['GLASS','PROMISE']},
 {q:'I have cities but no houses, rivers but no water. What am I?',a:'MAP',bad:['PLANET','BOOK']},
 {q:'What belongs to you but others use it more?',a:'YOUR NAME',bad:['YOUR PHONE','YOUR KEY']},
 {q:'What can fill a room but takes up no space?',a:'LIGHT',bad:['AIR','MUSIC']},
 {q:'What has many rings but no fingers?',a:'TREE',bad:['PHONE','CHAIN']},
 {q:'What is always ahead but cannot be seen?',a:'FUTURE',bad:['HORIZON','WIND']},
 {q:'What can you catch but never throw?',a:'COLD',bad:['BALL','FISH']},
 {q:'What has an end but no beginning?',a:'STICK',bad:['CIRCLE','ROAD']},
 {q:'I am tall when young and short when old. What am I?',a:'CANDLE',bad:['MOUNTAIN','LADDER']},
 {q:'What comes once in a minute, twice in a moment, never in a year?',a:'LETTER M',bad:['SECOND','LETTER E']},
 {q:'What is so fragile that speaking its name breaks it?',a:'SILENCE',bad:['ICE','GLASS']}
];
function puzzle(n){
 // Use every riddle once per cycle; late rooms also shorten the clock.
 const cycle=Math.floor((n-1)/puzzles.length), index=(n-1)%puzzles.length;
 const ordered=[...puzzles].sort((a,b)=>hashName(a.a,cycle)-hashName(b.a,cycle));
 const r=ordered[index], choices=[r.a,...r.bad];
 for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
 return {choices,clue:r.q,answer:choices.indexOf(r.a)};
}
function hashName(s,cycle){let v=cycle+17;for(const c of s)v=(v*31+c.charCodeAt(0))>>>0;return v;}
function clearRoom(){for(const obj of [...group.children]) {group.remove(obj);obj.traverse(child=>{if(child.isMesh){if(child.geometry!==geoBox)child.geometry.dispose();if(child.userData.ownedMaterial){child.material.map?.dispose();child.material.dispose();}}});}doors=[];}
function buildRoom(n){
 clearRoom(); const p=puzzle(n);correct=p.answer;$('#clue').innerHTML=p.clue;$('#room').textContent=String(n).padStart(2,'0');$('#best').textContent=String(best).padStart(2,'0');
 const tones=[0x8faabb,0xd3a476,0x9ea8b7,0xa7a68b];const accent=tones[(n-1)%tones.length];
 box(group,stone,0,-.18,0,16,.35,22);box(group,dark,0,6.15,0,16,.4,22);box(group,concrete,-8,3,0,.35,6,22);box(group,concrete,8,3,0,.35,6,22);box(group,concrete,0,3,10.9,16,6,.25);
 // A back wall with three recessed portals.
 box(group,concrete,0,5.2,-10.8,16,1.7,.5);box(group,concrete,0,.36,-10.8,16,.7,.5);
 for(const x of [-7.05,-2.35,2.35,7.05]) box(group,concrete,x,2.8,-10.8,.55,4.6,.5);
 for(let i=0;i<3;i++){
  const x=doorPositions[i], door=new THREE.Group();door.position.set(x,0,-10.45);group.add(door);doors.push(door);
  box(door,black,0,2.82,0,3.75,5.22,.24);box(door,trim,-1.82,2.85,.18,.22,5.15,.38);box(door,trim,1.82,2.85,.18,.22,5.15,.38);box(door,trim,0,5.43,.18,3.8,.23,.38);
  box(door,wood,0,2.8,.32,3.32,4.93,.22);box(door,trim,0,4.98,.47,3.1,.07,.07);box(door,trim,0,.67,.47,3.1,.07,.07);
  for(const yy of [1.15,2.25,3.35]) box(door,wood,0,yy,.445,2.7,.05,.04);
  box(door,brass,1.25,2.33,.52,.12,.4,.12);
  const tex=signTexture(p.choices[i]);const plaqueMat=new THREE.MeshStandardMaterial({map:tex,roughness:.45,metalness:.12});plane(door,plaqueMat,0,3.55,.51,2.08,1.28).userData.ownedMaterial=true;
  const no=labelTexture(`DOOR 0${i+1}`);plane(door,new THREE.MeshBasicMaterial({map:no,transparent:true}),0,5.7,.25,2.15,.54).userData.ownedMaterial=true;
  const glow=new THREE.PointLight(accent,3.7,4.8,2);glow.position.set(0,5.25,1.1);door.add(glow);
  box(door,lampMat,-1.5,5.42,.51,.18,.1,.16);box(door,lampMat,1.5,5.42,.51,.18,.1,.16);
 }
 for(let z=-8;z<10;z+=3.6){
  box(group,trim,0,5.9,z,15.4,.08,.18);box(group,black,0,6,z+.2,12,.04,.5);
  box(group,lampMat,0,5.82,z,.85,.04,.2);const l=new THREE.PointLight(0xffddaf,10,10,2);l.position.set(0,5.4,z);group.add(l);
  box(group,trim,-7.7,.18,z,.11,.17,1.2);box(group,trim,7.7,.18,z,.11,.17,1.2);
 }
 for(let z=-8;z<=9;z+=1.6){box(group,trim,-7.78,2.05,z,.08,.05,.65);box(group,trim,7.78,2.05,z,.08,.05,.65);}
 // Wall bays, skirting and ceiling ribs make the chamber read as a built place.
 for(let z=-9.2;z<10;z+=3.6){for(const side of [-1,1]){
  box(group,trim,side*7.78,2.95,z,.13,5.6,.14);
  box(group,black,side*7.7,3.15,z+1.7,.05,3.5,2.7);
  box(group,brass,side*7.64,4.7,z+1.7,.035,.035,2.5);
  box(group,lampMat,side*7.48,4.25,z,.14,.54,.14);
 }}
 for(const x of [-7.65,7.65])box(group,trim,x,.18,0,.16,.28,21);
 for(let z=-8;z<10;z+=3.6){box(group,trim,0,5.7,z,15.2,.12,.1);box(group,black,0,6.02,z+1.25,14.5,.08,.24);}
 for(let x=-6.6;x<=6.6;x+=1.65){box(group,dark,x,-.008,0,.025,.009,21);}
 for(let z=-10;z<=10;z+=1.65){box(group,dark,0,-.004,z,15.9,.009,.025);}
 box(group,black,0,.08,8.6,5,.05,.22);
 const marker=labelTexture('SOLVE THE RIDDLE');plane(group,new THREE.MeshBasicMaterial({map:marker,transparent:true}),0,3.55,-10.25,6.1,1.5);
}
function resetCamera(){px=0;pz=6.7;yaw=0;pitch=0;camera.position.set(px,1.65,pz);camera.rotation.set(0,0,0);axis={x:0,y:0};}
function start(resume=false){roomNo=resume?Math.max(1,Number(localStorage.getItem('omd-room')||1)):1;best=Number(localStorage.getItem('omd-best')||0);playing=true;$('#menu').classList.add('hidden');$('#end').classList.add('hidden');$('#hud').classList.remove('hidden');nextRoom(false);if(resume){time=Math.min(limit,Math.max(1,Number(localStorage.getItem('omd-time')||limit)));}}
function nextRoom(success){if(success){roomNo++;flash('#a7f59b');playTone(640,.11,'triangle');setTimeout(()=>playTone(900,.14,'triangle'),90);}lockOpen=false;lockSolved=false;$('#lock').classList.add('hidden');resetCamera();limit=Math.max(38,76-(roomNo-1)*1.6);time=limit;buildRoom(roomNo);saveProgress();last=performance.now();}
function end(reason){if(!playing)return;playing=false;lockOpen=false;$('#lock').classList.add('hidden');flash('#fa715f');playTone(160,.35,'sawtooth');const score=roomNo-1;if(score>best){best=score;localStorage.setItem('omd-best',String(best));}$('#final-score').textContent=score;$('#final-best').textContent=best;$('#end-title').innerHTML=reason==='timeout'?'TIME<br>IS UP.':'WRONG<br>DOOR.';$('#end-detail').textContent=reason==='timeout'?'The room swallowed your chance.':'The clue was right there. Try another run.';localStorage.removeItem('omd-room');localStorage.removeItem('omd-time');updateResume();$('#hud').classList.add('hidden');$('#end').classList.remove('hidden');document.exitPointerLock?.();}
function flash(color){const f=$('#flash');f.style.background=color;f.style.opacity='.47';setTimeout(()=>f.style.opacity='0',50);}
let audioCtx;function playTone(f,d,type='sine',volume=.09){if(!settings.sound)return;try{audioCtx ||=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(f,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(50,f*.6),audioCtx.currentTime+d);g.gain.setValueAtTime(volume*settings.soundVolume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+d);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d);}catch{}}
function nearest(){let bestIdx=-1,dist=99;doors.forEach((d,i)=>{const a=Math.hypot(px-d.position.x,pz-(-8.9));if(a<dist){dist=a;bestIdx=i;}});return dist<2.35?bestIdx:-1;}
function interact(){if(!playing||lockOpen||settingsOpen)return;const i=nearest();if(i<0){$('#hint').textContent='Move closer to a door';return;}if(i===correct)openLock();else end('wrong');}
// Each lock contains one guaranteed path through a 3×3 circuit. Players rotate
// the scrambled pieces; the live solver only accepts connected, reciprocal links.
const dirs=[[-1,0],[0,1],[1,0],[0,-1]], opposite=d=>(d+2)%4;
const rotateMask=(mask,n)=>mask.reduce((a,d)=>a|1<<((d+n)%4),0);
function lockRandom(seed){let state=(seed*1664525+1013904223)>>>0;return()=>((state=(state*1664525+1013904223)>>>0)/4294967296);}
function makeLock(n){
 const rand=lockRandom(n*7919+137), start=3, goal=5, path=[start], used=new Set(path);
 function search(cell){if(cell===goal)return path.length>=5;const r=Math.floor(cell/3),c=cell%3;
  const options=[0,1,2,3].sort(()=>rand()-.5);
  for(const d of options){const nr=r+dirs[d][0],nc=c+dirs[d][1],j=nr*3+nc;
   if(nr<0||nr>2||nc<0||nc>2||used.has(j))continue;
   used.add(j);path.push(j);if(search(j))return true;path.pop();used.delete(j);
  }return false;
 }
 if(!search(start)){path.splice(0,path.length,3,0,1,4,5);}
 const pieces=Array.from({length:9},()=>({mask:[0,1],rot:Math.floor(rand()*4)}));
 path.forEach((cell,i)=>{
  const links=[];
  for(const next of [i?path[i-1]:-1,i<path.length-1?path[i+1]:-1]){
   if(next<0)continue;const dr=Math.floor(next/3)-Math.floor(cell/3),dc=next%3-cell%3;
   links.push(dirs.findIndex(([r,c])=>r===dr&&c===dc));
  }
  if(i===0)links.push(3);if(i===path.length-1)links.push(1);
  pieces[cell].mask=links;
 });
 // Off-path pieces are decoys but keep the same visual language.
 if(isLockSolved(pieces))pieces[start].rot=(pieces[start].rot+1)%4;
 return pieces;
}
function lockFlow(tiles){const reached=new Set();const queue=[];
 if(rotateMask(tiles[3].mask,tiles[3].rot)&8){reached.add(3);queue.push(3);}
 for(const cell of queue){const bits=rotateMask(tiles[cell].mask,tiles[cell].rot);
  for(let d=0;d<4;d++){if(!(bits&(1<<d)))continue;const r=Math.floor(cell/3)+dirs[d][0],c=cell%3+dirs[d][1];
   if(r<0||r>2||c<0||c>2)continue;const next=r*3+c;
   if(!reached.has(next)&&(rotateMask(tiles[next].mask,tiles[next].rot)&(1<<opposite(d)))){reached.add(next);queue.push(next);}
  }
 }
 return {reached,solved:reached.has(5)&&!!(rotateMask(tiles[5].mask,tiles[5].rot)&2)};
}
function isLockSolved(tiles){return lockFlow(tiles).solved;}
function tileSvg(mask){const parts=mask.map(d=>{const ends=[[50,7],[93,50],[50,93],[7,50]];return `<path d="M50 50 L${ends[d][0]} ${ends[d][1]}"/>`;}).join('');
 return `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round">${parts}</g><circle cx="50" cy="50" r="11" fill="currentColor"/></svg>`;
}
function renderLock(){const flow=lockFlow(lockTiles);$('#lock-progress').textContent=`${flow.reached.size} / 9 powered`;
 $('#lock-grid').innerHTML=lockTiles.map((tile,i)=>`<button class="lock-tile ${flow.reached.has(i)?'powered':''}" data-tile="${i}" aria-label="Rotate circuit tile ${i+1}"><span style="transform:rotate(${tile.rot*90}deg)">${tileSvg(tile.mask)}</span></button>`).join('');
 if(flow.solved&&!lockSolved){lockSolved=true;$('#lock-message').textContent='CIRCUIT COMPLETE · DOOR UNLOCKED';$('#lock-grid').classList.add('solved');playTone(540,.2,'triangle');setTimeout(()=>playTone(810,.3,'triangle'),180);setTimeout(()=>{if(playing&&lockSolved)nextRoom(true);},900);}
}
function openLock(){lockOpen=true;lockSolved=false;lockTiles=makeLock(roomNo);lockSeed=lockTiles.map(t=>({...t,mask:[...t.mask]}));$('#lock-grid').classList.remove('solved');$('#lock-room').textContent=String(roomNo).padStart(2,'0');$('#lock-message').textContent='Tap to rotate · 1–9 on keyboard';$('#lock').classList.remove('hidden');document.exitPointerLock?.();playTone(330,.14,'triangle');renderLock();}
function rotateTile(i){if(!lockOpen||lockSolved||!playing||!lockTiles[i])return;lockTiles[i].rot=(lockTiles[i].rot+1)%4;playTone(235+i*21,.075,'triangle',.045);renderLock();}
$('#lock-grid').addEventListener('click',e=>{const button=e.target.closest('[data-tile]');if(button)rotateTile(Number(button.dataset.tile));});
$('#lock-reset').onclick=()=>{if(lockSolved)return;lockTiles=lockSeed.map(t=>({...t,mask:[...t.mask]}));renderLock();playTone(170,.1);};
$('#lock-close').onclick=()=>{if(lockSolved)return;lockOpen=false;$('#lock').classList.add('hidden');last=performance.now();};
$('#play').onclick=()=>start(false);$('#resume').onclick=()=>start(true);$('#again').onclick=()=>start(false);$('#interact').onclick=interact;
$('#share').onclick=async()=>{const text=`I cleared ${roomNo-1} rooms in ONE MORE DOOR. Can you beat me?`;try{if(navigator.share)await navigator.share({title:'One More Door',text,url:location.href});else{await navigator.clipboard.writeText(text+' '+location.href);$('#share').textContent='COPIED!';setTimeout(()=>$('#share').textContent='SHARE SCORE',1500);}}catch{}};
window.addEventListener('keydown',e=>{if(lockOpen){if(/^Digit[1-9]$/.test(e.code))rotateTile(Number(e.code.slice(-1))-1);if(e.code==='Escape'&&!lockSolved)$('#lock-close').click();return;}keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyE'||e.code==='Space')interact();if(e.code==='Enter'&&!playing && $('#settings').classList.contains('hidden'))start(false);if(e.code==='Escape'&&playing)openSettings();});window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('click',()=>{if(playing && matchMedia('(pointer:fine)').matches)canvas.requestPointerLock?.();});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas && playing)look(e.movementX,e.movementY);else if(mouseDown && playing)look(e.movementX,e.movementY);});canvas.addEventListener('mousedown',()=>mouseDown=true);window.addEventListener('mouseup',()=>mouseDown=false);
function look(dx,dy){yaw-=dx*.003;pitch=Math.max(-.45,Math.min(.45,pitch-dy*.0024));}
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX>innerWidth*.35){touchLook=e.pointerId;touchPrev={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{if(e.pointerId===touchLook&&touchPrev){look(e.clientX-touchPrev.x,e.clientY-touchPrev.y);touchPrev={x:e.clientX,y:e.clientY};}});
canvas.addEventListener('pointerup',e=>{if(e.pointerId===touchLook)touchLook=null;});canvas.addEventListener('pointercancel',e=>{if(e.pointerId===touchLook)touchLook=null;});
const pad=$('#pad');function padMove(e){const r=pad.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const max=r.width*.31,m=Math.hypot(x,y)||1,k=Math.min(1,max/m);axis.x=x*k/max;axis.y=y*k/max;$('#stick').style.transform=`translate(${x*k}px,${y*k}px)`;}
pad.addEventListener('pointerdown',e=>{padId=e.pointerId;pad.setPointerCapture(e.pointerId);padMove(e);});pad.addEventListener('pointermove',e=>{if(e.pointerId===padId)padMove(e);});function padUp(e){if(e.pointerId===padId){padId=null;axis={x:0,y:0};$('#stick').style.transform='';}}pad.addEventListener('pointerup',padUp);pad.addEventListener('pointercancel',padUp);
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}};
function frame(now){requestAnimationFrame(frame);resize();const dt=Math.min(.05,(now-last)/1000);last=now;if(playing && !settingsOpen){time=Math.max(0,time-dt);$('#timebar').style.transform=`scaleX(${time/limit})`;if(time<=0)end('timeout');if(!lockOpen&&playing){let forward=-(axis.y+(keys.has('KeyW')||keys.has('ArrowUp')?-1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0));let right=axis.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);const len=Math.hypot(forward,right);if(len>1){forward/=len;right/=len;}const speed=4.1;px+=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*speed*dt;pz+=(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*speed*dt;px=Math.max(-7.3,Math.min(7.3,px));pz=Math.max(-8.65,Math.min(9.65,pz));camera.position.set(px,1.65+Math.sin(now*.012)*(len>.2?.027:0),pz);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;const near=nearest();$('#hint').textContent=near<0?'Move closer to a door':`Door 0${near+1} · tap OPEN or press E`;$('#interact').style.opacity=near<0?'.47':'1';flashLight.position.set(px,2.2,pz-.4);}}else if(!playing){camera.rotation.y=Math.sin(now*.00013)*.08;}flashLight.intensity=35+Math.sin(now*.002)*2+Math.sin(now*.017)*.55;renderer.render(scene,camera);}
const defaults={brightness:2.05,music:true,musicVolume:.18,sound:true,soundVolume:1};
let settings={...defaults};try{settings={...settings,...JSON.parse(localStorage.getItem('omd-settings')||'{}')};}catch{}
let settingsOpen=false, musicOsc, musicGain, previousPlaying=false, lastMusicTick=0;
function saveProgress(){if(playing){localStorage.setItem('omd-room',String(roomNo));localStorage.setItem('omd-time',String(Math.ceil(time)));updateResume();}}
function updateResume(){const saved=Number(localStorage.getItem('omd-room')||0);$('#resume').classList.toggle('hidden',saved<1);$('#resume').textContent=`CONTINUE ROOM ${String(saved).padStart(2,'0')} ↗`;}
function applySettings(){renderer.toneMappingExposure=settings.brightness;$('#brightness').value=settings.brightness;$('#brightness-value').textContent=Math.round(settings.brightness/3.2*100)+'%';$('#music-toggle').checked=settings.music;$('#sound-toggle').checked=settings.sound;$('#music-volume').value=settings.musicVolume;$('#sound-volume').value=settings.soundVolume;if(musicGain)musicGain.gain.setTargetAtTime(settings.music?settings.musicVolume*.05:0,audioCtx.currentTime,.15);localStorage.setItem('omd-settings',JSON.stringify(settings));}
function beginMusic(){try{audioCtx ||=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();if(musicOsc)return;
 musicGain=audioCtx.createGain();musicGain.gain.value=0;const lowpass=audioCtx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=620;lowpass.connect(musicGain).connect(audioCtx.destination);
 for(const [frequency,type,level] of [[110,'sine',.7],[164.81,'triangle',.25],[220,'sine',.15]]){const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type=type;osc.frequency.value=frequency;gain.gain.value=level;osc.connect(gain).connect(lowpass);osc.start();musicOsc ||=osc;}
 applySettings();}catch{}}
function openSettings(){previousPlaying=playing;settingsOpen=true;saveProgress();$('#settings').classList.remove('hidden');document.exitPointerLock?.();beginMusic();}
function closeSettings(){settingsOpen=false;$('#settings').classList.add('hidden');last=performance.now();}
$('#settings-menu').onclick=openSettings;$('#settings-hud').onclick=openSettings;$('#settings-end').onclick=openSettings;$('#settings-close').onclick=closeSettings;
$('#brightness').oninput=e=>{settings.brightness=Number(e.target.value);applySettings();};
$('#music-toggle').onchange=e=>{settings.music=e.target.checked;beginMusic();applySettings();};
$('#sound-toggle').onchange=e=>{settings.sound=e.target.checked;applySettings();};
$('#music-volume').oninput=e=>{settings.musicVolume=Number(e.target.value);applySettings();};
$('#sound-volume').oninput=e=>{settings.soundVolume=Number(e.target.value);applySettings();};
$('#reset-save').onclick=()=>{localStorage.removeItem('omd-room');localStorage.removeItem('omd-time');localStorage.removeItem('omd-best');best=0;$('#best').textContent='00';updateResume();$('#save-status').textContent='Saved run and best score cleared.';};
$('#play').addEventListener('click',beginMusic);$('#resume').addEventListener('click',beginMusic);$('#again').addEventListener('click',beginMusic);
document.addEventListener('visibilitychange',()=>{if(document.hidden){saveProgress();last=performance.now();}else last=performance.now();});
window.addEventListener('pagehide',saveProgress);
applySettings();updateResume();buildRoom(1);requestAnimationFrame(frame);
