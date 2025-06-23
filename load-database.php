<?php
/**
 * HARDEM Editor - Load Database
 * Carrega dados do banco MariaDB
 * @version 3.0.0
 */

// Configurações
ini_set('memory_limit', '512M');
ini_set('max_execution_time', 300);

// Controle de output
ob_start();
ini_set('display_errors', 0);
error_reporting(0);

// Incluir classes necessárias
require_once __DIR__ . '/classes/Database.php';

// Função para log seguro
function safeLog($message) {
    $logFile = __DIR__ . '/hardem-editor.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] [LOAD-DB] $message\n", FILE_APPEND | LOCK_EX);
}

// Função para resposta JSON limpa
function sendJsonResponse($data, $httpCode = 200) {
    ob_clean();
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-cache, must-revalidate');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Verificar método de requisição
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST'])) {
    sendJsonResponse([
        'success' => false,
        'status' => 'error',
        'message' => 'Método não permitido.',
    ], 405);
}

try {
    // Verificar se é uma requisição de verificação de publicação
    if (isset($_GET['check_publication'])) {
        safeLog("Verificando se há dados publicados");
        
        // Inicializar banco de dados
        $db = Database::getInstance();
        
        // Verificar se há dados no banco (textos ou imagens)
        $textosCount = $db->query("SELECT COUNT(*) as total FROM textos WHERE status = 'ativo'")[0]['total'] ?? 0;
        $imagensCount = $db->query("SELECT COUNT(*) as total FROM pagina_imagens WHERE status = 'ativo'")[0]['total'] ?? 0;
        
        $hasPublishedData = ($textosCount > 0 || $imagensCount > 0);
        
        safeLog("Dados publicados encontrados: " . ($hasPublishedData ? 'SIM' : 'NÃO') . " (Textos: {$textosCount}, Imagens: {$imagensCount})");
        
        sendJsonResponse([
            'success' => true,
            'has_published_data' => $hasPublishedData,
            'stats' => [
                'textos' => (int)$textosCount,
                'imagens' => (int)$imagensCount
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    safeLog("Iniciando carregamento de dados do banco");
    
    // Determinar página atual
    $pageId = $_GET['page'] ?? $_POST['page'] ?? 'index';
    
    // Remover prefixo siteContent_ se existir
    if (strpos($pageId, 'siteContent_') === 0) {
        $pageId = substr($pageId, strlen('siteContent_'));
    }
    
    // Remover extensão .html
    $pageId = basename($pageId, '.html');
    
    if (empty($pageId)) {
        $pageId = 'index';
    }
    
    safeLog("Carregando dados para página: {$pageId}");
    
    // Inicializar banco de dados
    $db = Database::getInstance();
    
    // Testar conexão
    if (!$db->testConnection()) {
        throw new Exception('Erro na conexão com banco de dados', 500);
    }
    
    $contentMap = [];
    $stats = [
        'textos_carregados' => 0,
        'imagens_carregadas' => 0
    ];
    
    // Carregar textos da página (incluindo backgrounds)
    $textos = $db->query("
        SELECT chave, conteudo, tipo
        FROM textos
        WHERE pagina = ? AND status = 'ativo'
        ORDER BY data_modificacao DESC
    ", ["siteContent_{$pageId}.html"]);
    
    foreach ($textos as $texto) {
        $key = $texto['chave'];
        $content = $texto['conteudo'];
        
        // Se for JSON, decodificar
                    if ($texto['tipo'] === 'json') {
            $decoded = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $content = $decoded;
            }
        }
        
        $contentMap[$key] = $content;
        $stats['textos_carregados']++;
    }
    
    // Carregar imagens normais da tabela 'imagens' (database-only)
    // Voltando à query mais robusta que prioriza normalização
    $searchTerm = '"normalization"';
    $imagens = $db->query("
        SELECT 
            pi.contexto as chave, 
            i.id as image_id, 
            i.tipo_mime, 
            i.alt_text, 
            i.descricao, 
            i.largura, 
            i.altura, 
            i.hash_md5, 
            pi.propriedades,
            CASE WHEN pi.propriedades LIKE ? THEN 1 ELSE 0 END as has_normalization
        FROM pagina_imagens pi
        JOIN imagens i ON pi.imagem_id = i.id
        WHERE pi.pagina_id = ? AND pi.status = 'ativo' AND i.status = 'ativo'
        ORDER BY pi.contexto, has_normalization DESC, pi.created_at DESC
    ", ["%{$searchTerm}%", "siteContent_{$pageId}.html"]);
    
    // Processar imagens garantindo que apenas o melhor registro de cada contexto seja usado
    $contentMap = array_merge($contentMap, processarImagens($imagens, $stats));
    
    // Se não encontrou dados no banco, tentar carregar do arquivo JSON (migração)
    if (empty($contentMap)) {
        $jsonFile = __DIR__ . '/site-content.json';
        if (file_exists($jsonFile)) {
            safeLog("Banco vazio, carregando do arquivo JSON para migração");
            
            $jsonContent = file_get_contents($jsonFile);
            $jsonData = json_decode($jsonContent, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($jsonData)) {
                $contentMap = $jsonData;
                safeLog("Dados JSON carregados com sucesso para migração");
            }
        }
    }
    
    safeLog("Carregamento concluído - Textos: {$stats['textos_carregados']}, Imagens: {$stats['imagens_carregadas']}");
    
    // Resposta de sucesso
    sendJsonResponse([
        'success' => true,
        'status' => 'success',
        'data' => $contentMap,
        'stats' => $stats,
        'page_id' => $pageId,
        'timestamp' => date('Y-m-d H:i:s'),
        'source' => empty($stats['textos_carregados']) && empty($stats['imagens_carregadas']) ? 'json_fallback' : 'database'
    ]);
    
} catch (Exception $e) {
    $errorCode = $e->getCode() ?: 500;
    $errorMessage = $e->getMessage();
    
    safeLog("ERRO: {$errorMessage} (Código: {$errorCode})");
    
    // Em caso de erro, tentar carregar do JSON como fallback
    $jsonFile = __DIR__ . '/site-content.json';
    if (file_exists($jsonFile)) {
        try {
            $jsonContent = file_get_contents($jsonFile);
            $jsonData = json_decode($jsonContent, true);
            
            if (json_last_error() === JSON_ERROR_NONE && is_array($jsonData)) {
                safeLog("Fallback para JSON executado com sucesso");
                sendJsonResponse([
                    'success' => true,
                    'status' => 'success',
                    'data' => $jsonData,
                    'page_id' => $pageId,
                    'timestamp' => date('Y-m-d H:i:s'),
                    'source' => 'json_fallback',
                    'warning' => 'Dados carregados do arquivo JSON (banco indisponível)'
                ]);
            }
        } catch (Exception $fallbackError) {
            safeLog("Erro no fallback JSON: " . $fallbackError->getMessage());
        }
    }
    
    sendJsonResponse([
        'success' => false,
        'status' => 'error',
        'message' => $errorMessage,
        'error_code' => $errorCode,
        'timestamp' => date('Y-m-d H:i:s')
    ], $errorCode >= 400 && $errorCode < 600 ? $errorCode : 500);
}

/**
 * Processa o array de imagens do banco para garantir um registro por contexto.
 * @param array $imagens Lista de imagens da query.
 * @param array &$stats Referência para as estatísticas.
 * @return array Mapa de conteúdo de imagens.
 */
function processarImagens($imagens, &$stats) {
    $contentMap = [];
    $imagensProcessadas = [];

    foreach ($imagens as $imagem) {
        $key = $imagem['chave'];

        if (isset($imagensProcessadas[$key])) {
            continue; // Já processamos a melhor versão deste contexto
        }

        $imageUrl = "serve-image.php?id={$imagem['image_id']}&type=original";
        
        $imageData = [
            'src' => $imageUrl,
            'alt' => $imagem['alt_text'] ?: '',
            'type' => 'image',
            'width' => $imagem['largura'],
            'height' => $imagem['altura'],
            'hash' => $imagem['hash_md5'],
            'image_id' => $imagem['image_id'],
            'storage_type' => 'database'
        ];
        
        if (!empty($imagem['propriedades'])) {
            $elementInfo = json_decode($imagem['propriedades'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                // Adiciona o objeto 'normalization' diretamente se ele existir
                if (isset($elementInfo['normalization'])) {
                    $imageData['normalization'] = $elementInfo['normalization'];
                }
                // Adiciona todas as propriedades sob 'elementInfo' para consistência
                $imageData['elementInfo'] = $elementInfo;
            }
        }
        
        $contentMap[$key] = $imageData;
        $imagensProcessadas[$key] = true;
        $stats['imagens_carregadas']++;
    }
    
    return $contentMap;
}
?> 