$date = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "cofcof_backup_$date.sql"

$env:PGPASSWORD="cofcof_pwd"
$user="cofcof"
$db="cofcof_db"
$host="localhost"
$port="5432"

Write-Host "Starting backup of $db..."
pg_dump -U $user -h $host -p $port -d $db -F c -f $filename

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup successful: $filename" -ForegroundColor Green
    Write-Host "IMPORTANT: Please move this file to a secure, off-site location (e.g. Google Drive, external hard drive)." -ForegroundColor Yellow
} else {
    Write-Host "Backup failed!" -ForegroundColor Red
}
