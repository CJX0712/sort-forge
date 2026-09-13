// Headless invariant test for SortForge engine (extracted from index.html)
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/<script id="engine">([\s\S]*?)<\/script>/);
if (!m) { console.error('engine script not found'); process.exit(1); }

const ctx = { console, Math, Object, Array, JSON, String, globalThis: {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
const Sort = vm.runInContext(m[1] + '\nSort;', ctx, { filename: 'engine.js' });

let pass = 0, fail = 0;
function ok(name, cond){
  if (cond){ pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}

console.log('SortForge engine smoke test');

const cases = [
  [], [1], [1, 2, 3], [3, 2, 1], [2, 2, 1, 2], [5, 1, 4, 2, 8, 3],
  [3, 1, 2], [9, 9, 9, 9], [4, 3, 2, 1, 0, -1]
];

for (const name of Sort.list){
  // 1) boundary cases: sorted + same elements
  let allBoundary = true;
  for (const arr of cases){
    const r = Sort.run(name, arr);
    if (!Sort.isSorted(r.array) || !Sort.sameElements(r.array, arr)) allBoundary = false;
  }
  ok(name + ': 全部边界用例有序且元素一致', allBoundary);

  // 2) known small case exact
  const r3 = Sort.run(name, [3, 1, 2]);
  ok(name + ': [3,1,2] -> [1,2,3]', r3.array.join(',') === '1,2,3');

  // 3) 50 random arrays deterministic + correct
  let allRand = true, countsOk = true;
  for (let i = 0; i < 50; i++){
    const a = Sort.seededArray('self-' + i, 30, 100);
    const r = Sort.run(name, a);
    if (!Sort.isSorted(r.array) || !Sort.sameElements(r.array, a)) allRand = false;
    if (r.comparisons < 0 || r.swaps < 0) countsOk = false;
  }
  ok(name + ': 50 随机数组(30项)全有序且元素一致', allRand);
  ok(name + ': 比较/交换计数非负有限', countsOk);

  // 4) large random + duplicate-heavy
  const big = Sort.seededArray('big-' + name, 500, 100);
  const rb = Sort.run(name, big);
  ok(name + ': 500项随机正确', Sort.isSorted(rb.array) && Sort.sameElements(rb.array, big));

  const dups = Sort.seededArray('dup', 200, 4); // only 4 distinct values
  const rd = Sort.run(name, dups);
  ok(name + ': 200项低密度重复值正确', Sort.isSorted(rd.array) && Sort.sameElements(rd.array, dups));
}

// 5) determinism of seed array
const d1 = Sort.seededArray('晨星', 40, 100), d2 = Sort.seededArray('晨星', 40, 100);
ok('seed: 同种子 -> 同数组', JSON.stringify(d1) === JSON.stringify(d2));
ok('seed: 异种子 -> 异数组', JSON.stringify(d1) !== JSON.stringify(Sort.seededArray('别的', 40, 100)));

// 6) consistency: all algorithms produce identical sorted output for same input
const probe = Sort.seededArray('consistency', 64, 100);
const ref = Sort.run('heap', probe).array;
let allSame = true;
for (const name of Sort.list){ if (Sort.run(name, probe).array.join(',') !== ref.join(',')) allSame = false; }
ok('consistency: 6 算法对同输入产出完全一致', allSame);

console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
