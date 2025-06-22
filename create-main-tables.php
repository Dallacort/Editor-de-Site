<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== CRIANDO TABELAS PRINCIPAIS ===\n";

$config = require 'config/database.php';

try {
    $mysqli = new mysqli(
        $config['host'], 
        $config['username'], 
        $config['password'], 
        $config['database'], 
        $config['port']
    );
    
    if ($mysqli->connect_error) {
        die("❌ ERRO DE CONEXÃO: " . $mysqli->connect_error . "\n");
    }
    
    $mysqli->set_charset($config['charset']);
    echo "✅ Conectado ao banco\n";
    
    // Remover tabelas se existirem
    $mysqli->query("DROP TABLE IF EXISTS textos");
    $mysqli->query("DROP TABLE IF EXISTS imagens");
    echo "✅ Tabelas antigas removidas\n";
    
    // Criar tabela textos
    echo "\n--- CRIANDO TABELA TEXTOS ---\n";
    $sql_textos = "CREATE TABLE textos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        pagina VARCHAR(100) NOT NULL,
        elemento VARCHAR(200) NOT NULL,
        conteudo LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_pagina_elemento (pagina, elemento)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    if ($mysqli->query($sql_textos)) {
        echo "✅ Tabela 'textos' criada com sucesso\n";
    } else {
        echo "❌ Erro ao criar tabela textos: " . $mysqli->error . "\n";
        exit(1);
    }
    
    // Criar tabela imagens
    echo "\n--- CRIANDO TABELA IMAGENS ---\n";
    $sql_imagens = "CREATE TABLE imagens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        pagina VARCHAR(100) NOT NULL,
        elemento VARCHAR(200) NOT NULL,
        caminho VARCHAR(500) NOT NULL,
        alt_text VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_pagina_elemento (pagina, elemento)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    if ($mysqli->query($sql_imagens)) {
        echo "✅ Tabela 'imagens' criada com sucesso\n";
    } else {
        echo "❌ Erro ao criar tabela imagens: " . $mysqli->error . "\n";
        exit(1);
    }
    
    // Inserir dados de teste
    echo "\n--- INSERINDO DADOS DE TESTE ---\n";
    
    $mysqli->query("INSERT INTO textos (pagina, elemento, conteudo) VALUES ('index', 'hero-title', 'Bem-vindo ao HARDEM')");
    $mysqli->query("INSERT INTO textos (pagina, elemento, conteudo) VALUES ('index', 'hero-subtitle', 'Soluções em desenvolvimento web')");
    $mysqli->query("INSERT INTO imagens (pagina, elemento, caminho, alt_text) VALUES ('index', 'hero-image', 'assets/images/banner/01.jpg', 'Banner principal')");
    
    echo "✅ Dados de teste inseridos\n";
    
    // Verificar
    echo "\n--- VERIFICAÇÃO FINAL ---\n";
    
    $result = $mysqli->query("SELECT COUNT(*) as count FROM textos");
    $row = $result->fetch_assoc();
    echo "📊 Registros na tabela textos: " . $row['count'] . "\n";
    
    $result = $mysqli->query("SELECT COUNT(*) as count FROM imagens");
    $row = $result->fetch_assoc();
    echo "📊 Registros na tabela imagens: " . $row['count'] . "\n";
    
    // Testar consulta que estava falhando
    echo "\n--- TESTANDO CONSULTA PROBLEMÁTICA ---\n";
    $stmt = $mysqli->prepare("SELECT elemento, conteudo FROM textos WHERE pagina = ?");
    $pagina = 'index';
    $stmt->bind_param("s", $pagina);
    $stmt->execute();
    $result = $stmt->get_result();
    
    echo "✅ Query executada com sucesso!\n";
    echo "📊 Registros encontrados para página 'index': " . $result->num_rows . "\n";
    
    while ($row = $result->fetch_assoc()) {
        echo "   - {$row['elemento']}: {$row['conteudo']}\n";
    }
    
    $stmt->close();
    $mysqli->close();
    echo "\n✅ TABELAS CRIADAS COM SUCESSO!\n";
    
} catch (Exception $e) {
    echo "❌ ERRO: " . $e->getMessage() . "\n";
}
?> 