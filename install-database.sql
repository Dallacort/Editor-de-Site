-- HARDEM Editor - Script de Instalação do Banco de Dados
-- Execute este script no seu MariaDB para criar as tabelas necessárias

-- Criar banco de dados (se não existir)
CREATE DATABASE IF NOT EXISTS hardem_editor 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar o banco de dados
USE hardem_editor;

-- Tabela de imagens
CREATE TABLE IF NOT EXISTS imagens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome_arquivo VARCHAR(255) NOT NULL,
    nome_original VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamanho BIGINT NOT NULL,
    largura INT,
    altura INT,
    data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    url_arquivo VARCHAR(500) NOT NULL,
    url_otimizada VARCHAR(500),
    url_thumbnail VARCHAR(500),
    hash_md5 CHAR(32) NOT NULL,
    alt_text VARCHAR(255),
    descricao TEXT,
    status ENUM('ativo', 'inativo', 'excluido') DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_hash (hash_md5),
    INDEX idx_status (status),
    INDEX idx_tipo_mime (tipo_mime),
    INDEX idx_data_upload (data_upload),
    UNIQUE KEY uk_hash_status (hash_md5, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de textos/conteúdo
CREATE TABLE IF NOT EXISTS textos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    chave VARCHAR(255) NOT NULL,
    conteudo LONGTEXT NOT NULL,
    pagina VARCHAR(255),
    tipo ENUM('texto', 'titulo', 'paragrafo', 'link', 'lista') DEFAULT 'texto',
    data_modificacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    versao INT NOT NULL DEFAULT 1,
    usuario VARCHAR(100),
    status ENUM('ativo', 'inativo', 'excluido') DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_chave_status (chave, status),
    INDEX idx_status (status),
    INDEX idx_pagina (pagina),
    INDEX idx_tipo (tipo),
    INDEX idx_data_modificacao (data_modificacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relacionamento entre páginas e imagens
CREATE TABLE IF NOT EXISTS pagina_imagens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pagina_id VARCHAR(255) NOT NULL,
    imagem_id BIGINT NOT NULL,
    posicao INT NOT NULL DEFAULT 0,
    contexto VARCHAR(255), -- ex: 'banner', 'galeria', 'thumbnail'
    propriedades JSON, -- propriedades específicas como width, height, etc.
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_pagina (pagina_id),
    INDEX idx_imagem (imagem_id),
    INDEX idx_posicao (posicao),
    INDEX idx_contexto (contexto),
    INDEX idx_status (status),
    UNIQUE KEY uk_pagina_imagem_contexto (pagina_id, imagem_id, contexto),
    
    FOREIGN KEY (imagem_id) REFERENCES imagens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de backups
CREATE TABLE IF NOT EXISTS backups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome_arquivo VARCHAR(255) NOT NULL,
    tamanho BIGINT NOT NULL,
    tipo ENUM('completo', 'incremental', 'imagens', 'textos') DEFAULT 'completo',
    data_backup DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    url_arquivo VARCHAR(500) NOT NULL,
    status ENUM('ativo', 'inativo', 'corrompido') DEFAULT 'ativo',
    descricao TEXT,
    hash_md5 CHAR(32),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_data_backup (data_backup),
    INDEX idx_tipo (tipo),
    INDEX idx_status (status),
    INDEX idx_hash (hash_md5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100),
    registro_id BIGINT,
    dados_anteriores JSON,
    dados_novos JSON,
    usuario VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_acao (acao),
    INDEX idx_tabela (tabela_afetada),
    INDEX idx_registro (registro_id),
    INDEX idx_usuario (usuario),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados de exemplo para testes
INSERT INTO textos (chave, conteudo, pagina, tipo) VALUES 
('site_title', 'HARDEM Construções', 'index', 'titulo'),
('site_subtitle', 'Construindo o futuro com qualidade e segurança', 'index', 'texto'),
('about_title', 'Sobre a HARDEM', 'about', 'titulo'),
('contact_email', 'contato@hardem.com.br', 'contact', 'texto');

-- Criar usuário para a aplicação (opcional - você pode usar root)
-- CREATE USER IF NOT EXISTS 'hardem_user'@'localhost' IDENTIFIED BY 'hardem_2024!';
-- GRANT ALL PRIVILEGES ON hardem_editor.* TO 'hardem_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Mostrar tabelas criadas
SHOW TABLES;

-- Mostrar estrutura das tabelas principais
DESCRIBE imagens;
DESCRIBE textos;
DESCRIBE pagina_imagens; 