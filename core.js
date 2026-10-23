import { DIRS, OPP } from './levels.js';
export const initialConfig = level => level.switches.map(s => s.initial);
export const coordinate = ([x,y]) => `${'ABCDEF'[x]}${y+1}`;
export function activePairs(level, position, config) {
  const tile = level.tiles[position.join(',')];
  return !tile ? [] : tile.kind === 'switch' ? [tile.pairs[config[tile.index]]] : tile.pairs;
}
export function initialFrame(level) {
  return { tick: 0, status: 'running', message: 'Trenes listos para salir.', trains: level.trains.map(t => ({ id: t.id, position: [...t.start], incoming: t.start[0]===0 ? 'W':'N', delivered: false, visited: [] })) };
}
export function step(level, config, frame) {
  if (frame.status !== 'running') return frame;
  const next = { tick: frame.tick+1, status: 'running', message: '', trains: [] };
  const fail = (message, position) => { next.status='failed'; next.message=message; next.problem=position; };
  for (const train of frame.trains) {
    if (train.delivered) { next.trains.push({...train}); continue; }
    const tag = `${train.position}:${train.incoming}`;
    const pair = activePairs(level,train.position,config).find(p => p.includes(train.incoming));
    if (!pair) { next.trains.push({...train}); fail(`El tren ${train.id} no tiene vía conectada en ${coordinate(train.position)}. Revisa las agujas cercanas.`,train.position); continue; }
    if (train.visited.includes(tag)) { next.trains.push({...train}); fail(`El tren ${train.id} vuelve a pasar por ${coordinate(train.position)}: la ruta forma un bucle.`,train.position); continue; }
    const outgoing = pair.find(d => d!==train.incoming);
    const delta = DIRS[outgoing];
    const position = [train.position[0]+delta[0],train.position[1]+delta[1]];
    const incoming = OPP[outgoing];
    const own = level.trains.find(t=>t.id===train.id);
    const station = level.trains.find(t=>t.goal.join(',')===position.join(','));
    const delivered = position.join(',')===own.goal.join(',');
    const connected = activePairs(level,position,config).some(p=>p.includes(incoming));
    next.trains.push({ ...train, position, incoming, delivered: delivered && connected, visited: [...train.visited,tag] });
    if (!connected) fail(`La ruta del tren ${train.id} se corta al salir de ${coordinate(train.position)} hacia ${outgoing === 'N' ? 'el norte' : outgoing === 'S' ? 'el sur' : outgoing === 'E' ? 'el este' : 'el oeste'}.`,train.position);
    else if (station && !delivered) fail(`El tren ${train.id} ha llegado al andén ${station.id}. Cada letra tiene su propio destino.`,position);
  }
  for (let i=0;i<next.trains.length;i++) for (let j=i+1;j<next.trains.length;j++) {
    const a=next.trains[i], b=next.trains[j], oldA=frame.trains[i], oldB=frame.trains[j];
    const equal = (p,q)=>p.join(',')===q.join(',');
    const bridge = level.tiles[a.position.join(',')]?.kind==='bridge' && 'NS'.includes(a.incoming)!=='NS'.includes(b.incoming);
    if ((equal(a.position,b.position) && !bridge) || (equal(a.position,oldB.position) && equal(b.position,oldA.position))) fail(`Los trenes ${a.id} y ${b.id} comparten una vía. Necesitan rutas separadas o un puente.`,a.position);
  }
  if (next.status==='running' && next.trains.every(t=>t.delivered)) { next.status='won'; next.message='Todos los trenes han llegado a su andén.'; }
  return next;
}
export function simulate(level, config) {
  const frames=[initialFrame(level)];
  while(frames.at(-1).status==='running' && frames.length<150) frames.push(step(level,config,frames.at(-1)));
  if(frames.at(-1).status==='running') throw new Error('Simulation exceeded finite board bound');
  return { won: frames.at(-1).status==='won', frames };
}
export function switchConfig(config,index) {
  if(!Number.isInteger(index)||index<0||index>=config.length) return config;
  return config.map((v,i)=>i===index?1-v:v);
}
export function findSolutions(level) {
  const solutions=[];
  for(let mask=0;mask<2**level.switches.length;mask++) {
    const config=level.switches.map((_,i)=>(mask>>i)&1);
    if(simulate(level,config).won) solutions.push(config);
  }
  return solutions;
}
