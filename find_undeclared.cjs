const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        results = results.concat(walk(fullPath));
      }
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

const globalVars = new Set([
  'window', 'document', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'localStorage', 'sessionStorage', 'fetch', 'alert', 'confirm', 'prompt', 'navigator', 'location',
  'URL', 'URLSearchParams', 'FormData', 'Blob', 'File', 'FileReader', 'Image', 'Audio',
  'Event', 'CustomEvent', 'MutationObserver', 'IntersectionObserver', 'ResizeObserver', 'AbortController',
  'Headers', 'Request', 'Response', 'Math', 'JSON', 'Promise', 'Set', 'Map', 'WeakSet', 'WeakMap',
  'Intl', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Error', 'TypeError',
  'RangeError', 'ReferenceError', 'SyntaxError', 'isNaN', 'isFinite', 'parseFloat', 'parseInt',
  'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI', 'Infinity', 'NaN', 'undefined',
  'process', 'global', 'Buffer'
]);

let totalIssues = 0;

files.forEach(fullPath => {
  const code = fs.readFileSync(fullPath, 'utf8');
  const relPath = path.relative(__dirname, fullPath);

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator']
    });

    const undeclared = new Set();

    traverse(ast, {
      ReferencedIdentifier(pathNode) {
        const { name } = pathNode.node;
        if (globalVars.has(name)) return;
        if (!pathNode.scope.hasBinding(name)) {
          if (pathNode.parent.type === 'MemberExpression' && pathNode.parent.property === pathNode.node && !pathNode.parent.computed) {
            return;
          }
          undeclared.add(`${name} (line ${pathNode.node.loc?.start?.line})`);
        }
      }
    });

    if (undeclared.size > 0) {
      console.log(`\n=== Undeclared in ${relPath} ===`);
      undeclared.forEach(u => console.log('  -', u));
      totalIssues += undeclared.size;
    }
  } catch (err) {
    console.error(`Error parsing ${relPath}:`, err.message);
  }
});

console.log(`\nFinished scan. Total undeclared issues: ${totalIssues}`);
