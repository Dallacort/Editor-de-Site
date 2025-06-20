-- HARDEM Editor - Banco de Dados Database-Only (Sem arquivos físicos)
-- Versão 2.0 - Tudo no banco de dados

-- Criar banco se não existir
CREATE DATABASE IF NOT EXISTS hardem_editor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hardem_editor;

-- Tabela de imagens (COM dados binários)
CREATE TABLE IF NOT EXISTS imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_arquivo VARCHAR(255) NOT NULL,
    nome_original VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    tamanho INT NOT NULL DEFAULT 0,
    largura INT NULL,
    altura INT NULL,
    
    -- DADOS DA IMAGEM DIRETAMENTE NO BANCO
    dados_base64 LONGTEXT NULL,           -- Imagem original em base64
    thumbnail_base64 LONGTEXT NULL,       -- Thumbnail em base64
    url_externo VARCHAR(500) NULL,        -- Para URLs externas
    
    hash_md5 CHAR(32) NOT NULL,
    alt_text TEXT DEFAULT '',
    descricao TEXT DEFAULT '',
    status ENUM('ativo', 'inativo', 'excluido', 'substituido') DEFAULT 'ativo',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para performance
    INDEX idx_status (status),
    INDEX idx_hash (hash_md5),
    INDEX idx_tipo (tipo_mime),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de textos
CREATE TABLE IF NOT EXISTS textos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(255) NOT NULL,
    conteudo LONGTEXT NOT NULL,
    pagina VARCHAR(100) NOT NULL,
    versao INT DEFAULT 1,
    status ENUM('ativo', 'inativo', 'excluido') DEFAULT 'ativo',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_pagina (pagina),
    INDEX idx_chave (chave),
    INDEX idx_status (status),
    UNIQUE KEY unique_pagina_chave (pagina, chave, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relacionamento página-imagem
CREATE TABLE IF NOT EXISTS pagina_imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pagina_id VARCHAR(100) NOT NULL,
    imagem_id INT NOT NULL,
    contexto VARCHAR(100) NULL,
    posicao INT DEFAULT 1,
    propriedades JSON NULL,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (imagem_id) REFERENCES imagens(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_pagina (pagina_id),
    INDEX idx_imagem (imagem_id),
    INDEX idx_status (status),
    INDEX idx_posicao (posicao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NULL,
    descricao TEXT NULL,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
('sistema_nome', 'HARDEM Editor', 'Nome do sistema', 'string'),
('versao', '2.0', 'Versão do sistema', 'string'),
('armazenaento_tipo', 'database', 'Tipo de armazenamento: database ou files', 'string'),
('max_file_size', '10485760', 'Tamanho máximo de arquivo em bytes (10MB)', 'number'),
('thumbnail_width', '300', 'Largura máxima do thumbnail', 'number'),
('thumbnail_height', '300', 'Altura máxima do thumbnail', 'number'),
('cache_time', '31536000', 'Tempo de cache em segundos (1 ano)', 'number')
ON DUPLICATE KEY UPDATE valor=VALUES(valor);

-- Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nivel ENUM('info', 'warning', 'error', 'debug') DEFAULT 'info',
    categoria VARCHAR(50) NOT NULL,
    mensagem TEXT NOT NULL,
    contexto JSON NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_nivel (nivel),
    INDEX idx_categoria (categoria),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View para estatísticas
CREATE OR REPLACE VIEW vw_estatisticas AS
SELECT 
    (SELECT COUNT(*) FROM imagens WHERE status = 'ativo') as total_imagens,
    (SELECT COUNT(*) FROM textos WHERE status = 'ativo') as total_textos,
    (SELECT COUNT(*) FROM pagina_imagens WHERE status = 'ativo') as total_relacionamentos,
    (SELECT COALESCE(SUM(tamanho), 0) FROM imagens WHERE status = 'ativo') as tamanho_total,
    (SELECT COUNT(DISTINCT tipo_mime) FROM imagens WHERE status = 'ativo') as tipos_mime,
    (SELECT COUNT(DISTINCT pagina_id) FROM pagina_imagens WHERE status = 'ativo') as paginas_com_imagens;

-- Procedimento para limpeza de dados antigos
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS LimparDadosExcluidos()
BEGIN
    -- Limpar imagens excluídas há mais de 30 dias
    DELETE FROM imagens 
    WHERE status = 'excluido' 
    AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Limpar textos excluídos há mais de 30 dias
    DELETE FROM textos 
    WHERE status = 'excluido' 
    AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Limpar logs antigos (manter só últimos 90 dias)
    DELETE FROM system_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Otimizar tabelas
    OPTIMIZE TABLE imagens, textos, pagina_imagens, system_logs;
END //
DELIMITER ;

-- Trigger para log automático
DELIMITER //
CREATE TRIGGER IF NOT EXISTS log_imagem_insert 
AFTER INSERT ON imagens
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (nivel, categoria, mensagem, contexto) 
    VALUES ('info', 'imagem', 'Nova imagem adicionada', JSON_OBJECT('id', NEW.id, 'nome', NEW.nome_original));
END //

CREATE TRIGGER IF NOT EXISTS log_imagem_delete 
AFTER UPDATE ON imagens
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status AND NEW.status = 'excluido' THEN
        INSERT INTO system_logs (nivel, categoria, mensagem, contexto) 
        VALUES ('warning', 'imagem', 'Imagem excluída', JSON_OBJECT('id', NEW.id, 'nome', NEW.nome_original));
    END IF;
END //
DELIMITER ;

-- Inserir dados de exemplo (opcional)
-- INSERT INTO imagens (nome_arquivo, nome_original, tipo_mime, tamanho, dados_base64, hash_md5, alt_text) VALUES
-- ('exemplo.png', 'Imagem de Exemplo', 'image/png', 1024, 'iVBORw0KGgoAAAANSUhE...', MD5('exemplo'), 'Exemplo de imagem');

SHOW TABLES;
SELECT 'Banco de dados HARDEM Editor (Database-Only) criado com sucesso!' as status; 