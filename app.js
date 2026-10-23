import { LEVELS } from './levels.js';
import { initialFrame, step, switchConfig, coordinate } from './core.js';
import { readProgress, writeProgress, freshAttempt } from './storage.js';
const $=id=>document.getElementById(id);
const loaded=readProgress(LEVELS);
let progress=loaded.progress, available=loaded.available, mode='planning', frame=null, timer=null, message='';
const colors={A:'#99600a',B:'#1e6784',C:'#9a376b'};
const points={N:[50,0],E:[100,50],S:[50,100],W:[0,50]};
const names={N:'norte',E:'este',S:'sur',W:'oeste'};
const level=()=>LEVELS[progress.currentLevel];
const attempt=()=>progress.attempts[progress.currentLevel]??=freshAttempt(level());
function save(){ if(!writeProgress(progress)) available=false; $('storage-warning').hidden=available; }
function stop(){clearInterval(timer);timer=null;}
function toPlan(){stop();mode='planning';frame=null;message='Prepara las vías y pulsa «Dar salida».';render();}
function path(pair){const a=points[pair[0]],b=points[pair[1]];return `M${a} L50 50 L${b}`;}
function rail(pair){const d=path(pair);return `<path class="rail-bed" d="${d}"/><path class="rail-line" d="${d}"/><path class="rail-center" d="${d}"/>`;}
function tileSVG(tile,config){
  if(!tile)return '';
  if(tile.kind==='switch') {
    const pair=tile.pairs[config[tile.index]],off=tile.pairs[1-config[tile.index]];
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="rail-inactive" d="${path(off)}"/>${rail(pair)}<circle class="switch-pivot" cx="50" cy="50" r="13"/><path class="switch-arrow" d="M44 49 A7 7 0 1 1 53 57 M53 57 L53 51 M53 57 L59 57"/></svg>`;
  }
  if(tile.kind==='bridge')return `<svg viewBox="0 0 100 100" aria-hidden="true">${rail(tile.pairs[0])}<path d="${path(tile.pairs[1])}" fill="none" stroke="#f4f2e9" stroke-width="28"/>${rail(tile.pairs[1])}<path d="${tile.pairs[1].includes('N')?'M30 30 L30 70 M70 30 L70 70':'M30 30 L70 30 M30 70 L70 70'}" stroke="#788c78" stroke-width="2"/></svg>`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${rail(tile.pairs[0])}</svg>`;
}
function renderBoard(){
  const l=level(),a=attempt(),selected=document.activeElement?.dataset.switch;
  const board=$('board');board.replaceChildren();
  for(let y=0;y<6;y++)for(let x=0;x<6;x++){
    const tile=l.tiles[`${x},${y}`],station=l.trains.find(t=>t.start[0]===x&&t.start[1]===y),goal=l.trains.find(t=>t.goal[0]===x&&t.goal[1]===y);
    const cell=document.createElement(tile?.kind==='switch'?'button':'div');cell.className='cell';
    cell.innerHTML=`<span class="cell-coord" aria-hidden="true">${coordinate([x,y])}</span>`+tileSVG(tile,a.config);
    if(tile?.kind==='switch'){
      cell.classList.add('switch');cell.dataset.switch=tile.index;
      const pair=tile.pairs[a.config[tile.index]];
      cell.setAttribute('aria-label',`Aguja ${tile.index+1}, ${coordinate([x,y])}: ${names[pair[0]]} con ${names[pair[1]]}. Pulsar para cambiar.`);
      cell.disabled=mode==='running'||mode==='paused';
      cell.addEventListener('click',()=>changeSwitch(tile.index));
    }
    if(station||goal){cell.classList.add('station-cell');cell.style.setProperty('--train-color',colors[(station||goal).id]);cell.innerHTML+=`<span class="station-label" aria-hidden="true">${goal?'ANDÉN':'SALIDA'} ${(station||goal).id}</span>`;}
    if(goal){cell.classList.add('destination');cell.innerHTML+=`<span class="destination-badge" aria-hidden="true">${goal.id}</span>`;}
    if(!tile&&l.scenery.some(p=>p[0]===x&&p[1]===y))cell.innerHTML+='<svg viewBox="0 0 100 100" class="tree" aria-hidden="true"><path d="M48 48 L48 72 M48 61 L37 53"/><circle cx="44" cy="40" r="15"/><circle cx="56" cy="48" r="13"/><circle cx="32" cy="48" r="11"/></svg>';
    if(frame?.problem?.[0]===x&&frame.problem[1]===y)cell.classList.add('problem');
    board.append(cell);
  }
  const trains=frame?.trains??initialFrame(l).trains;
  for(const train of trains){const el=document.createElement('span');el.className='train'+(train.delivered?' delivered':'');el.setAttribute('aria-hidden','true');el.textContent=train.delivered?'✓':train.id;el.style.cssText=`--x:${Math.max(0,Math.min(5,train.position[0]))};--y:${Math.max(0,Math.min(5,train.position[1]))};--train-color:${colors[train.id]}`;board.append(el);}
  if(selected!==undefined)board.querySelector(`[data-switch="${selected}"]`)?.focus({preventScroll:true});
}
function render(){
  const l=level(),a=attempt(),completed=Object.keys(progress.completed).length;
  $('station-number').textContent=`ESTACIÓN ${String(l.id).padStart(2,'0')} / 06`;
  $('map-label').textContent=`PLANO DE VÍAS / ${String(l.id).padStart(2,'0')}`;
  $('completion-label').textContent=`${completed} de 6`;
  $('progress').value=completed;
  $('level-title').textContent=l.name;$('level-note').textContent=l.note;
  $('moves').textContent=a.moves;$('best').textContent=progress.completed[progress.currentLevel]?.bestMoves??'—';
  $('train-list').innerHTML=l.trains.map(t=>`<span class="train-route" style="--train-color:${colors[t.id]}"><b>${t.id}</b><span aria-hidden="true">→</span><span class="sr-only"> al andén </span><b class="goal-badge">${t.id}</b>${frame?.trains.find(f=>f.id===t.id)?.delivered?' ✓':''}</span>`).join('');
  $('result').className='result '+mode;
  $('result').textContent=message||'Prepara las vías y pulsa «Dar salida».';
  $('play').innerHTML=mode==='running'?'<span aria-hidden="true">Ⅱ</span> Pausar':mode==='paused'?'<span aria-hidden="true">▶</span> Continuar':'<span aria-hidden="true">▶</span> Dar salida';
  $('step').disabled=mode==='running'||mode==='won'||mode==='failed';
  $('plan').disabled=mode==='planning';
  $('undo').disabled=!a.history.length||mode==='running'||mode==='paused';
  $('reset').disabled=a.moves===0&&mode==='planning';
  $('next').hidden=mode!=='won'||progress.currentLevel===LEVELS.length-1;
  $('plan-label').textContent=mode==='running'?'TRENES EN MARCHA':mode==='paused'?'SIMULACIÓN EN PAUSA':mode==='won'?'CONEXIÓN COMPLETA':mode==='failed'?'REVISAR CONEXIÓN':'PREPARANDO RUTAS';
  $('storage-warning').hidden=available;
  const nav=$('levels'),activeLevel=document.activeElement?.dataset.level;
  nav.replaceChildren();
  let unlocked=LEVELS.findIndex((_,i)=>!progress.completed[i]);if(unlocked<0)unlocked=5;
  LEVELS.forEach((l,i)=>{
    const button=document.createElement('button');button.textContent=String(i+1).padStart(2,'0');button.dataset.level=i;
    button.disabled=i>unlocked;button.className=progress.completed[i]?'done':'';
    button.setAttribute('aria-label',`Estación ${i+1}: ${l.name}${progress.completed[i]?', resuelta':i>unlocked?', bloqueada':''}`);
    if(i===progress.currentLevel)button.setAttribute('aria-current','step');
    button.addEventListener('click',()=>selectLevel(i));nav.append(button);
  });
  if(activeLevel!==undefined)nav.querySelector(`[data-level="${activeLevel}"]`)?.focus({preventScroll:true});
  renderBoard();
}
function changeSwitch(index){
  if(mode==='running'||mode==='paused'||attempt().moves>=99999)return;
  stop();frame=null;mode='planning';
  const a=attempt();a.history.push({config:[...a.config],moves:a.moves});if(a.history.length>200)a.history.shift();
  a.config=switchConfig(a.config,index);a.moves++;
  message=`Aguja ${index+1} cambiada. Comprueba que cada tren tenga una ruta hasta su letra.`;
  save();render();
}
function advance(){
  frame=step(level(),attempt().config,frame);
  if(frame.status==='won'){
    stop();mode='won';const index=progress.currentLevel,moves=attempt().moves;
    const best=progress.completed[index]?.bestMoves;
    progress.completed[index]={bestMoves:best?Math.min(best,moves):Math.max(1,moves)};
    message=index===5?'¡Red completa! Has resuelto las seis estaciones. Puedes repetirlas y mejorar tus marcas.':'¡Todos en su destino! Has abierto la siguiente estación.';
    save();
  }else if(frame.status==='failed'){stop();mode='failed';message=frame.message;}
  else message=`${mode==='paused'?'En pausa. ':''}Paso ${frame.tick}: ${frame.trains.filter(t=>t.delivered).length} de ${frame.trains.length} trenes en su destino.`;
  render();
}
function play(){
  if(mode==='running'){stop();mode='paused';message=`En pausa en el paso ${frame.tick}. Puedes continuar o volver al plano.`;render();return;}
  if(mode!=='paused')frame=initialFrame(level());
  mode='running';message='Trenes en marcha. Puedes pausar para observar las rutas.';render();timer=setInterval(advance,470);
}
function singleStep(){if(mode==='running'||mode==='failed'||mode==='won')return;if(!frame)frame=initialFrame(level());mode='paused';advance();}
function undo(){
  if(mode==='running'||mode==='paused'||!attempt().history.length)return;
  const a=attempt(),last=a.history.pop();a.config=last.config;a.moves=last.moves;frame=null;mode='planning';message='Último cambio deshecho.';save();render();
}
function selectLevel(i){stop();progress.currentLevel=i;frame=null;mode='planning';message='Plano listo. Tu intento se ha conservado.';save();render();}
$('play').addEventListener('click',play);$('step').addEventListener('click',singleStep);$('plan').addEventListener('click',toPlan);$('undo').addEventListener('click',undo);
$('reset').addEventListener('click',()=>{if(mode==='running'){stop();mode='paused';render();}$('reset-dialog').returnValue='cancel';$('reset-dialog').showModal();});
$('reset-dialog').querySelector('form').addEventListener('submit',event=>{if(event.submitter?.value==='reset'){progress.attempts[progress.currentLevel]=freshAttempt(level());save();toPlan();}});
$('next').addEventListener('click',()=>{selectLevel(Math.min(5,progress.currentLevel+1));$('level-title').setAttribute('tabindex','-1');$('level-title').focus();});
$('game').addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  const k=event.key.toLowerCase();
  if(event.target.dataset.switch!==undefined&&event.key.startsWith('Arrow')){
    const buttons=[...$('board').querySelectorAll('.switch')],index=buttons.indexOf(event.target);
    const delta=event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1;
    buttons[(index+delta+buttons.length)%buttons.length]?.focus();event.preventDefault();return;
  }
  if(k==='z'){event.preventDefault();undo();}
  else if(k==='r'){event.preventDefault();if(!$('reset').disabled)$('reset').click();}
  else if(k==='p'&&(mode==='running'||mode==='paused')){event.preventDefault();play();}
  else if(k==='escape'&&mode!=='planning'){event.preventDefault();toPlan();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running'){stop();mode='paused';message='Simulación en pausa. Continúa cuando estés listo.';render();}});
render();
