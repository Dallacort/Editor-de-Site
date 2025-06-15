<?php
/**
 * HARDEM Editor - Save.php
 * Recebe e salva as edições do editor.js
 * @version 2.2.0
 */

// Configurações de limite e memória otimizadas para muitas imagens
ini_set('post_max_size', '200M');      // Aumentado para 200MB
ini_set('upload_max_filesize', '200M'); // Aumentado para 200MB  
ini_set('memory_limit', '1024M');       // Aumentado para 1GB
ini_set('max_execution_time', 600);     // Aumentado para 10 minutos
ini_set('max_input_time', 600);         // Aumentado para 10 minutos
ini_set('max_input_vars', 10000);       // Aumentado limite de variáveis

// Controle total de output
ob_start();
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Função para log seguro
function safeLog($message) {
    $logFile = __DIR__ . '/hardem-editor.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// Função para resposta JSON limpa
function sendJsonResponse($data, $httpCode = 200) {
    ob_clean(); // Limpar qualquer output
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, must-revalidate');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Verificar limite POST ANTES de processar dados
$postContentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
$maxPostSize = ini_get('post_max_size');
$maxPostBytes = (int)$maxPostSize * 1024 * 1024; // Converter para bytes

if ($postContentLength > $maxPostBytes) {
    safeLog("POST size limit exceeded: {$postContentLength} bytes > {$maxPostBytes} bytes");
    sendJsonResponse([
        'success' => false,
        'status' => 'error',
        'error_type' => 'post_size_limit',
        'message' => 'Dados muito grandes para o servidor.',
        'details' => [
            'sent_size' => $postContentLength,
            'max_size' => $maxPostBytes,
            'sent_mb' => round($postContentLength / 1024 / 1024, 2),
            'max_mb' => (int)$maxPostSize
        ],
        'solutions' => [
            'Reduza o tamanho das imagens antes de carregar',
            'Use imagens comprimidas (JPEG com qualidade 80%)',
            'Configure PHP: post_max_size = 50M no php.ini',
            'Salve em partes menores'
        ],
        'timestamp' => date('Y-m-d H:i:s'),
        'php_version' => PHP_VERSION
    ], 413);
}

// Verificar se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse([
        'success' => false,
        'status' => 'error',
        'message' => 'Apenas requisições POST são permitidas.',
        'timestamp' => date('Y-m-d H:i:s')
    ], 405);
}

// Verificar se há dados POST
if (empty($_POST)) {
    sendJsonResponse([
        'success' => false,
        'status' => 'error',
        'error_type' => 'empty_post',
        'message' => 'Nenhum dado recebido via POST.',
        'details' => [
            'content_length' => $postContentLength,
            'post_max_size' => $maxPostSize,
            'memory_limit' => ini_get('memory_limit')
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], 400);
}

try {
    safeLog("Iniciando processamento de salvamento - POST size: {$postContentLength} bytes");
    
    // Receber e validar dados JSON
    $rawData = $_POST['data'] ?? '';
    
    if (empty($rawData)) {
        throw new Exception('Parâmetro "data" não fornecido', 400);
    }
    
    // Verificar tamanho do JSON
    $jsonSize = strlen($rawData);
    $maxJsonSize = 100 * 1024 * 1024; // 100MB
    
    if ($jsonSize > $maxJsonSize) {
        throw new Exception("JSON muito grande: {$jsonSize} bytes", 413);
    }
    
    safeLog("JSON recebido: {$jsonSize} bytes");
    
    // Decodificar JSON
    $data = json_decode($rawData, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        $error = json_last_error_msg();
        safeLog("Erro JSON: {$error}");
        throw new Exception("Erro ao decodificar JSON: {$error}", 400);
    }
    
    if (!is_array($data)) {
        throw new Exception('Dados devem ser um objeto JSON', 400);
    }
    
    safeLog("JSON decodificado com sucesso - " . count($data) . " elementos");
    
    // Compressão automática se muito grande
    if ($jsonSize > 20 * 1024 * 1024) { // 20MB
        safeLog("Aplicando compressão JSON (tamanho > 20MB)");
        $rawData = gzencode($rawData, 9);
        $compressedSize = strlen($rawData);
        safeLog("Compressão: {$jsonSize} → {$compressedSize} bytes");
    }
    
    // Determinar nome do arquivo e salvar na pasta backups
    $timestamp = date('Y-m-d_H-i-s');
    $filename = "hardem-backup-{$timestamp}.json";
    
    // Criar pasta backups se não existir
    $backupsDir = __DIR__ . '/backups';
    if (!is_dir($backupsDir)) {
        mkdir($backupsDir, 0755, true);
    }
    
    $filepath = $backupsDir . '/' . $filename;
    
    // Salvar arquivo
    $bytesWritten = file_put_contents($filepath, $rawData, LOCK_EX);
    
    if ($bytesWritten === false) {
        throw new Exception('Falha ao escrever arquivo no disco', 500);
    }
    
    safeLog("Arquivo salvo: {$filename} ({$bytesWritten} bytes)");
    
    // Resposta de sucesso
    sendJsonResponse([
        'success' => true,
        'status' => 'success',
        'message' => 'Conteúdo salvo com sucesso na pasta backups.',
        'file_info' => [
            'filename' => $filename,
            'filepath' => realpath($filepath),
            'size_bytes' => $bytesWritten,
            'size_mb' => round($bytesWritten / 1024 / 1024, 2)
        ],
        'timestamp' => date('Y-m-d H:i:s'),
        'server_time' => time(),
        'php_version' => PHP_VERSION,
        'memory_usage' => memory_get_usage(true),
        'memory_peak' => memory_get_peak_usage(true),
        'post_max_size' => $maxPostSize,
        'memory_limit' => ini_get('memory_limit')
    ]);
    
} catch (Exception $e) {
    $errorCode = $e->getCode() ?: 500;
    $errorMessage = $e->getMessage();
    
    safeLog("ERRO: {$errorMessage} (Código: {$errorCode})");
    
    sendJsonResponse([
        'success' => false,
        'status' => 'error',
        'message' => $errorMessage,
        'error_code' => $errorCode,
        'timestamp' => date('Y-m-d H:i:s'),
        'php_version' => PHP_VERSION,
        'memory_usage' => memory_get_usage(true),
        'server_info' => [
            'post_max_size' => ini_get('post_max_size'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time')
        ]
    ], $errorCode);
}
?> 