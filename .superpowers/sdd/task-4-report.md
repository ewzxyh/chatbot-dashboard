# Task 4: Operacao paginada

## Entrega

- Operacao agora usa as abas Canais e Alertas com filtros server-side, `count`, `page`, `limit`, paginacao, loading, erro, retry e empty.
- Query params sao validados por aba e sincronizados via Router sem reload. Status incompativel, filtros desconhecidos e `resourceType` ausente/invalido sao ignorados.
- Links de servicos e filas agora levam `resourceType=service|queue`. O componente converte `resource` para `service` ou `queue` somente na requisicao de alertas.
- A tabela foi mantida densa e responsiva, com overflow horizontal em telas estreitas e sem cards aninhados.

## Validacao

- PASS: `npx ngc -p src/tsconfig.app.json`
- PASS: compilacao TypeScript focada dos specs de Operacao, Dashboard e AdminService com `--skipLibCheck`.
- PASS: harness isolado dos fluxos de carga, paginacao, deep-link, troca de aba, erro, retry e empty.
- PASS: `npx ng build --configuration production` em 89s.
- PASS: `git diff --check`.
- BLOCKED: Karma nao inicia porque `karma-coverage-istanbul-reporter` esta ausente em `node_modules`/dependencias locais.
- BLOCKED: `npx ultracite check` porque o repositorio nao possui configuracao Biome/ESLint/Prettier.

## Preocupacao

O dashboard envia `queue` para o endpoint de alertas conforme o contrato pedido. O branch atual do servidor ainda valida e consulta `service`, mas nao inclui `queue` na allowlist/query; o deploy do backend precisa aceitar esse filtro antes de usar deep-links de filas.
