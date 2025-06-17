-- HARDEM Editor - Script COMPLETO de Instalação do Banco de Dados
-- Execute este script no seu MariaDB para criar TODAS as tabelas necessárias
-- Versão: 3.1.0

-- Remover banco se existir (cuidado em produção!)
-- DROP DATABASE IF EXISTS hardem_editor;

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS hardem_editor 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar o banco de dados
USE hardem_editor;

-- Remover tabelas se existirem (para garantir estrutura correta)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS system_logs;
DROP TABLE IF EXISTS pagina_imagens;
DROP TABLE IF EXISTS backups;
DROP TABLE IF EXISTS textos;
DROP TABLE IF EXISTS imagens;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- 1. TABELA DE IMAGENS (COMPLETA)
-- ========================================
CREATE TABLE imagens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome_arquivo VARCHAR(255) NOT NULL COMMENT 'Nome do arquivo salvo no servidor',
    nome_original VARCHAR(255) NOT NULL COMMENT 'Nome original do arquivo enviado',
    tipo_mime VARCHAR(100) NOT NULL COMMENT 'Tipo MIME da imagem',
    tamanho BIGINT NOT NULL DEFAULT 0 COMMENT 'Tamanho em bytes',
    largura INT DEFAULT NULL COMMENT 'Largura da imagem em pixels',
    altura INT DEFAULT NULL COMMENT 'Altura da imagem em pixels',
    data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora do upload',
    url_arquivo VARCHAR(500) NOT NULL COMMENT 'URL do arquivo original',
    url_otimizada VARCHAR(500) DEFAULT NULL COMMENT 'URL da versão otimizada',
    url_thumbnail VARCHAR(500) DEFAULT NULL COMMENT 'URL da miniatura',
    hash_md5 CHAR(32) NOT NULL COMMENT 'Hash MD5 para evitar duplicatas',
    alt_text VARCHAR(255) DEFAULT NULL COMMENT 'Texto alternativo para acessibilidade',
    descricao TEXT DEFAULT NULL COMMENT 'Descrição da imagem',
    status ENUM('ativo', 'inativo', 'excluido') DEFAULT 'ativo' COMMENT 'Status da imagem',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação do registro',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última atualização',
    
    -- Índices para performance
    INDEX idx_hash (hash_md5),
    INDEX idx_status (status),
    INDEX idx_tipo_mime (tipo_mime),
    INDEX idx_data_upload (data_upload),
    INDEX idx_tamanho (tamanho),
    UNIQUE KEY uk_hash_status (hash_md5, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela para armazenar informações das imagens';

-- ========================================
-- 2. TABELA DE TEXTOS (COMPLETA)
-- ========================================
CREATE TABLE textos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    chave VARCHAR(255) NOT NULL COMMENT 'Identificador único do texto',
    conteudo LONGTEXT NOT NULL COMMENT 'Conteúdo do texto',
    pagina VARCHAR(255) DEFAULT NULL COMMENT 'Página onde o texto aparece',
    tipo ENUM('texto', 'titulo', 'paragrafo', 'link', 'lista', 'json') DEFAULT 'texto' COMMENT 'Tipo de conteúdo',
    data_modificacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data da última modificação',
    versao INT NOT NULL DEFAULT 1 COMMENT 'Versão do conteúdo',
    usuario VARCHAR(100) DEFAULT NULL COMMENT 'Usuário que fez a modificação',
    status ENUM('ativo', 'inativo', 'excluido') DEFAULT 'ativo' COMMENT 'Status do texto',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação do registro',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última atualização',
    
    -- Índices para performance
    UNIQUE KEY uk_chave_status (chave, status),
    INDEX idx_status (status),
    INDEX idx_pagina (pagina),
    INDEX idx_tipo (tipo),
    INDEX idx_data_modificacao (data_modificacao),
    INDEX idx_versao (versao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela para armazenar textos e conteúdos';

-- ========================================
-- 3. TABELA DE RELACIONAMENTO PÁGINA-IMAGENS (COMPLETA)
-- ========================================
CREATE TABLE pagina_imagens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pagina_id VARCHAR(255) NOT NULL COMMENT 'Identificador da página',
    imagem_id BIGINT NOT NULL COMMENT 'ID da imagem',
    posicao INT NOT NULL DEFAULT 0 COMMENT 'Posição da imagem na página',
    contexto VARCHAR(255) DEFAULT NULL COMMENT 'Contexto de uso (banner, galeria, etc.)',
    propriedades JSON DEFAULT NULL COMMENT 'Propriedades específicas (width, height, etc.)',
    status ENUM('ativo', 'inativo') DEFAULT 'ativo' COMMENT 'Status do relacionamento',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação do registro',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última atualização',
    
    -- Índices para performance
    INDEX idx_pagina (pagina_id),
    INDEX idx_imagem (imagem_id),
    INDEX idx_posicao (posicao),
    INDEX idx_contexto (contexto),
    INDEX idx_status (status),
    UNIQUE KEY uk_pagina_imagem_contexto (pagina_id, imagem_id, contexto),
    
    -- Chave estrangeira
    FOREIGN KEY (imagem_id) REFERENCES imagens(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Relacionamento entre páginas e imagens';

-- ========================================
-- 4. TABELA DE BACKUPS (COMPLETA)
-- ========================================
CREATE TABLE backups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome_arquivo VARCHAR(255) NOT NULL COMMENT 'Nome do arquivo de backup',
    tamanho BIGINT NOT NULL DEFAULT 0 COMMENT 'Tamanho do backup em bytes',
    tipo ENUM('completo', 'incremental', 'imagens', 'textos') DEFAULT 'completo' COMMENT 'Tipo de backup',
    data_backup DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora do backup',
    url_arquivo VARCHAR(500) NOT NULL COMMENT 'Caminho para o arquivo de backup',
    status ENUM('ativo', 'inativo', 'corrompido') DEFAULT 'ativo' COMMENT 'Status do backup',
    descricao TEXT DEFAULT NULL COMMENT 'Descrição do backup',
    hash_md5 CHAR(32) DEFAULT NULL COMMENT 'Hash MD5 do arquivo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação do registro',
    
    -- Índices para performance
    INDEX idx_data_backup (data_backup),
    INDEX idx_tipo (tipo),
    INDEX idx_status (status),
    INDEX idx_hash (hash_md5),
    INDEX idx_tamanho (tamanho)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela para controle de backups';

-- ========================================
-- 5. TABELA DE LOGS DO SISTEMA (COMPLETA)
-- ========================================
CREATE TABLE system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    acao VARCHAR(100) NOT NULL COMMENT 'Ação realizada (INSERT, UPDATE, DELETE)',
    tabela_afetada VARCHAR(100) DEFAULT NULL COMMENT 'Tabela que foi afetada',
    registro_id BIGINT DEFAULT NULL COMMENT 'ID do registro afetado',
    dados_anteriores JSON DEFAULT NULL COMMENT 'Dados antes da alteração',
    dados_novos JSON DEFAULT NULL COMMENT 'Dados após a alteração',
    usuario VARCHAR(100) DEFAULT NULL COMMENT 'Usuário que executou a ação',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Endereço IP do usuário',
    user_agent TEXT DEFAULT NULL COMMENT 'User Agent do navegador',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora da ação',
    
    -- Índices para performance
    INDEX idx_acao (acao),
    INDEX idx_tabela (tabela_afetada),
    INDEX idx_registro (registro_id),
    INDEX idx_usuario (usuario),
    INDEX idx_created_at (created_at),
    INDEX idx_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log de todas as ações do sistema';

-- ========================================
-- 6. INSERIR DADOS DE EXEMPLO
-- ========================================
INSERT INTO textos (chave, conteudo, pagina, tipo, usuario) VALUES 
('site_title', 'HARDEM Construções', 'index', 'titulo', 'system'),
('site_subtitle', 'Construindo o futuro com qualidade e segurança', 'index', 'texto', 'system'),
('about_title', 'Sobre a HARDEM', 'about', 'titulo', 'system'),
('contact_email', 'contato@hardem.com.br', 'contact', 'texto', 'system'),
('welcome_message', 'Bem-vindos ao sistema HARDEM Editor com banco de dados!', 'index', 'paragrafo', 'system');

-- ========================================
-- 7. CRIAR USUÁRIO ESPECÍFICO (OPCIONAL)
-- ========================================
-- Descomente as linhas abaixo se quiser criar um usuário específico
-- CREATE USER IF NOT EXISTS 'hardem_user'@'localhost' IDENTIFIED BY 'hardem_2024_secure!';
-- GRANT ALL PRIVILEGES ON hardem_editor.* TO 'hardem_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ========================================
-- 8. VERIFICAÇÕES FINAIS
-- ========================================

-- Mostrar todas as tabelas criadas
SELECT 'TABELAS CRIADAS:' AS info;
SHOW TABLES;

-- Mostrar estrutura das tabelas principais
SELECT 'ESTRUTURA DA TABELA IMAGENS:' AS info;
DESCRIBE imagens;

SELECT 'ESTRUTURA DA TABELA TEXTOS:' AS info;
DESCRIBE textos;

SELECT 'ESTRUTURA DA TABELA PAGINA_IMAGENS:' AS info;
DESCRIBE pagina_imagens;

SELECT 'ESTRUTURA DA TABELA BACKUPS:' AS info;
DESCRIBE backups;

SELECT 'ESTRUTURA DA TABELA SYSTEM_LOGS:' AS info;
DESCRIBE system_logs;

-- Verificar se os dados de exemplo foram inseridos
SELECT 'DADOS DE EXEMPLO INSERIDOS:' AS info;
SELECT COUNT(*) as total_textos FROM textos;
SELECT chave, conteudo, tipo FROM textos LIMIT 5;

-- Verificar chaves estrangeiras
SELECT 'CHAVES ESTRANGEIRAS:' AS info;
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'hardem_editor'
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verificar índices criados
SELECT 'ÍNDICES CRIADOS:' AS info;
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'hardem_editor'
ORDER BY TABLE_NAME, INDEX_NAME;

SELECT '✅ INSTALAÇÃO COMPLETA!' AS status; 