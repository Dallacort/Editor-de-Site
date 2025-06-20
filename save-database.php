<?php
/**
 * HARDEM Editor - Save Database
 * Versão melhorada que salva dados no banco MariaDB
 * @version 3.0.0
 */

// Configurações de limite e memória
ini_set('post_max_size', '200M');
ini_set('upload_max_filesize', '200M');
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', 600);
ini_set('max_input_time', 600);
ini_set('max_input_vars', 10000);

// Controle de output
ob_start();
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Incluir classes necessárias
require_once __DIR__ . '/classes/Database.php';
require_once __DIR__ . '/classes/ImageManager.php';

// Função para log seguro
function safeLog($message) {
    $logFile = __DIR__ . '/hardem-editor.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] [SAVE-DB] $message\n", FILE_APPEND | LOCK_EX);
}

// Função para resposta JSON limpa
function sendJsonResponse($data, $httpCode = 200) {
    ob_clean();
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, must-revalidate');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Verificar método de requisição
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
        'message' => 'Nenhum dado recebido.',
        'timestamp' => date('Y-m-d H:i:s')
    ], 400);
}

try {
    safeLog("Iniciando processamento de salvamento no banco de dados");
    
    // Receber dados
    $rawData = $_POST['data'] ?? '';
    
    if (empty($rawData)) {
        throw new Exception('Parâmetro "data" não fornecido', 400);
    }
    
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
    
    // Inicializar banco de dados e gerenciador de imagens
    $db = Database::getInstance();
    $imageManager = new ImageManager();
    
    // Testar conexão
    if (!$db->testConnection()) {
        throw new Exception('Erro na conexão com banco de dados', 500);
    }
    
    safeLog("Conexão com banco estabelecida com sucesso");
    
    // Determinar página atual
    $pageId = $data['url'] ?? $_SERVER['HTTP_REFERER'] ?? 'unknown';
    $pageId = basename(parse_url($pageId, PHP_URL_PATH), '.html');
    if (empty($pageId)) {
        $pageId = 'index';
    }
    
    // Converter para formato siteContent_
    $pageId = "siteContent_{$pageId}.html";
    
    safeLog("Página identificada: {$pageId}");
    
    // Iniciar transação
    $db->beginTransaction();
    
    $stats = [
        'textos_salvos' => 0,
        'imagens_salvas' => 0,
        'erros' => 0
    ];
    
    // Processar dados
    if (isset($data['contentMap']) && is_array($data['contentMap'])) {
        foreach ($data['contentMap'] as $key => $content) {
            try {
                                 if (is_string($content)) {
                     // Texto simples
                     saveText($db, $key, $content, $pageId);
                     $stats['textos_salvos']++;
                     
                 } elseif (is_array($content)) {
                     // Pode ser imagem ou conteúdo complexo
                     if (isset($content['src'])) {
                         // É uma imagem
                         $imageId = $imageManager->saveImage($content, $pageId, $key);
                         $stats['imagens_salvas']++;
                         safeLog("Imagem salva: chave {$key}, ID {$imageId}");
                         
                     } else {
                         // Conteúdo complexo - serializar como JSON
                         $contentJson = json_encode($content, JSON_UNESCAPED_UNICODE);
                         saveText($db, $key, $contentJson, $pageId, 'json');
                         $stats['textos_salvos']++;
                     }
                 }
                
            } catch (Exception $e) {
                $stats['erros']++;
                safeLog("Erro ao processar chave {$key}: " . $e->getMessage());
                // Continuar processamento mesmo com erros individuais
            }
        }
    }
    
             // Confirmar transação
    $db->commit();
    
    safeLog("Salvamento concluído - Textos: {$stats['textos_salvos']}, Imagens: {$stats['imagens_salvas']}, Erros: {$stats['erros']}");
    
    // Resposta de sucesso
    sendJsonResponse([
        'success' => true,
        'status' => 'success',
        'message' => 'Conteúdo salvo com sucesso no banco de dados.',
        'stats' => $stats,
        'page_id' => $pageId,
        'timestamp' => date('Y-m-d H:i:s'),
        'server_time' => time(),
        'php_version' => PHP_VERSION,
        'memory_usage' => memory_get_usage(true),
        'memory_peak' => memory_get_peak_usage(true)
    ]);
    
} catch (Exception $e) {
    // Rollback em caso de erro
    if (isset($db)) {
        $db->rollback();
    }
    
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
        'memory_usage' => memory_get_usage(true)
    ], $errorCode);
}

// Funções auxiliares
function saveText($db, $key, $content, $pageId, $type = 'texto') {
    // Verificar se texto já existe para esta página específica
    $results = $db->query(
        "SELECT id, versao FROM textos WHERE chave = ? AND pagina = ? AND status = 'ativo'",
        [$key, $pageId]
    );
    $existing = !empty($results) ? $results[0] : null;
    
    if ($existing) {
        // Atualizar texto existente
        $db->update('textos', [
            'conteudo' => $content,
            'tipo' => $type,
            'versao' => $existing['versao'] + 1,
            'data_modificacao' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ], 'id = ?', [$existing['id']]);
        
        safeLog("Texto atualizado: {$key} (página: {$pageId})");
        
    } else {
        // Inserir novo texto
        $db->insert('textos', [
            'chave' => $key,
            'conteudo' => $content,
            'pagina' => $pageId,
            'tipo' => $type,
            'status' => 'ativo',
            'versao' => 1,
            'data_modificacao' => date('Y-m-d H:i:s'),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        
        safeLog("Novo texto inserido: {$key} (página: {$pageId})");
    }
}


?> 