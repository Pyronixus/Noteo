const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'script.js');
const src = fs.readFileSync(file, 'utf8');
let stack = [];
let line = 1; let col = 0; let i = 0;
let inSingle=false,inDouble=false,inTemplate=false,inLineComment=false,inBlockComment=false;
for(i=0;i<src.length;i++){
  const ch = src[i];
  col++;
  if(ch==='\n'){line++; col=0; inLineComment=false;}
  if(inLineComment||inBlockComment){
    if(inBlockComment && ch==='*' && src[i+1]==='/'){inBlockComment=false;i++;col++;}
    continue;
  }
  if(!inSingle && !inDouble && !inTemplate){
    if(ch==='/' && src[i+1]==='/'){inLineComment=true;i++;col++;continue;}
    if(ch==='/' && src[i+1]==='*'){inBlockComment=true;i++;col++;continue;}
  }
  if(!inLineComment && !inBlockComment){
    if(ch==="'" && !inDouble && !inTemplate){inSingle=!inSingle; continue}
    if(ch==='"' && !inSingle && !inTemplate){inDouble=!inDouble; continue}
    if(ch==='`' && !inSingle && !inDouble){inTemplate=!inTemplate; continue}
  }
  if(inSingle||inDouble||inTemplate) continue;
  if(ch==='{') stack.push({line,col,i});
  else if(ch==='}'){
    if(stack.length===0){
      console.log('Unmatched } at line',line,'col',col);
      const start = Math.max(0,i-200);
      const end = Math.min(src.length,i+200);
      const context = src.slice(start,end);
      const startLine = src.slice(0,start).split('\n').length;
      console.log('Context (approx lines', startLine,'to', startLine + context.split('\n').length,'):\n');
      console.log(context);
      process.exit(1);
    } else stack.pop();
  }
}
if(stack.length){
  console.log('Unclosed { positions:'); stack.forEach(s=>console.log(s)); process.exit(1);
}
console.log('No problems');
