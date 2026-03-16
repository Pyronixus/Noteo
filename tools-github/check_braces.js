const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'script.js');
const src = fs.readFileSync(file, 'utf8');
let stack = [];
let line = 1;
let col = 0;
let i = 0;
let inSingle = false, inDouble = false, inTemplate = false, inLineComment = false, inBlockComment = false;
let errors = [];
for (i = 0; i < src.length; i++) {
  const ch = src[i];
  col++;
  if (ch === '\n') { line++; col = 0; inLineComment = false; }
  if (inLineComment || inBlockComment) {
    if (inBlockComment && ch === '*' && src[i+1] === '/') { inBlockComment = false; i++; col++; }
    continue;
  }
  if (!inSingle && !inDouble && !inTemplate) {
    if (ch === '/' && src[i+1] === '/') { inLineComment = true; i++; col++; continue; }
    if (ch === '/' && src[i+1] === '*') { inBlockComment = true; i++; col++; continue; }
  }
  if (!inLineComment && !inBlockComment) {
    if (ch === '\'' && !inDouble && !inTemplate) { inSingle = !inSingle; continue; }
    if (ch === '"' && !inSingle && !inTemplate) { inDouble = !inDouble; continue; }
    if (ch === '`' && !inSingle && !inDouble) { inTemplate = !inTemplate; continue; }
  }
  if (inSingle || inDouble || inTemplate) continue;
  if (ch === '{') stack.push({ch, line, col});
  else if (ch === '}') {
    if (stack.length === 0) errors.push({msg: "Unmatched closing brace", line, col});
    else stack.pop();
  }
}
if (stack.length) {
  stack.forEach(s => errors.push({msg: 'Unclosed opening brace', line: s.line, col: s.col}));
}
if (errors.length) {
  console.log('Found brace errors:');
  errors.forEach(e => console.log(e.msg + ' at line ' + e.line + ' col ' + e.col));
  process.exit(1);
} else {
  console.log('No brace errors found.');
}
