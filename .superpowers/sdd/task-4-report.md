# Task 4: Operacao paginada

## Entrega

- Operacao usa abas Canais e Alertas com filtros server-side, `count`, `page`, `limit`, loading, erro, retry e empty.
- Requests de detalhe e summary cancelam a inscricao anterior e validam um request id; callbacks stale nao alteram estado.
- `ngOnDestroy` encerra query params, detalhe e summary.
- `getOperationalHealthSummary` adiciona contexto `missing`/`stale` sem executar probes. Erro de summary tem retry independente.
- A mesma sanitizacao allowlisted e aplicada na query inicial, troca de aba e request HTTP.
- Query params ignorados ou invalidos sao substituidos pela forma canonica via Router com `replaceUrl`, sem reload ou loop.
- `tab`, `resource` e `resourceType` permanecem internos. Somente alertas recebem `service` ou `queue` derivados.
- Recursos `ok` sem causa no Dashboard aparecem como status sem link; recursos acionaveis mantem deep-link para alertas abertos.
- O spec do Dashboard nao importa mais `fs` ou `path`.

## Contrato backend

- O commit aprovado `be85d5fd` esta no HEAD local do servidor.
- `queue` e allowlisted e consulta `OperationalAlert.queue` antes da paginacao.
- `to=YYYY-MM-DD` e inclusivo ate `23:59:59.999Z`; a validacao frontend usa a mesma semantica para ranges.

## TDD

- RED: Subjects fora de ordem mostraram a resposta anterior restaurando `page=1`; os specs tambem falharam pelas APIs ausentes de summary, teardown, canonicalizacao e recursos acionaveis.
- GREEN: harness isolado passou para race, canonicalizacao, missing, teardown e link saudavel; os tres specs focais compilam.

## Validacao

- PASS: `npx ngc -p src/tsconfig.app.json`.
- PASS: compilacao TypeScript focada dos specs de Operacao, Dashboard e AdminService com `--skipLibCheck`.
- PASS: harness isolado da auditoria Task 4.
- PASS: `npx ng build --configuration production` em 69s.
- PASS: `git diff --check`.
- BLOCKED: Karma nao inicia porque `karma-coverage-istanbul-reporter` continua ausente no setup local.

## Preocupacoes

- O build mantem warnings preexistentes de seletores CSS e CommonJS de `chart.js`, sem falha.
- A suite Karma segue indisponivel ate a dependencia legada ser restaurada ou a configuracao ser corrigida.
