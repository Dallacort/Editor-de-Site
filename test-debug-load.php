<?php
require_once 'classes/Database.php';

try {
    $db = Database::getInstance();
    
    echo "=== DEBUG LOAD-DATABASE ===\n\n";
    
    // Verificar páginas existentes
    echo "--- PÁGINAS NA TABELA TEXTOS ---\n";
    $paginas = $db->query('SELECT DISTINCT pagina FROM textos');
    foreach($paginas as $p) {
        echo "Página: '" . $p['pagina'] . "'\n";
    }
    
    // Verificar páginas na tabela pagina_imagens
    echo "\n--- PÁGINAS NA TABELA PAGINA_IMAGENS ---\n";
    $paginas_img = $db->query('SELECT DISTINCT pagina_id FROM pagina_imagens');
    foreach($paginas_img as $p) {
        echo "Página: '" . $p['pagina_id'] . "'\n";
    }
    
    // Testar com diferentes pageIds
    $testPages = ['index', 'siteContent_index.html', 'siteContent_index', 'test'];
    
    foreach($testPages as $pageId) {
        echo "\n--- TESTANDO PÁGINA: '$pageId' ---\n";
        
        $textos = $db->query("
            SELECT chave, conteudo, tipo
            FROM textos
            WHERE pagina = ? AND status = 'ativo'
            ORDER BY data_modificacao DESC
        ", [$pageId]);
        echo "Textos encontrados: " . count($textos) . "\n";
        
        $imagens = $db->query("
            SELECT pi.contexto as chave, i.url_arquivo as url_original, i.url_otimizada, i.alt_text, i.largura, i.altura, i.hash_md5
            FROM pagina_imagens pi
            JOIN imagens i ON pi.imagem_id = i.id
            WHERE pi.pagina_id = ? AND pi.status = 'ativo' AND i.status = 'ativo'
            ORDER BY pi.created_at DESC
        ", [$pageId]);
        echo "Imagens encontradas: " . count($imagens) . "\n";
        
        $total = count($textos) + count($imagens);
        echo "Total de itens: $total\n";
        
        if ($total > 0) {
            echo "✅ Esta página tem dados!\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
?> 