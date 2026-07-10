# Admin UI polish report

Base: `master` em `46404c35e79dcdc9e09a1b7ba1453fd0fe85d351`.
Backend semantico aprovado: `c4681bcf`.

## Entrega

- Audit passou a usar um wrapper de largura total, tabela com largura total e overflow horizontal interno no mobile; o detalhe deixou de ocupar uma coluna lateral ociosa.
- Dashboard mapeia `ok` para `Operacional`, `degraded` para `Operacional com atenção`, `down` para `Indisponível` e `unknown` para `Aguardando monitoramento`; `degraded` mantém a classe de atenção.
- Dialogs de Projects preservam os fluxos existentes e receberam overlay responsivo, títulos de 22px, controles de 15px, altura minima de 40px, classes de contrato e wrappers de tabela.
- Selects do escopo admin receberam `admin-select-panel` com estado ativo/selecionado azul; nenhuma cor customizável de widget/produto foi alterada.
- Inputs da Privacy receberam altura minima, padding e line-height coerentes.
- Shell admin usa sete links nativos, overflow horizontal com touch/swipe, foco nativo e `aria-current`; query params não alteram a tab ativa.
- Impersonação, sidebar, header global, `/home`, rotas, endpoints e ações existentes permaneceram fora da mudança semântica.

## Specs

Adicionados/ajustados specs browser-safe para labels de status, shell sem markup/setas Material, wrapper de Audit e classes do overlay/controls de Projects. Eles foram escritos antes da implementação. O runner focal não chegou a executar assertions neste ambiente: o bootstrap padrão reportou `0 specs` e erros de compilação legados; um bootstrap temporário isolado também perdeu a conexão ChromeHeadless após 30s sem mensagem. Os arquivos temporários foram removidos.

## Checks

- PASS: `npx tsc -p src/tsconfig.spec-admin.json --noEmit`.
- PASS: `npx ngc -p src/tsconfig.app.json`.
- PASS: `npm run build -- --configuration production`.
- PASS: `git diff --check`.
- BLOCKED: Karma/ChromeHeadless antes de executar specs, por bootstrap/legado do repositório.
- NOT RUN: inspeção visual autenticada; `localhost:3000` pertence ao processo Next de `C:\Users\enzo\lotohub.com.br`, não a este dashboard, e nenhum servidor novo foi iniciado.

## Observacoes

O build preserva warnings existentes de CommonJS (`chart.js`) e regras CSS legadas. Nenhuma dependência foi adicionada.

## Finalização do fix parcial

Base de trabalho: `6a2caf1a5`.

- Projects recebeu o wrapper específico `.admin-projects-table-wrap`, com largura contida, `min-width: 0` e `overflow-x: auto`, mantendo o scroll horizontal dentro da tabela no mobile.
- Projects agora cobre Plano, Teste, Cotas, Uso e Cobrança, incluindo larguras/max-width dos dialogs, controles, tabelas internas e ações de persistência/lifecycle.
- Audit verifica wrapper, `max-width`, `min-width`, `overflow-x` e `admin-select-panel`; Privacy verifica os quatro inputs alinhados por classe de contrato.
- O spec de Privacy foi incluído em `src/tsconfig.spec-admin.json`.

## Validação final

- PASS: `npx tsc -p src/tsconfig.spec-admin.json --noEmit`.
- PASS: `npx ngc -p src/tsconfig.app.json`.
- PASS: `npm run build -- --configuration production`.
- PASS: `git diff --check`.
- BLOCKED: `npx ng test --watch=false --browsers=ChromeHeadless` iniciou o Karma, mas executou `0 specs`; houve `404 /_karma_webpack_/main.js` e falhas de compilação em specs legados de Analytics/RxJS (`analytics.service`, `@angular/http/testing`, `rxjs-compat`). Nenhuma assertion do escopo admin foi executada.
- Nenhum servidor de desenvolvimento foi iniciado.

## Terceiro ciclo: contratos renderizados

Base de trabalho: `d78e52717`.

- O spec de Projects carrega o `AdminPanelComponent` real para aplicar o SCSS global e valida por `getComputedStyle` o `min-width`, a largura contida, `max-width: 100%` e `overflow-x: auto` do wrapper em um host de 360px.
- O mesmo spec confirma que a tabela excede a largura interna do wrapper sem ampliar o wrapper, abre um select admin e verifica as cores computadas do estado selecionado.
- O modal Uso agora clica em `Exportar CSV` e verifica `exportProjectUsageCsv` com o projeto esperado; `EMPTY` evita efeitos de download no teste.
- Privacy verifica `line-height`, margens e altura renderizada dos quatro inputs alinhados.

### Checks do terceiro ciclo

- PASS: `npx tsc -p src/tsconfig.spec-admin.json --noEmit`.
- PASS: `npx ngc -p src/tsconfig.app.json`.
- PASS: `git diff --check`.
- NOT RUN: Karma, conforme restrição deste ciclo; a infraestrutura legada permanece documentada como bloqueada.
- NOT RUN: build de produção, pois somente specs e este relatório foram alterados.
