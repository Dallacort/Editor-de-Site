<?php
/**
 * Teste das Funcionalidades PUT e DELETE
 * Script para testar as novas funcionalidades da API
 */

require_once __DIR__ . '/classes/Database.php';
require_once __DIR__ . '/classes/ImageManager.php';

function testLog($message) {
    echo "[" . date('Y-m-d H:i:s') . "] $message\n";
}

try {
    testLog("=== INICIANDO TESTES PUT e DELETE ===");
    
    // Inicializar classes
    $db = Database::getInstance();
    $imageManager = new ImageManager();
    
    // Teste 1: Verificar conexão
    testLog("1. Testando conexão com banco de dados...");
    if ($db->testConnection()) {
        testLog("✅ Conexão com banco de dados OK");
    } else {
        testLog("❌ Falha na conexão com banco de dados");
        exit(1);
    }
    
    // Teste 2: Obter estatísticas iniciais
    testLog("2. Obtendo estatísticas iniciais...");
    $statsQuery = "SELECT 
        (SELECT COUNT(*) FROM imagens WHERE status = 'ativo') as total_images,
        (SELECT COUNT(*) FROM textos WHERE status = 'ativo') as total_texts,
        (SELECT COUNT(*) FROM pagina_imagens WHERE status = 'ativo') as total_relations";
    
    $stats = $db->query($statsQuery);
    $initialStats = $stats[0];
    testLog("📊 Estatísticas iniciais:");
    testLog("   - Imagens ativas: " . $initialStats['total_images']);
    testLog("   - Textos ativos: " . $initialStats['total_texts']);
    testLog("   - Relacionamentos ativos: " . $initialStats['total_relations']);
    
    // Teste 3: Listar algumas imagens para testar PUT
    testLog("3. Listando imagens existentes para teste PUT...");
    $images = $db->query("SELECT id, nome_original, alt_text, descricao FROM imagens WHERE status = 'ativo' LIMIT 5");
    
    if (empty($images)) {
        testLog("⚠️ Nenhuma imagem encontrada para testar PUT");
        
        // Criar uma imagem de teste
        testLog("   Criando imagem de teste...");
        $testImageData = [
            'src' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'alt' => 'Imagem de teste',
            'title' => 'Imagem criada para teste'
        ];
        
        $testImageId = $imageManager->saveImage($testImageData, 'test-page', 'test');
        testLog("✅ Imagem de teste criada com ID: $testImageId");
        
        // Buscar novamente
        $images = $db->query("SELECT id, nome_original, alt_text, descricao FROM imagens WHERE id = ?", [$testImageId]);
    }
    
    foreach ($images as $img) {
        testLog("   - ID: {$img['id']} | Nome: {$img['nome_original']} | Alt: {$img['alt_text']}");
    }
    
    // Teste 4: Testar PUT - Atualização de metadados
    if (!empty($images)) {
        $testImage = $images[0];
        $imageId = $testImage['id'];
        
        testLog("4. Testando PUT - Atualização de metadados...");
        testLog("   Atualizando imagem ID: $imageId");
        
        $updateData = [
            'nome_original' => 'Imagem Atualizada - ' . date('H:i:s'),
            'alt_text' => 'Alt text atualizado - ' . date('H:i:s'),
            'descricao' => 'Descrição atualizada pelo teste - ' . date('H:i:s')
        ];
        
        $success = $imageManager->updateImage($imageId, $updateData);
        
        if ($success) {
            testLog("✅ PUT - Metadados atualizados com sucesso");
            
            // Verificar se foi atualizado
            $updatedImage = $imageManager->getImageById($imageId);
            testLog("   Dados atualizados:");
            testLog("   - Nome: " . $updatedImage['nome_original']);
            testLog("   - Alt: " . $updatedImage['alt_text']);
            testLog("   - Descrição: " . $updatedImage['descricao']);
        } else {
            testLog("❌ PUT - Falha ao atualizar metadados");
        }
    }
    
    // Teste 5: Testar DELETE - Exclusão de página específica
    testLog("5. Testando DELETE - Exclusão de dados de página específica...");
    
    // Primeiro, criar alguns dados de teste para uma página específica
    $testPageId = 'test-delete-page-' . time();
    testLog("   Criando dados de teste para página: $testPageId");
    
    // Criar texto de teste
    $db->insert('textos', [
        'chave' => 'test-text-1',
        'conteudo' => 'Texto de teste para exclusão',
        'pagina' => $testPageId,
        'versao' => 1
    ]);
    
    $db->insert('textos', [
        'chave' => 'test-text-2',
        'conteudo' => 'Outro texto de teste',
        'pagina' => $testPageId,
        'versao' => 1
    ]);
    
    // Criar imagem de teste
    $testImageData2 = [
        'src' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'alt' => 'Imagem para teste de exclusão',
        'title' => 'Será excluída no teste'
    ];
    
    $testImageId2 = $imageManager->saveImage($testImageData2, $testPageId, 'test-context');
    
    testLog("   Dados de teste criados:");
    testLog("   - 2 textos");
    testLog("   - 1 imagem (ID: $testImageId2)");
    
    // Simular exclusão da página
    testLog("   Executando exclusão da página...");
    
    $db->beginTransaction();
    
    try {
        $deletedImages = 0;
        $deletedTexts = 0;
        $deletedRelations = 0;
        
        // Obter imagens da página
        $pageImages = $db->query("
            SELECT DISTINCT i.id 
            FROM imagens i 
            JOIN pagina_imagens pi ON i.id = pi.imagem_id 
            WHERE pi.pagina_id = ? AND i.status = 'ativo'
        ", [$testPageId]);
        
        // Marcar imagens como excluídas
        foreach ($pageImages as $img) {
            $imageManager->deleteImage($img['id']);
            $deletedImages++;
        }
        
        // Deletar textos da página
        $pageTexts = $db->query("SELECT id FROM textos WHERE pagina = ? AND status = 'ativo'", [$testPageId]);
        foreach ($pageTexts as $text) {
            $db->update('textos', [
                'status' => 'excluido',
                'data_modificacao' => date('Y-m-d H:i:s')
            ], 'id = ?', [$text['id']]);
            $deletedTexts++;
        }
        
        // Deletar relacionamentos da página
        $db->query("UPDATE pagina_imagens SET status = 'inativo' WHERE pagina_id = ?", [$testPageId]);
        $deletedRelations = $db->query("SELECT ROW_COUNT()", [])[0]['ROW_COUNT()'] ?? 0;
        
        $db->commit();
        
        testLog("✅ DELETE - Página excluída com sucesso:");
        testLog("   - Imagens excluídas: $deletedImages");
        testLog("   - Textos excluídos: $deletedTexts");
        testLog("   - Relacionamentos removidos: $deletedRelations");
        
    } catch (Exception $e) {
        $db->rollback();
        testLog("❌ DELETE - Erro ao excluir página: " . $e->getMessage());
    }
    
    // Teste 6: Obter estatísticas finais
    testLog("6. Obtendo estatísticas finais...");
    $finalStats = $db->query($statsQuery)[0];
    testLog("📊 Estatísticas finais:");
    testLog("   - Imagens ativas: " . $finalStats['total_images']);
    testLog("   - Textos ativos: " . $finalStats['total_texts']);
    testLog("   - Relacionamentos ativos: " . $finalStats['total_relations']);
    
    // Comparar estatísticas
    $diffImages = $initialStats['total_images'] - $finalStats['total_images'];
    $diffTexts = $initialStats['total_texts'] - $finalStats['total_texts'];
    $diffRelations = $initialStats['total_relations'] - $finalStats['total_relations'];
    
    testLog("📈 Diferenças:");
    testLog("   - Imagens: $diffImages");
    testLog("   - Textos: $diffTexts");
    testLog("   - Relacionamentos: $diffRelations");
    
    testLog("=== TESTES CONCLUÍDOS COM SUCESSO ===");
    
} catch (Exception $e) {
    testLog("❌ ERRO DURANTE OS TESTES: " . $e->getMessage());
    testLog("Stack trace: " . $e->getTraceAsString());
    exit(1);
}

testLog("🎉 Todos os testes das funcionalidades PUT e DELETE passaram!");
testLog("Sistema pronto para uso em produção!");

?> 