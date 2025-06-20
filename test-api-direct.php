<?php
/**
 * Teste direto da API - HARDEM Editor
 * Testa se a API está processando corretamente
 */

echo "<h1>🧪 Teste Direto da API - HARDEM</h1>";

// Simular dados de POST
$_POST['action'] = 'upload_image_database_only';
$_POST['nome_original'] = 'teste_api.png';
$_POST['tipo_mime'] = 'image/png';
$_POST['tamanho'] = 1024;
$_POST['dados_base64'] = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
$_POST['alt_text'] = 'Teste API';
$_POST['descricao'] = 'Imagem de teste da API';
$_POST['data_key'] = 'test_img_1';
$_POST['pagina'] = 'test_page';
$_POST['element_info'] = '{}';
$_POST['is_header_content'] = false;
$_POST['timestamp'] = date('c');

echo "<h2>📊 Dados de Teste</h2>";
echo "<pre>";
print_r($_POST);
echo "</pre>";

echo "<h2>📡 Resultado da API</h2>";
echo "<div style='border: 1px solid #ccc; padding: 10px; background: #f9f9f9;'>";

// Capturar saída da API
ob_start();
try {
    include 'api-admin.php';
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage();
}
$apiOutput = ob_get_clean();

echo "<pre>" . htmlspecialchars($apiOutput) . "</pre>";
echo "</div>";

echo "<h2>📋 Logs</h2>";
$logFile = __DIR__ . '/hardem-editor.log';
if (file_exists($logFile)) {
    $logs = file_get_contents($logFile);
    $recentLogs = implode("\n", array_slice(explode("\n", $logs), -20));
    echo "<pre style='background: #000; color: #0f0; padding: 10px;'>" . htmlspecialchars($recentLogs) . "</pre>";
} else {
    echo "<p>❌ Arquivo de log não encontrado</p>";
}

?>

<style>
body {
    font-family: Arial, sans-serif;
    margin: 20px;
    background: #f5f5f5;
}
h1, h2 {
    color: #333;
}
pre {
    background: #fff;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
}
</style> 