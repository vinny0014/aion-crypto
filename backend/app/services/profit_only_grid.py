from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_UP
from typing import Dict, List, Optional, Set, Tuple
from uuid import uuid4


D = Decimal


@dataclass(frozen=True)
class GridConfig:
    """Configuration for the ETH/USDT profit-only spot grid.

    This engine intentionally does not place exchange orders. It is the safety/accounting
    core that a live adapter must call before any SELL can be submitted.
    """

    symbol: str = "ETHUSDT"
    grid_lower: Decimal = D("2250")
    grid_upper: Decimal = D("2700")
    grid_count: int = 12

    # Conservative default fee estimates. Override with the account's real fee tier.
    buy_fee_rate: Decimal = D("0.001")
    sell_fee_rate: Decimal = D("0.001")

    # Every executed sell must target at least 1% net profit after estimated fees.
    min_net_profit_rate: Decimal = D("0.01")

    # Capital plan discussed for the first test.
    base_grid_capital: Decimal = D("450")
    reserve_capital: Decimal = D("250")

    # DCA reserve: starts below 2250, one buy for each ~$100 decline.
    # Total = 250 USDT.
    dca_orders: Tuple[Tuple[Decimal, Decimal], ...] = (
        (D("2150"), D("25")),
        (D("2050"), D("30")),
        (D("1950"), D("30")),
        (D("1850"), D("35")),
        (D("1750"), D("40")),
        (D("1650"), D("45")),
        (D("1550"), D("45")),
    )

    # Extra capital is NOT assumed to exist. A live adapter must require explicit funding
    # confirmation before using this emergency amount.
    emergency_level: Decimal = D("1500")
    emergency_topup: Decimal = D("500")

    def validate(self) -> None:
        if self.grid_lower <= 0 or self.grid_upper <= self.grid_lower:
            raise ValueError("invalid grid range")
        if self.grid_count < 2:
            raise ValueError("grid_count must be >= 2")
        if not (D("0") <= self.buy_fee_rate < D("0.05")):
            raise ValueError("invalid buy_fee_rate")
        if not (D("0") <= self.sell_fee_rate < D("0.05")):
            raise ValueError("invalid sell_fee_rate")
        if self.min_net_profit_rate <= 0:
            raise ValueError("min_net_profit_rate must be positive")
        if sum(amount for _, amount in self.dca_orders) != self.reserve_capital:
            raise ValueError("DCA orders must exactly match reserve_capital")


@dataclass
class Lot:
    """One immutable purchase lot with independent exit accounting."""

    lot_id: str
    buy_price: Decimal
    quantity: Decimal
    gross_cost_quote: Decimal
    buy_fee_quote: Decimal
    cost_basis_quote: Decimal
    remaining_qty: Decimal
    source: str
    closed: bool = False
    realized_pnl_quote: Decimal = D("0")


@dataclass(frozen=True)
class SellDecision:
    allowed: bool
    lot_id: str
    market_price: Decimal
    minimum_sell_price: Decimal
    expected_net_pnl_quote: Decimal
    reason: str


@dataclass(frozen=True)
class DcaAction:
    level: Decimal
    quote_amount: Decimal
    requires_extra_funds: bool = False


class ProfitOnlyGridEngine:
    """Lot-aware spot grid engine that refuses loss-making sells.

    Core invariant:
        No SELL is accepted unless the selected lot has strictly positive estimated
        net PnL after both buy and sell fee estimates and also meets the configured
        minimum net-profit target.

    Important:
        This prevents *realized* losses from engine-approved sells. It cannot prevent
        unrealized drawdown, exchange risk, execution slippage, delisting, outages,
        tax effects, or permanent price decline.
    """

    def __init__(self, config: Optional[GridConfig] = None) -> None:
        self.config = config or GridConfig()
        self.config.validate()
        self.lots: Dict[str, Lot] = {}
        self.triggered_dca_levels: Set[Decimal] = set()
        self.emergency_triggered = False

    @staticmethod
    def _d(value: Decimal | str | int | float) -> Decimal:
        return value if isinstance(value, Decimal) else D(str(value))

    def grid_levels(self) -> List[Decimal]:
        """Return arithmetic grid levels including both range endpoints."""
        step = (self.config.grid_upper - self.config.grid_lower) / D(self.config.grid_count)
        return [
            (self.config.grid_lower + step * i).quantize(D("0.01"))
            for i in range(self.config.grid_count + 1)
        ]

    def record_buy(
        self,
        *,
        price: Decimal | str | int | float,
        quote_amount: Decimal | str | int | float,
        source: str = "grid",
        lot_id: Optional[str] = None,
    ) -> Lot:
        """Record a filled BUY as a new independent lot.

        Assumption: buy fee is modeled in quote currency. A live exchange adapter should
        normalize actual fills/commissions into quote-currency cost before calling this.
        """
        p = self._d(price)
        q = self._d(quote_amount)
        if p <= 0 or q <= 0:
            raise ValueError("price and quote_amount must be positive")

        buy_fee = q * self.config.buy_fee_rate
        quantity = q / p
        lot = Lot(
            lot_id=lot_id or str(uuid4()),
            buy_price=p,
            quantity=quantity,
            gross_cost_quote=q,
            buy_fee_quote=buy_fee,
            cost_basis_quote=q + buy_fee,
            remaining_qty=quantity,
            source=source,
        )
        if lot.lot_id in self.lots:
            raise ValueError(f"duplicate lot_id: {lot.lot_id}")
        self.lots[lot.lot_id] = lot
        return lot

    def minimum_sell_price(self, lot: Lot) -> Decimal:
        """Minimum price required to achieve configured NET target after sell fee."""
        if lot.quantity <= 0:
            raise ValueError("lot quantity must be positive")
        if lot.remaining_qty <= 0:
            raise ValueError("lot is already closed")

        target_net_proceeds = lot.cost_basis_quote * (D("1") + self.config.min_net_profit_rate)
        denominator = lot.quantity * (D("1") - self.config.sell_fee_rate)
        price = target_net_proceeds / denominator
        return price.quantize(D("0.01"), rounding=ROUND_UP)

    def evaluate_sell(
        self,
        lot_id: str,
        *,
        market_price: Decimal | str | int | float,
        quantity: Optional[Decimal | str | int | float] = None,
    ) -> SellDecision:
        lot = self.lots[lot_id]
        p = self._d(market_price)
        qty = lot.remaining_qty if quantity is None else self._d(quantity)

        if qty <= 0 or qty > lot.remaining_qty:
            return SellDecision(False, lot_id, p, self.minimum_sell_price(lot), D("0"), "invalid quantity")

        minimum = self.minimum_sell_price(lot)
        fraction = qty / lot.quantity
        allocated_cost = lot.cost_basis_quote * fraction
        gross_proceeds = p * qty
        sell_fee = gross_proceeds * self.config.sell_fee_rate
        net_proceeds = gross_proceeds - sell_fee
        net_pnl = net_proceeds - allocated_cost

        if p < minimum:
            return SellDecision(
                False,
                lot_id,
                p,
                minimum,
                net_pnl,
                "blocked: market price is below this lot's profit-only exit",
            )
        if net_pnl <= 0:
            return SellDecision(False, lot_id, p, minimum, net_pnl, "blocked: estimated net PnL is not positive")

        return SellDecision(True, lot_id, p, minimum, net_pnl, "allowed: lot exits with positive net profit")

    def eligible_lots(self, market_price: Decimal | str | int | float) -> List[Lot]:
        p = self._d(market_price)
        eligible = [
            lot
            for lot in self.lots.values()
            if lot.remaining_qty > 0 and self.evaluate_sell(lot.lot_id, market_price=p).allowed
        ]
        # Lowest exit target first: lets newer/cheaper lots recycle independently.
        return sorted(eligible, key=self.minimum_sell_price)

    def record_sell(
        self,
        lot_id: str,
        *,
        price: Decimal | str | int | float,
        quantity: Optional[Decimal | str | int | float] = None,
    ) -> Decimal:
        """Record a filled SELL only if the profit-only guard approves it.

        A live adapter MUST call evaluate_sell immediately before exchange submission and
        record_sell again from the actual fill price/quantity.
        """
        lot = self.lots[lot_id]
        p = self._d(price)
        qty = lot.remaining_qty if quantity is None else self._d(quantity)
        decision = self.evaluate_sell(lot_id, market_price=p, quantity=qty)
        if not decision.allowed:
            raise ValueError(decision.reason)

        fraction = qty / lot.quantity
        allocated_cost = lot.cost_basis_quote * fraction
        gross_proceeds = p * qty
        sell_fee = gross_proceeds * self.config.sell_fee_rate
        net_proceeds = gross_proceeds - sell_fee
        net_pnl = net_proceeds - allocated_cost

        # Last-resort invariant: engine must never realize a non-positive sell.
        if net_pnl <= 0:
            raise AssertionError("PROFIT_ONLY invariant violated")

        lot.remaining_qty -= qty
        lot.realized_pnl_quote += net_pnl
        if lot.remaining_qty == 0:
            lot.closed = True
        return net_pnl

    def pending_dca_actions(self, market_price: Decimal | str | int | float) -> List[DcaAction]:
        """Return DCA actions newly eligible at or below the current market price."""
        p = self._d(market_price)
        actions: List[DcaAction] = []

        for level, amount in self.config.dca_orders:
            if p <= level and level not in self.triggered_dca_levels:
                actions.append(DcaAction(level=level, quote_amount=amount))

        if p <= self.config.emergency_level and not self.emergency_triggered:
            actions.append(
                DcaAction(
                    level=self.config.emergency_level,
                    quote_amount=self.config.emergency_topup,
                    requires_extra_funds=True,
                )
            )
        return actions

    def confirm_dca_fill(
        self,
        *,
        level: Decimal | str | int | float,
        fill_price: Decimal | str | int | float,
        quote_amount: Decimal | str | int | float,
    ) -> Lot:
        """Mark one configured DCA level as filled and create its independent lot."""
        lvl = self._d(level)
        amount = self._d(quote_amount)

        configured = dict(self.config.dca_orders)
        if lvl == self.config.emergency_level:
            if amount != self.config.emergency_topup:
                raise ValueError("emergency quote amount does not match configuration")
            self.emergency_triggered = True
            return self.record_buy(price=fill_price, quote_amount=amount, source="emergency-dca")

        expected = configured.get(lvl)
        if expected is None:
            raise ValueError("unknown DCA level")
        if amount != expected:
            raise ValueError("DCA quote amount does not match configuration")
        if lvl in self.triggered_dca_levels:
            raise ValueError("DCA level already filled")

        self.triggered_dca_levels.add(lvl)
        return self.record_buy(price=fill_price, quote_amount=amount, source="dca")

    def realized_profit_total(self) -> Decimal:
        return sum((lot.realized_pnl_quote for lot in self.lots.values()), D("0"))

    def open_lots(self) -> List[Lot]:
        return [lot for lot in self.lots.values() if lot.remaining_qty > 0]
