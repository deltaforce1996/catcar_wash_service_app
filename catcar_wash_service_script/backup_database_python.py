#!/usr/bin/env python3
"""
Backup PostgreSQL database using pure Python (no pg_dump required).

This script creates SQL backup using psycopg2 directly.
Useful when pg_dump is not available (e.g., Windows without PostgreSQL client).

Usage:
  python backup_database_python.py [--output-dir backups]
"""

import os
import sys
import datetime as dt
from pathlib import Path
import argparse

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("ERROR: psycopg2 not installed!", file=sys.stderr)
    print("Install: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(1)


def get_db_config():
    """Get database configuration from environment variables."""
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        from urllib.parse import urlparse
        parsed = urlparse(database_url)
        return {
            "host": parsed.hostname or "localhost",
            "port": parsed.port or 5432,
            "user": parsed.username or "postgres",
            "password": parsed.password or "",
            "database": parsed.path.lstrip('/') if parsed.path else "postgres"
        }
    else:
        return {
            "host": os.getenv("PGHOST", "localhost"),
            "port": int(os.getenv("PGPORT", "5432")),
            "user": os.getenv("PGUSER", "catcar"),
            "password": os.getenv("PGPASSWORD", "password"),
            "database": os.getenv("PGDATABASE", "catcar_wash_db")
        }


def get_table_list(conn):
    """Get list of tables to backup."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        return [row[0] for row in cur.fetchall()]


def backup_table_data(conn, table_name, output_file):
    """Backup data from a single table as SQL INSERT statements."""
    with conn.cursor() as cur:
        # Get column names
        cur.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        columns = [row[0] for row in cur.fetchall()]
        
        if not columns:
            return 0
        
        # Get row count
        cur.execute(f'SELECT COUNT(*) FROM "public"."{table_name}"')
        row_count = cur.fetchone()[0]
        
        if row_count == 0:
            return 0
        
        # Write INSERT statements
        output_file.write(f"\n-- Data for table: {table_name} ({row_count} rows)\n")
        
        # Fetch data in batches
        batch_size = 1000
        cur.execute(f'SELECT * FROM "public"."{table_name}"')
        
        rows_written = 0
        while True:
            rows = cur.fetchmany(batch_size)
            if not rows:
                break
            
            for row in rows:
                values = []
                for val in row:
                    if val is None:
                        values.append('NULL')
                    elif isinstance(val, (int, float)):
                        values.append(str(val))
                    elif isinstance(val, bool):
                        values.append('TRUE' if val else 'FALSE')
                    elif isinstance(val, dt.datetime):
                        values.append(f"'{val.isoformat()}'::timestamptz")
                    elif isinstance(val, dt.date):
                        values.append(f"'{val.isoformat()}'::date")
                    else:
                        # Escape single quotes
                        escaped = str(val).replace("'", "''")
                        values.append(f"'{escaped}'")
                
                cols_str = ', '.join(f'"{c}"' for c in columns)
                vals_str = ', '.join(values)
                output_file.write(f'INSERT INTO "public"."{table_name}" ({cols_str}) VALUES ({vals_str});\n')
                rows_written += 1
        
        return rows_written


def backup_database(output_dir="catcar_wash_service_script/backups"):
    """Create a SQL backup of the entire database."""
    print("=" * 60)
    print("PostgreSQL Database Backup (Pure Python)")
    print("=" * 60)
    
    # Get database config
    config = get_db_config()
    print(f"\nDatabase: {config['database']}")
    print(f"Host: {config['host']}:{config['port']}")
    print(f"User: {config['user']}")
    
    # Create backup directory
    backup_path = Path(output_dir)
    backup_path.mkdir(exist_ok=True)
    print(f"Backup directory: {backup_path.absolute()}")
    
    # Generate filename with timestamp
    timestamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{config['database']}_backup_{timestamp}.sql"
    output_file_path = backup_path / filename
    
    print(f"\nBackup format: Plain SQL")
    print(f"Output file: {output_file_path.absolute()}")
    
    try:
        # Connect to database
        print("\nConnecting to database...")
        conn = psycopg2.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            dbname=config['database']
        )
        print("[OK] Connected")
        
        # Get table list
        print("\nGetting table list...")
        tables = get_table_list(conn)
        print(f"[OK] Found {len(tables)} tables")
        
        # Open output file
        print("\nStarting backup...")
        print("-" * 60)
        
        with open(output_file_path, 'w', encoding='utf-8') as f:
            # Write header
            f.write(f"-- PostgreSQL Database Backup\n")
            f.write(f"-- Database: {config['database']}\n")
            f.write(f"-- Generated: {dt.datetime.now().isoformat()}\n")
            f.write(f"-- Host: {config['host']}:{config['port']}\n")
            f.write(f"\n")
            f.write(f"-- WARNING: This is a data-only backup.\n")
            f.write(f"-- Schema must be created first using migrations.\n")
            f.write(f"\nBEGIN;\n\n")
            
            # Backup each table
            total_rows = 0
            for i, table in enumerate(tables, 1):
                print(f"[{i}/{len(tables)}] Backing up: {table}...", end=" ")
                sys.stdout.flush()
                
                try:
                    rows = backup_table_data(conn, table, f)
                    total_rows += rows
                    print(f"{rows} rows")
                except Exception as e:
                    print(f"SKIPPED ({e})")
            
            f.write(f"\nCOMMIT;\n")
            f.write(f"\n-- Backup completed: {total_rows} total rows\n")
        
        print("-" * 60)
        print(f"\n[OK] Backup completed successfully!")
        print(f"Backup file: {output_file_path.absolute()}")
        
        # Get file size
        size_bytes = output_file_path.stat().st_size
        size_mb = size_bytes / (1024 * 1024)
        print(f"File size: {size_mb:.2f} MB ({size_bytes:,} bytes)")
        print(f"Total rows backed up: {total_rows:,}")
        
        conn.close()
        
        # Print restore instructions
        print("\n" + "=" * 60)
        print("HOW TO RESTORE THIS BACKUP")
        print("=" * 60)
        print(f"""
1. Make sure schema exists (run migrations first):
   cd catcar_wash_service_serve
   npx prisma migrate deploy

2. Restore data:
   psql -h {config['host']} -p {config['port']} -U {config['user']} -d {config['database']} -f {output_file_path}

""")
        print("=" * 60)
        
        return str(output_file_path)
        
    except psycopg2.Error as e:
        print("\n" + "=" * 60, file=sys.stderr)
        print(f"DATABASE ERROR: {e}", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        sys.exit(1)
        
    except Exception as e:
        print("\n" + "=" * 60, file=sys.stderr)
        print(f"ERROR: {e}", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Backup PostgreSQL database using pure Python (no pg_dump required)"
    )
    parser.add_argument(
        "--output-dir",
        default="catcar_wash_service_script/backups",
        help="Directory to store backups (default: catcar_wash_service_script/backups/)"
    )
    
    args = parser.parse_args()
    
    # Perform backup
    backup_database(output_dir=args.output_dir)


if __name__ == "__main__":
    main()

