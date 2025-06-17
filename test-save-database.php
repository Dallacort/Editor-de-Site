<?php
// Teste simples do save-database.php
$testData = [
    'contentMap' => [
        'test-key-' . time() => 'Conteúdo de teste',
        'test-image-' . time() => [
            'src' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'type' => 'image'
        ]
    ],
    'url' => 'http://localhost:8000/test.html',
    'timestamp' => date('c'),
    'metadata' => [
        'test' => true
    ]
];

// Simular POST
$_POST['data'] = json_encode($testData);
$_SERVER['REQUEST_METHOD'] = 'POST';

echo "=== TESTE DO SAVE-DATABASE.PHP ===\n";
echo "Dados de teste preparados:\n";
echo json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

echo "=== EXECUTANDO SAVE-DATABASE.PHP ===\n";

// Capturar saída e erros
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    include 'save-database.php';
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
?> 