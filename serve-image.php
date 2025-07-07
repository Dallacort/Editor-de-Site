<?php
/**
 * HARDEM Editor - Servidor de Imagens do Banco
 * Serve imagens armazenadas diretamente no banco de dados
 */

// Headers básicos
header('Cache-Control: public, max-age=31536000'); // Cache por 1 ano
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');

// Log seguro
function safeLog($message) {
    $logFile = __DIR__ . '/hardem-editor.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] [SERVE-IMAGE] $message\n", FILE_APPEND | LOCK_EX);
}

// Função para servir imagem de fallback
function serveDefaultImage($type = 'placeholder') {
    $fallbackPath = '';
    switch ($type) {
        case 'background':
            $fallbackPath = 'assets/images/about/06.webp';
            break;
        case 'background-2':
            $fallbackPath = 'assets/images/about/07.webp';
            break;
        default:
            $fallbackPath = 'assets/images/banner/01.webp';
    }
    
    if (file_exists($fallbackPath)) {
        $mime = mime_content_type($fallbackPath);
        header('Content-Type: ' . $mime);
        readfile($fallbackPath);
        exit;
    }
    
    // Se nem o fallback existir, retornar erro
    http_response_code(404);
    exit('Imagem não encontrada');
}

// Verificar parâmetros
$imageId = $_GET['id'] ?? null;
$type = $_GET['type'] ?? 'original'; // original ou thumbnail
$download = isset($_GET['download']); // Force download
$fallbackType = $_GET['fallback'] ?? 'placeholder'; // tipo de fallback

if (!$imageId) {
    safeLog("Erro: ID da imagem não fornecido");
    serveDefaultImage($fallbackType);
}

try {
    // Carregar classes
    require_once __DIR__ . '/classes/Database.php';
    
    $db = Database::getInstance();
    
    // Buscar imagem no banco com retry
    $maxRetries = 3;
    $retryDelay = 1; // segundos
    
    for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
        try {
            $results = $db->query("SELECT * FROM imagens WHERE id = ? AND status = 'ativo'", [$imageId]);
            
            if (!empty($results)) {
                break; // Sucesso, sair do loop
            }
            
            if ($attempt < $maxRetries) {
                safeLog("Tentativa {$attempt} falhou, aguardando {$retryDelay}s antes de tentar novamente");
                sleep($retryDelay);
            }
            
        } catch (Exception $e) {
            safeLog("Erro na tentativa {$attempt}: " . $e->getMessage());
            if ($attempt === $maxRetries) {
                throw $e; // Última tentativa falhou
            }
            sleep($retryDelay);
        }
    }
    
    if (empty($results)) {
        safeLog("Imagem não encontrada após {$maxRetries} tentativas: ID {$imageId}");
        serveDefaultImage($fallbackType);
    }
    
    $image = $results[0];
    
    // Se for URL externa, redirecionar
    if (!empty($image['url_externo'])) {
        header("Location: " . $image['url_externo']);
        exit;
    }
    
    // Escolher dados corretos (original ou thumbnail)
    $base64Data = null;
    if ($type === 'thumbnail' && !empty($image['thumbnail_base64'])) {
        $base64Data = $image['thumbnail_base64'];
    } elseif (!empty($image['dados_base64'])) {
        $base64Data = $image['dados_base64'];
    }
    
    if (!$base64Data) {
        safeLog("Dados da imagem não encontrados: ID {$imageId}, Tipo {$type}");
        serveDefaultImage($fallbackType);
    }
    
    // Decodificar base64 com verificação
    $imageContent = base64_decode($base64Data);
    
    if ($imageContent === false) {
        safeLog("Erro ao decodificar imagem: ID {$imageId}");
        serveDefaultImage($fallbackType);
    }
    
    // Verificar integridade da imagem
    if (function_exists('imagecreatefromstring')) {
        $testImage = @imagecreatefromstring($imageContent);
        if ($testImage === false) {
            safeLog("Imagem corrompida detectada: ID {$imageId}");
            serveDefaultImage($fallbackType);
        }
        imagedestroy($testImage);
    }
    
    // Headers da imagem
    header('Content-Type: ' . $image['tipo_mime']);
    header('Content-Length: ' . strlen($imageContent));
    
    // Se for download, forçar download
    if ($download) {
        $filename = $image['nome_original'] ?: 'imagem';
        header('Content-Disposition: attachment; filename="' . $filename . '"');
    } else {
        header('Content-Disposition: inline');
    }
    
    // ETag para cache
    $etag = md5($image['hash_md5'] . $type);
    header('ETag: "' . $etag . '"');
    
    // Verificar se cliente já tem a imagem em cache
    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === '"' . $etag . '"') {
        http_response_code(304);
        exit;
    }
    
    // Outputar imagem
    echo $imageContent;
    
} catch (Exception $e) {
    safeLog("Erro ao servir imagem: " . $e->getMessage());
    serveDefaultImage($fallbackType);
}
?> 