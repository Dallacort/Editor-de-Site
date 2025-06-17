<?php
echo "=== TESTE HTTP DO LOAD-DATABASE.PHP ===\n";

$url = 'http://localhost:8000/load-database.php?page=siteContent_index.html';

echo "URL: $url\n";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 10
    ]
]);

try {
    $response = file_get_contents($url, false, $context);
    
    if ($response === false) {
        echo "❌ Erro na requisição HTTP\n";
        exit(1);
    }
    
    echo "✅ Resposta recebida (" . strlen($response) . " bytes)\n";
    echo "Primeiros 200 caracteres:\n";
    echo substr($response, 0, 200) . "\n\n";
    
    // Verificar se é JSON
    $json = json_decode($response, true);
    if ($json) {
        echo "✅ JSON válido\n";
        echo "Sucesso: " . ($json['success'] ? 'SIM' : 'NÃO') . "\n";
        echo "Fonte: " . ($json['source'] ?? 'não especificada') . "\n";
        if (isset($json['data'])) {
            echo "Dados: " . count($json['data']) . " itens\n";
        }
    } else {
        echo "❌ JSON inválido: " . json_last_error_msg() . "\n";
        echo "Últimos 200 caracteres:\n";
        echo substr($response, -200) . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
}
?> 