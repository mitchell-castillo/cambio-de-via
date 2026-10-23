// Original track plans. Coordinates are [column, row], with north at the top.
const DIRS = { N: [0,-1], E: [1,0], S: [0,1], W: [-1,0] };
const OPP = { N: 'S', E: 'W', S: 'N', W: 'E' };
const direction = (a,b) => Object.keys(DIRS).find(d => a[0]+DIRS[d][0]===b[0] && a[1]+DIRS[d][1]===b[1]);
const key = p => p.join(',');
function plan(id, name, note, routes, switches, scenery = []) {
  const tiles = {};
  const trains = routes.map((path,i) => ({ id: 'ABC'[i], path, start: path[0], goal: path.at(-1) }));
  for (const {path} of trains) path.forEach((p,i) => {
    const pair = [i ? direction(p,path[i-1]) : (p[0]===0?'W':'N'), i<path.length-1 ? direction(p,path[i+1]) : (p[0]===5?'E':'S')];
    if (tiles[key(p)]) tiles[key(p)] = { kind: 'bridge', pairs: [tiles[key(p)].pairs[0], pair] };
    else tiles[key(p)] = { kind: 'rail', pairs: [pair] };
  });
  const controls = switches.map(([x,y,alternative],i) => {
    const tile = tiles[`${x},${y}`];
    const correct = [...tile.pairs[0]];
    const options = [correct, [correct[0], alternative]];
    const solution = (i+id)%2;
    if (solution) options.reverse();
    tiles[`${x},${y}`] = { kind: 'switch', pairs: options, index: i };
    const scrambled = (i+id)%3 !== 0 || i===0;
    return { x,y, solution, initial: scrambled ? 1-solution : solution };
  });
  return { id, name, note, width: 6, height: 6, tiles, trains, switches: controls, scenery };
}
export const LEVELS = [
  plan(1, 'La primera salida', 'Lleva el tren A a su andén A. Las tres agujas cambian solo una bifurcación.', [
    [[0,2],[1,2],[2,2],[2,1],[3,1],[4,1],[4,2],[5,2]]
  ], [[1,2,'N'],[2,2,'S'],[4,1,'E']], [[0,0],[5,5],[1,5]]),
  plan(2, 'Correo y mercancías', 'Dos trenes, dos destinos. Prepara ambas rutas antes de dar la salida.', [
    [[0,1],[1,1],[1,2],[2,2],[3,2],[3,1],[4,1],[5,1]],
    [[0,4],[1,4],[2,4],[2,3],[3,3],[4,3],[4,4],[5,4]]
  ], [[1,1,'E'],[3,2,'E'],[2,4,'E'],[4,3,'E']], [[0,0],[5,0],[0,5],[5,5]]),
  plan(3, 'El paso elevado', 'En los puentes las vías se cruzan sin unirse. Cada tren conserva su dirección.', [
    [[0,3],[1,3],[1,2],[2,2],[3,2],[4,2],[4,3],[5,3]],
    [[3,0],[3,1],[3,2],[3,3],[2,3],[2,4],[2,5]]
  ], [[1,3,'E'],[1,2,'N'],[4,2,'E'],[3,1,'W'],[3,3,'E'],[2,4,'E']], [[0,0],[5,5],[5,0]]),
  plan(4, 'Tres destinos', 'El tren C entra en servicio. Una aguja mal orientada puede llevarte a una vía vecina.', [
    [[0,0],[1,0],[1,1],[2,1],[3,1],[4,1],[4,0],[5,0]],
    [[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[5,3]],
    [[0,5],[1,5],[2,5],[3,5],[3,4],[4,4],[5,4]]
  ], [[1,0,'E'],[1,1,'S'],[4,1,'E'],[2,2,'E'],[2,3,'S'],[3,5,'E'],[3,4,'N']], [[0,4],[5,1]]),
  plan(5, 'Nudo del río', 'Sigue cada línea a través de los dos puentes. Los ramales apagados no transportan trenes.', [
    [[0,2],[1,2],[2,2],[3,2],[4,2],[5,2]],
    [[2,0],[2,1],[2,2],[2,3],[2,4],[2,5]],
    [[0,5],[1,5],[1,4],[1,3],[2,3],[3,3],[4,3],[4,4],[5,4]]
  ], [[1,2,'S'],[3,2,'S'],[4,2,'S'],[2,1,'E'],[2,4,'W'],[1,5,'E'],[1,3,'N'],[4,3,'N']], [[0,0],[5,0],[5,5]]),
  plan(6, 'La gran conexión', 'Diez agujas y tres puentes. Haz que las tres rutas funcionen a la vez.', [
    [[0,1],[1,1],[2,1],[3,1],[4,1],[4,2],[4,3],[5,3]],
    [[2,0],[2,1],[2,2],[2,3],[2,4],[3,4],[3,5]],
    [[0,3],[1,3],[1,2],[2,2],[3,2],[4,2],[5,2]]
  ], [[1,1,'S'],[3,1,'S'],[4,1,'E'],[4,3,'W'],[2,3,'E'],[2,4,'W'],[3,4,'N'],[1,3,'E'],[1,2,'N'],[3,2,'S']], [[0,5],[5,5],[0,0]])
];
export { DIRS, OPP };
