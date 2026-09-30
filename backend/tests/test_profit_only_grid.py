from decimal import Decimal

import pytest

from app.services.profit_only_grid import GridConfig, ProfitOnlyGridEngine


D = Decimal


def test_default_dca_reserve_matches_250_usdt():
    cfg = GridConfig()
    assert sum(amount for _, amount in cfg.dca_orders) == D("250")


def test_grid_is_12_intervals_from_2250_to_2700():
    engine = ProfitOnlyGridEngine()
    levels = engine.grid_levels()
    assert len(levels) == 13
    assert levels[0] == D("2250.00")
    assert levels[-1] == D("2700.00")
    assert levels[1] - levels[0] == D("37.50")


def test_lot_bought_at_2300_cannot_be_sold_at_1600():
    engine = ProfitOnlyGridEngine()
    lot = engine.record_buy(price="2300", quote_amount="100", lot_id="lot-2300")

    decision = engine.evaluate_sell(lot.lot_id, market_price="1600")
    assert decision.allowed is False
    assert decision.expected_net_pnl_quote < 0

    with pytest.raises(ValueError):
        engine.record_sell(lot.lot_id, price="1600")


def test_lot_bought_at_1500_can_exit_independently_with_profit():
    engine = ProfitOnlyGridEngine()
    expensive = engine.record_buy(price="2300", quote_amount="100", lot_id="expensive")
    cheap = engine.record_buy(price="1500", quote_amount="100", lot_id="cheap")

    cheap_minimum = engine.minimum_sell_price(cheap)
    assert cheap_minimum < engine.minimum_sell_price(expensive)

    cheap_decision = engine.evaluate_sell(cheap.lot_id, market_price=cheap_minimum)
    expensive_decision = engine.evaluate_sell(expensive.lot_id, market_price=cheap_minimum)

    assert cheap_decision.allowed is True
    assert cheap_decision.expected_net_pnl_quote > 0
    assert expensive_decision.allowed is False


def test_default_minimum_exit_delivers_at_least_one_percent_net_profit():
    engine = ProfitOnlyGridEngine()
    lot = engine.record_buy(price="2300", quote_amount="100", lot_id="lot")
    exit_price = engine.minimum_sell_price(lot)
    decision = engine.evaluate_sell(lot.lot_id, market_price=exit_price)

    assert decision.allowed is True
    assert decision.expected_net_pnl_quote >= lot.cost_basis_quote * D("0.01")


def test_partial_sell_is_also_profit_only():
    engine = ProfitOnlyGridEngine()
    lot = engine.record_buy(price="2000", quote_amount="100", lot_id="lot")
    exit_price = engine.minimum_sell_price(lot)
    half = lot.quantity / D("2")

    pnl = engine.record_sell(lot.lot_id, price=exit_price, quantity=half)
    assert pnl > 0
    assert lot.remaining_qty == half
    assert lot.closed is False


def test_dca_actions_trigger_every_100_dollar_step_below_2250():
    engine = ProfitOnlyGridEngine()

    actions_2149 = engine.pending_dca_actions("2149")
    assert [(a.level, a.quote_amount) for a in actions_2149] == [(D("2150"), D("25"))]

    engine.confirm_dca_fill(level="2150", fill_price="2149", quote_amount="25")
    actions_2049 = engine.pending_dca_actions("2049")
    assert [(a.level, a.quote_amount) for a in actions_2049] == [(D("2050"), D("30"))]


def test_1500_action_requires_extra_funds():
    engine = ProfitOnlyGridEngine()
    actions = engine.pending_dca_actions("1500")
    emergency = [a for a in actions if a.level == D("1500")][0]

    assert emergency.quote_amount == D("500")
    assert emergency.requires_extra_funds is True


def test_total_realized_profit_never_decreases_from_approved_sell():
    engine = ProfitOnlyGridEngine()
    lot1 = engine.record_buy(price="2150", quote_amount="25", lot_id="a")
    lot2 = engine.record_buy(price="1550", quote_amount="45", lot_id="b")

    before = engine.realized_profit_total()
    engine.record_sell(lot2.lot_id, price=engine.minimum_sell_price(lot2))
    after = engine.realized_profit_total()

    assert after > before
    assert lot1.closed is False
