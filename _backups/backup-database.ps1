# Script de Backup do Banco de Dados HARDEM Editor (PowerShell)
# Execute este script para criar backup completo do banco MariaDB no Windows

# Configurações do banco
$DB_NAME = "hardem_editor"
$DB_USER = "root"
$DB_HOST = "localhost"
$DB_PORT = "3306"

# Diretório de backups
$BACKUP_DIR = "database_backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "hardem_backup_$DATE.sql"

# Criar diretório se não existir
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

Write-Host "🔄 Iniciando backup do banco de dados..." -ForegroundColor Cyan
Write-Host "📅 Data: $(Get-Date)" -ForegroundColor Gray
Write-Host "🗄️  Banco: $DB_NAME" -ForegroundColor Gray
Write-Host "📁 Arquivo: $BACKUP_FILE" -ForegroundColor Gray

# Solicitar senha
$Password = Read-Host "🔐 Digite a senha do MySQL" -AsSecureString
$PlainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))

# Executar backup
$BackupPath = Join-Path $BACKUP_DIR $BACKUP_FILE

try {
    # Comando mysqldump
    $Arguments = @(
        "-h", $DB_HOST,
        "-P", $DB_PORT,
        "-u", $DB_USER,
        "-p$PlainPassword",
        "--single-transaction",
        "--routines",
        "--triggers", 
        "--events",
        "--hex-blob",
        "--default-character-set=utf8mb4",
        $DB_NAME
    )
    
    Write-Host "🔄 Executando mysqldump..." -ForegroundColor Yellow
    
    # Executar mysqldump e salvar output
    $Process = Start-Process -FilePath "mysqldump" -ArgumentList $Arguments -RedirectStandardOutput $BackupPath -NoNewWindow -Wait -PassThru
    
    if ($Process.ExitCode -eq 0) {
        Write-Host "✅ Backup criado com sucesso!" -ForegroundColor Green
        Write-Host "📄 Arquivo: $BackupPath" -ForegroundColor Gray
        
        # Verificar tamanho do arquivo
        $FileSize = (Get-Item $BackupPath).Length
        $FileSizeMB = [math]::Round($FileSize / 1MB, 2)
        Write-Host "📊 Tamanho: $FileSizeMB MB" -ForegroundColor Gray
        
        # Compactar o backup usando 7-Zip (se disponível) ou PowerShell
        Write-Host "🗜️  Compactando backup..." -ForegroundColor Yellow
        
        $CompressedPath = "$BackupPath.zip"
        
        try {
            # Tentar usar 7-Zip primeiro
            if (Get-Command "7z" -ErrorAction SilentlyContinue) {
                & 7z a "$CompressedPath" "$BackupPath" | Out-Null
            } else {
                # Usar PowerShell Compress-Archive
                Compress-Archive -Path $BackupPath -DestinationPath $CompressedPath -Force
            }
            
            # Remover arquivo original não compactado
            Remove-Item $BackupPath -Force
            
            $CompressedSize = (Get-Item $CompressedPath).Length
            $CompressedSizeMB = [math]::Round($CompressedSize / 1MB, 2)
            
            Write-Host "✅ Backup compactado: $CompressedPath" -ForegroundColor Green
            Write-Host "📊 Tamanho final: $CompressedSizeMB MB" -ForegroundColor Gray
            
        } catch {
            Write-Host "⚠️  Erro na compactação, mantendo arquivo original" -ForegroundColor Yellow
        }
        
        # Limpar backups antigos (manter apenas os últimos 7)
        Write-Host "🧹 Limpando backups antigos..." -ForegroundColor Yellow
        
        $OldBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "hardem_backup_*.sql*" | 
                      Sort-Object LastWriteTime -Descending | 
                      Select-Object -Skip 7
        
        if ($OldBackups) {
            $OldBackups | Remove-Item -Force
            Write-Host "🗑️  Removidos $($OldBackups.Count) backups antigos" -ForegroundColor Gray
        }
        
        $RemainingBackups = (Get-ChildItem -Path $BACKUP_DIR -Filter "hardem_backup_*.sql*").Count
        Write-Host "📋 Backups mantidos: $RemainingBackups" -ForegroundColor Gray
        
    } else {
        throw "mysqldump falhou com código de saída: $($Process.ExitCode)"
    }
    
} catch {
    Write-Host "❌ Erro ao criar backup!" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Processo de backup concluído!" -ForegroundColor Green

# Limpar senha da memória
$PlainPassword = $null
$Password = $null 