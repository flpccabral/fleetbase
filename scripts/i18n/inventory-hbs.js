// Lists user-visible literal strings in .hbs files: text nodes and string-valued UI attributes.
const { parse, traverse } = require('ember-template-recast');
const fs = require('fs');
const UI_ATTRS = /^@?(title|label|placeholder|helpText|text|buttonText|acceptButtonText|declineButtonText|emptyText|description|subtitle|tooltip|aria-label|alt|heading|caption|message|prompt|emptyStateText|loadingText|confirmText|cancelText|submitText|saveText|okText|header|name|value)$/i;
const out = [];
for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = parse(src);
  traverse(ast, {
    TextNode(node, path) {
      const parent = path.parent && path.parent.node;
      const t = node.chars.replace(/\s+/g, ' ').trim();
      if (!/[A-Za-z]{2,}/.test(t)) return;
      if (parent && parent.type === 'AttrNode') {
        if (!UI_ATTRS.test(parent.name)) return;
        out.push([file, node.loc.start.line, 'attr:' + parent.name, t]);
      } else if (parent && parent.type === 'ConcatStatement') {
        out.push([file, node.loc.start.line, 'concat', t]);
      } else {
        out.push([file, node.loc.start.line, 'text', t]);
      }
    },
    StringLiteral(node, path) {
      const parent = path.parent && path.parent.node;
      if (!parent || parent.type !== 'HashPair') return;
      if (!UI_ATTRS.test(parent.key)) return;
      if (!/[A-Za-z]{2,}/.test(node.value)) return;
      out.push([file, node.loc.start.line, 'hash:' + parent.key, node.value]);
    },
  });
}
for (const r of out) console.log(r.join('\t'));
