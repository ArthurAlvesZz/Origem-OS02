#!/bin/bash
# Restore script for COFCOF ERP PostgreSQL Database

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_file.sql>"
  exit 1
fi

FILE=$1

export PGPASSWORD="cofcof_pwd"
USER="cofcof"
DB="cofcof_db"
HOST="localhost"
PORT="5432"

echo "Restoring $DB from $FILE..."
echo "WARNING: This will overwrite existing data. Are you sure? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
    pg_restore -U $USER -h $HOST -p $PORT -d $DB -1 $FILE
    if [ $? -eq 0 ]; then
      echo "Restore successful!"
    else
      echo "Restore failed!"
    fi
else
    echo "Restore cancelled."
fi
