<?php
/**
 * HARDEM Editor - Servidor de Imagens do Banco
 * Serve imagens armazenadas diretamente no banco de dados
 */

// Headers básicos
header('Cache-Control: public, max-age=31536000'); // Cache por 1 ano
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');

// Verificar parâmetros
$imageId = $_GET['id'] ?? null;
$type = $_GET['type'] ?? 'original'; // original ou thumbnail
$download = isset($_GET['download']); // Force download

if (!$imageId) {
    http_response_code(400);
    exit('ID da imagem obrigatório');
}

try {
    // Carregar classes
    require_once __DIR__ . '/classes/Database.php';
    
    $db = Database::getInstance();
    
    // Buscar imagem no banco
    $results = $db->query("SELECT * FROM imagens WHERE id = ? AND status = 'ativo'", [$imageId]);
    
    if (empty($results)) {
        http_response_code(404);
        exit('Imagem não encontrada');
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
        http_response_code(404);
        exit('Dados da imagem não encontrados');
    }
    
    // Decodificar base64
    $imageContent = base64_decode($base64Data);
    
    if ($imageContent === false) {
        http_response_code(500);
        exit('Erro ao decodificar imagem');
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
    error_log("Erro ao servir imagem: " . $e->getMessage());
    http_response_code(500);
    exit('Erro interno do servidor');
}
?> 