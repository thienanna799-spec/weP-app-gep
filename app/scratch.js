const fs = require('fs');
const path = require('path');

function normalizeNodeName(rootDir, absolutePath) {
  let rel = path.relative(rootDir, absolutePath);
  const ext = path.extname(rel);
  if (ext) {
    rel = rel.slice(0, -ext.length);
  }
  return rel.replace(/\\/g, '/');
}

const content = fs.readFileSync('server/src/controllers/finance.controller.ts', 'utf-8');
const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"](.*?)['"]/g;
let match;
const imports = [];
while ((match = importRegex.exec(content)) !== null) {
  imports.push(match[1]);
}
console.log('Imports found:', imports);

const targetNode = normalizeNodeName(process.cwd(), path.resolve('server/src/controllers', '../services/finance.service.js'));
console.log('Target Node:', targetNode);
