"""Lock down the Supabase Data API surface.

The application talks to PostgreSQL through the server-side ``DATABASE_URL``;
it does not use the Supabase browser client.  Therefore no application table
needs direct PostgREST access for ``anon`` or ``authenticated``.  This
migration removes the inherited public grants and enables RLS as defence in
depth.  It deliberately does not create permissive policies.

Revision ID: 20260809_06
Revises: 20260731_05
"""

from alembic import op


revision = "20260809_06"
down_revision = "20260731_05"
branch_labels = None
depends_on = None


TABLES = (
    "alembic_version",
    "articles",
    "cost_ledger",
    "incidents",
    "sources",
    "subscribers",
    "tasks",
    "users",
    "watchlist_items",
    "refresh_sessions",
    "subscriber_preferences",
    "editorial_events",
    "social_outbox",
    "breaking_campaigns",
)


def upgrade() -> None:
    # The backend uses a direct, server-only PostgreSQL connection.  Do not
    # re-grant access here unless a reviewed client-side Supabase use case is
    # introduced with matching RLS policies.
    for table in TABLES:
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")

    # Supabase creates these API roles, while the vanilla PostgreSQL service in
    # CI does not.  Resolve the roles at runtime so this migration validates on
    # both systems without creating platform-specific roles in production.
    quoted_tables = ", ".join(repr(table) for table in TABLES)
    op.execute(f"""
        DO $$
        DECLARE
            api_role text;
            table_name text;
        BEGIN
            FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
                    FOREACH table_name IN ARRAY ARRAY[{quoted_tables}] LOOP
                        EXECUTE format(
                            'REVOKE ALL ON TABLE public.%I FROM %I', table_name, api_role
                        );
                    END LOOP;
                    EXECUTE format(
                        'ALTER DEFAULT PRIVILEGES IN SCHEMA public '
                        || 'REVOKE ALL ON TABLES FROM %I', api_role
                    );
                    EXECUTE format(
                        'ALTER DEFAULT PRIVILEGES IN SCHEMA public '
                        || 'REVOKE ALL ON SEQUENCES FROM %I', api_role
                    );
                END IF;
            END LOOP;
        END $$;
    """)

    # PUBLIC exists on every PostgreSQL installation.  Revoke it explicitly so
    # inherited grants cannot bypass the API-role restrictions above.
    for table in TABLES:
        op.execute(f"REVOKE ALL ON TABLE public.{table} FROM PUBLIC")
    op.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC")
    op.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC")


def downgrade() -> None:
    # Re-exposing account, session and subscriber data is not a safe rollback.
    # If a reviewed application change needs direct Supabase client access,
    # introduce a new forward migration with only the necessary grants and
    # policies.  A database backup is not required for this non-destructive
    # hardening migration.
    raise RuntimeError("Security hardening is forward-only; use a reviewed corrective migration.")
