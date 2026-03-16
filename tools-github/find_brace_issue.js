const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'Source', 'script.js');
const txt = fs.readFileSync(file, 'utf8');
const lines = txt.split(/\r?\n/);
let cum = 0;
let maxCum = 0;
let maxLine = -1;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let ch of line) {
    if (ch === '{') cum++;
    else if (ch === '}') cum--;
  }
  if (cum > maxCum) { maxCum = cum; maxLine = i+1; }
}
console.log('final cumulative { minus } =', maxCum === 0 ? 0 : maxCum, '(positive => unclosed {)');
console.log('max nesting at line', maxLine, 'with depth', maxCum);
console.log('\n---context---\n');
const start = Math.max(0, maxLine - 6);
const end = Math.min(lines.length, maxLine + 5);
for (let i = start; i < end; i++) {
  const prefix = (i+1 === maxLine) ? '>>' : '  ';
  console.log(prefix, (i+1).toString().padStart(4), lines[i]);
}
console.log('\n---file end (last 40 lines)---\n');
const tailStart = Math.max(0, lines.length - 40);
for (let i = tailStart; i < lines.length; i++) console.log((i+1).toString().padStart(4), lines[i]);

// Print per-line cumulative depth around the max nesting for deeper inspection
const inspectStart = Math.max(0, maxLine - 30);
const inspectEnd = Math.min(lines.length, maxLine + 30);
console.log('\n---detailed depth around max (line:depth:code)---\n');
let cum2 = 0;
for (let i = 0; i < inspectStart; i++) {
  for (let ch of lines[i]) { if (ch === '{') cum2++; else if (ch === '}') cum2--; }
}
for (let i = inspectStart; i < inspectEnd; i++) {
  for (let ch of lines[i]) { if (ch === '{') cum2++; else if (ch === '}') cum2--; }
  console.log((i+1).toString().padStart(4), cum2.toString().padStart(3), lines[i]);
}
console.log('\n---cumulative snapshots every 50 lines---\n');
let cum3 = 0;
for (let i = 0; i < lines.length; i++) {
  for (let ch of lines[i]) { if (ch === '{') cum3++; else if (ch === '}') cum3--; }
  if ((i+1) % 50 === 0) console.log('line', (i+1).toString().padStart(4), 'cum', cum3);
}
console.log('final cumulative after full scan =', cum3);
// Find last line where cumulative was zero
let cum4 = 0;
let lastZero = 0;
for (let i = 0; i < lines.length; i++) {
  for (let ch of lines[i]) { if (ch === '{') cum4++; else if (ch === '}') cum4--; }
  if (cum4 === 0) lastZero = i+1;
}
console.log('last line where cumulative was zero:', lastZero);
const showStart = Math.max(1, lastZero - 6);
const showEnd = Math.min(lines.length, lastZero + 12);
console.log('\n---context after last zero (lines start..end)---\n');
for (let i = showStart-1; i < showEnd; i++) {
  console.log((i+1).toString().padStart(4), lines[i]);
}
