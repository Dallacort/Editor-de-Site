<?php
require_once 'classes/Database.php';

try {
    $db = Database::getInstance();
    
    echo "=== ESTRUTURA DAS TABELAS ===\n\n";
    
    // Verificar tabela textos
    echo "--- TABELA TEXTOS ---\n";
    $textos = $db->query('DESCRIBE textos');
    foreach($textos as $col) {
        echo $col['Field'] . ' - ' . $col['Type'] . "\n";
    }
    
    // Verificar tabela pagina_imagens
    echo "\n--- TABELA PAGINA_IMAGENS ---\n";
    $pagina_imagens = $db->query('DESCRIBE pagina_imagens');
    foreach($pagina_imagens as $col) {
        echo $col['Field'] . ' - ' . $col['Type'] . "\n";
    }
    
    // Verificar tabela imagens
    echo "\n--- TABELA IMAGENS ---\n";
    $imagens = $db->query('DESCRIBE imagens');
    foreach($imagens as $col) {
        echo $col['Field'] . ' - ' . $col['Type'] . "\n";
    }
    
    // Testar query específica que está falhando
    echo "\n=== TESTE DE QUERIES ===\n";
    
    echo "Testando query de textos...\n";
    $textos = $db->query("
        SELECT chave, conteudo, tipo
        FROM textos
        WHERE pagina = ? AND status = 'ativo'
        ORDER BY data_modificacao DESC
    ", ['index']);
    echo "Textos encontrados: " . count($textos) . "\n";
    
    echo "Testando query de imagens...\n";
    $imagens = $db->query("
        SELECT pi.contexto as chave, i.url_arquivo as url_original, i.url_otimizada, i.alt_text, i.largura, i.altura, i.hash_md5
        FROM pagina_imagens pi
        JOIN imagens i ON pi.imagem_id = i.id
        WHERE pi.pagina_id = ? AND pi.status = 'ativo' AND i.status = 'ativo'
        ORDER BY pi.created_at DESC
    ", ['index']);
    echo "Imagens encontradas: " . count($imagens) . "\n";
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
?> 