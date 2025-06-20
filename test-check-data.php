<?php
require_once 'classes/Database.php';

try {
    $db = Database::getInstance();
    
    echo "=== DADOS SALVOS NO BANCO ===\n\n";
    
    // Verificar textos
    echo "--- TEXTOS ---\n";
    $textos = $db->query('SELECT * FROM textos ORDER BY id DESC LIMIT 5');
    foreach($textos as $t) {
        echo "ID: {$t['id']}, Chave: {$t['chave']}, Conteúdo: " . substr($t['conteudo'], 0, 50) . "...\n";
    }
    
    // Verificar imagens
    echo "\n--- IMAGENS ---\n";
    $imagens = $db->query('SELECT * FROM imagens ORDER BY id DESC LIMIT 5');
    foreach($imagens as $i) {
        echo "ID: {$i['id']}, Nome: {$i['nome_arquivo']}, Hash: {$i['hash_md5']}\n";
    }
    

    
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?> 