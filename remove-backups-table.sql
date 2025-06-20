-- Script para remover sistema de backups redundante
-- Execute este script no seu banco MariaDB para limpar as tabelas de backup

USE hardem_editor;

-- Remover tabela de backups (se existir)
DROP TABLE IF EXISTS backups;

-- Verificar tabelas restantes
SHOW TABLES;

-- Confirmar remoção
SELECT 'Tabela de backups removida com sucesso!' as status; 