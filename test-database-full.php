<?php
/**
 * Teste Completo do Sistema de Banco
 * Testa salvamento e carregamento do banco MariaDB
 */

echo "<!DOCTYPE html>
<html>
<head>
    <title>Teste Completo do Sistema de Banco</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        .section { border: 1px solid #ccc; padding: 15px; margin: 10px 0; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
        .test-result { padding: 10px; margin: 5px 0; border-radius: 5px; }
        .test-success { background: #d4edda; border: 1px solid #c3e6cb; }
        .test-error { background: #f8d7da; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>";

echo "<h1>🧪 Teste Completo do Sistema de Banco de Dados</h1>";

// Testar conexão com banco
echo "<div class='section'>";
echo "<h2>1. 🔗 Teste de Conexão</h2>";

try {
    require_once __DIR__ . '/classes/Database.php';
    $db = Database::getInstance();
    
    if ($db->testConnection()) {
        echo "<div class='test-result test-success'>✅ Conexão com banco estabelecida com sucesso!</div>";
        
        // Mostrar informações do banco
        $info = $db->query("SELECT VERSION() as version");
        if ($info) {
            echo "<div class='info'>📊 Versão do MariaDB: " . $info[0]['version'] . "</div>";
        }
        
    } else {
        echo "<div class='test-result test-error'>❌ Falha na conexão com banco</div>";
        exit;
    }
} catch (Exception $e) {
    echo "<div class='test-result test-error'>❌ Erro: " . $e->getMessage() . "</div>";
    exit;
}

echo "</div>";

// Testar estrutura das tabelas
echo "<div class='section'>";
echo "<h2>2. 📋 Verificação da Estrutura das Tabelas</h2>";

$tabelas = ['imagens', 'textos', 'pagina_imagens', 'system_logs'];

foreach ($tabelas as $tabela) {
    try {
        $colunas = $db->query("DESCRIBE $tabela");
        echo "<div class='test-result test-success'>✅ Tabela '$tabela' encontrada (" . count($colunas) . " colunas)</div>";
    } catch (Exception $e) {
        echo "<div class='test-result test-error'>❌ Tabela '$tabela' não encontrada: " . $e->getMessage() . "</div>";
    }
}

echo "</div>";

// Testar salvamento
echo "<div class='section'>";
echo "<h2>3. 💾 Teste de Salvamento</h2>";

$dadosTeste = [
    'url' => 'index.html',
    'contentMap' => [
        'test-texto-' . time() => 'Texto de teste ' . date('Y-m-d H:i:s'),
        'test-background-' . time() => [
            'backgroundImage' => 'assets/images/test/test-image.jpg',
            'elementInfo' => [
                'tagName' => 'div',
                'className' => 'test-element'
            ]
        ]
    ]
];

// Simular POST para save-database.php
$_POST['data'] = json_encode($dadosTeste);

ob_start();
$saveResult = null;

try {
    // Capturar output do save-database.php
    include 'save-database.php';
} catch (Exception $e) {
    echo "<div class='test-result test-error'>❌ Erro no salvamento: " . $e->getMessage() . "</div>";
}

$saveOutput = ob_get_clean();

// Tentar decodificar resultado do salvamento
if ($saveOutput) {
    $saveResult = json_decode($saveOutput, true);
    if ($saveResult && isset($saveResult['success'])) {
        if ($saveResult['success']) {
            echo "<div class='test-result test-success'>✅ Salvamento realizado com sucesso!</div>";
            echo "<div class='info'>📊 Estatísticas: " . 
                 ($saveResult['stats']['textos_salvos'] ?? 0) . " textos, " . 
                 ($saveResult['stats']['imagens_salvas'] ?? 0) . " imagens</div>";
        } else {
            echo "<div class='test-result test-error'>❌ Falha no salvamento: " . $saveResult['message'] . "</div>";
        }
    }
} else {
    echo "<div class='test-result test-error'>❌ Nenhuma resposta do sistema de salvamento</div>";
}

echo "</div>";

// Testar carregamento
echo "<div class='section'>";
echo "<h2>4. 📥 Teste de Carregamento</h2>";

$_GET['page'] = 'index';

ob_start();
$loadResult = null;

try {
    // Capturar output do load-database.php
    include 'load-database.php';
} catch (Exception $e) {
    echo "<div class='test-result test-error'>❌ Erro no carregamento: " . $e->getMessage() . "</div>";
}

$loadOutput = ob_get_clean();

// Tentar decodificar resultado do carregamento
if ($loadOutput) {
    $loadResult = json_decode($loadOutput, true);
    if ($loadResult && isset($loadResult['success'])) {
        if ($loadResult['success']) {
            echo "<div class='test-result test-success'>✅ Carregamento realizado com sucesso!</div>";
            echo "<div class='info'>📊 Fonte: " . ($loadResult['source'] ?? 'unknown') . "</div>";
            echo "<div class='info'>📊 Itens carregados: " . count($loadResult['data'] ?? []) . "</div>";
            
            if (!empty($loadResult['data'])) {
                echo "<details>";
                echo "<summary>🔍 Ver dados carregados</summary>";
                echo "<pre>" . htmlspecialchars(json_encode($loadResult['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . "</pre>";
                echo "</details>";
            }
        } else {
            echo "<div class='test-result test-error'>❌ Falha no carregamento: " . $loadResult['message'] . "</div>";
        }
    }
} else {
    echo "<div class='test-result test-error'>❌ Nenhuma resposta do sistema de carregamento</div>";
}

echo "</div>";

// Estatísticas do banco
echo "<div class='section'>";
echo "<h2>5. 📈 Estatísticas do Banco</h2>";

try {
    foreach ($tabelas as $tabela) {
        $count = $db->query("SELECT COUNT(*) as total FROM $tabela");
        $total = $count[0]['total'] ?? 0;
        echo "<div class='info'>📋 Tabela '$tabela': $total registros</div>";
    }
} catch (Exception $e) {
    echo "<div class='test-result test-error'>❌ Erro ao obter estatísticas: " . $e->getMessage() . "</div>";
}

echo "</div>";

// Verificação de logs
echo "<div class='section'>";
echo "<h2>6. 📜 Logs do Sistema</h2>";

$logFile = __DIR__ . '/hardem-editor.log';
if (file_exists($logFile)) {
    $logSize = filesize($logFile);
    echo "<div class='info'>📄 Arquivo de log encontrado (" . number_format($logSize) . " bytes)</div>";
    
    if ($logSize > 0 && $logSize < 50000) { // Mostrar apenas se menor que 50KB
        echo "<details>";
        echo "<summary>🔍 Ver últimas 20 linhas do log</summary>";
        $lines = file($logFile);
        $lastLines = array_slice($lines, -20);
        echo "<pre>" . htmlspecialchars(implode('', $lastLines)) . "</pre>";
        echo "</details>";
    }
} else {
    echo "<div class='info'>📄 Nenhum arquivo de log encontrado</div>";
}

echo "</div>";

echo "<h2>🎯 Resumo do Teste</h2>";
echo "<p>Teste concluído em " . date('Y-m-d H:i:s') . "</p>";
echo "<p><strong>Para usar o sistema:</strong></p>";
echo "<ul>";
echo "<li>✅ Os arquivos JavaScript já foram atualizados para usar save-database.php e load-database.php</li>";
echo "<li>🔄 Recarregue a página do site para testar o sistema completo</li>";
echo "<li>💾 Os dados agora são salvos no banco MariaDB ao invés de arquivos JSON</li>";
echo "<li>🔍 Use o painel de administração (admin-panel.html) para gerenciar os dados</li>";
echo "</ul>";

echo "</body></html>";
?> 