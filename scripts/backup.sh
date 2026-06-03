#!/bin/bash
# Backup script for COFCOF ERP PostgreSQL Database

# Ensure you have set the password or use ~/.pgpass
export PGPASSWORD="cofcof_pwd"
USER="cofcof"
DB="cofcof_db"
HOST="localhost"
PORT="5432"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="cofcof_backup_$TIMESTAMP.sql"

echo "Starting backup of $DB..."
pg_dump -U $USER -h $HOST -p $PORT -d $DB -F c -f $FILENAME

if [ $? -eq 0 ]; then
  echo "Backup successful: $FILENAME"
  echo "IMPORTANT: Please move this file to a secure, off-site location (e.g. Google Drive, external hard drive)."
else
  echo "Backup failed!"
fi
