const fs = require('fs');
const path = './constants.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/minQuantity: /g, 'lowStockThreshold: ');
fs.writeFileSync(path, content);
console.log('Replaced minQuantity with lowStockThreshold in constants.ts');
