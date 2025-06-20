#!/bin/bash

# Script de Restauração do Banco de Dados HARDEM Editor
# Execute este script para restaurar backup do banco MariaDB

# Configurações do banco
DB_NAME="hardem_editor"
DB_USER="root"
DB_HOST="localhost"
DB_PORT="3306"

# Diretório de backups
BACKUP_DIR="database_backups"

echo "🔄 Script de Restauração do Banco HARDEM Editor"
echo "==============================================="

# Verificar se o diretório de backups existe
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Diretório de backups não encontrado: $BACKUP_DIR"
    exit 1
fi

# Listar backups disponíveis
echo "📋 Backups disponíveis:"
ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null | nl

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ Nenhum backup encontrado no diretório $BACKUP_DIR"
    exit 1
fi

# Solicitar qual backup restaurar
echo ""
read -p "🔢 Digite o número do backup para restaurar (ou 'q' para sair): " choice

if [ "$choice" = "q" ] || [ "$choice" = "Q" ]; then
    echo "👋 Saindo..."
    exit 0
fi

# Obter o arquivo de backup selecionado
BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.sql.gz | sed -n "${choice}p")

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Backup inválido selecionado!"
    exit 1
fi

echo "📄 Backup selecionado: $(basename "$BACKUP_FILE")"
echo "📊 Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"

# Confirmação
echo ""
echo "⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER todos os dados atuais!"
read -p "🤔 Tem certeza que deseja continuar? (digite 'SIM' para confirmar): " confirm

if [ "$confirm" != "SIM" ]; then
    echo "❌ Operação cancelada pelo usuário."
    exit 0
fi

echo ""
echo "🔄 Iniciando restauração..."
echo "📅 Data: $(date)"
echo "🗄️  Banco: $DB_NAME"

# Descompactar temporariamente
TEMP_SQL="/tmp/hardem_restore_temp.sql"
echo "🗜️  Descompactando backup..."
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao descompactar backup!"
    exit 1
fi

# Restaurar banco
echo "📥 Restaurando dados no banco..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < "$TEMP_SQL"

if [ $? -eq 0 ]; then
    echo "✅ Restauração concluída com sucesso!"
    echo "🗄️  Banco $DB_NAME restaurado a partir de $(basename "$BACKUP_FILE")"
    
    # Limpar arquivo temporário
    rm -f "$TEMP_SQL"
    
    echo ""
    echo "🎉 Processo de restauração concluído!"
    echo "💡 Verifique se todos os dados foram restaurados corretamente."
    
else
    echo "❌ Erro durante a restauração!"
    rm -f "$TEMP_SQL"
    exit 1
fi 