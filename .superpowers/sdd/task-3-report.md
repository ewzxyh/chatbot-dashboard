# Task 3 report

## Implementacao

- `AdminService` agora expoe `getOperationalHealthSummary()`, `getOperationalChannels(filters)` e `getOperationalAlerts(filters)` com contratos tipados e filtros paginados.
- O Dashboard chama somente `GET /sadmin/health/summary` para o snapshot operacional.
- A UI mostra `fresh`, `stale` e `missing`, erro com retry, status geral, CaseZap/WABA por status, top causes limitadas a cinco, servicos/filas limitados a 50 e alertas agregados.
- Os links para Operacao preservam `product`, `channel`, `status` e `cause` quando informados.
- Nenhuma outra tab foi alterada. O teste forcado e qualquer probe continuam fora do Dashboard.

## Validacao

- PASS: `npx ngc -p src/tsconfig.app.json`.
- PASS: Jasmine focal alternativo com o runner instalado e stub minimo de Angular DI: `6 specs, 0 failures`.
- PASS: `git diff --check`.
- BLOQUEADO: `npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/admin-panel/admin-dashboard/admin-dashboard.component.spec.ts --progress=false` falha antes do bundle porque `karma.conf.js` exige `karma-coverage-istanbul-reporter`, ausente em `node_modules` e no lockfile.
- BLOQUEADO: tentativas de Karma isolado com ChromeHeadless conectaram o navegador, mas ele desconectou apos o timeout sem executar specs. Nao ha processo Karma/ChromeHeadless nem listener em `9876`/`9877` ao finalizar.

O `--no-progress` nao existe na versao Jasmine 2.8 instalada; foi usado `--no-color`/`--stop-on-failure=true` com timeout de 120s no runner alternativo.

## Correcao de contratos e links

- Links de canais agora incluem `tab=channels`.
- Links de alertas incluem `tab=alerts` e convertem saude ativa para `status=open`; `ok` usa `status=resolved`. Nenhum link de alerta envia `ok`, `degraded`, `down` ou `unknown` como status do endpoint.
- `ChannelDiagnostic`, `OperationalAlert` e `PagedResponse` refletem somente os campos allowlisted por `persistedChannelRecord()` e `alertResponse()` no server.
- Filtros foram separados: canais aceitam status de saude; alertas aceitam `open|resolved`, `info|warning|critical` e os demais filtros allowlisted atuais.
- O SCSS e o layout nao foram alterados nesta correcao.

### TDD e validacao da correcao

- RED: runner focal executou 10 specs com 3 falhas esperadas: `severity` nao era enviado e `buildAlertOperationLink()` nao existia.
- RED: typecheck focal acusou os DTOs inexatos e unions/filtros ausentes.
- PASS: typecheck focal dos dois specs.
- PASS: runner Jasmine alternativo: `10 specs, 0 failures`.
- PASS: `npx ngc -p src/tsconfig.app.json`.
- BLOQUEADO: o TestBed/Karma focal continua falhando antes do bundle por `karma-coverage-istanbul-reporter` ausente. Nenhum teste de template foi declarado como aprovado.

## Correcao final de navegacao

- Todos os deep-links usam `Router.createUrlTree(['/admin/operation'], { queryParams })` e `routerLink`, compativeis com o `HashLocationStrategy` do app.
- O Dashboard nao usa mais `href` nem `../operation`; a navegacao preserva `tab`, `product`, `channel`, `status` e `cause` sem recarregar a pagina.
- O SCSS permaneceu inalterado.

### TDD e validacao final

- RED: typecheck focal falhou porque `ADMIN_OPERATION_ROUTE` e a injecao de `Router` ainda nao existiam.
- RED: runner alternativo executou 11 specs com 1 falha esperada para o destino absoluto ausente.
- PASS: runner Jasmine alternativo: `11 specs, 0 failures`.
- PASS: typecheck focal dos dois specs.
- PASS: `npx ngc -p src/tsconfig.app.json`.
- PASS: busca estatica em producao sem `../operation`, `[href]` ou `href=`.
- PASS: `git diff --check`.
- BLOQUEADO: Karma/TestBed oficial permanece sem execucao pelo reporter ausente documentado acima.
