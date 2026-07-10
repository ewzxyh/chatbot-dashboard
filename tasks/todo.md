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
