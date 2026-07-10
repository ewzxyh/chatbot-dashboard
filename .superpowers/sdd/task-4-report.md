# Task 4: Operacao administrativa

## Entrega atual

- Canais e Alertas continuam paginados no servidor, com filtros, count/page/limit, loading, erro, retry e empty.
- Requests de detalhe, summary, eventos e metricas cancelam a inscricao anterior, validam request id e fazem teardown no destroy.
- Summary continua read-only, com contexto distinto para `missing`, aviso para `stale` e retry de erro.
- Query params permanecem canonicalizados via Router `replaceUrl`; abas legadas removem paginacao, filtros e deep-links incompativeis.
- `tab`, `resource` e `resourceType` continuam internos. Somente Alertas traduz resource para `service` ou `queue`.
- Recursos `ok` sem causa no Dashboard continuam sem deep-link.
- A aba Canais recupera teste de conexao, registro de webhook e acesso aos erros do canal.
- Diagnostico / Infraestrutura usa o summary V2 para servicos e filas e oferece testes explicitos de storage e notificacao.
- Eventos / Metricas recupera filtros, loading, erro, retry, empty, agregados e tabelas historicas.
- `admin-operational-status.util.ts` voltou a ser consumido. Filas V2 sem contadores usam status/cause para nao tratar campo ausente como zero.
- `changeLimit()` foi removido; o `mat-paginator` continua enviando page e pageSize por `changePage()`.

## Oito capacidades restauradas

1. Teste de storage.
2. Teste de conexao do canal.
3. Teste de notificacao operacional.
4. Registro de webhook do canal.
5. Filtro e acesso aos erros do canal.
6. Filas e diagnosticos de infraestrutura.
7. Eventos operacionais.
8. Metricas operacionais.

## Inventario antigo versus atual

Fonte antiga: `git show 122039881:src/app/admin-panel/admin-operation/admin-operation.component.ts`.

| Capacidade | Metodo antigo | Consumo atual |
| --- | --- | --- |
| Summary/diagnosticos/filas | `getHealthSummary` | `getOperationalHealthSummary` (delega ao mesmo metodo) |
| Canais paginados | ausente | `getOperationalChannels` |
| Alertas paginados | ausente | `getOperationalAlerts` |
| Teste de storage | `testStorageConnection` | restaurado |
| Teste de canal | `testChannelConnection` | restaurado |
| Teste de notificacao | `testOperationalAlertNotification` | restaurado |
| Registro de webhook | `registerChannelWebhook` | restaurado |
| Erros de canal/eventos | `getOperationalEvents` | restaurado |
| Metricas | `getOperationalMetrics` | restaurado |

Nenhum metodo publico consumido pela tela antiga ficou sem fluxo funcional; os dois metodos paginados novos permanecem ativos.

## Contrato backend preservado

- O backend aprovado `be85d5fd` aceita `queue` e fim de dia inclusivo.
- Requests paginados continuam allowlisted e nunca recebem filtros das abas legadas.
- A troca para Diagnostico ou Eventos cancela o request paginado em andamento antes de iniciar qualquer carga legada.

## TDD

- RED: o spec focal falhou por ausencia das quatro abas, oito capacidades, estados de eventos/metricas e retries.
- RED adicional: o utilitario legado marcou fila V2 `ok` sem `consumers` como problema.
- GREEN: specs focais compilam e harness isolado passou para cancelamento, chamadas antigas, filtros, erros/retries, canonicalizacao e filas V2.
- RED final: o spec de concorrencia falhou porque `isTestingChannel` e `isRegisteringWebhook` nao existiam e os estados eram escalares.
- GREEN final: Sets por chave permitem A+B, bloqueiam duplicata da mesma integracao e removem somente a chave concluida; teardown nao limpa pending artificialmente.

## Validacao final de concorrencia

- PASS: `npx ngc -p src/tsconfig.app.json` retornou exit 0 em 23s, dentro do timeout de 120s.
- PASS: harness de concorrencia e oito fluxos retornou exit 0 em 1,5s, dentro do timeout de 60s.
- PASS: `npx ng build --configuration production` retornou exit 0 em 44,7s, hash `ea05e8d5741455b8`, dentro do timeout de 180s.
- PASS: compilacao TypeScript focal do spec de Operacao retornou exit 0.
- PASS: `git diff --check` retornou exit 0.
- `isOperationalErrorStatus` e sua allowlist foram removidos por nao terem consumidor.
- `warnings` deixou de ser calculado porque nao existe coluna ou indicador correspondente no template.

## Validacao

- PASS: `npx ngc -p src/tsconfig.app.json`.
- PASS: compilacao TypeScript focada dos specs de Operacao, Dashboard e AdminService.
- PASS: harness isolado da restauracao dos fluxos e adaptador de filas V2.
- PASS: `npx ng build --configuration production` em 54s, hash `23e3e6e621fd99c2`.
- PASS: `git diff --check`.
- BLOCKED: Karma oficial ainda requer `karma-coverage-istanbul-reporter`, ausente no setup local.
- BLOCKED: configuracao Karma focal sem cobertura compilou o bundle, mas nao publicou `main.js` ao ChromeHeadless em 180s; executou 0 casos.

## Preocupacoes

- A suite browser permanece indisponivel pelo setup Karma; a cobertura executavel ficou no harness isolado e na compilacao focal.
- O build mantem warnings preexistentes de dois seletores CSS e da dependencia CommonJS `chart.js`.
