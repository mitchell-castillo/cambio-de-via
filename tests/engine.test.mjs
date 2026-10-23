import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../levels.js';
import { initialConfig, initialFrame, simulate, step, findSolutions, switchConfig } from '../core.js';

for(const level of LEVELS){
  test(`Station ${level.id}: valid physical tracks and a unique reachable solution`,()=>{
    const solutions=findSolutions(level);
    assert.equal(solutions.length,1);
    assert.deepEqual(solutions[0],level.switches.map(s=>s.solution));
    assert.equal(simulate(level,initialConfig(level)).won,false);
    const result=simulate(level,solutions[0]);
    assert.ok(result.won);
    assert.ok(result.frames.at(-1).trains.every(t=>t.delivered));
    assert.ok(result.frames.length<30);
    const starts=new Set(level.trains.map(t=>t.start.join(','))),goals=new Set(level.trains.map(t=>t.goal.join(',')));
    assert.equal(starts.size,level.trains.length);assert.equal(goals.size,level.trains.length);
    for(const tile of Object.values(level.tiles)){
      for(const pair of tile.pairs){assert.equal(pair.length,2);assert.notEqual(pair[0],pair[1]);assert.ok(pair.every(p=>'NESW'.includes(p)));}
      if(tile.kind==='switch'){assert.equal(new Set(tile.pairs.flat()).size,3);assert.equal(tile.pairs[0][0],tile.pairs[1][0]);}
      if(tile.kind==='bridge'){assert.equal(new Set(tile.pairs.flat()).size,4);assert.ok(tile.pairs.every(p=>p.includes('N')&&p.includes('S')||p.includes('W')&&p.includes('E')));}
    }
  });
  test(`Station ${level.id}: every wrong switch breaks a solved route`,()=>{
    const solved=level.switches.map(s=>s.solution);
    solved.forEach((_,i)=>assert.equal(simulate(level,switchConfig(solved,i)).won,false));
  });
}
test('Engine does not mutate configuration, board or previous frames',()=>{
  const level=structuredClone(LEVELS[2]),config=initialConfig(level),frame=initialFrame(level);
  const before=JSON.stringify({level,config,frame});step(level,config,frame);
  assert.equal(JSON.stringify({level,config,frame}),before);
  assert.equal(switchConfig(config,-1),config);assert.equal(switchConfig(config,999),config);
});
const rail=(...pairs)=>({kind:'rail',pairs});
const train=(id,position,incoming)=>({id,position,incoming,delivered:false,visited:[]});
const frame=(...trains)=>({tick:0,status:'running',trains});
test('Head-on trains cannot exchange cells in one tick',()=>{
  const l={tiles:{'0,0':rail(['W','E']),'1,0':rail(['W','E'])},trains:[{id:'A',goal:[5,5]},{id:'B',goal:[5,4]}]};
  const result=step(l,[],frame(train('A',[0,0],'W'),train('B',[1,0],'E')));
  assert.equal(result.status,'failed');assert.match(result.message,/comparten/);
});
test('A perpendicular bridge allows simultaneous crossing, a shared junction does not',()=>{
  const tiles={'0,1':rail(['W','E']),'1,0':rail(['N','S']),'1,1':rail(['W','E'],['N','S'])};
  const l={tiles,trains:[{id:'A',goal:[5,5]},{id:'B',goal:[5,4]}]};
  const f=frame(train('A',[0,1],'W'),train('B',[1,0],'N'));
  assert.equal(step(l,[],f).status,'failed');
  tiles['1,1'].kind='bridge';assert.equal(step(l,[],f).status,'running');
});
test('Wrong station and missing track produce actionable failures',()=>{
  const l={tiles:{'0,1':rail(['W','E']),'1,1':rail(['W','E'])},trains:[{id:'A',goal:[5,1]},{id:'B',goal:[1,1]}]};
  const result=step(l,[],frame(train('A',[0,1],'W')));
  assert.equal(result.status,'failed');assert.match(result.message,/andén B/);
  const cut=step(l,[],frame(train('A',[1,1],'W')));assert.equal(cut.status,'failed');assert.match(cut.message,/corta/);
});
test('A route loop terminates with a diagnostic',()=>{
  const l={tiles:{'1,1':rail(['S','E']),'2,1':rail(['W','S']),'2,2':rail(['N','W']),'1,2':rail(['E','N'])},trains:[{id:'A',goal:[5,5]}]};
  let f=frame(train('A',[1,1],'S'));
  for(let i=0;i<6&&f.status==='running';i++)f=step(l,[],f);
  assert.equal(f.status,'failed');assert.match(f.message,/bucle/);
  assert.equal(step(l,[],f),f);
});
