import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../levels.js';
import { STORAGE_KEY,emptyProgress,freshAttempt,normalize,readProgress,writeProgress } from '../storage.js';
test('Own key and catalogue-compatible bestMoves summary survive a roundtrip',()=>{
  assert.equal(STORAGE_KEY,'daily-games:cambio-de-via:v1');
  const map=new Map([['daily-games:orbita-de-rescate:v1','untouched']]);
  const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  const progress=emptyProgress();progress.completed[0]={bestMoves:3};progress.currentLevel=1;
  progress.attempts[1]=freshAttempt(LEVELS[1]);progress.attempts[1].config[0]^=1;progress.attempts[1].moves=1;
  progress.attempts[1].history=[{config:freshAttempt(LEVELS[1]).config,moves:0}];
  assert.ok(writeProgress(progress,storage));
  const loaded=readProgress(LEVELS,storage);
  assert.ok(loaded.available);assert.deepEqual(loaded.progress.completed,progress.completed);
  assert.deepEqual(loaded.progress.attempts,progress.attempts);assert.equal(loaded.progress.currentLevel,1);
  assert.equal(map.get('daily-games:orbita-de-rescate:v1'),'untouched');
});
test('Invalid, truncated and old storage recover without crashes or accidental unlocks',()=>{
  for(const input of [null,[],{},'bad',{version:2},false])assert.deepEqual(normalize(input,LEVELS),emptyProgress());
  assert.deepEqual(readProgress(LEVELS,{getItem:()=>'{bad'}).progress,emptyProgress());
  const cleaned=normalize({version:1,currentLevel:99,completed:{5:{bestMoves:1},0:{bestMoves:-1}},attempts:{0:{config:[0],moves:2}}},LEVELS);
  assert.equal(cleaned.currentLevel,0);assert.deepEqual(cleaned.completed,{});assert.deepEqual(cleaned.attempts,{});
  const valid=freshAttempt(LEVELS[0]);valid.moves=3;valid.history=[null,{config:valid.config,moves:9},{config:valid.config,moves:2}];
  assert.equal(normalize({version:1,attempts:{0:valid}},LEVELS).attempts[0].history.length,1);
});
test('Blocked storage and exhausted quota remain playable',()=>{
  const blocked={getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('quota');}};
  assert.equal(readProgress(LEVELS,blocked).available,false);
  assert.deepEqual(readProgress(LEVELS,blocked).progress,emptyProgress());
  assert.equal(writeProgress(emptyProgress(),blocked),false);
});
test('History is bounded and fresh attempts do not share mutable arrays',()=>{
  const a=freshAttempt(LEVELS[0]),b=freshAttempt(LEVELS[0]);a.config[0]^=1;assert.notDeepEqual(a.config,b.config);
  a.moves=500;a.history=Array.from({length:400},(_,moves)=>({config:b.config,moves}));
  const result=normalize({version:1,attempts:{0:a}},LEVELS);assert.equal(result.attempts[0].history.length,200);
});
