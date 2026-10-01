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
renderer.toneMappingExposure = 1.3;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x080c12); scene.fog = new THREE.FogExp2(0x090e16, .025);
const camera = new THREE.PerspectiveCamera(72, 1, .08, 100); camera.position.set(0, 1.65, 5.7);
const ambient = new THREE.HemisphereLight(0x9db2cf, 0x202026, 1.15); scene.add(ambient);
const flashLight = new THREE.PointLight(0xffdfbf, 23, 17, 2); scene.add(flashLight);
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
  q.fillStyle=tint; q.textAlign='center'; q.textBaseline='middle'; q.font=`bold ${text.length>2?245:420}px Arial`; q.fillText(text,size/2,size/2+18);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function labelTexture(text){const c=document.createElement('canvas');c.width=1024;c.height=256;const q=c.getContext('2d');q.fillStyle='#c4bdad';q.font='bold 78px Arial';q.textAlign='center';q.fillText(text,512,155);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const lampMat=new THREE.MeshBasicMaterial({color:0xffd5a4});
const doorPositions=[-4.7,0,4.7]; let doors=[]; let roomNo=0, best=Number(localStorage.getItem('omd-best')||0), correct=0, time=0, limit=0, playing=false, last=performance.now(), yaw=0, pitch=0, px=0, pz=5.7, mouseDown=false, touchLook=null, touchPrev=null, padId=null, axis={x:0,y:0}, keys=new Set();
$('#best').textContent=String(best).padStart(2,'0');
function puzzle(n){
  let choices, clue, answer;
  const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(o=>o.v);
  if(n<=3){ choices=shuffle(['◆','●','✦']); answer=Math.floor(Math.random()*3); clue=`Choose the <em>${choices[answer]}</em> symbol`; }
  else if(n<=6){choices=shuffle(['2','3','5']);answer=Math.floor(Math.random()*3);clue=`Choose door number <em>${choices[answer]}</em>`;}
  else if(n<=11){choices=shuffle(['3','4','7']);answer=choices.indexOf('4');clue='Only the <em>EVEN</em> number survives';}
  else {let pool=shuffle(['2','5','8','3','6','9']);choices=pool.slice(0,3);answer=choices.indexOf(Math.max(...choices.map(Number)).toString());clue='Choose the <em>HIGHEST</em> number';}
  return {choices,clue,answer};
}
function clearRoom(){for(const obj of [...group.children]) {group.remove(obj);obj.traverse(child=>{if(child.isMesh && child.material?.map?.isTexture){child.material.map.dispose();child.material.dispose();}});}doors=[];}
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
  const tex=signTexture(p.choices[i]);const plaqueMat=new THREE.MeshStandardMaterial({map:tex,roughness:.45,metalness:.12});plane(door,plaqueMat,0,3.55,.51,1.28,1.28);
  const no=labelTexture(`DOOR 0${i+1}`);plane(door,new THREE.MeshBasicMaterial({map:no,transparent:true}),0,5.7,.25,2.15,.54);
  const glow=new THREE.PointLight(accent,3.7,4.8,2);glow.position.set(0,5.25,1.1);door.add(glow);
  box(door,lampMat,-1.5,5.42,.51,.18,.1,.16);box(door,lampMat,1.5,5.42,.51,.18,.1,.16);
 }
 for(let z=-8;z<10;z+=3.6){
  box(group,trim,0,5.9,z,15.4,.08,.18);box(group,black,0,6,z+.2,12,.04,.5);
  box(group,lampMat,0,5.82,z,.85,.04,.2);const l=new THREE.PointLight(0xf5bb83,5.4,7,2);l.position.set(0,5.4,z);group.add(l);
  box(group,trim,-7.7,.18,z,.11,.17,1.2);box(group,trim,7.7,.18,z,.11,.17,1.2);
 }
 for(let z=-8;z<=9;z+=1.6){box(group,trim,-7.78,2.05,z,.08,.05,.65);box(group,trim,7.78,2.05,z,.08,.05,.65);}
 for(let x=-6.6;x<=6.6;x+=1.65){box(group,dark,x,-.008,0,.025,.009,21);}
 for(let z=-10;z<=10;z+=1.65){box(group,dark,0,-.004,z,15.9,.009,.025);}
 box(group,black,0,.08,8.6,5,.05,.22);
 const marker=labelTexture('READ THE RULE ABOVE');plane(group,new THREE.MeshBasicMaterial({map:marker,transparent:true}),0,3.55,-10.25,6.1,1.5);
}
function resetCamera(){px=0;pz=6.7;yaw=0;pitch=0;camera.position.set(px,1.65,pz);camera.rotation.set(0,0,0);axis={x:0,y:0};}
function start(){roomNo=1;best=Number(localStorage.getItem('omd-best')||0);playing=true;$('#menu').classList.add('hidden');$('#end').classList.add('hidden');$('#hud').classList.remove('hidden');nextRoom(false);}
function nextRoom(success){if(success){roomNo++;flash('#a7f59b');beep(640,.11);setTimeout(()=>beep(900,.14),90);}resetCamera();limit=Math.max(12,31-(roomNo-1)*1.15);time=limit;buildRoom(roomNo);last=performance.now();}
function end(reason){if(!playing)return;playing=false;flash('#fa715f');beep(160,.35);const score=roomNo-1;if(score>best){best=score;localStorage.setItem('omd-best',String(best));}$('#final-score').textContent=score;$('#final-best').textContent=best;$('#end-title').innerHTML=reason==='timeout'?'TIME<br>IS UP.':'WRONG<br>DOOR.';$('#end-detail').textContent=reason==='timeout'?'The room swallowed your chance.':'The clue was right there. Try another run.';$('#hud').classList.add('hidden');$('#end').classList.remove('hidden');document.exitPointerLock?.();}
function flash(color){const f=$('#flash');f.style.background=color;f.style.opacity='.47';setTimeout(()=>f.style.opacity='0',50);}
let audioCtx;function beep(f,d){try{audioCtx ||=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(f,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(50,f*.55),audioCtx.currentTime+d);g.gain.setValueAtTime(.09,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+d);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d);}catch{}}
function nearest(){let bestIdx=-1,dist=99;doors.forEach((d,i)=>{const a=Math.hypot(px-d.position.x,pz-(-8.9));if(a<dist){dist=a;bestIdx=i;}});return dist<2.35?bestIdx:-1;}
function interact(){if(!playing)return;const i=nearest();if(i<0){$('#hint').textContent='Move closer to a door';return;}if(i===correct)nextRoom(true);else end('wrong');}
$('#play').onclick=start;$('#again').onclick=start;$('#interact').onclick=interact;
$('#share').onclick=async()=>{const text=`I cleared ${roomNo-1} rooms in ONE MORE DOOR. Can you beat me?`;try{if(navigator.share)await navigator.share({title:'One More Door',text,url:location.href});else{await navigator.clipboard.writeText(text+' '+location.href);$('#share').textContent='COPIED!';setTimeout(()=>$('#share').textContent='SHARE SCORE',1500);}}catch{}};
window.addEventListener('keydown',e=>{keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyE'||e.code==='Space')interact();if(e.code==='Enter'&&!playing)start();});window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('click',()=>{if(playing && matchMedia('(pointer:fine)').matches)canvas.requestPointerLock?.();});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas && playing)look(e.movementX,e.movementY);else if(mouseDown && playing)look(e.movementX,e.movementY);});canvas.addEventListener('mousedown',()=>mouseDown=true);window.addEventListener('mouseup',()=>mouseDown=false);
function look(dx,dy){yaw-=dx*.003;pitch=Math.max(-.45,Math.min(.45,pitch-dy*.0024));}
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX>innerWidth*.35){touchLook=e.pointerId;touchPrev={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);}});
canvas.addEventListener('pointermove',e=>{if(e.pointerId===touchLook&&touchPrev){look(e.clientX-touchPrev.x,e.clientY-touchPrev.y);touchPrev={x:e.clientX,y:e.clientY};}});
canvas.addEventListener('pointerup',e=>{if(e.pointerId===touchLook)touchLook=null;});canvas.addEventListener('pointercancel',e=>{if(e.pointerId===touchLook)touchLook=null;});
const pad=$('#pad');function padMove(e){const r=pad.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const max=r.width*.31,m=Math.hypot(x,y)||1,k=Math.min(1,max/m);axis.x=x*k/max;axis.y=y*k/max;$('#stick').style.transform=`translate(${x*k}px,${y*k}px)`;}
pad.addEventListener('pointerdown',e=>{padId=e.pointerId;pad.setPointerCapture(e.pointerId);padMove(e);});pad.addEventListener('pointermove',e=>{if(e.pointerId===padId)padMove(e);});function padUp(e){if(e.pointerId===padId){padId=null;axis={x:0,y:0};$('#stick').style.transform='';}}pad.addEventListener('pointerup',padUp);pad.addEventListener('pointercancel',padUp);
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}};
function frame(now){requestAnimationFrame(frame);resize();const dt=Math.min(.05,(now-last)/1000);last=now;if(playing){time=Math.max(0,time-dt);$('#timebar').style.transform=`scaleX(${time/limit})`;if(time<=0)end('timeout');let forward=-(axis.y+(keys.has('KeyW')||keys.has('ArrowUp')?-1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0));let right=axis.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);const len=Math.hypot(forward,right);if(len>1){forward/=len;right/=len;}const speed=4.1;px+=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*speed*dt;pz+=(-Math.cos(yaw)*forward-Math.sin(yaw)*right)*speed*dt;px=Math.max(-7.3,Math.min(7.3,px));pz=Math.max(-8.65,Math.min(9.65,pz));camera.position.set(px,1.65+Math.sin(now*.012)*(len>.2?.027:0),pz);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;const near=nearest();$('#hint').textContent=near<0?'Move closer to a door':`Door 0${near+1} · tap OPEN or press E`;$('#interact').style.opacity=near<0?'.47':'1';flashLight.position.set(px,2.2,pz-.4);}else{camera.rotation.y=Math.sin(now*.00013)*.08;}renderer.render(scene,camera);}
buildRoom(1);requestAnimationFrame(frame);
