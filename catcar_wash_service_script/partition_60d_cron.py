#!/usr/bin/env python3
"""
Create next 60-day partitions for:
  - public.tbl_devices_state
  - public.tbl_devices_events

Idempotent & safe:
- Uses an advisory lock to avoid concurrent runs
- Derives the next partition window from the latest existing one
  (fallback to 60-day bucket aligned around "today" if none exist)
- Creates per-partition indexes and a per-partition primary key on (id)
"""

import os
import sys
import datetime as dt
import psycopg2
from urllib.parse import urlparse

PARENT_TABLES = [
    {
        "name": "tbl_devices_state",
        "index_sqls": [
            'CREATE INDEX IF NOT EXISTS {part}_created_at_idx ON "public"."{part}"("created_at");',
            'CREATE INDEX IF NOT EXISTS {part}_dev_created_idx ON "public"."{part}"("device_id","created_at");',
        ],
    },
    {
        "name": "tbl_devices_events",
        "index_sqls": [
            'CREATE INDEX IF NOT EXISTS {part}_created_at_idx ON "public"."{part}"("created_at");',
            'CREATE INDEX IF NOT EXISTS {part}_dev_type_created_idx ON "public"."{part}"("device_id","type","created_at");',
        ],
    },
]

ADVISORY_LOCK_KEY = 85123456  # arbitrary unique int for this job


def get_conn():
    """
    Connect with DATABASE_URL (postgres://...) or individual env vars.
    """
    dsn = os.getenv("DATABASE_URL")
    if dsn:
        return psycopg2.connect(dsn)

    host = os.getenv("PGHOST", "localhost")
    port = int(os.getenv("PGPORT", "5432"))
    user = os.getenv("PGUSER", "postgres")
    password = os.getenv("PGPASSWORD", "")
    dbname = os.getenv("PGDATABASE", "postgres")
    return psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname)


def floor_to_60day_bucket(date_: dt.date) -> dt.date:
    """
    Align a date to the start of its 60-day bucket, anchored at 1970-01-01.
    """
    epoch = dt.date(1970, 1, 1)
    days = (date_ - epoch).days
    offset = days % 60
    return date_ - dt.timedelta(days=offset)


def get_latest_partition_end(cur, parent_table: str) -> dt.date | None:
    """
    Read the latest partition end date by parsing child table names:
      parent_YYYYMMDD_to_YYYYMMDD
    Returns a date or None when there are no partitions.
    """
    sql = """
    SELECT to_date(substring(c.relname from '.*_to_(\\d{8})$'), 'YYYYMMDD') AS end_date
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname LIKE %s
    ORDER BY end_date DESC
    LIMIT 1;
    """
    like_pat = f"{parent_table}_%_to_%"
    cur.execute(sql, (like_pat,))
    row = cur.fetchone()
    return row[0] if row and row[0] is not None else None


def create_next_partition(cur, parent_table: str, index_sqls: list[str]) -> str:
    """
    Create the next 60-day partition after the latest existing partition.
    If none exists, start from today's 60-day bucket.
    Returns the created partition name (or existing one if already present).
    """
    latest_end = get_latest_partition_end(cur, parent_table)

    if latest_end is None:
        # No partitions yet → start from the current bucket start
        today = dt.date.today()
        start = floor_to_60day_bucket(today)
        end = start + dt.timedelta(days=60)
    else:
        # Continue right after the latest end
        start = latest_end
        end = start + dt.timedelta(days=60)

    part_name = f'{parent_table}_{start.strftime("%Y%m%d")}_to_{end.strftime("%Y%m%d")}'

    # Create partition if not exists
    cur.execute(
        f'''
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM   pg_class c
            JOIN   pg_namespace n ON n.oid = c.relnamespace
            WHERE  n.nspname = 'public'
            AND    c.relname = %s
          ) THEN
            EXECUTE format($f$
              CREATE TABLE "public"."%I"
              PARTITION OF "public"."{parent_table}"
              FOR VALUES FROM (%L) TO (%L)
            $f$, %s, %s::date, %s::date);
          END IF;
        END $$;
        ''',
        (part_name, part_name, start.isoformat(), end.isoformat())
    )

    # Per-partition indexes
    for stmt in index_sqls:
        cur.execute(stmt.format(part=part_name))

    # Best-effort add per-partition PK on (id)
    cur.execute(
        f'''
        DO $$
        DECLARE
          conname text := %s || '_pkey';
          rel regclass := format('public.%s', %s)::regclass;
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = conname
              AND conrelid = rel
          ) THEN
            EXECUTE format('ALTER TABLE "public"."%s" ADD CONSTRAINT %s PRIMARY KEY ("id");', %s, conname);
          END IF;
        END $$;
        ''',
        (part_name, part_name, part_name)
    )

    return part_name


def main():
    try:
        with get_conn() as conn:
            conn.autocommit = False
            with conn.cursor() as cur:
                # Acquire advisory lock to avoid concurrent runs
                cur.execute("SELECT pg_try_advisory_lock(%s);", (ADVISORY_LOCK_KEY,))
                locked = cur.fetchone()[0]
                if not locked:
                    print("Another partition job is running. Exiting.")
                    return

                # Ensure parent tables exist and are partitioned (defensive)
                # If your migration already created parents, these will just no-op or raise if not partitioned.
                # We won't try to convert here; keep this job for "future partitions" only.
                for t in PARENT_TABLES:
                    parent = t["name"]
                    cur.execute(
                        """
                        SELECT EXISTS (
                          SELECT 1
                          FROM pg_partitioned_table pt
                          JOIN pg_class c ON c.oid = pt.partrelid
                          JOIN pg_namespace n ON n.oid = c.relnamespace
                          WHERE n.nspname='public' AND c.relname=%s
                        );
                        """,
                        (parent,)
                    )
                    is_partitioned = cur.fetchone()[0]
                    if not is_partitioned:
                        raise RuntimeError(
                            f'Parent table "public.{parent}" is not a partitioned table. '
                            f'Please run your migration that creates it with PARTITION BY RANGE(created_at).'
                        )

                created = []
                for t in PARENT_TABLES:
                    part = create_next_partition(cur, t["name"], t["index_sqls"])
                    created.append(part)

                conn.commit()
                print("Partitions ensured:", ", ".join(created))
    except Exception as e:
        print("ERROR:", e, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
