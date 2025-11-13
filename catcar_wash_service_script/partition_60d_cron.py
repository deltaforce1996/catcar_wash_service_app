#!/usr/bin/env python3
"""
Create next 60-day partitions for:
  - public.tbl_devices_events

Idempotent & safe:
- Uses an advisory lock to avoid concurrent runs
- Derives the next partition window from the latest existing one
  (fallback to 60-day bucket aligned around "today" if none exist)
- Creates per-partition indexes and a per-partition primary key on (id)

Installation:
  pip install -r requirments.txt

Usage:
  python partition_60d_cron.py
"""

import os
import sys
import datetime as dt
import traceback

try:
    import psycopg2
except ImportError as e:
    print(f"ERROR: Failed to import psycopg2: {e}", file=sys.stderr)
    print("Please install: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(1)

PARENT_TABLES = [
    {
        "name": "tbl_devices_events",
        "index_sqls": [
            'CREATE INDEX IF NOT EXISTS {part}_created_at_idx ON "public"."{part}"("created_at");',
            'CREATE INDEX IF NOT EXISTS {part}_dev_created_idx ON "public"."{part}"("device_id","created_at");',
        ],
    },
]

ADVISORY_LOCK_KEY = 85123456  # arbitrary unique int for this job


def get_conn():
    """
    Connect with DATABASE_URL (postgres://...) or individual env vars.
    """
    print("DEBUG: Attempting database connection...")
    dsn = os.getenv("DATABASE_URL")
    if dsn:
        print(f"DEBUG: Using DATABASE_URL")
        return psycopg2.connect(dsn)

    host = os.getenv("PGHOST", "localhost")
    port = int(os.getenv("PGPORT", "5432"))
    user = os.getenv("PGUSER", "catcar")
    password = os.getenv("PGPASSWORD", "password")
    dbname = os.getenv("PGDATABASE", "catcar_wash_db")
    
    print(f"DEBUG: Connecting to {host}:{port}/{dbname} as {user}")
    return psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname)


def floor_to_60day_bucket(date_):
    """
    Align a date to the start of its 60-day bucket, anchored at 1970-01-01.
    """
    epoch = dt.date(1970, 1, 1)
    days = (date_ - epoch).days
    offset = days % 60
    return date_ - dt.timedelta(days=offset)


def get_latest_partition_end(cur, parent_table):
    """
    Read the latest partition end date by parsing child table names:
      parent_YYYYMMDD_to_YYYYMMDD
    Returns a date or None when there are no partitions.
    """
    print(f"DEBUG: Getting latest partition end for {parent_table}...")
    sql = """
    SELECT to_date(substring(c.relname from '.*_to_(\\d{8})$'), 'YYYYMMDD') AS end_date
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname LIKE %s
      AND c.relname ~ '.*_\\d{8}_to_\\d{8}$'
    ORDER BY end_date DESC NULLS LAST
    LIMIT 1;
    """
    like_pat = f"{parent_table}_%_to_%"
    cur.execute(sql, (like_pat,))
    row = cur.fetchone()
    print(f"DEBUG: Latest partition query returned: {row}")
    return row[0] if row and row[0] is not None else None


def create_next_partition(cur, parent_table, index_sqls):
    """
    Create the next 60-day partition after the latest existing partition.
    If none exists, start from today's 60-day bucket.
    Returns the created partition name (or existing one if already present).
    """
    print(f"DEBUG: Creating next partition for {parent_table}...")
    latest_end = get_latest_partition_end(cur, parent_table)

    if latest_end is None:
        # No partitions yet → start from the current bucket start
        today = dt.date.today()
        start = floor_to_60day_bucket(today)
        end = start + dt.timedelta(days=60)
        print(f"DEBUG: No existing partitions found, using {start} to {end}")
    else:
        # Continue right after the latest end
        start = latest_end
        end = start + dt.timedelta(days=60)
        print(f"DEBUG: Latest partition ends {latest_end}, creating {start} to {end}")

    part_name = f'{parent_table}_{start.strftime("%Y%m%d")}_to_{end.strftime("%Y%m%d")}'
    print(f"DEBUG: Partition name will be: {part_name}")

    # Create partition if not exists
    # Note: Using %s in DO $$ doesn't work, must use direct string formatting
    sql = f'''
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM   pg_class c
            JOIN   pg_namespace n ON n.oid = c.relnamespace
            WHERE  n.nspname = 'public'
            AND    c.relname = '{part_name}'
          ) THEN
            EXECUTE format($f$
              CREATE TABLE "public"."%I"
              PARTITION OF "public"."{parent_table}"
              FOR VALUES FROM (%L) TO (%L)
            $f$, '{part_name}', '{start.isoformat()}'::date, '{end.isoformat()}'::date);
          END IF;
        END $$;
        '''
    cur.execute(sql)
    print(f"DEBUG: Partition table created/exists")

    # Per-partition indexes
    for i, stmt in enumerate(index_sqls):
        print(f"DEBUG: Creating index {i+1}/{len(index_sqls)} for {part_name}...")
        cur.execute(stmt.format(part=part_name))

    # Best-effort add per-partition PK on (id, created_at) - matches Prisma schema
    print(f"DEBUG: Adding primary key constraint for {part_name}...")
    # Note: Using %s in DO $$ doesn't work, must use direct string formatting
    sql_pk = f'''
        DO $$
        DECLARE
          constraint_name text := '{part_name}' || '_pkey';
          rel regclass := format('public.%s', '{part_name}')::regclass;
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
            WHERE c.conname = constraint_name
              AND c.conrelid = rel
          ) THEN
            EXECUTE format('ALTER TABLE "public"."%s" ADD CONSTRAINT %s PRIMARY KEY ("id", "created_at");', '{part_name}', constraint_name);
          END IF;
        END $$;
        '''
    cur.execute(sql_pk)

    print(f"DEBUG: Partition {part_name} fully configured")
    return part_name


def main():
    conn = None
    cur = None
    
    try:
        print("=" * 60)
        print("Starting partition creation script...")
        print("=" * 60)
        
        conn = get_conn()
        print("[OK] Database connection established")
        
        conn.autocommit = False
        cur = conn.cursor()
        print("[OK] Cursor created")
        
        # Acquire advisory lock to avoid concurrent runs
        print("\nAcquiring advisory lock...")
        cur.execute("SELECT pg_try_advisory_lock(%s);", (ADVISORY_LOCK_KEY,))
        result = cur.fetchone()
        print(f"DEBUG: Advisory lock query returned: {result}")
        
        if result is None:
            print("ERROR: Failed to acquire advisory lock (no result returned)", file=sys.stderr)
            sys.exit(1)
            
        locked = result[0]
        if not locked:
            print("Another partition job is running. Exiting.")
            return

        print("[OK] Advisory lock acquired")

        # Ensure parent tables exist and are partitioned (defensive)
        print("\nChecking parent tables...")
        for t in PARENT_TABLES:
            parent = t["name"]
            print(f"  Checking if {parent} is partitioned...")
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
            result = cur.fetchone()
            print(f"  DEBUG: Partitioned check returned: {result}")
            
            if result is None:
                raise RuntimeError(
                    f'Failed to check if table "public.{parent}" is partitioned (no result returned)'
                )
                
            is_partitioned = result[0]
            if not is_partitioned:
                raise RuntimeError(
                    f'Parent table "public.{parent}" is not a partitioned table. '
                    f'Please run your migration that creates it with PARTITION BY RANGE(created_at).'
                )
            print(f"  [OK] {parent} is partitioned")

        print("\nCreating partitions...")
        created = []
        for t in PARENT_TABLES:
            part = create_next_partition(cur, t["name"], t["index_sqls"])
            created.append(part)
            print(f"  [OK] {part}")

        print("\nCommitting transaction...")
        conn.commit()
        print("\n" + "=" * 60)
        print("SUCCESS! Partitions ensured:", ", ".join(created))
        print("=" * 60)
        
    except psycopg2.Error as e:
        print("\n" + "=" * 60, file=sys.stderr)
        print(f"DATABASE ERROR: {e}", file=sys.stderr)
        print(f"Error code: {e.pgcode}", file=sys.stderr)
        print(f"Error message: {e.pgerror}", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
        
    except Exception as e:
        print("\n" + "=" * 60, file=sys.stderr)
        print(f"ERROR: {type(e).__name__}: {e}", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
        
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
        print("\nDatabase connection closed.")


if __name__ == "__main__":
    main()
