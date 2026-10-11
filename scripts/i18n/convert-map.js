// Replaces exact texts (text nodes, attribute values, helper string literals) with translation keys from MAP.
const { transform } = require('ember-template-recast');
const fs = require('fs');
const MAP = JSON.parse(process.env.MAP);
for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, 'utf8');
  const { code } = transform({
    template: src,
    plugin(env) {
      const b = env.syntax.builders;
      return {
        AttrNode(node) {
          if (node.value.type !== 'TextNode') return;
          const key = MAP[node.value.chars.trim()];
          if (key && !/^(class|@class|type|role)$/.test(node.name)) node.value = b.mustache(b.path('t'), [b.string(key)]);
        },
        TextNode(node, path) {
          const p = path.parent && path.parent.node;
          if (!p || p.type === 'AttrNode' || p.type === 'ConcatStatement') return;
          const text = node.chars.replace(/\s+/g, ' ').trim();
          const key = MAP[text];
          if (!key) return;
          const lead = node.chars.match(/^\s*/)[0];
          const trail = node.chars.slice(lead.length).match(/\s*$/)[0];
          const out = [];
          if (lead) out.push(b.text(lead));
          out.push(b.mustache(b.path('t'), [b.string(key)]));
          if (trail) out.push(b.text(trail));
          return out;
        },
        StringLiteral(node, path) {
          const p = path.parent && path.parent.node;
          const key = MAP[node.value];
          if (!key || !p || p.type === 'HashPair' || (p.path && p.path.original === 't')) return;
          return b.sexpr(b.path('t'), [b.string(key)]);
        },
      };
    },
  });
  if (code !== src) fs.writeFileSync(file, code);
}
