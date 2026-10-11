// Lists user-visible string literals in JS: UI-ish object properties and notification messages.
const parser = require('@babel/parser');
const fs = require('fs');
const UI_KEYS = /^(label|text|title|helpText|placeholder|filterComponentPlaceholder|message|acceptButtonText|declineButtonText|body|subtitle|description|emptyText|ddMenuLabel|confirmText|tooltip|heading|caption|prompt|successMessage|errorMessage|loadingText|modalTitle|buttonText|name|hint|expectedResult|summary)$/;
const NOTIFY = /^(success|error|warning|info|notice)$/;
function walk(node, parent, cb) {
  if (!node || typeof node.type !== 'string') return;
  cb(node, parent);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'start' || k === 'end' || k === 'leadingComments' || k === 'trailingComments') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && walk(c, node, cb));
    else if (v && typeof v.type === 'string') walk(v, node, cb);
  }
}
const text = (n) => n.type === 'StringLiteral' ? n.value : n.type === 'TemplateLiteral' ? n.quasis.map((q) => q.value.cooked).join('${…}') : null;
for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(src, { sourceType: 'module', plugins: ['decorators-legacy', 'classProperties', 'classPrivateMethods'] });
  walk(ast.program, null, (node, parent) => {
    const t = text(node);
    if (t === null || !/[A-Za-z]{2,}/.test(t)) return;
    let kind = null;
    if (parent && parent.type === 'ObjectProperty' && parent.value === node) {
      const key = parent.key.name || parent.key.value;
      if (UI_KEYS.test(key)) kind = 'prop:' + key;
    } else if (parent && parent.type === 'CallExpression' && parent.callee.type === 'MemberExpression') {
      const m = parent.callee.property.name;
      const obj = parent.callee.object;
      const objName = obj.type === 'MemberExpression' ? obj.property.name : obj.name;
      if (NOTIFY.test(m) && /notifications?/.test(objName || '')) kind = 'notify:' + m;
      else if (/^(confirm|show|alert|prompt)$/.test(m) && /modalsManager/.test(objName || '')) kind = 'modal:' + m;
    } else if (parent && parent.type === 'ConditionalExpression' || parent && parent.type === 'LogicalExpression' || parent && parent.type === 'ReturnStatement') {
      kind = 'expr:' + parent.type;
    }
    if (kind) console.log([file, node.loc.start.line, kind, t].join('\t'));
  });
}
