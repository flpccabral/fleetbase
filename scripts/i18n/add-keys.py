"""Insert translation keys into a YAML translation file without reformatting the rest of it.

Usage: python3 scripts/i18n/add-keys.py <keys.json> <translations.yaml> <indent> <column>

  keys.json  {"some.nested.key": ["English", "Português"], ...} (as written by apply-edits.py)
  indent     spaces per nesting level used by that file (Fleet-Ops en-us uses 4, most files use 2)
  column     0 to write the English text, 1 to write the Portuguese text

Keys that already exist are left untouched. Missing parent sections are created at the end of the
closest existing parent, so the file's existing order and comments are preserved.
"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from yaml_ensure import ensure  # noqa: E402

keys_file, yaml_file, indent, column = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
keys = json.load(open(keys_file))
lines = open(yaml_file).read().split('\n')
added = sum(1 for k, v in keys.items() if ensure(lines, k, v[column], indent))
open(yaml_file, 'w').write('\n'.join(lines))
print('added %d of %d keys to %s' % (added, len(keys), yaml_file))
