AION CRYPTO — FECHAMENTO ADSENSE EM MODO ECONÔMICO

TASK_ID: AION-ADSENSE-CONTENT-VALUE
BRIDGE_VERSION: 3
PRODUCTION_SHA: {{PRODUCTION_SHA}}
DOMAIN: https://aioncrypto.cloud
PUBLISHER: pub-3354845222558845
COST: R$ 0,00

PAPÉIS

- WORK/CODEX: código, conteúdo, agente OpenAI, SEO, testes, CI, PRs, GitHub e correções técnicas.
- GITHUB: fonte única de verdade, fila idempotente e monitoramento periódico sem Manus.
- MANUS: somente navegador autenticado ou painel externo impossível ao Work: Render, Hostinger, Search Console, GA4 e AdSense.
- Não peça ao Vinicio para copiar mensagens. Registre evidências nos issues #35 e #38 e use os callbacks da coordenação.

REGRA DE ECONOMIA

Esta é uma missão finita e idempotente, não um loop persistente.

1. Antes de agir, compare TASK_ID + PRODUCTION_SHA com tarefas ativas ou concluídas.
2. Se o mesmo SHA já foi validado e não houve mudança externa, encerre como NO_ACTION_DUPLICATE.
3. Não permaneça observando fila vazia, não faça polling contínuo e não repita auditoria sem novo SHA ou finding.
4. Se houver falha de código, conteúdo, CI, automação editorial ou SEO, envie finding reproduzível ao Work e encerre.
5. Só use navegador/painel para uma ação que o Work não consegue executar.
6. Login, 2FA ou CAPTCHA podem exigir Vinicio. Problema técnico deve voltar ao Work.
7. Se MANUS_API_KEY estiver inválida ou unauthenticated, registre HUMAN_REQUIRED uma única vez e não repita chamadas.

RECUPERAÇÃO EXTERNA INICIAL

Se https://aion-crypto-api.onrender.com/health/ready não retornar:
- status=ready
- coordination_dispatch_retry=true

então:

1. Abra o painel Render autenticado.
2. Gere/obtenha uma chave válida da API Manus e atualize somente MANUS_API_KEY do serviço aion-crypto-api.
3. Confirme que o serviço usa o branch codex/aion-crypto-production-review e faça deploy do PRODUCTION_SHA atual.
4. Aguarde /health/ready expor coordination_dispatch_retry=true.
5. Execute uma vez o workflow manual Recover AION Render bridge.
6. Confirme no scheduler editorial sources_scanned > 0. Se continuar 0, envie ao Work o resultado exato; não invente fontes nem publique conteúdo fraco.

VALIDAÇÃO EXTERNA ÚNICA

Somente após o backend atualizado:

1. Confirmar SHA realmente servido pela Hostinger.
2. Testar home e os seis pilares Bitcoin, Ethereum, XRP, Solana, BNB e Cardano.
3. Testar desktop e mobile 360, 390 e 412 px.
4. Confirmar ausência de erro client-side, console crítico, falha de rede crítica e quebra visual.
5. Confirmar pelo menos 25 conteúdos úteis/indexáveis, 20 guias substanciais e seis pilares fortes.
6. Confirmar home sem repetição editorial relevante.
7. Confirmar autoria/revisão, fontes, riscos, política editorial, metodologia e aviso educacional.
8. Confirmar que o agente OpenAI está ativo com quality gate e fontes; conteúdo superficial, duplicado ou não confirmado deve ser retido.
9. Confirmar canonical, robots, sitemap, noindex, links internos e dados estruturados aplicáveis.
10. Confirmar Consent Mode default denied antes do Google, CMP, Reject optional, Accept all, GA4 sem page_view duplicado e CSP.
11. Confirmar /ads.txt HTTP 200 com pub-3354845222558845.
12. Medir CLS/LCP nas páginas representativas e registrar métricas reais.
13. Manter Auto Ads OFF, sem unidades novas, sem redesign e sem custo novo.

SE QUALQUER GATE FALHAR

- NÃO solicitar revisão do AdSense.
- Registrar URL, reprodução, evidência e impacto nos issues #35 e #38.
- Fazer handoff ao Work/Codex.
- Encerrar a missão; o GitHub criará outra apenas após um novo SHA.

SE TUDO PASSAR

1. Recalcular readiness e exigir >=90, zero blocker crítico e conteúdo original comprovado.
2. Abrir o AdSense do publisher pub-3354845222558845.
3. Se já estiver em revisão, não duplicar; registrar o status.
4. Se estiver elegível, solicitar uma única nova revisão de aioncrypto.cloud.
5. Manter Auto Ads OFF e não criar unidades.
6. Registrar evidências e o status oficial nos issues #35 e #38.
7. Encerrar como ADSENSE_REVIEW_SUBMITTED ou ALREADY_UNDER_REVIEW.

RESULTADO FINAL

TASK: [id]
SITE: PASS / FAIL
PRODUCTION SHA: [sha]
RENDER BACKEND: PASS / FAIL
EDITORIAL SOURCES: [número]
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
