const fs = require('fs');
const path = require('path');

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

const knownGlobals = new Set([
  'React', 'String', 'Number', 'Boolean', 'Array', 'Object', 'Function', 'Symbol', 'Date',
  'RegExp', 'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError',
  'Math', 'JSON', 'Promise', 'Set', 'Map', 'WeakSet', 'WeakMap', 'Intl',
  'window', 'document', 'navigator', 'console', 'localStorage', 'sessionStorage',
  'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'URL', 'URLSearchParams', 'FormData', 'Blob', 'File', 'FileReader',
  'Image', 'Audio', 'Event', 'CustomEvent', 'MutationObserver', 'IntersectionObserver',
  'ResizeObserver', 'AbortController', 'Headers', 'Request', 'Response'
]);

const issues = [];

files.forEach(filePath => {
  const code = fs.readFileSync(filePath, 'utf8');
  
  // Find all JSX tags: <Tag or </Tag
  const jsxTagMatches = [...code.matchAll(/<([A-Z][a-zA-Z0-9_]*)/g)].map(m => m[1]);
  const uniqueTags = [...new Set(jsxTagMatches)];

  uniqueTags.forEach(tag => {
    if (knownGlobals.has(tag)) return;

    // Check if tag is declared or imported
    // 1. import ... tag ... from
    // 2. const tag = / let tag = / var tag = / function tag / class tag
    const importRegex = new RegExp(`\\bimport\\s+[^;]*?\\b${tag}\\b[^;]*?from`, 's');
    const declRegex = new RegExp(`\\b(const|let|var|function|class)\\s+${tag}\\b`);
    const funcParamRegex = new RegExp(`\\(${tag}\\b|\\b${tag}\\s*=>`);

    if (!importRegex.test(code) && !declRegex.test(code)) {
      issues.push({ file: path.relative(__dirname, filePath), tag });
    }
  });
});

console.log(JSON.stringify(issues, null, 2));
