param(
    [Parameter(Mandatory=$true)]
    [string]$File
)

$env:PGPASSWORD="cofcof_pwd"
$user="cofcof"
$db="cofcof_db"
$hostServer="localhost"
$port="5432"

Write-Host "Restoring $db from $File..." -ForegroundColor Cyan
$confirmation = Read-Host "WARNING: This will overwrite existing data. Are you sure? (y/n)"

if ($confirmation -eq 'y') {
    pg_restore -U $user -h $hostServer -p $port -d $db -1 $File
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Restore successful!" -ForegroundColor Green
    } else {
        Write-Host "Restore failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Restore cancelled." -ForegroundColor Yellow
}
