<?php
// Teste dos cabeçalhos HTTP
$testData = [
    'contentMap' => [
        'header-test-' . time() => 'Teste de cabeçalhos'
    ],
    'url' => 'http://localhost:8000/index.html',
    'timestamp' => date('c'),
    'metadata' => ['test' => true]
];

$postData = http_build_query(['data' => json_encode($testData)]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => $postData
    ]
]);

echo "=== TESTE DE CABEÇALHOS HTTP ===\n";

$response = file_get_contents('http://localhost:8000/save-database.php', false, $context);

echo "Cabeçalhos de resposta:\n";
foreach ($http_response_header as $header) {
    echo "  $header\n";
}

echo "\nCorpo da resposta:\n";
echo $response . "\n";

// Verificar se é JSON válido
$json = json_decode($response, true);
if ($json) {
    echo "\n✅ JSON válido\n";
} else {
    echo "\n❌ JSON inválido: " . json_last_error_msg() . "\n";
}
?> 