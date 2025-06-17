<?php
require_once 'classes/Database.php';

try {
    echo "=== TESTE DE CONEXÃO COM BANCO DE DADOS ===\n";
    
    $db = Database::getInstance();
    
    if ($db->testConnection()) {
        echo "✅ Conexão com banco estabelecida com sucesso!\n";
        
        // Testar insert
        echo "\n=== TESTE DE INSERT ===\n";
        $textId = $db->insert('textos', [
            'chave' => 'teste_' . time(),
            'conteudo' => 'Conteúdo de teste',
            'pagina' => 'teste',
            'tipo' => 'texto'
        ]);
        echo "✅ Texto inserido com ID: {$textId}\n";
        
        // Testar query
        echo "\n=== TESTE DE QUERY ===\n";
        $results = $db->query("SELECT * FROM textos WHERE id = ?", [$textId]);
        echo "✅ Query executada, resultado: " . json_encode($results[0] ?? 'nenhum') . "\n";
        
        // Testar update
        echo "\n=== TESTE DE UPDATE ===\n";
        $updated = $db->update('textos', [
            'conteudo' => 'Conteúdo atualizado'
        ], 'id = ?', [$textId]);
        echo "✅ Update executado, linhas afetadas: {$updated}\n";
        
        // Verificar update
        $results = $db->query("SELECT * FROM textos WHERE id = ?", [$textId]);
        echo "✅ Conteúdo após update: " . ($results[0]['conteudo'] ?? 'não encontrado') . "\n";
        
        echo "\n=== TODAS AS TABELAS ===\n";
        $tables = $db->query("SHOW TABLES");
        foreach ($tables as $table) {
            $tableName = array_values($table)[0];
            echo "📋 Tabela: {$tableName}\n";
        }
        
    } else {
        echo "❌ Falha na conexão com banco de dados\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERRO: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?> 