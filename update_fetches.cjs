const fs = require('fs');
const dir = './src/repositories/api/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'apiClient.ts');

files.forEach(f => {
  const filepath = dir + f;
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (!content.includes('import { safeFetch }')) {
    content = "import { safeFetch } from './apiClient';\n" + content;
  }
  
  // replace await fetch with await safeFetch
  content = content.replace(/await fetch\(/g, 'await safeFetch(');
  
  // strip out response ok checks since safeFetch throws
  // and modify json() calls
  // this is a bit tricky with regex, let's do a simple replace
  content = content.replace(/const res = await safeFetch([\s\S]*?);\n\s*if \(!res\.ok\)[\s\S]*?\n\s*const json = await res\.json\(\);\n\s*(return)?/g, (match, p1, p2) => {
    return `const json = await safeFetch${p1};\n    ${p2 ? 'return' : ''}`;
  });

  content = content.replace(/const res = await safeFetch([\s\S]*?);\n\s*const json = await res\.json\(\);/g, 'const json = await safeFetch$1;');
  
  fs.writeFileSync(filepath, content);
});
console.log('done');
