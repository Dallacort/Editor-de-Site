<?php
/**
 * HARDEM Editor - Save.php
 * Recebe e salva as edições do editor.js
 * @version 1.0.0
 */

// Configurar headers para CORS (permitir requisições locais)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Responder a requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Função para retornar resposta JSON
function sendResponse($status, $message, $data = null) {
    $response = [
        'status' => $status,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit();
}

// Verificar se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse('error', 'Apenas requisições POST são aceitas.');
}

try {
    // Ler dados da requisição
    $input = file_get_contents('php://input');
    
    if (empty($input)) {
        sendResponse('error', 'Nenhum dado foi enviado.');
    }
    
    // Decodificar JSON
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse('error', 'Dados JSON inválidos: ' . json_last_error_msg());
    }
    
    // Verificar se contentMap existe
    if (!isset($data['contentMap'])) {
        sendResponse('error', 'Campo contentMap não encontrado nos dados enviados.');
    }
    
    $contentMap = $data['contentMap'];
    
    // Preparar dados para salvar
    $saveData = [
        'contentMap' => $contentMap,
        'metadata' => [
            'lastUpdate' => date('Y-m-d H:i:s'),
            'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            'url' => $data['url'] ?? 'Unknown',
            'totalElements' => count($contentMap),
            'version' => '1.0.0'
        ]
    ];
    
    // Nome do arquivo de destino
    $filename = 'site-content.json';
    
    // Fazer backup do arquivo anterior (se existir)
    if (file_exists($filename)) {
        $backupName = 'site-content-backup-' . date('Y-m-d-H-i-s') . '.json';
        copy($filename, $backupName);
    }
    
    // Salvar dados no arquivo JSON
    $jsonData = json_encode($saveData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    if ($jsonData === false) {
        sendResponse('error', 'Erro ao codificar dados para JSON.');
    }
    
    $bytesWritten = file_put_contents($filename, $jsonData, LOCK_EX);
    
    if ($bytesWritten === false) {
        sendResponse('error', 'Erro ao salvar arquivo. Verifique as permissões de escrita.');
    }
    
    // Verificar se o arquivo foi salvo corretamente
    if (!file_exists($filename)) {
        sendResponse('error', 'Arquivo não foi criado. Verifique as permissões do diretório.');
    }
    
    // Sucesso!
    sendResponse('success', 'Conteúdo salvo com sucesso.', [
        'filename' => $filename,
        'size' => $bytesWritten,
        'elements' => count($contentMap),
        'backup' => isset($backupName) ? $backupName : null
    ]);
    
} catch (Exception $e) {
    sendResponse('error', 'Erro interno do servidor: ' . $e->getMessage());
}
?> 