<?php
echo "<h1>🧪 Teste Simples do Sistema</h1>";

try {
    require_once 'classes/Database.php';
    $db = Database::getInstance();
    
    echo "<p>✅ Banco conectado com sucesso!</p>";
    
    if ($db->testConnection()) {
        echo "<p>✅ Teste de conexão passou!</p>";
        
        // Testar uma consulta simples
        $version = $db->query("SELECT VERSION() as version");
        echo "<p>📊 Versão do banco: " . ($version[0]['version'] ?? 'N/A') . "</p>";
        
        // Verificar se arquivos JSON foram criados
        $dataDir = __DIR__ . '/data/';
        if (is_dir($dataDir)) {
            echo "<p>📁 Diretório de dados criado: $dataDir</p>";
            $files = scandir($dataDir);
            echo "<p>📄 Arquivos JSON: " . implode(', ', array_filter($files, function($f) { return strpos($f, '.json') !== false; })) . "</p>";
        }
        
    } else {
        echo "<p>❌ Teste de conexão falhou!</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Erro: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><strong>Próximos passos:</strong></p>";
echo "<ul>";
echo "<li>✅ O sistema está usando JSON como banco de dados</li>";
echo "<li>🔄 Agora teste o editor na página principal</li>";
echo "<li>💾 Faça uma edição e salve (Ctrl+S)</li>";
echo "<li>🔍 Verifique se os dados são salvos na pasta /data/</li>";
echo "</ul>";
?> 