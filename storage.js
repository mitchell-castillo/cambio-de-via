import { initialConfig } from './core.js';
export const STORAGE_KEY='daily-games:cambio-de-via:v1';
export const freshAttempt=level=>({config:initialConfig(level),moves:0,history:[]});
export const emptyProgress=()=>({version:1,currentLevel:0,completed:{},attempts:{},updatedAt:null});
const validMoves=n=>Number.isInteger(n)&&n>=0&&n<100000;
const validConfig=(v,level)=>Array.isArray(v)&&v.length===level.switches.length&&v.every(n=>n===0||n===1);
export function normalize(value,levels) {
  const clean=emptyProgress();
  if(!value||value.version!==1||typeof value!=='object') return clean;
  levels.forEach((level,i)=>{
    const done=value.completed?.[i];
    if(done&&validMoves(done.bestMoves)&&done.bestMoves>0) clean.completed[i]={bestMoves:done.bestMoves};
    const attempt=value.attempts?.[i];
    if(attempt&&validConfig(attempt.config,level)&&validMoves(attempt.moves)) {
      clean.attempts[i]={ config:[...attempt.config], moves:attempt.moves, history:Array.isArray(attempt.history)?attempt.history.slice(-200).filter(h=>h&&validConfig(h.config,level)&&validMoves(h.moves)&&h.moves<attempt.moves).map(h=>({config:[...h.config],moves:h.moves})):[] };
    }
  });
  let unlocked=levels.findIndex((_,i)=>!clean.completed[i]);
  if(unlocked===-1) unlocked=levels.length-1;
  // Completion is sequential, and malformed storage cannot unlock later yards.
  for(let i=unlocked+1;i<levels.length;i++) delete clean.completed[i];
  clean.currentLevel=Number.isInteger(value.currentLevel)?Math.min(Math.max(0,value.currentLevel),unlocked):0;
  return clean;
}
export function readProgress(levels,storage) {
  try {
    const raw=(storage??globalThis.localStorage).getItem(STORAGE_KEY);
    try { return {progress:normalize(JSON.parse(raw),levels),available:true}; }
    catch { return {progress:emptyProgress(),available:true}; }
  } catch { return {progress:emptyProgress(),available:false}; }
}
export function writeProgress(progress,storage) {
  try { (storage??globalThis.localStorage).setItem(STORAGE_KEY,JSON.stringify({...progress,version:1,updatedAt:new Date().toISOString()})); return true; }
  catch { return false; }
}
