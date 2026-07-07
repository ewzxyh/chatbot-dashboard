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
