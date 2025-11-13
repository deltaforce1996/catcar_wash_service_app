FROM python:3.11-slim

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    cron \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirments.txt .
RUN pip install --no-cache-dir -r requirments.txt

# Copy scripts
COPY backup_database_python.py .
COPY partition_60d_cron.py .
COPY docker-entrypoint.sh .

# Create backups directory
RUN mkdir -p /app/backups

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Setup cron jobs
RUN echo "# Database partition creation - Every Monday at 3:00 AM" > /etc/cron.d/db-scripts && \
    echo "0 3 * * 1 cd /app && python3 partition_60d_cron.py >> /var/log/partition_cron.log 2>&1" >> /etc/cron.d/db-scripts && \
    echo "" >> /etc/cron.d/db-scripts && \
    echo "# Database backup - Every day at 2:00 AM" >> /etc/cron.d/db-scripts && \
    echo "0 2 * * * cd /app && python3 backup_database_python.py --output-dir /app/backups >> /var/log/backup_cron.log 2>&1" >> /etc/cron.d/db-scripts && \
    echo "" >> /etc/cron.d/db-scripts && \
    chmod 0644 /etc/cron.d/db-scripts && \
    crontab /etc/cron.d/db-scripts

# Create log files
RUN touch /var/log/partition_cron.log /var/log/backup_cron.log && \
    chmod 0666 /var/log/partition_cron.log /var/log/backup_cron.log

ENTRYPOINT ["/app/docker-entrypoint.sh"]

