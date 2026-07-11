## Lessons

- Nao trocar a iconografia global do produto sem uma decisao visual consolidada: se o resultado ficar inconsistente, o rollback deve varrer dashboard, chat e estudio, removendo servico runtime, assets e marcadores especificos sem mexer nas demais customizacoes ChatCase.
- Quando o pedido for para voltar uma mudanca por commit, primeiro usar o historico/diff dos commits como fonte de verdade; buscas por string servem apenas para validar sobra tecnica, nao para decidir o rollback.
- Se aparecer alerta de brand com HTTP 200, medir `dashboard-config.json` e `brandSrc` antes de mexer em avatar/SVG; 200 com HTML ou placeholder e erro de config/deploy, nao de imagem.
- Ao corrigir estilos do Angular Material com `!important`, validar a especificidade e a ordem no bundle compilado; uma regra com a mesma especificidade pode ser carregada e ainda perder na cascata global.
- Ajustes de posicao em `.mat-form-field-label` devem distinguir o estado vazio do `.mat-form-field-should-float`; alterar ambos corta labels de selects preenchidos e inputs focados.
- Em telas administrativas densas, nao considerar 10-12px aceitavel para tabs, filtros, tabelas ou acoes; validar no bundle live fonte computada de pelo menos 14px, alinhamento vertical e overflow horizontal realmente manipulavel.
- Para padronizar filtros admin, reutilizar `admin-filter-bar` e `admin-filter-field`; nao recriar altura/linha em CSS local nem misturar datas nativas fora de `mat-form-field`.
- Novos itens do sidebar devem reutilizar `sb-mat-tooltip` e o mesmo delay dos menus existentes; `matTooltip` sozinho cai no estilo Material padrao.
- Em `input[type='date']`, alinhar o `mat-form-field` nao garante o alinhamento visual do valor; validar tambem o `::-webkit-datetime-edit` com data preenchida e vazia no Chromium.
- Na Home, chamadas dependentes do projeto devem iniciar somente depois de `project_bs` emitir um ID valido; erro de carregamento nao pode ser convertido em estado vazio, e a ativacao deve aparecer antes de cotas e upgrade.
- No `AuthGuard`, publicar o projeto deve acontecer antes de aquecer caches de membros e bots; iniciar esses requests enquanto `getUserRole` ainda esta pendente produz URLs indefinidas no interceptor XSRF.
