# Translation backups

Temporary copies of translation files for modules that live in other
repositories (git submodules under `packages/`), kept here until they can be
pushed to a fork of that module.

| File | Destination |
|---|---|
| `storefront/pt-br.yaml` | `packages/storefront/translations/pt-br.yaml` (fleetbase/storefront) |

To use locally:

```bash
cp translations-backup/storefront/pt-br.yaml packages/storefront/translations/pt-br.yaml
```

Remove this directory once the file is merged into the module's repository.
