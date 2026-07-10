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
- PASS: harness Karma/ChromeHeadless isolado, `2/2 SUCCESS`, com entrypoint temporário removido após a execução.
- PASS: `npm run build -- --configuration production`, exit 0, 52,9s.
- PASS: `git diff --check`.
- PASS: auditoria automática de capacidades e arquivos globais.
- BLOCKED: `npx ng test --watch=false --browsers=ChromeHeadless`, exit 1 antes dos specs por `Cannot find module 'karma-coverage-istanbul-reporter'`; a dependência não está instalada e não foi adicionada.
- NOT RUN: `ultracite`, indisponível em `node_modules/.bin`.

## Preocupações

- A suite Karma completa continua dependente de outras falhas legadas já existentes (`rxjs-compat` e specs de analytics) quando o módulo de coverage é contornado.
- Não foi iniciado servidor local: `localhost:3000` pertence a outro workspace; a validação visual usou o Dashboard como referência de código e o harness browser-safe focal.
