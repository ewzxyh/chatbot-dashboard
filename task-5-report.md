# Task 5 report

Base: `master` em `a9fc2016f1be321dd0ea3c0bae156a1b5db9d525`.

## Entrega

- Shell admin com exatamente sete links: Dashboard, Projetos, Usuários, Pagamentos, Operação, Auditoria e Privacidade.
- `activeTab` tipado, `aria-current`, `RouterLinkActive`, foco visível e navegação Material com roving focus/scroll horizontal.
- Cabeçalhos compactos e ações de atualização; filtros, tabelas, paginação, estados de loading/error/retry/empty preservados.
- Cobrança automática/Tarefa em Projects ganhou hierarquia visual discreta sem remover Simular/Executar/Atualizar.
- Impersonação de projeto/usuário, plano, teste, cotas, uso, cobrança, pagamentos, auditoria e privacidade mantêm os mesmos serviços e contratos.
- Nenhuma dependência nova, endpoint renomeado ou alteração em sidebar/header global, auth, routing ou `/home`.

## Revisão Pre/Post

| Capacidade | Baseline | Post | Resultado |
| --- | --- | --- | --- |
| Sete rotas admin | Presente | Presente + metadata/estado ativo | Mantida |
| Impersonação | `AuthService.impersonate` em Projects/Users | Chamadas e guardas mantidos | Mantida |
| Projetos | filtros, paginação, plano/teste/cotas/uso/cobrança | mesmos fluxos + retry/erro | Mantida |
| Usuários | busca, paginação e impersonação | mesmos fluxos + retry/erro | Mantida |
| Pagamentos | filtro, paginação e estados | mesmos fluxos + retry/erro | Mantida |
| Auditoria | summary, filtros, tabela, detalhe e paginação | mesmos controles + loading/retry de summary | Mantida |
| Privacidade | configuração, retenção, exportação e anonimização | mesmos controles + loading/retry/empty | Mantida |
| Shell global | sidebar, navbar e `/home` | sem diff nesses arquivos | Mantida |

## Verificação

- PASS: `npx ngc -p src/tsconfig.app.json`.
- PASS: harness Karma/ChromeHeadless focal, `13/13 SUCCESS`, cobrindo query params, `aria-current`, foco/teclado, concorrência, teardown e estados de erro.
- PASS: `npm run build -- --configuration production`, exit 0, 57,9s.
- PASS: `git diff --check`.
- PASS: auditoria automática de capacidades e arquivos globais.
- PASS: `karma.conf.js` carrega o reporter de coverage somente quando `codeCoverage` está habilitado; coverage não foi ocultado e nenhuma dependência foi adicionada.
- BLOCKED: `npx ng test --watch=false --browsers=ChromeHeadless`, exit 1 no bundle da suite legada por imports ausentes de `analytics-service`, `@angular/http/testing` e `rxjs-compat`, antes dos specs globais.
- NOT RUN: `ultracite`, indisponível em `node_modules/.bin`.

## Preocupações

- A suite Karma completa continua dependente dos módulos legados ausentes; o harness focal da Task 5 passa de forma independente.
- Não foi iniciado servidor local nem feita validação visual; a instrução do projeto exige usar o servidor já existente em `localhost:3000`.
