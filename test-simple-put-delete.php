<?php
/**
 * Teste Simples PUT e DELETE
 */

// Ativar display de erros
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "=== TESTE SIMPLES PUT e DELETE ===\n";

try {
    // Carregar classes
    echo "1. Carregando classes...\n";
    require_once __DIR__ . '/classes/Database.php';
    require_once __DIR__ . '/classes/ImageManager.php';
    echo "   ✅ Classes carregadas\n";

    // Inicializar
    echo "2. Inicializando...\n";
    $db = Database::getInstance();
    $imageManager = new ImageManager();
    echo "   ✅ Instâncias criadas\n";

    // Testar conexão
    echo "3. Testando conexão...\n";
    if ($db->testConnection()) {
        echo "   ✅ Conexão OK\n";
    } else {
        echo "   ⚠️ Usando JSON fallback\n";
    }

    // Testar query simples
    echo "4. Testando query simples...\n";
    $result = $db->query("SELECT COUNT(*) as total FROM imagens WHERE status = 'ativo'");
    $totalImages = $result[0]['total'] ?? 0;
    echo "   ✅ Total de imagens ativas: $totalImages\n";

    // Se não há imagens, criar uma para teste
    if ($totalImages == 0) {
        echo "5. Criando imagem de teste...\n";
        $testImageData = [
            'src' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'alt' => 'Imagem de teste',
            'title' => 'Criada para teste PUT/DELETE'
        ];
        
        $imageId = $imageManager->saveImage($testImageData, 'test-page', 'test');
        echo "   ✅ Imagem criada com ID: $imageId\n";
        $totalImages = 1;
    }

    // Testar GET de imagens
    echo "6. Testando listagem de imagens...\n";
    $images = $db->query("SELECT id, nome_original, alt_text FROM imagens WHERE status = 'ativo' LIMIT 3");
    foreach ($images as $img) {
        echo "   - ID: {$img['id']} | Nome: {$img['nome_original']}\n";
    }

    // Testar PUT (update)
    if (!empty($images)) {
        $testImageId = $images[0]['id'];
        echo "7. Testando PUT (update metadados) - ID: $testImageId...\n";
        
        $updateData = [
            'nome_original' => 'ATUALIZADO - ' . date('H:i:s'),
            'alt_text' => 'Alt atualizado - ' . date('H:i:s'),
            'descricao' => 'Descrição teste - ' . date('H:i:s')
        ];
        
        $success = $imageManager->updateImage($testImageId, $updateData);
        
        if ($success) {
            echo "   ✅ PUT executado com sucesso\n";
            
            // Verificar se atualizou
            $updated = $imageManager->getImageById($testImageId);
            echo "   - Nome atualizado: {$updated['nome_original']}\n";
        } else {
            echo "   ❌ PUT falhou\n";
        }
    }

    echo "\n=== TESTE CONCLUÍDO COM SUCESSO ===\n";

} catch (Exception $e) {
    echo "❌ ERRO: " . $e->getMessage() . "\n";
    echo "Linha: " . $e->getLine() . "\n";
    echo "Arquivo: " . $e->getFile() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?> 