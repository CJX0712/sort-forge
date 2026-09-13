// Probe: compare 6 algorithms on same seeded array, dump counts + result to _probe.txt
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/<script id="engine">([\s\S]*?)<\/script>/);
const ctx = { console, Math, Object, Array, JSON, String, globalThis: {} }; ctx.globalThis = ctx;
vm.createContext(ctx);
const Sort = vm.runInContext(m[1] + '\nSort;', ctx, { filename: 'engine.js' });

const arr = Sort.seededArray('晨星', 40, 100);
const rows = [];
rows.push('seed "晨星" size=40  input: ' + arr.join(',') + '\n');
rows.push('算法       比较次数   交换/写入   结果有序');
for (const name of Sort.list){
  const r = Sort.run(name, arr);
  rows.push(
    Sort.NAMES[name].padEnd(6, ' ') +
    String(r.comparisons).padStart(8, ' ') +
    String(r.swaps).padStart(10, ' ') +
    '   ' + (Sort.isSorted(r.array) ? 'yes' : 'NO')
  );
}
rows.push('\nresult: ' + Sort.run('heap', arr).array.join(','));

fs.writeFileSync(path.join(__dirname, '_probe.txt'), rows.join('\n') + '\n', 'utf8');
console.log('probe written: ' + rows.join('\n').length + ' chars');
