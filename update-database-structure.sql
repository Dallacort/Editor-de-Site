-- Atualizar estrutura da tabela imagens para suporte database-only
-- Execute este script no seu banco de dados

USE hardem_editor;

-- Adicionar campos necessários para database-only
ALTER TABLE `imagens` 
ADD COLUMN `dados_base64` LONGTEXT NULL COMMENT 'Dados da imagem em base64 (database-only)' AFTER `hash_md5`,
ADD COLUMN `thumbnail_base64` LONGTEXT NULL COMMENT 'Thumbnail da imagem em base64 (database-only)' AFTER `dados_base64`;

-- Tornar campos de URL opcionais (para compatibilidade com database-only)
ALTER TABLE `imagens` 
MODIFY COLUMN `url_arquivo` varchar(500) NULL COMMENT 'URL do arquivo original (opcional para database-only)';

-- Adicionar índice para otimizar consultas
ALTER TABLE `imagens` 
ADD INDEX `idx_database_only` (`dados_base64`(100));

-- Verificar estrutura atualizada
DESCRIBE `imagens`;

-- Mostrar estatísticas
SELECT 
    COUNT(*) as total_imagens,
    COUNT(dados_base64) as imagens_database_only,
    COUNT(url_arquivo) as imagens_com_url
FROM `imagens` 
WHERE status = 'ativo'; 