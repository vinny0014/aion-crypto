# AION ETH Profit-Only Grid

## Objetivo

Criar um motor de grid Spot para ETH/USDT em que **nenhuma venda seja autorizada se o lote selecionado estiver com prejuízo líquido estimado**.

O motor trabalha por lotes independentes. Uma compra feita a 2.300 USDT não pode ser vendida a 1.600 USDT. Se houver uma nova compra a 1.500 USDT, esse novo lote pode ser vendido com lucro antes do lote antigo, enquanto o lote de 2.300 permanece aberto.

> Importante: isso protege contra prejuízo **realizado pelo motor**. Não elimina prejuízo flutuante, risco de mercado, risco de exchange, slippage, delisting ou queda permanente do ETH.

## Configuração inicial

- Par: `ETHUSDT`
- Mercado: Spot
- Alavancagem: nenhuma
- Capital inicial: 700 USDT
- Capital destinado ao grid: 450 USDT
- Reserva DCA: 250 USDT
- Faixa principal: 2.250 a 2.700 USDT
- Grid aritmético: 12 intervalos
- Espaçamento: 37,50 USDT
- Taxa estimada de compra: 0,10%
- Taxa estimada de venda: 0,10%
- Lucro líquido mínimo alvo por lote: 1,00%
- Stop-loss automático: não faz parte deste motor

## DCA abaixo de 2.250

| Preço de referência | Compra planejada |
|---:|---:|
| 2.150 | 25 USDT |
| 2.050 | 30 USDT |
| 1.950 | 30 USDT |
| 1.850 | 35 USDT |
| 1.750 | 40 USDT |
| 1.650 | 45 USDT |
| 1.550 | 45 USDT |

Total da reserva: 250 USDT.

Em 1.500 USDT existe uma ação de emergência adicional de **500 USDT**, marcada pelo motor como `requires_extra_funds=True`. O motor não presume que esse dinheiro já está disponível e não deve usar esse valor sem confirmação externa de saldo/aporte.

## Regra de venda

Cada BUY cria um lote com:

- preço real de compra;
- quantidade;
- custo bruto;
- taxa de compra;
- custo total do lote;
- quantidade ainda não vendida;
- lucro realizado daquele lote.

O preço mínimo de venda é calculado para cobrir:

1. custo da compra;
2. taxa estimada da compra;
3. taxa estimada da venda;
4. lucro líquido mínimo configurado.

Uma venda só recebe `allowed=True` quando atende simultaneamente às condições acima.

## Exemplo

Um lote comprado a 2.300 USDT jamais será aprovado para venda a 1.600 USDT.

Se o ETH cair e um novo lote for comprado a 1.500 USDT, esse lote terá seu próprio preço mínimo de saída. Quando o mercado atingir esse preço, ele pode ser vendido com lucro mesmo que o lote de 2.300 continue aberto.

## Travas obrigatórias para o adaptador Binance

Antes de qualquer integração que envie ordens reais, o adaptador deverá:

1. operar exclusivamente em Spot;
2. reconciliar cada fill real da Binance com um `lot_id` local;
3. converter a comissão real para a moeda de cotação antes de calcular o custo;
4. chamar `evaluate_sell()` imediatamente antes de submeter cada SELL;
5. recusar qualquer SELL se `allowed=False`;
6. validar novamente o preço e a quantidade do fill com `record_sell()`;
7. cancelar ou reduzir ordens se slippage puder levar o fill abaixo do preço mínimo do lote;
8. persistir lotes e fills para sobreviver a reinicializações;
9. não reutilizar quantidade de um lote já comprometida por outra ordem aberta;
10. manter API de saque desabilitada e usar chave sem permissão de retirada.

## Estado atual

A branch `feature/eth-profit-only-grid` contém apenas o **núcleo de segurança e contabilidade + testes**. Ela não possui chave de API e não envia ordens reais.

A próxima etapa operacional deve ser um adaptador Binance Spot em modo `DRY_RUN`, com dados públicos/market data e simulação de fills, antes de habilitar qualquer operação financeira.
