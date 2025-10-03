# Partition 60-Day Cron Job

This script is designed to create the next 60-day partitions for the following tables:

- `public.tbl_devices_state`
- `public.tbl_devices_events`

## Overview

The script is idempotent and safe, ensuring that:

- It uses an advisory lock to avoid concurrent runs.
- It derives the next partition window from the latest existing one, with a fallback to a 60-day bucket aligned around "today" if none exist.
- It creates per-partition indexes and a per-partition primary key on `(id)`.

## Environment Variables

The script can connect to the database using a `DATABASE_URL` or individual environment variables:

- `PGHOST`: Database host (default: `localhost`)
- `PGPORT`: Database port (default: `5432`)
- `PGUSER`: Database user (default: `postgres`)
- `PGPASSWORD`: Database password (default: empty)
- `PGDATABASE`: Database name (default: `postgres`)

## How to Run

### Prerequisites

1. **Python 3**: Ensure Python 3 is installed on your system.
2. **Dependencies**: Install the required Python packages using pip:
   ```bash
   pip install psycopg2
   ```

### Running the Script

1. **Set Environment Variables**: Ensure the necessary environment variables are set. You can export them in your terminal session:

   ```bash
   export PGHOST=your_host
   export PGPORT=your_port
   export PGUSER=your_user
   export PGPASSWORD=your_password
   export PGDATABASE=your_database
   ```

2. **Execute the Script**: Run the script using Python:

   ```bash
   python partition_60d_cron.py
   ```

3. **Check Output**: The script will output the status of partition creation. If another job is running, it will notify you and exit.

## Error Handling

The script will print an error message and exit if:

- Another partition job is running.
- A parent table is not partitioned.
