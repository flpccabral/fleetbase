# Passagem de bastão: tradução pt-BR do Fleetbase

> Escrito por quem está saindo do projeto para quem chega. Leia de cima para baixo na primeira vez;
> depois use como consulta. Quando algo aqui ficar desatualizado, **corrija este arquivo no mesmo
> commit** em que você mudar o comportamento. Documentação velha é pior que nenhuma.

---

## Sumário

1. [Antes de tudo: o que você precisa saber em 5 minutos](#1-antes-de-tudo-o-que-você-precisa-saber-em-5-minutos)
2. [O que é o Fleetbase](#2-o-que-é-o-fleetbase)
3. [Mapa dos repositórios (forks, submódulos e branches)](#3-mapa-dos-repositórios-forks-submódulos-e-branches)
4. [Preparando sua máquina](#4-preparando-sua-máquina)
5. [Como a tradução funciona por dentro](#5-como-a-tradução-funciona-por-dentro)
6. [Padrões que adotamos (e por quê)](#6-padrões-que-adotamos-e-por-quê)
7. [Passo a passo: traduzir uma tela](#7-passo-a-passo-traduzir-uma-tela)
8. [Ferramentas em `scripts/i18n/`](#8-ferramentas-em-scriptsi18n)
9. [Validação: lint, varredura e testes](#9-validação-lint-varredura-e-testes)
10. [Git: como commitar e publicar sem quebrar nada](#10-git-como-commitar-e-publicar-sem-quebrar-nada)
11. [Armadilhas conhecidas](#11-armadilhas-conhecidas)
12. [Estado atual e trabalho pendente](#12-estado-atual-e-trabalho-pendente)
13. [Histórico do que foi feito](#13-histórico-do-que-foi-feito)
14. [Glossário](#14-glossário)

---

## 1. Antes de tudo: o que você precisa saber em 5 minutos

- O objetivo deste trabalho é deixar o **Console do Fleetbase 100% utilizável em português do Brasil**.
  Quando o usuário escolhe pt-BR, nenhum texto deveria aparecer em inglês nem como
  `Missing translation`.
- O Fleetbase é **um repositório principal + vários submódulos Git** (um por extensão). Cada
  extensão que alteramos tem um **fork na conta `flpccabral`**, e todo o nosso trabalho fica na
  branch **`claude/pt-br-translations`** desses forks. O repositório principal usa a branch
  **`claude/festive-meitner-u3i27z`**.
- Traduzir quase sempre é: **trocar texto fixo por uma chave** (`{{t "..."}}` no template,
  `this.intl.t('...')` no JavaScript) e **adicionar a chave em `en-us.yaml` e `pt-br.yaml`**.
- **Nunca** traduza um valor que o sistema usa como identificador (ids de menu, slugs, status
  salvos no banco, nomes de widget persistidos). Traduza só o que é exibido. A seção 6 explica.
- Antes de commitar, rode **lint** e a **varredura de chaves inexistentes**
  (`scripts/i18n/scan-missing-keys.py`). Os testes automatizados da maioria das extensões **não
  rodam** hoje (seção 9). Não conclua que "passou" sem ter rodado.
- Ordem de publicação: **commit e push no submódulo primeiro, depois no repositório principal**
  (para atualizar o ponteiro do submódulo). Seção 10.

---

## 2. O que é o Fleetbase

Plataforma open source de logística e gestão de frotas. O backend é PHP/Laravel (`api/` e
`packages/core-api`). O frontend é o **Console**, um app Ember.js (`console/`). Cada módulo de
negócio é uma **extensão** em `packages/`:

| Pasta | O que é | Quem mantém o código |
|---|---|---|
| `console/` | O app Ember principal (shell, login, admin, configurações) | repo principal |
| `packages/ember-ui` | Biblioteca de componentes (tabelas, menus, cabeçalho, botões) | fork |
| `packages/ember-core` | Serviços base (universe, menu-service, fetch, current-user) | upstream |
| `packages/fleetops` | Fleet-Ops: pedidos, motoristas, veículos, rastreamento | fork |
| `packages/storefront` | Loja on-line: produtos, pedidos, clientes, redes | fork |
| `packages/iam-engine` | Usuários, grupos, papéis e políticas | fork |
| `packages/ledger` | Faturas, pagamentos, contabilidade, relatórios | fork |
| `packages/ai` | Fleetbase AI (assistente + telas de admin) | fork |
| `packages/registry-bridge` | Registro/loja de extensões | fork |
| `packages/dev-engine` | Área de desenvolvedores (API keys, webhooks, sockets) | upstream |
| `packages/pallet` | Armazém/estoque | upstream |
| `packages/customer-portal` | Portal do cliente | upstream |

O Console carrega as extensões como **Ember Engines**. Cada extensão registra menus, atalhos e
widgets no arquivo `addon/extension.js`, dentro de `setupExtension(app, universe)`.

---

## 3. Mapa dos repositórios (forks, submódulos e branches)

```
flpccabral/fleetbase  (repo principal, branch claude/festive-meitner-u3i27z)
├── console/                      ← código e traduções do Console
├── scripts/i18n/                 ← nossas ferramentas de tradução
└── packages/  (submódulos)
    ├── fleetops         → flpccabral/fleetops         @ claude/pt-br-translations
    ├── storefront       → flpccabral/storefront       @ claude/pt-br-translations
    ├── iam-engine       → flpccabral/iam-engine       @ claude/pt-br-translations
    ├── ledger           → flpccabral/ledger           @ claude/pt-br-translations
    ├── ember-ui         → flpccabral/ember-ui         @ claude/pt-br-translations
    ├── ai               → flpccabral/ai               @ claude/pt-br-translations
    ├── registry-bridge  → flpccabral/registry-bridge  @ claude/pt-br-translations
    └── (demais)         → fleetbase/<repo>  (upstream, não alterados)
```

- O arquivo `.gitmodules` aponta os sete módulos acima para os forks (URLs SSH
  `git@github.com:flpccabral/<repo>.git`).
- Dentro de cada submódulo existem dois remotes: `origin` (de onde foi clonado) e **`fork`**
  (`https://github.com/flpccabral/<repo>`). **Publique sempre em `fork`.**
- O repositório principal guarda só o **commit** para o qual cada submódulo aponta. Se você
  commitar no submódulo e esquecer de commitar o ponteiro no principal, ninguém recebe sua mudança.
- **Para alterar uma extensão que ainda não tem fork** (ex.: `pallet`, `customer-portal`,
  `dev-engine`): crie o fork no GitHub em `flpccabral`, mude a URL dela no `.gitmodules`, rode
  `git submodule sync`, crie a branch `claude/pt-br-translations` e adicione o remote `fork`. Foi
  assim com o AI e o Registry Bridge.

---

## 4. Preparando sua máquina

Ambiente usado: **Linux**. Você vai precisar de Git, Docker, Node.js 18+ (o projeto foi validado com
Node 22), `pnpm` e Python 3 com PyYAML (`pip install pyyaml`).

### 4.1 Clonar com os submódulos

```bash
git clone https://github.com/flpccabral/fleetbase.git
cd fleetbase
git checkout claude/festive-meitner-u3i27z
git submodule sync
git submodule update --init --recursive
```

**Git com HTTPS em vez de SSH.** Se você não tem chave SSH no GitHub, os submódulos (URLs
`git@github.com:`) vão falhar. Faça o Git trocar SSH por HTTPS automaticamente:

```bash
git config --global url."https://github.com/".insteadOf git@github.com:
```

### 4.2 Docker sem `sudo`

Erro típico: `permission denied while trying to connect to the docker API at unix:///var/run/docker.sock`.
Se `usermod` disser que o grupo `docker` não existe, crie o grupo antes:

```bash
sudo groupadd docker          # só se o grupo não existir
sudo usermod -aG docker $USER
newgrp docker                 # ou faça logout/login
docker ps                     # deve funcionar sem sudo
```

### 4.3 Subir o Fleetbase

Siga o `README.md` da raiz (instalação via Docker/CLI). Depois de subir, entre no Console, abra o
seu perfil e escolha **Português (Brasil)**. O idioma é uma preferência do usuário
(`currentUser.getOption('locale')`), aplicada em `console/app/routes/application.js`.

### 4.4 Trabalhar com as extensões localmente

Para o Console usar o código local das extensões (e não a versão publicada no npm), use o
*package linker*:

```bash
node scripts/package-linker.mjs enable fleetops storefront iam-engine ledger ai registry-bridge \
  --shared ember-core ember-ui fleetops-data --install
```

Depois de qualquer mudança em tradução ou template, **refaça o build do Console**. As traduções
são compiladas no build.

### 4.5 Dependências para lint e testes de cada extensão

Cada pacote tem o próprio `node_modules`. Antes de rodar lint ou testes de uma extensão:

```bash
cd packages/<extensão>
pnpm install --frozen-lockfile
npx eslint addon
npx ember-template-lint addon
```

---

## 5. Como a tradução funciona por dentro

- **Biblioteca:** [ember-intl](https://ember-intl.github.io/ember-intl/) 6.x, com arquivos YAML.
- **Onde ficam os arquivos:**
  - Console: `console/translations/<locale>.yaml`
  - Cada extensão: `packages/<extensão>/translations/<locale>.yaml`
  - O **ember-ui não tem traduções próprias**: as chaves que ele usa ficam no Console.
- **Mesclagem:** no build, o ember-intl junta as pastas `translations/` de todas as extensões num
  único dicionário por idioma. Por isso uma tela do Storefront consegue usar uma chave definida no
  Fleet-Ops. **Evite fazer isso** (seção 6.6).
- **Idioma reserva:** `console/config/ember-intl.js` define `fallbackLocale: 'en-US'`. Uma chave
  que falta em pt-BR aparece em inglês. Uma chave que falta **também** em en-US aparece como
  `Missing translation "x.y.z"`.
- **Uso no template:** `{{t "storefront.order-list.dispatch"}}`, com parâmetros
  `{{t "chave" count=3 name=@model.name}}`, ou dentro de outra expressão:
  `{{n-a @product.name (t "storefront.product-list.untitled-product")}}`.
- **Uso no JavaScript:** injete `@service intl;` e chame `this.intl.t('chave', { name })`. Para
  saber se uma chave existe: `this.intl.exists('chave')`.
- **Placeholders e plural (formato ICU):**

  ```yaml
  dispatch-success: "O pedido {orderId} foi despachado."
  variants: "{count, plural, one {# variação} other {# variações}}"
  ```

  O nome do placeholder (`{orderId}`, `{count}`) é **idêntico** em todos os idiomas. Nunca traduza o
  que está entre chaves. Use `plural` sempre que houver número. Não concatene "variants" depois do
  número.

---

## 6. Padrões que adotamos (e por quê)

### 6.1 Nomes de chave

- Prefixo do módulo: `fleet-ops.`, `storefront.`, `ledger.`, `iam.`, `ai.`, `registry-bridge.`.
- Depois, a tela ou área: `storefront.product-list.*`, `fleet-ops.order-details.tracking.*`,
  `ai.admin.logs.*`.
- **Prefira chaves novas, com nome claro, a reaproveitar chaves de outro módulo.**
- Mantenha `en-us.yaml` e `pt-br.yaml` com **as mesmas chaves**. A varredura da seção 9 confere.

### 6.2 Tradução em tempo de renderização (menus, atalhos e widgets)

As extensões registram menus e widgets em `setupExtension`, que roda **antes** de o idioma do
usuário ser aplicado. Se você chamar `intl.t()` ali, o texto fica congelado em inglês. Por isso:

- As extensões registram **a chave**, não o texto, usando a função `labelResolver(app)` do
  `extension.js`:

  ```js
  function labelResolver(app) {
      if (app.factoryFor('helper:translate-label')) {
          return (key) => key;          // ember-ui novo: traduz na renderização
      }
      const intl = app.lookup('service:intl');
      return (key) => intl.t(key);      // ember-ui antigo: traduz na hora (compatibilidade)
  }
  ```

- Quem exibe o texto passa pelo helper **`translate-label`** (ember-ui) ou pela função
  `translateRegisteredLabel` (Console, `console/app/utils/translate-registered-label.js`). Os dois
  traduzem o valor se ele for uma chave existente e devolvem o valor original se não for.
- Abas registradas por outras extensões (ex.: a aba "Fatura" que o Ledger injeta nos pedidos do
  Fleet-Ops e do Storefront) são traduzidas pelo controller que monta as abas, com
  `intl.exists(label) ? intl.t(label) : label`.

### 6.3 Nunca mude identificadores ao traduzir

O `menu-service` (ember-core) gera **id, slug e view** a partir do título com `dasherize(title)`.
Se o título virar uma chave, o id muda, e com ele URLs, permissões (`"<id> see extension"`) e
atalhos fixados pelos usuários. Sempre que trocar um título por chave, **defina explicitamente** o
id, o slug e a view com o valor que existia antes:

```js
new MenuItem({
    id: 'task-&-chat-logs', slug: 'task-&-chat-logs', view: 'task-&-chat-logs', // dasherize do título antigo
    title: label('ai.admin.menu.logs'),
})
```

Atalhos do cabeçalho seguem `dasherize(parentId + '-sc-' + title)`. Exemplo:
`id: 'storefront-sc-products'`.

### 6.4 Não traduza dados salvos

- O dashboard **persiste o nome do widget** (`services/dashboard.js`, `_storedLabel`). Ele continua
  salvo em inglês; só a exibição é traduzida.
- Status internos (`'Live'`, `'Missing'`, `'draft'`, `'created'`) continuam em inglês no código e
  são usados em comparações. Traduza só o que vai para a tela, por exemplo com
  `intl.t(\`order-status.${status}\`)` e um fallback quando a chave não existir.
- Palavras-chave de busca dos menus continuam em inglês, de propósito.

### 6.5 Nomes de produto e valores técnicos não se traduzem

Google Routes, OSRM, GNU Taler, QPay, JSON Lines, CSV, nomes de provedores e modelos de IA, URLs de
exemplo, classes CSS e ícones ficam como estão.

### 6.6 Chaves de outro módulo são frágeis

Achamos várias telas do Storefront usando `fleet-ops.operations.orders.index.*`. O Fleet-Ops
renomeou essas chaves e as telas passaram a mostrar `Missing translation`. Quando um módulo
precisar de um texto, **crie a chave no próprio módulo**, mesmo que o texto se repita.

### 6.7 Testes que verificam textos em inglês

- Em extensões com traduções próprias (Fleet-Ops, Storefront, AI), adicione
  `setupIntl(hooks, 'en-us')` (de `ember-intl/test-support`) ao módulo de teste. Assim ele continua
  verificando o texto em inglês.
- No **ember-ui** (sem traduções próprias), registre um `intl` falso ou intercepte só as suas
  chaves:

  ```js
  const intl = this.owner.lookup('service:intl');
  const translate = intl.t.bind(intl);
  intl.t = (key, options) => MAPA_EN[key] ?? translate(key, options);
  ```

---

## 7. Passo a passo: traduzir uma tela

Exemplo real: a lista de produtos do Storefront. Rode todos os comandos a partir da raiz do
repositório.

1. **Ache os arquivos da tela.** Comece pela rota (`addon/templates/<rota>.hbs` e
   `addon/controllers/<rota>.js`) e siga os componentes usados no template (`<Storefront::Product::Card`
   → `addon/components/storefront/product/card.hbs/.js`).

2. **Faça o inventário dos textos fixos:**

   ```bash
   cd scripts/i18n && npm install && cd ../..        # uma vez só
   node scripts/i18n/inventory-hbs.js packages/storefront/addon/components/storefront/product/*.hbs
   node scripts/i18n/inventory-js.js  packages/storefront/addon/controllers/products/index.js
   ```

   O inventário **não pega tudo**. Procure também literais dentro de expressões:

   ```bash
   grep -n '{{[^}]*"[A-Z][a-z][^"]*"' <arquivos.hbs> | grep -v '(t "\|{{t "'
   ```

   Esse grep acha casos como `{{n-a @x "No SKU"}}` e `{{if @y "Sim" "Não"}}`.

3. **Decida o que traduzir.** Descarte nomes de produto, valores técnicos e identificadores
   (seções 6.3 a 6.5). Para status, procure se já existe chave (ex.: `order-status.*` no Fleet-Ops).

4. **Escreva uma especificação** (`/tmp/minha-tela.py`):

   ```python
   EDITS = [
     ('packages/storefront/addon/components/storefront/product/card.hbs', [
       ('<FaIcon @icon="star" /> Recommended</span>',
        '<FaIcon @icon="star" /> {{t "storefront.product-list.recommended"}}</span>'),
     ]),
   ]
   KEYS = [
     ('storefront.product-list.recommended', 'Recommended', 'Recomendado'),
   ]
   ```

   Aplique:

   ```bash
   python3 scripts/i18n/apply-edits.py /tmp/minha-tela.py
   ```

   O script exige que cada trecho apareça **exatamente uma vez** no arquivo. Se aparecer mais de
   uma vez, ele para e não edita nada naquele arquivo. Inclua mais contexto no trecho até ficar
   único.

5. **Se o JavaScript passou a usar `this.intl`**, confira se a classe tem `@service intl;` (e o
   `import { inject as service } from '@ember/service';`). Esquecer isso quebra a tela em tempo de
   execução, e o lint não acusa.

6. **Insira as chaves nos YAML.** Olhe a indentação de cada arquivo antes: o `en-us.yaml` do
   Fleet-Ops usa 4 espaços e quase todos os outros usam 2.

   ```bash
   python3 scripts/i18n/add-keys.py /tmp/minha-tela.keys.json packages/storefront/translations/en-us.yaml 2 0
   python3 scripts/i18n/add-keys.py /tmp/minha-tela.keys.json packages/storefront/translations/pt-br.yaml 2 1
   ```

7. **Valide** (seção 9): lint, template-lint, varredura de chaves inexistentes e carga dos YAML.

8. **Revise o diff linha por linha** (`git diff`). O diff deve conter **somente** as suas trocas.
   Se aparecerem dezenas de linhas reformatadas, o Prettier mexeu no que não devia (seção 11).

9. **Teste no navegador** em pt-BR **e** em en-US. Confira plural, placeholders e textos longos
   quebrando o layout.

10. **Commit e push** (seção 10).

---

## 8. Ferramentas em `scripts/i18n/`

| Arquivo | Para que serve |
|---|---|
| `inventory-hbs.js` | Lista textos visíveis em templates `.hbs` (nós de texto e atributos como `@title`, `@placeholder`, `@helpText`). |
| `inventory-js.js` | Lista strings em JS que parecem texto de interface (`label:`, `text:`, `title:`, notificações). |
| `convert-map.js` | Troca automaticamente textos exatos por `{{t "chave"}}`, a partir de um mapa JSON. Útil quando há muitos textos simples: `MAP='{"Pickup":"x.pickup"}' node scripts/i18n/convert-map.js arquivo.hbs`. |
| `apply-edits.py` | Aplica trocas exatas a partir de uma especificação e acumula as chaves em `<spec>.keys.json`. |
| `add-keys.py` / `yaml_ensure.py` | Insere chaves num YAML sem reformatar o resto. Cria as seções que faltam e ignora chaves que já existem. |
| `scan-missing-keys.py` | Lista chaves usadas no código que não existem em nenhum `en-us`/`pt-br`. |

Instalação: `cd scripts/i18n && npm install`. Os scripts Python precisam de `pyyaml`.

---

## 9. Validação: lint, varredura e testes

### 9.1 Lint (obrigatório)

```bash
cd packages/<extensão>
npx eslint <arquivos ou pastas alterados>
npx ember-template-lint <templates alterados>
npx prettier --check <arquivos alterados>
```

No Console use `cd console && npx eslint app/...`. Se uma extensão não tiver `node_modules`, rode
`pnpm install --frozen-lockfile` antes.

### 9.2 Varredura de chaves inexistentes (obrigatória)

```bash
python3 scripts/i18n/scan-missing-keys.py packages/storefront/addon
python3 scripts/i18n/scan-missing-keys.py console/app
```

O resultado esperado é `missing en 0 | missing only pt 0`.

### 9.3 Os YAML precisam carregar no js-yaml

O ember-intl usa o js-yaml, que **falha com chave duplicada**. Já o PyYAML aceita a duplicata
calado. Valide com:

```bash
node -e "const y=require('./packages/fleetops/node_modules/.pnpm/js-yaml@4.1.1/node_modules/js-yaml');
for (const f of process.argv.slice(1)) { y.load(require('fs').readFileSync(f,'utf8')); console.log('ok', f); }" \
  packages/storefront/translations/en-us.yaml packages/storefront/translations/pt-br.yaml
```

### 9.4 Testes automatizados (situação real)

Para rodar os testes de uma extensão é preciso um Chrome/Chromium. Neste ambiente usamos o
Chromium do Playwright com um link chamado `google-chrome` no `PATH` e `CI=true`:

```bash
CI=true npx ember test --filter "Integration | Component | table"
```

| Pacote | Situação dos testes |
|---|---|
| **ember-ui** | ✅ **Funcionam.** Últimas execuções: tabela 433/433, cabeçalho + docs-panel 200/200. |
| fleetops | ❌ O app de testes não inicia: `Failed to create an instance of 'service:universe/registry-service'`. Confirmado em teste não relacionado (`trailer/form`). Já falhava antes do nosso trabalho. |
| storefront | ❌ O app de testes não carrega: `Could not find module 'ember-resolver'`. |
| ai | ❌ `Could not find module '@fleetbase/ai-engine/...'`. Reproduzido no código original do fork, sem nossas mudanças. |
| ledger | ❌ `Class extends value [object Object]`. Já falhava antes do nosso trabalho. |

**Consequência:** nas extensões marcadas com ❌, a única validação possível hoje é lint, varredura,
build do Console e **teste manual no navegador**. Consertar esses ambientes de teste está na lista
de pendências (seção 12).

---

## 10. Git: como commitar e publicar sem quebrar nada

1. **No submódulo:**

   ```bash
   cd packages/storefront
   git status                       # confira a branch: claude/pt-br-translations
   git add -A addon translations tests
   git commit -m "Translate the products list"
   git push fork claude/pt-br-translations
   ```

2. **No repositório principal**, atualize o ponteiro:

   ```bash
   cd ../..
   git add packages/storefront      # e console/translations, se mudou
   git commit -m "Point storefront submodule at translated products list"
   git push origin claude/festive-meitner-u3i27z
   ```

3. **Para quem vai usar** (ou para você em outra máquina):

   ```bash
   git pull
   git submodule sync
   git submodule update --init
   ```

   Depois, refaça o build do Console.

**Regras:**

- Nunca faça push no repositório upstream `fleetbase/*`. Publique sempre nos forks `flpccabral/*`.
- Mensagens de commit em inglês, no imperativo ("Translate the products list"), com um corpo
  explicando **por quê** quando não for óbvio.
- Não reescreva histórico já publicado (`rebase`/`push --force`) nas branches compartilhadas.

---

## 11. Armadilhas conhecidas

1. **Prettier reformata o que você não tocou.** O código original não segue 100% a configuração do
   Prettier. Rodar `prettier --write` numa pasta inteira gera centenas de linhas de ruído. Rode o
   Prettier **só nos arquivos JS que você alterou** e revise o diff. Ele também remove a quebra de
   linha final dos `.hbs`; se o original tinha, recoloque.
2. **`yes:` e `no:` como chave YAML** viram booleanos `true`/`false` no PyYAML (YAML 1.1). Use
   nomes como `answer-yes` e `answer-no`. Valem também para `on`, `off`, `y`, `n`, `true` e `false`.
3. **Indentação diferente entre arquivos.** O `en-us.yaml` do Fleet-Ops usa 4 espaços; o `pt-br.yaml`
   dele e quase todos os outros usam 2. Confira antes de inserir chaves.
4. **Seção existente com o mesmo nome da chave.** `modals.select-payment-method` já era uma seção
   (com `card-ending` dentro) e um template a usava como texto. Antes de criar uma chave, veja se o
   caminho já existe como seção.
5. **Comparação de status com texto traduzido.** Evite `(eq @status (t "..."))`. Compare sempre o
   valor interno.
6. **`setupExtension` roda antes do idioma.** Nunca chame `intl.t()` direto ao registrar menus ou
   widgets (seção 6.2).
7. **Componentes de modal são abertos por string** (`modalsManager.show('modals/xyz')`). Ao avaliar
   se um componente "não é usado", procure também por essas strings.
8. **Literais em atributos de outro componente** (`@emptyStateComponent={{component ... title="..."}}`)
   não aparecem no inventário. Leia o template inteiro.
9. **Padrões em inglês no ember-ui.** Componentes genéricos têm textos de reserva (ex.: tabela
   vazia). Corrigir no ember-ui resolve todas as telas de uma vez. Prefira isso a corrigir tela por
   tela.

---

## 12. Estado atual e trabalho pendente

### 12.1 Cobertura das traduções (chaves pt-BR × en-US)

| Módulo | Chaves en-US | pt-BR faltando | pt-BR igual ao inglês* | Chaves inexistentes no código |
|---|---:|---:|---:|---:|
| console | 837 | 0 | 16 | 0 |
| fleetops | 3474 | 0 | 67 | 0 |
| storefront | 1115 | 0 | 29 | 0 |
| ledger | 1024 | 0 | 16 | 0 |
| iam-engine | 171 | 0 | 1 | 0 |
| ai | 162 | 0 | 6 | 0 |
| registry-bridge | 142 | 0 | 2 | 0 |
| dev-engine (não alterado) | 237 | 0 | 34 | **2** |
| pallet (não alterado) | 266 | **266 (sem pt-br.yaml)** | — | **5** (+73 só em pt) |
| customer-portal (não alterado) | 492 | **492 (sem pt-br.yaml)** | — | 0 (+414 só em pt) |

\* "Igual ao inglês" inclui casos corretos (ID, Status, Total, nomes de produto). Revise a lista,
mas não traduza às cegas.

### 12.2 Pendências, em ordem de prioridade

1. **Telas ainda não auditadas** (podem ter texto fixo em inglês):
   - Storefront: redes, promoções, catálogos, food trucks e formulário de produto.
   - Fleet-Ops: motoristas, veículos, locais, frotas, manutenção e agendador.
   - Ledger, IAM, AI e Registry Bridge: telas fora das que fizemos.

   Use o passo a passo da seção 7. Exemplo já conhecido: o formulário de sensores do Fleet-Ops
   (`components/sensor/form.hbs`) tem `@name="Min Threshold"` e `@name="Max Threshold"` fixos.
2. **Pallet e Customer Portal** não têm `pt-br.yaml`. É preciso criar o fork, apontar o
   `.gitmodules`, copiar o `en-us.yaml` para `pt-br.yaml` e traduzir. O Pallet também tem 5 chaves
   inexistentes; rode a varredura.
3. **Dev-engine:** 2 chaves inexistentes. Rode
   `python3 scripts/i18n/scan-missing-keys.py packages/dev-engine/addon`.
4. **Consertar os ambientes de teste** de Fleet-Ops, Storefront, AI e Ledger (seção 9.4). Sem isso,
   toda mudança nessas extensões depende de teste manual.
5. **Datas relativas e formatação:** o AI mostra "3 hours ago" via `date-fns` em inglês
   (`addon/utils/ai-admin-format.js`). Corrigir exige passar o locale do date-fns, e os testes de
   utilitário verificam o texto em inglês.
6. **Status personalizados** de fluxos de pedido (colunas do quadro kanban) aparecem com o nome
   original. São dados do cliente, então avalie com o time antes de traduzir.
7. **Contribuir de volta com o upstream** (`fleetbase/*`). Abra PRs com as correções de chaves
   inexistentes e com o pt-BR. Isso reduz o custo de manter os forks atualizados.
8. **Manter os forks atualizados:** de tempos em tempos, traga o upstream
   (`git fetch origin && git merge origin/main` na branch do fork), resolva conflitos nos YAML e
   rode a varredura de chaves.

---

## 13. Histórico do que foi feito

Commits na branch `claude/pt-br-translations` de cada fork (mais recentes primeiro):

**fleetops**
- `b19898b` Add translations for keys that do not exist (79 chaves que o código usava e não existiam)
- `793caa1` Translate the orders list (tabela, quadro kanban, lista no mapa)
- `141ba87` Translate the order details screen (incluindo rastreamento/ETA)
- `57b0219` Translate order details tabs and actions
- `7351cbb` Translate Fleet-Ops admin menu and admin settings pages
- `f00be8c` Register header shortcuts and widgets with translation keys
- `2683f1a` Complete pt-BR translations

**storefront**
- `c993cf9` Translate the products list
- `ffb8940` Translate the customers list empty state and fix its actions label
- `efd45c5` Fix translation keys that do not exist
- `9c454d2` Translate the orders list and fix its missing translation keys
- `e965332` Translate the order details screen
- `944acd9` Translate order details tabs, actions and confirmations
- `2316b53` Translate Storefront navigation menus, header shortcuts and widgets
- `5ea4c95` Complete pt-BR translations

**ledger**
- `9b275cd` Translate the Invoice tab added to order details
- `1d7e5f0` Register header shortcuts and widgets with translation keys
- `3a4abb2` Translate accounting, reports and dashboard screens
- `8ace0f7` Translate status, type and environment badges
- `b6116dd` Translate invoices and payments screens
- `ef80d04` Add pt-BR translations

**ember-ui**
- `797e361` Translate the header organization and user menus
- `49a529e` Translate the default table empty state text
- `eb84fa4` Translate registered menu, shortcut and widget labels at render time (helper `translate-label`)

**iam-engine**
- `4e97a0d` Fix translation keys that do not exist
- `5dd6c9b` Complete pt-BR translations

**ai**
- `5c69db4` Translate AI admin menu and admin pages

**registry-bridge**
- `0fdc283` Fix the uploading message translation key
- `936ec03` Translate Registry Bridge menus and add pt-BR translations

**Repositório principal (Console)**, branch `claude/festive-meitner-u3i27z`:
- Tradução completa de `console/translations/pt-br.yaml`.
- Menu de administração traduzido (`console/app/controllers/console/admin.js`,
  `utils/translate-registered-label.js`).
- Chaves do ember-ui: cabeçalho, tabela vazia, `smart-nav-menu`, painel de widgets.
- Forks apontados no `.gitmodules` e os ponteiros dos submódulos atualizados.

Para ver tudo: `git log --oneline` dentro de cada `packages/<extensão>`.

---

## 14. Glossário

| Termo | Significado |
|---|---|
| **Chave de tradução** | Identificador como `storefront.product-list.recommended`, que aponta para o texto em cada idioma. |
| **ember-intl** | Biblioteca de internacionalização do Ember usada pelo Console. |
| **ICU** | Formato das mensagens com placeholders e plural (`{count, plural, one {...} other {...}}`). |
| **Engine / extensão** | Módulo do Console (Fleet-Ops, Storefront...) carregado como Ember Engine. |
| **`setupExtension`** | Função em `addon/extension.js` onde a extensão registra menus, atalhos e widgets. |
| **universe / menu-service** | Serviços do ember-core que guardam os menus, painéis e widgets registrados. |
| **Submódulo** | Repositório Git dentro de outro. O principal guarda só o commit para o qual ele aponta. |
| **Fork / upstream** | Fork é a nossa cópia (`flpccabral/*`); upstream é o original (`fleetbase/*`). |
| **Fallback locale** | Idioma usado quando a chave não existe no idioma escolhido (`en-US`). |
| **Missing translation** | O que aparece quando a chave não existe nem no idioma escolhido nem no reserva. |

---

Boa sorte. Este projeto é grande, mas o padrão se repete: ache o texto, troque pela chave, traduza,
valide, revise o diff, publique na ordem certa. Na dúvida, prefira a mudança menor e mais
explícita, e anote aqui o que aprender.
