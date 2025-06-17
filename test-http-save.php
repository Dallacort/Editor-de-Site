<?php
// Teste HTTP do save-database.php
$testData = [
    'contentMap' => [
        'http-test-' . time() => 'Teste via HTTP',
        'http-image-' . time() => [
            'src' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'type' => 'image'
        ]
    ],
    'url' => 'http://localhost:8000/index.html',
    'timestamp' => date('c'),
    'metadata' => [
        'test_http' => true
    ]
];

$postData = http_build_query([
    'data' => json_encode($testData)
]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => $postData
    ]
]);

echo "=== TESTE HTTP DO SAVE-DATABASE.PHP ===\n";
echo "URL: http://localhost:8000/save-database.php\n";
echo "Dados: " . strlen($postData) . " bytes\n\n";

try {
    $response = file_get_contents('http://localhost:8000/save-database.php', false, $context);
    
    if ($response === false) {
        echo "❌ Erro na requisição HTTP\n";
        exit(1);
    }
    
    echo "✅ Resposta recebida:\n";
    echo $response . "\n";
    
    // Tentar decodificar JSON
    $json = json_decode($response, true);
    if ($json) {
        echo "\n=== ANÁLISE DA RESPOSTA ===\n";
        echo "Sucesso: " . ($json['success'] ? 'SIM' : 'NÃO') . "\n";
        if (isset($json['stats'])) {
            echo "Textos salvos: " . $json['stats']['textos_salvos'] . "\n";
            echo "Imagens salvas: " . $json['stats']['imagens_salvas'] . "\n";
            echo "Erros: " . $json['stats']['erros'] . "\n";
        }
        if (isset($json['message'])) {
            echo "Mensagem: " . $json['message'] . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
?> 