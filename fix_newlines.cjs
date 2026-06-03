const fs = require('fs');
const dir = './src/repositories/api/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'apiClient.ts');

files.forEach(f => {
  const filepath = dir + f;
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/\\n/g, '\n');
  fs.writeFileSync(filepath, content);
});
console.log('fixed literal n');
