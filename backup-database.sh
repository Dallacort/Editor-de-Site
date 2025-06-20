#!/bin/bash

# Script de Backup do Banco de Dados HARDEM Editor
# Execute este script para criar backup completo do banco MariaDB

# Configurações do banco
DB_NAME="hardem_editor"
DB_USER="root"
DB_HOST="localhost"
DB_PORT="3306"

# Diretório de backups
BACKUP_DIR="database_backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="hardem_backup_${DATE}.sql"

# Criar diretório se não existir
mkdir -p "$BACKUP_DIR"

echo "🔄 Iniciando backup do banco de dados..."
echo "📅 Data: $(date)"
echo "🗄️  Banco: $DB_NAME"
echo "📁 Arquivo: $BACKUP_FILE"

# Executar backup
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --default-character-set=utf8mb4 \
    "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

# Verificar se o backup foi criado com sucesso
if [ $? -eq 0 ]; then
    echo "✅ Backup criado com sucesso!"
    echo "📄 Arquivo: $BACKUP_DIR/$BACKUP_FILE"
    echo "📊 Tamanho: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"
    
    # Compactar o backup
    echo "🗜️  Compactando backup..."
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup compactado: $BACKUP_DIR/$BACKUP_FILE.gz"
        echo "📊 Tamanho final: $(du -h "$BACKUP_DIR/$BACKUP_FILE.gz" | cut -f1)"
    fi
    
    # Limpar backups antigos (manter apenas os últimos 7)
    echo "🧹 Limpando backups antigos..."
    cd "$BACKUP_DIR"
    ls -t hardem_backup_*.sql.gz | tail -n +8 | xargs -r rm --
    echo "📋 Backups mantidos: $(ls -1 hardem_backup_*.sql.gz | wc -l)"
    
else
    echo "❌ Erro ao criar backup!"
    exit 1
fi

echo "🎉 Processo de backup concluído!" 