# Audit dashboard avatar/brand fixes

- [x] Auditar diffs pendentes de avatar/branding.
- [x] Corrigir caminhos de asset quebrados.
- [x] Rodar build/check.
- [x] Validar DEV publico.
- [x] Commit e push dos repos afetados.

## Review

- `dashboard-config.json` publico voltou a ser gerado com valores reais na VPS DEV.
- O alerta global de brand com HTTP 200 vinha de placeholders `${...}` servidos no config.
- Os assets locais novos de avatar existem; a URL externa quebrada do widget callout foi revertida para o asset existente.

# Dashboard impersonation

- [x] Mapear sessao, storage, rotas e telas administrativas existentes.
- [x] Centralizar impersonacao e restauracao no `AuthService`.
- [x] Adicionar acoes com confirmacao e estado de carregamento em usuarios e projetos.
- [x] Adicionar banner global persistente para retorno ao admin.
- [x] Validar testes aplicaveis, build e diff.

## Review

- Build Angular concluido com sucesso usando `--optimization=false`.
- Troca e restauracao atualizam storage/rota e recarregam a pagina para encerrar sockets e caches autenticados.
- Teste Karma focado bloqueado por dependencias e specs legados quebrados no setup existente; nenhum arquivo temporario foi mantido.
- Inspecao visual nao executada porque `localhost:3000` pertence a outro workspace e nenhum servidor novo foi iniciado.

# Dashboard impersonation audit fixes

- [x] Alinhar o contrato da resposta e remover efeitos no runtime anterior ao reload.
- [x] Sincronizar Firebase antes de trocar ou restaurar o storage REST.
- [x] Aplicar expiracao automatica e sincronizacao entre abas via `localStorage`.
- [x] Restaurar o historico deste arquivo e acrescentar o plano atual.
- [x] Executar build final e revisar o diff.

## Review

- Contrato alinhado sem campo `impersonation`; `expiresIn` gera `expiresAt` obrigatorio.
- Firebase troca primeiro e o storage REST so muda apos `signInWithCustomToken` concluir.
- Backup compartilhado em `localStorage` coordena reload, rota e bloqueio de sessao aninhada entre abas.
- Timer restaura automaticamente no vencimento e falhas de restauracao permanecem visiveis no banner.
- Build Angular e `git diff --check` concluidos; artefato temporario removido.

# Dashboard impersonation cross-tab lock

- [x] Transformar o backup compartilhado em estado `starting`/`active` com nonce.
- [x] Validar ownership antes do POST, ao redor do Firebase e antes do storage REST.
- [x] Restaurar `starting` interrompido e aplicar `failClosed` antes de publicar backup invalido.
- [x] Recarregar outras abas apenas para sinal/remocao `active`.
- [x] Executar build final e revisar o diff.

## Review

- Backup `starting` e adquirido por nonce antes do POST e validado por leitura imediata.
- Ownership e verificado antes/depois do Firebase e novamente antes do storage REST.
- Backup `active` e o ultimo sinal da troca e inclui usuario/token efetivos e expiracao.
- Bootstrap restaura `starting`, valida profundamente `active` e usa `failClosed` antes de publicar estado invalido.
- Build Angular e `git diff --check` concluidos; artefato temporario removido.

# Task 4: Operacao paginada

# Admin UI polish

- [x] Escrever specs RED para status, shell nativo, largura da auditoria e dialogs/inputs.
- [x] Implementar ajustes visuais sem alterar fluxos administrativos.
- [x] Validar specs compiláveis, typecheck admin, ngc, build production e diff.
- [x] Escrever relatorio, revisar contra o base e criar o commit solicitado.

## Review

- Status labels usam o contrato `ok/degraded/down/unknown`; `degraded` permanece em tom de atenção.
- Shell usa sete links nativos com overflow horizontal, `aria-current` e match exato ignorando query params.
- Audit ocupa toda a largura útil; a tabela mantém overflow interno no mobile e o detalhe fica abaixo sem coluna ociosa.
- Overlays de Projects usam `admin-dialog-panel`, controles de 15px/40px e wrappers horizontais para tabelas.
- Dropdowns admin usam `admin-select-panel` azul; cores customizáveis do widget/produto não foram alteradas.
- Karma/ChromeHeadless não inicializou os specs neste ambiente; `tsc` admin, `ngc`, build production e `git diff --check` passaram.

- [x] Escrever spec focal para filtros, paginacao, estados e deep-link.
- [x] Implementar abas Canais e Alertas com URL sincronizada.
- [x] Validar com `ngc`, specs focais alternativas e build.
- [x] Fazer auto-revisao, escrever `task-4-report.md` e criar commit.

## Review

- Karma e Ultracite permaneceram bloqueados pelo setup local; os checks focais, `ngc`, build e diff passaram.
- O backend passou a aceitar `queue` no commit `be85d5fd`.

# Task 4: Correcoes da auditoria frontend

- [x] Cancelar callbacks stale e fazer teardown no destroy.
- [x] Carregar summary com estados missing/stale e retry de erro.
- [x] Sanitizar filtros por aba e canonicalizar a URL.
- [x] Remover links de alerta para recursos saudaveis.
- [x] Remover imports Node do spec do Dashboard.
- [x] Validar specs focais, `ngc`, build e diff.

## Review

- RED confirmou a race com Subjects fora de ordem; GREEN passou no harness isolado.
- Backend `be85d5fd` confirmado para `queue` e fim de dia inclusivo.
- Karma permanece bloqueado somente pela dependencia local ausente.

# Task 4: Restauracao dos fluxos operacionais legados

- [x] Inventariar chamadas publicas da tela em `122039881` e comparar com a versao atual.
- [x] Escrever specs RED para as oito capacidades removidas e cancelamento entre abas.
- [x] Integrar Diagnostico/Infraestrutura e Eventos/Metricas sem alterar Canais/Alertas.
- [x] Validar specs focais, `ngc`, build e diff.
- [x] Atualizar o relatorio e criar o commit corretivo separado.

## Review

- Os seis metodos legados continuam usados, com `getOperationalHealthSummary` substituindo apenas a chamada direta ao mesmo summary.
- Canais e Alertas mantem os fixes aprovados; abas legadas canonicalizam para `tab` sem vazar filtros.
- Karma focal ficou bloqueado no builder, mas `ngc`, specs compilados, harness isolado e build production passaram.

# Task 4: Concorrencia das acoes por integracao

- [x] Escrever RED com canais A+B, duplicata, sucesso seletivo, erro e teardown.
- [x] Substituir estados escalares por Sets e helpers usados no template.
- [x] Remover utilitario sem consumidor e metrica nao exibida.
- [x] Rodar `ngc`, harness funcional/concorrente, build e diff com timeout.
- [x] Atualizar report e criar commit separado.

## Review

- Cada integracao bloqueia apenas sua propria acao; testes e webhooks distintos podem rodar em paralelo.
- Duplicata da mesma chave nao cria request e cada callback remove somente sua chave.
- `ngc`, harness e build retornaram dentro dos timeouts definidos; nenhum runner ficou ativo.

# Task 5: shell e estados das tabs admin

- [x] Escrever spec RED focal para os sete links, estado ativo, teclado e retorno ao Dashboard.
- [x] Confirmar a falha do spec antes da implementacao.
- [x] Implementar shell responsivo e estados loading/error/retry/empty sem alterar rotas, servicos ou acoes.
- [x] Validar ngc, specs focais/harness browser-safe, build production e diff pre/post.
- [x] Escrever `task-5-report.md` e criar o commit solicitado.

## Review

- Shell com sete links, estado ativo, foco/teclado e scroll horizontal; sidebar, header global e /home permanecem fora do diff.
- Projects/Users/Payments ganharam retry e erro explicito; Audit/Privacy ganharam loading/retry/empty sem remover acoes existentes.
- `ngc`, harness focal ChromeHeadless, build production e diff check passaram; suite Karma completa permanece bloqueada por dependencia legada ausente.

# Task 5: correções da auditoria

- [x] Escrever RED para nav ativo com query params e foco/teclado real.
- [x] Escrever RED para concorrência, ordem, teardown e detalhe acessível do Audit.
- [x] Escrever RED para estados de erro inicial sem tabela/paginador/empty.
- [x] Implementar correções mínimas e preservar capacidades existentes.
- [x] Rodar harness ChromeHeadless, `ngc`, build production, diff e revisão pre/post.
- [x] Atualizar `task-5-report.md` e criar commit corretivo separado.

## Review

- `RouterLinkActive` ignora query params sem perder o match exato de rota; `aria-current` e roving focus foram validados no ChromeHeadless.
- Auditoria cancela requests anteriores, rejeita callbacks stale, bloqueia refresh concorrente e encerra subscriptions no destroy.
- Erro inicial não exibe tabela, paginação ou empty state; dados anteriores permanecem visíveis apenas como estado stale durante falha de refresh.
- TS de Projects/Users/Payments e chamadas de impersonação/ações administrativas permaneceram inalterados.
- Harness focal `13/13`, `ngc` e build passaram; suite completa segue bloqueada por imports legados ausentes.

# Correcao: registro de webhooks por produto

- [x] Enviar WABA/CaseZap a partir de `channel.product`, normalizado e allowlisted.
- [x] Ocultar o botão e bloquear a ação para produtos não suportados.
- [x] Validar tsc admin, `ngc`, build production e diff.

## Review

- Diagnóstico WABA com `channel: webhook` envia request backend com `channel: waba`; CaseZap envia `channel: casezap`.
- `tsc` app/admin e `tsc` de specs administrativos passaram; `ngc` e build production passaram.
- Karma permanece conhecido como bloqueado antes das assertions pelos imports legados ausentes (`rxjs-compat`, Analytics e `@angular/http/testing`); não houve tentativa de corrigir essa infraestrutura.
