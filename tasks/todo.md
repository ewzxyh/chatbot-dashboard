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

# Home orientada a ativacao e receita

- [x] Corrigir lifecycle da Home, skeleton infinito e separar erro de estado vazio.
- [x] Corrigir estados de canal, permissao, destino da acao e proxima etapa executavel.
- [x] Orientar a ativacao para uma conversa de teste com copy para publico leigo.
- [x] Colocar ativacao antes das cotas e remover representacoes redundantes de progresso.
- [x] Exibir expansao somente no contexto de uso, instrumentar o funil minimo e corrigir acessibilidade.
- [x] Validar desktop/mobile, auditar o diff, commitar, enviar e aplicar na VPS DEV.

## Criterios de aceite

- Sessao nova nao permanece presa no skeleton quando uma dependencia falha.
- Erro, vazio, sem permissao, configuracao pendente e pronto sao estados distintos.
- O CTA abre o canal detectado e conduz ate uma conversa real registrada.
- Projetos nao ativados veem uma unica proxima acao antes das cotas.
- Projetos ativados veem um resumo compacto; upgrade aparece apenas com uso relevante e permissao.
- A tela funciona sem overflow em 320px e possui controles acessiveis por teclado.

## Review

- Auditoria Luna bloqueou permissionamento assincrono, status CaseZap aninhado, analytics e cor de atencao; todos foram corrigidos e a reauditoria aprovou.
- `tsc` focal, `ngc`, `git diff --check` e build production passaram; o Karma legado continua bloqueado antes das assertions por imports ausentes ja conhecidos.
- Sessao limpa na VPS DEV exibiu a ativacao antes das cotas, sem skeleton e sem erro de console; o CTA abriu CaseZap e nao houve overflow em 1440px, 390px ou 320px.
- O `AuthGuard` agora publica o projeto antes de aquecer caches e ignora callbacks obsoletos apos troca rapida de projeto.

# Bots orientados a primeira resposta

- [x] Canonicalizar rotas, corrigir CTA da Home e alinhar o estado de prontidao.
- [x] Tornar o shell lateral semantico, navegavel por teclado e responsivo.
- [x] Redesenhar a lista com proxima acao, erro/retry e empty state leigo.
- [x] Redesenhar modelos e detalhes com CTA sempre visivel e recuperacao de erro.
- [x] Simplificar criacao, edicao e modais sem esconder capacidades avancadas.
- [x] Auditar integrado, validar 320/390/1440, commitar, enviar e aplicar na VPS DEV.

## Criterios de aceite

- `/bots` e aliases chegam a uma rota canonica funcional.
- Lista, modelos e editor distinguem loading, erro, vazio, sem permissao e conteudo.
- A acao principal permanece visivel em touch, teclado e desktop.
- A jornada usa linguagem leiga e conduz a criar, testar e acompanhar uma resposta automatica.
- Nenhuma pagina `/bots/` cria overflow horizontal em 320px, 390px ou 1440px.
- Modais e acoes destrutivas possuem controles nativos, labels e foco visivel.

## Review

- Auditorias funcionais e de UI bloquearam corrida na importacao, foco de dialogs, contraste e semantica dos dropdowns; a reauditoria aprovou todas as correcoes.
- A validacao live encontrou e corrigiu uma rota guard-only invalida, a inicializacao nao deterministica de `FAQKB_URL` e a ordenacao de bots legados sem nome.
- O fluxo normal de login e selecao de projeto exibiu 1 bot e 6 modelos, abriu o detalhe acessivel e canonicalizou `/bots` sem erros de console ou rede.
- `ngc`, `tsc` focal, `git diff --check` e build production passaram; 1440px, 390px e 320px ficaram sem overflow horizontal.
- O dashboard foi publicado na VPS DEV e o container `chatcase-dashboard` permaneceu ativo apos o rebuild.

# Correcao: identidade visual e largura de Bots

- [x] Comparar `/home`, `/bots` e `/bots/templates` em 1440px, 390px e 320px.
- [x] Remover a segunda coluna fixa das paginas modernizadas e preservar Webhooks legados.
- [x] Aplicar largura integral, bordas retas e navegacao horizontal responsiva.
- [x] Corrigir o icone de verificacao que renderizava texto sobre o card.
- [x] Validar o bundle na VPS DEV, auditar screenshots e confirmar ausencia de overflow.

## Criterios de aceite

- Lista e modelos usam toda a largura disponivel depois do sidebar global.
- Navegacao interna permanece acessivel por scroll horizontal em telas estreitas.
- Cards e faixas seguem a identidade plana da Home, sem sombras ou cantos decorativos.
- Textos, icones e acoes nao se sobrepoem em 1440px, 390px ou 320px.

## Review

- A navegacao secundaria virou uma faixa horizontal apenas na lista e nos modelos; Webhooks legados continuam com o shell anterior.
- Lista e modelos usam toda a largura util, com faixas e cards retos, sem sombras decorativas.
- O primeiro teste live revelou o card mobile em linha; a causa foi corrigida restaurando `flex-direction: column` no breakpoint de 900px.
- A VPS DEV ficou sem overflow em 1440px, 390px e 320px nas duas rotas, sem erros de console, rede ou HTTP.
- O card de modelo em 320px manteve selo, canais, tags e CTA sem sobreposicao.

# Correcao: Webhooks no shell de Fluxos

- [x] Remover o titulo absoluto e a sidebar vertical da rota `/flows/flow-webhooks`.
- [x] Reutilizar a navegacao horizontal e a largura integral das outras paginas de Fluxos.
- [x] Transformar o vazio em uma proxima acao clara para criar uma automacao.
- [x] Preservar copiar, abrir, ativar/desativar e excluir webhooks em controles proprios.
- [x] Validar 1440px, 390px e 320px na VPS DEV e confirmar ausencia de erros e overflow.

## Review

- A rota agora usa o mesmo titulo local, navegacao horizontal e largura integral das outras paginas de Fluxos.
- O estado vazio conduz diretamente a `/flows/flow-automations`; o destino foi validado no navegador.
- 1440px, 390px e 320px ficaram sem overflow, erros de console, falhas de rede ou respostas HTTP com erro.
- O clique implicito do card de bot foi removido; a acao Editar continua sendo o controle explicito e acessivel.

# Identidade de Fluxos e Knowledge Bases

- [x] Adicionar eyebrow, titulo e descricao nas paginas de Fluxos.
- [x] Igualar a altura das acoes de criacao e usar o icone ChatCase do sidebar nos modelos.
- [x] Diferenciar WhatsApp aberto de Meta WABA na selecao de canal.
- [x] Modernizar Knowledge Bases com estados explicitos, layout responsivo e controles acessiveis.
- [x] Corrigir deep links, semantica de cards/linhas, overflow de tags e retry de Webhooks.
- [x] Reduzir overrides, restaurar testes Angular e obter aprovacao da auditoria Luna.
- [x] Validar as rotas na VPS DEV em desktop e mobile.
- [x] Commitar, enviar e aplicar na VPS DEV.

## Criterios de aceite

- Fluxos e Knowledge Bases seguem a largura integral, bordas retas e hierarquia visual da Home.
- Loading, erro, vazio e conteudo nao se sobrepoem.
- Navegacao de Knowledge Bases preserva tab e subtab ao trocar de base.
- Nenhuma rota cria overflow horizontal em 1440px, 390px ou 320px.
- Build, diff check, auditoria, commit, push e deploy DEV concluidos.

## Review

- A auditoria Luna bloqueou encoding, erro de Webhooks, deep links, semantica interativa, overflow e testes; os achados foram corrigidos e a decisao final foi APROVAR.
- Os overrides responsivos novos foram reduzidos em cerca de 42% antes da aprovacao.
- O build de producao e `git diff --check` passaram; Karma permanece bloqueado apenas por imports legados externos ao escopo.
- Na VPS DEV, Fluxos e Knowledge Bases ficaram sem overflow em 1700px, 390px e 320px; as duas acoes de criacao medem 40px.
- O icone dos modelos usa `chatcase-icon.svg`, e os filtros distinguem WhatsApp aberto de Meta WABA.
- A validacao live encontrou o binding orfao `@fadeInOut`; ele foi removido, republicado e o erro deixou de aparecer no bundle novo.

# Padronizacao do Monitoramento

- [x] Identificar a rota e preservar o fluxo de WebSocket, filtros e acoes.
- [x] Aplicar a hierarquia, largura e linguagem visual da Home.
- [x] Validar build, diff e responsividade em desktop e mobile.
- [x] Publicar na VPS DEV e validar a rota live.
- [x] Commitar e enviar o resultado.

## Criterios de aceite

- A rota `/wsrequests` usa toda a largura util e possui eyebrow, titulo e descricao.
- Resumo, filtros, equipe e estados mantem a funcionalidade sem sobreposicao.
- Nenhum elemento cria overflow horizontal em 1700px, 390px ou 320px.
- Build, commit, push e publicacao DEV concluidos.

## Review

- A pagina recebeu cabecalho traduzido, fundo operacional, largura integral e secoes planas alinhadas com Home e Knowledge Bases.
- As abas continuam horizontais e rolaveis no mobile; os controles de aba, busca e mapa agora sao botoes focaveis com rotulos acessiveis.
- A auditoria Luna apontou conflitos globais, i18n e risco de corte; os estilos foram restringidos e o texto longo de horario passou a quebrar dentro da largura disponivel.
- O build de producao e `git diff --check` passaram sem novos erros; permanecem apenas os warnings preexistentes do Angular.
- A VPS DEV foi validada em 1700px, 390px e 320px, sem overflow de documento ou erros novos de console.

# Correcao do fluxo de Monitoramento

- [x] Tornar as abas Todas e Suas conversas deterministicas.
- [x] Mostrar o nome junto ao avatar do agente.
- [x] Renomear a acao visual para Arquivar e confirmar o destino no Historico.
- [x] Validar build e comportamento live em desktop e mobile.
- [x] Publicar na VPS DEV, commit e push.

## Criterios de aceite

- Cada aba seleciona diretamente o conjunto correto e atualiza o estado ativo.
- O carrossel identifica o agente por avatar e nome sem sobreposicao.
- A acao usa Arquivar; a conversa arquivada permanece encontravel em Historico.
- Build, validacao live, commit, push e publicacao DEV concluidos.

## Review

- As abas agora enviam `false` e `true` diretamente; a camada visual legada que interceptava o clique foi removida.
- O clique live alternou `aria-current` e o estado azul nos dois sentidos.
- O nome carregado em `id_user` aparece junto ao avatar com truncamento seguro; em 320px nao houve overflow.
- O tooltip da acao usa a traducao existente `VisitorsPage.Archive`.
- O endpoint de arquivamento mantem o status `1000`, exibido por padrao em `/history`, onde a conversa pode ser reaberta enquanto a regra de retencao permitir.

# Correcao da pagina de Historico

- [x] Carregar conversas arquivadas ao abrir `/history`, sem exigir pesquisa manual.
- [x] Adicionar subtitulo, titulo e descricao seguindo a hierarquia visual do Monitoramento.
- [x] Validar build, comportamento live e responsividade.
- [x] Commitar, enviar e aplicar na VPS DEV.

## Criterios de aceite

- A rota sem query de pesquisa consulta por padrao o status fechado `1000`.
- Filtros existentes e deep links continuam executando uma unica pesquisa coerente.
- O cabecalho nao cria sobreposicao ou overflow em desktop e mobile.

## Revisao

- A inicializacao usa o mesmo fluxo de pesquisa manual, preservando o filtro fechado `1000` e os deep links existentes.
- Os filtros de departamento e agente sao inicializados antes da consulta automatica.
- O build de producao concluiu com sucesso; os avisos restantes sao preexistentes do Angular/CommonJS.
- O erro `500` antigo foi rastreado a `req.projectuser` ausente, mas as chamadas impersonificadas atuais retornam `200/304` e o servidor ja contem a hidratacao correspondente; nenhum patch adicional de backend foi necessario.
- O commit `81ae52c57` foi enviado ao `master` e aplicado na VPS DEV; o chunk live do historico responde `200` e contem o cabecalho e a consulta `initial-load`.
- O container `chatcase-dashboard` foi recriado com a nova imagem e permaneceu em execucao, sem novos erros de permissao ou respostas `500` nos logs do servidor apos o deploy.
