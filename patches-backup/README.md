# Patch backups

Temporary copies of commits for submodules under `packages/` that have no
fork to push to yet. Remove this directory once the commit is pushed to the
module's fork and the submodule points at it.

| File | Module | Base commit |
|---|---|---|
| `ember-ui-translate-label.patch` | `packages/ember-ui` (fleetbase/ember-ui) | `f6923a5` (v0.4.4) |

To apply locally:

```bash
cd packages/ember-ui
git checkout -b claude/pt-br-translations f6923a5
git am ../../patches-backup/ember-ui-translate-label.patch
```
