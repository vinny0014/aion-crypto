from sqlalchemy.orm import Session

from app.pipeline.commander import Commander
from app.models import SchedulerRun
from app.pipeline.editorial import EditorialPipeline
from app.services.radar import scan_source

AGENTS = ("radar", "verifier", "editor-chief", "writer", "reviewer", "seo", "compliance", "publisher", "distribution")
NEXT = {
    "radar": "verifier", "verifier": "editor-chief", "editor-chief": "writer",
    "writer": "reviewer", "reviewer": "seo", "seo": "compliance",
    "compliance": "publisher", "publisher": "distribution",
}


def build_commander(db: Session) -> Commander:
    commander = Commander(db)
    pipeline = EditorialPipeline(db)

    def handler(agent: str):
        def run(payload: dict) -> dict:
            article_id = int(payload["article_id"])
            result = pipeline.run_agent(agent, article_id)
            next_agent = NEXT.get(agent)
            if next_agent and result.get("advance", True) and result["status"] not in {"duplicate", "rejected", "compliance_failed", "failed", "archived"}:
                commander.enqueue(next_agent, {"article_id": article_id}, idempotency_key=f"article:{article_id}:{next_agent}")
            return result
        return run

    for agent in AGENTS:
        commander.register(agent, handler(agent))
    def source_scan(payload: dict) -> dict:
        result = scan_source(db, int(payload["source_id"]))
        if payload.get("scheduler_run_id"):
            scheduler_run = db.get(SchedulerRun, int(payload["scheduler_run_id"]))
            if scheduler_run is not None:
                scheduler_run.items_seen += int(result.get("items", 0))
                scheduler_run.articles_detected += int(result.get("detected", 0))
                scheduler_run.duplicates_rejected += int(result.get("duplicates", 0))
                db.commit()
        for article_id in result.get("article_ids", []):
            commander.enqueue(
                "radar",
                {"article_id": article_id},
                idempotency_key=f"article:{article_id}:radar",
            )
        return result

    commander.register("source-scan", source_scan)
    # Import locally to avoid a registry/market-news import cycle.
    from app.services.market_news import publish_daily_market_brief
    commander.register("market-brief", lambda _payload: publish_daily_market_brief(db))
    return commander
