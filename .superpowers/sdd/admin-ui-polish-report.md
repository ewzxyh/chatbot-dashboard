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
