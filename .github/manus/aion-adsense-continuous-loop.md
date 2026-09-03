AION CRYPTO — FECHAMENTO DO SPRINT DE CONTEÚDO E NOVA REVISÃO ADSENSE

TASK_ID: AION-ADSENSE-CONTENT-VALUE
PRODUCTION_SHA: {{PRODUCTION_SHA}}
DOMAIN: https://aioncrypto.cloud
PUBLISHER: pub-3354845222558845
COST: R$ 0,00

Você é o validador externo e operador de navegador desta missão. O GitHub é a fonte única de verdade. Não peça ao Vinicio para copiar mensagens entre Work/Codex e Manus. Use os callbacks da tarefa para registrar conclusão, bloqueio humano real ou handoff técnico.

OBJETIVO

Validar a produção correspondente ao SHA informado e, somente se todos os gates abaixo passarem, solicitar uma nova revisão do domínio no Google AdSense. Não considere HTTP 200 ou merge como prova suficiente: valide o conteúdo realmente renderizado no navegador.

VALIDAÇÃO OBRIGATÓRIA

1. Confirmar branch `codex/aion-crypto-production-review`, SHA em produção e deploy Hostinger atualizado.
2. Testar home e os seis pilares: Bitcoin, Ethereum, XRP, Solana, BNB e Cardano.
3. Testar desktop e viewports móveis 360, 390 e 412 px.
4. Confirmar ausência de erro client-side, console crítico, falha de rede crítica e quebra visual.
5. Confirmar que Solana e Cardano renderizam H1, conteúdo, riscos, FAQ, fontes e links internos.
6. Confirmar pelo menos 25 conteúdos úteis/indexáveis, pelo menos 20 guias substanciais e os seis pilares fortes.
7. Confirmar home sem repetição editorial relevante entre Top Story, Latest News, More Coverage e Latest Articles.
8. Confirmar autoria/revisão, fontes primárias identificadas, riscos, política editorial, metodologia e aviso educacional.
9. Confirmar que a automação OpenAI continua ativa com quality gate: sem fonte verificável, duplicação, texto superficial ou dado não confirmado deve impedir publicação.
10. Confirmar canonical, robots, sitemap, indexação/noindex, links internos e dados estruturados Article, Breadcrumb e FAQ quando aplicáveis.
11. Confirmar consent default denied antes do Google, banner/CMP, Reject optional, Accept all, GA4 sem page_view duplicado e CSP válida.
12. Confirmar `/ads.txt` HTTP 200 com `pub-3354845222558845`.
13. Manter Auto Ads OFF, não criar unidades, não alterar layout e não gerar custo novo.
14. Medir CLS/LCP nas páginas representativas e registrar resultados reais, sem inventar métricas.

SE QUALQUER ITEM FALHAR

- NÃO solicitar revisão do AdSense.
- Registrar somente findings reproduzíveis, URL, evidência e impacto nos issues #35 e #38.
- Fazer handoff ao Work/Codex pela coordenação com os findings concretos.
- Não corrigir código diretamente e não aguardar silenciosamente.

SE TUDO PASSAR

1. Registrar nos issues #35 e #38 as evidências, SHA, data/hora UTC e readiness recalculada.
2. Exigir readiness >= 90, zero blocker crítico e conformidade editorial comprovada.
3. Abrir o Google AdSense na conta do publisher `pub-3354845222558845`.
4. Se o domínio já estiver em revisão, não duplicar a solicitação; registrar o status exato.
5. Se estiver elegível para nova revisão, solicitar a revisão de `aioncrypto.cloud`.
6. Não ativar Auto Ads e não criar unidades de anúncio.
7. Concluir a tarefa com o estado exato exibido pelo Google e evidências.

BLOQUEIO HUMANO ACEITÁVEL

Somente login, 2FA, CAPTCHA, pagamento ou decisão empresarial. Problema técnico deve voltar ao Work/Codex por handoff; não deve ser estacionado como ação humana.

RESULTADO FINAL OBRIGATÓRIO

SITE: PASS / FAIL
PRODUCTION SHA: [sha]
SIX PILLARS: PASS / FAIL
CONTENT VALUE: PASS / FAIL
MOBILE/DESKTOP: PASS / FAIL
CONSOLE/NETWORK: PASS / FAIL
CLS/LCP: PASS / FAIL + métricas
GA4/CONSENT/CSP: PASS / FAIL
ADS.TXT: 200 / FAIL
READINESS: [0-100]
ADSENSE REVIEW: SUBMITTED / ALREADY UNDER REVIEW / NOT SUBMITTED
AUTO ADS: OFF
ISSUES #35/#38: UPDATED
NEW RECURRING COST: R$ 0,00
HUMAN ACTION REQUIRED: YES / NO + motivo
