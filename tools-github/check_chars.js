const fs = require('fs');
const path = 'Source/script.js';
const s = fs.readFileSync(path, 'utf8');
const counts = { '{':0, '}':0, '(':0, ')':0, '[':0, ']':0, '`':0, '"':0, "'":0 };
for (let i = 0; i < s.length; i++) { const c = s[i]; if (counts.hasOwnProperty(c)) counts[c]++; }
console.log(JSON.stringify(counts, null, 2));

// Also print last 40 lines to inspect tail
const lines = s.split('\n');
console.log('---TAIL---');
console.log(lines.slice(-40).join('\n'));
