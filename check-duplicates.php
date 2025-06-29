<?php
require_once 'classes/Database.php';

try {
    $db = Database::getInstance();
    
    echo "<h1>🔍 Verificando Registros Duplicados</h1>";
    
    // Buscar registros duplicados
    $duplicates = $db->query("
        SELECT 
            pi.pagina_id,
            pi.contexto,
            COUNT(*) as total,
            GROUP_CONCAT(pi.id) as ids,
            GROUP_CONCAT(pi.imagem_id) as image_ids
        FROM pagina_imagens pi
        WHERE pi.status = 'ativo'
        GROUP BY pi.pagina_id, pi.contexto
        HAVING COUNT(*) > 1
    ");
    
    if (empty($duplicates)) {
        echo "<p>✅ Nenhum registro duplicado encontrado!</p>";
    } else {
        echo "<h2>⚠️ Registros Duplicados Encontrados:</h2>";
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr><th>Página</th><th>Contexto</th><th>Total</th><th>IDs</th><th>Image IDs</th></tr>";
        
        foreach ($duplicates as $dup) {
            echo "<tr>";
            echo "<td>{$dup['pagina_id']}</td>";
            echo "<td>{$dup['contexto']}</td>";
            echo "<td>{$dup['total']}</td>";
            echo "<td>{$dup['ids']}</td>";
            echo "<td>{$dup['image_ids']}</td>";
            echo "</tr>";
        }
        
        echo "</table>";
        
        // Corrigir duplicatas
        echo "<h2>🔧 Corrigindo Duplicatas...</h2>";
        
        $db->beginTransaction();
        
        try {
            foreach ($duplicates as $dup) {
                $ids = explode(',', $dup['ids']);
                $imageIds = explode(',', $dup['image_ids']);
                
                // Pegar o registro mais recente (maior ID)
                $latestId = max($ids);
                $latestImageId = max(array_filter($imageIds, function($id) { return $id > 0; })) ?: 0;
                
                // Atualizar o registro mais recente com a imagem mais recente
                if ($latestImageId > 0) {
                    $db->query("
                        UPDATE pagina_imagens 
                        SET imagem_id = ?, updated_at = NOW()
                        WHERE id = ?
                    ", [$latestImageId, $latestId]);
                }
                
                // Desativar os outros registros
                $otherIds = array_filter($ids, function($id) use ($latestId) { 
                    return $id != $latestId; 
                });
                
                if (!empty($otherIds)) {
                    $db->query("
                        UPDATE pagina_imagens 
                        SET status = 'inativo', updated_at = NOW()
                        WHERE id IN (" . implode(',', $otherIds) . ")
                    ");
                }
                
                echo "<p>✅ Corrigido: Página {$dup['pagina_id']}, Contexto {$dup['contexto']}</p>";
            }
            
            $db->commit();
            echo "<p>✅ Todas as duplicatas foram corrigidas!</p>";
            
        } catch (Exception $e) {
            $db->rollback();
            throw new Exception("Erro ao corrigir duplicatas: " . $e->getMessage());
        }
    }
    
} catch (Exception $e) {
    echo "<p>❌ Erro: " . htmlspecialchars($e->getMessage()) . "</p>";
}

// Adicionar estilo básico
echo "<style>
body {
    font-family: Arial, sans-serif;
    margin: 20px;
    background: #f5f5f5;
}
h1, h2 {
    color: #333;
}
table {
    background: white;
    margin: 20px 0;
}
th, td {
    padding: 8px;
    text-align: left;
}
th {
    background: #eee;
}
</style>"; 