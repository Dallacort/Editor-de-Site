<?php
// Teste do load-database.php
echo "=== TESTE DO LOAD-DATABASE.PHP ===\n";

// Simular requisição GET
$_GET['page'] = 'siteContent_index.html';
$_SERVER['REQUEST_METHOD'] = 'GET';

echo "Testando carregamento para página: siteContent_index.html\n\n";

// Capturar saída
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    include 'load-database.php';
} catch (ParseError $e) {
    echo "❌ Erro de sintaxe PHP: " . $e->getMessage() . "\n";
    echo "Arquivo: " . $e->getFile() . " linha " . $e->getLine() . "\n";
} catch (Error $e) {
    echo "❌ Erro fatal: " . $e->getMessage() . "\n";
    echo "Arquivo: " . $e->getFile() . " linha " . $e->getLine() . "\n";
} catch (Exception $e) {
    echo "❌ Exceção: " . $e->getMessage() . "\n";
    echo "Arquivo: " . $e->getFile() . " linha " . $e->getLine() . "\n";
}

$output = ob_get_clean();
echo "Saída capturada:\n" . $output . "\n";

// Verificar se é JSON válido
$json = json_decode($output, true);
if ($json) {
    echo "\n✅ JSON válido retornado\n";
    echo "Tipo de fonte: " . ($json['source'] ?? 'não especificado') . "\n";
    if (isset($json['data'])) {
        echo "Dados encontrados: " . count($json['data']) . " itens\n";
    }
} else {
    echo "\n❌ JSON inválido: " . json_last_error_msg() . "\n";
}
?> 