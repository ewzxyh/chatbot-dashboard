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

## Verificacao

- PASS: `npx ngc -p src/tsconfig.app.json`, exit 0.
- PASS: `npm run build -- --configuration production`, exit 0.
- PASS: `git diff --check`.
- BLOCKED: `npx ng test --watch=false --browsers=ChromeHeadless --main=src/test-admin.ts --ts-config=src/tsconfig.spec-admin.json`, primeiras duas tentativas terminaram com exit 1 apos `ChromeHeadless` desconectar por `no message in 30000 ms`, com zero specs reportadas.
- BLOCKED: o mesmo comando com `browserNoActivityTimeout: 180000` ficou sem reportar specs ate o timeout externo de 180s e terminou com exit 124; nenhum spec foi executado.
- PASS: `karma.conf.js` nao contem configuracao nem reporter de coverage; nenhum coverage foi executado ou alegado e nenhuma dependencia foi adicionada.
- NOT RUN: `ultracite`, indisponivel em `node_modules/.bin`.

## Preocupacoes

- Os asserts de Space e `.audit-detail` permanecem em `admin-audit-template.component.spec.ts`, mas o runner ChromeHeadless nao chegou a executar specs neste ambiente.
- Nao foi iniciado servidor local nem feita validacao visual; a instrucao do projeto exige usar o servidor ja existente em `localhost:3000`.
