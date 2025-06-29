-- Atualizar estrutura da tabela imagens para suporte database-only
-- Execute este script no seu banco de dados

USE hardem_editor;

-- Adicionar campos necessários para database-only
ALTER TABLE `imagens` 
ADD COLUMN IF NOT EXISTS `dados_base64` LONGTEXT NULL COMMENT 'Dados da imagem em base64 (database-only)' AFTER `hash_md5`,
ADD COLUMN IF NOT EXISTS `thumbnail_base64` LONGTEXT NULL COMMENT 'Thumbnail da imagem em base64 (database-only)' AFTER `dados_base64`,
ADD COLUMN IF NOT EXISTS `url_externo` varchar(500) DEFAULT NULL COMMENT 'URL externa da imagem' AFTER `url_thumbnail`;

-- Tornar campos de URL opcionais (para compatibilidade com database-only)
ALTER TABLE `imagens` 
MODIFY COLUMN `url_arquivo` varchar(500) NULL COMMENT 'URL do arquivo original (opcional para database-only)';

-- Adicionar índice para otimizar consultas
ALTER TABLE `imagens` 
ADD INDEX IF NOT EXISTS `idx_database_only` (`dados_base64`(100)),
ADD INDEX IF NOT EXISTS `idx_hash_status` (`hash_md5`, `status`);

-- Atualizar estrutura da tabela pagina_imagens
ALTER TABLE `pagina_imagens`
MODIFY COLUMN `pagina_id` varchar(255) NOT NULL COMMENT 'ID da página',
MODIFY COLUMN `propriedades` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`propriedades`)),
ADD COLUMN IF NOT EXISTS `status` enum('ativo','inativo','excluido') DEFAULT 'ativo' AFTER `posicao`,
ADD COLUMN IF NOT EXISTS `created_at` datetime DEFAULT CURRENT_TIMESTAMP AFTER `status`,
ADD COLUMN IF NOT EXISTS `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
ADD INDEX IF NOT EXISTS `idx_pagina_contexto` (`pagina_id`, `contexto`),
ADD INDEX IF NOT EXISTS `idx_imagem_status` (`imagem_id`, `status`);

-- Verificar estrutura atualizada
DESCRIBE `imagens`;
DESCRIBE `pagina_imagens`;

-- Mostrar estatísticas
SELECT 
    COUNT(*) as total_imagens,
    COUNT(dados_base64) as imagens_database_only,
    COUNT(url_arquivo) as imagens_com_url
FROM `imagens` 
WHERE status = 'ativo';

-- Verificar registros duplicados
SELECT 
    pi.pagina_id,
    pi.contexto,
    COUNT(*) as total,
    GROUP_CONCAT(pi.id) as ids,
    GROUP_CONCAT(pi.imagem_id) as image_ids
FROM pagina_imagens pi
WHERE pi.status = 'ativo'
GROUP BY pi.pagina_id, pi.contexto
HAVING COUNT(*) > 1; 