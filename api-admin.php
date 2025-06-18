<?php
/**
 * HARDEM Editor - API de Administração
 * API para gerenciar imagens, textos e backups
 * @version 1.0.0
 */

// Configurações de erro
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Headers CORS e JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Importar classes necessárias
require_once __DIR__ . '/classes/Database.php';
require_once __DIR__ . '/classes/ImageManager.php';

// Função para log seguro
function safeLog($message) {
    $logFile = __DIR__ . '/hardem-editor.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] [API-ADMIN] $message\n", FILE_APPEND | LOCK_EX);
}

// Função para resposta JSON limpa
function sendJsonResponse($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// Verificar método de requisição
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    // Inicializar classes
    $db = Database::getInstance();
    $imageManager = new ImageManager();
    
    // Roteamento das ações
    switch ($action) {
        // ESTATÍSTICAS
        case 'get_stats':
            handleGetStats($db);
            break;
            
        // IMAGENS
        case 'get_images':
            handleGetImages($db);
            break;
            
        case 'update_image':
            handleUpdateImage($imageManager, $db);
            break;
            
        case 'delete_image':
            handleDeleteImage($imageManager);
            break;
            
        case 'replace_image':
            handleReplaceImage($imageManager);
            break;
            
        // TEXTOS
        case 'get_texts':
            handleGetTexts($db);
            break;
            
        case 'update_text':
            handleUpdateText($db);
            break;
            
        case 'delete_text':
            handleDeleteText($db);
            break;
            
        // BACKUPS
        case 'get_backups':
            handleGetBackups();
            break;
            
        case 'delete_backup':
            handleDeleteBackup();
            break;
            
        case 'create_backup':
            handleCreateBackup($db);
            break;
            
        default:
            sendJsonResponse([
                'success' => false,
                'message' => 'Ação não encontrada: ' . $action
            ], 404);
    }
    
} catch (Exception $e) {
    safeLog("Erro na API: " . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'message' => 'Erro interno do servidor',
        'error' => $e->getMessage()
    ], 500);
}

// FUNÇÕES DE TRATAMENTO

function handleGetStats($db) {
    try {
        // Estatísticas de imagens
        $imageStats = $db->query("SELECT COUNT(*) as total, SUM(tamanho) as total_size FROM imagens WHERE status = 'ativo'");
        $totalImages = $imageStats[0]['total'] ?? 0;
        $totalImagesSize = $imageStats[0]['total_size'] ?? 0;
        
        // Estatísticas de textos
        $textStats = $db->query("SELECT COUNT(*) as total FROM textos WHERE status = 'ativo'");
        $totalTexts = $textStats[0]['total'] ?? 0;
        
        // Estatísticas de backups
        $backupsDir = __DIR__ . '/backups';
        $backupFiles = is_dir($backupsDir) ? glob($backupsDir . '/*.json') : [];
        $totalBackups = count($backupFiles);
        
        // Tamanho total dos backups
        $totalBackupsSize = 0;
        foreach ($backupFiles as $file) {
            if (is_file($file)) {
                $totalBackupsSize += filesize($file);
            }
        }
        
        sendJsonResponse([
            'success' => true,
            'data' => [
                'total_images' => $totalImages,
                'total_texts' => $totalTexts,
                'total_backups' => $totalBackups,
                'total_size' => $totalImagesSize + $totalBackupsSize
            ]
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao obter estatísticas: " . $e->getMessage());
    }
}

function handleGetImages($db) {
    try {
        $search = $_GET['search'] ?? '';
        $id = $_GET['id'] ?? null;
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT * FROM imagens WHERE status = 'ativo'";
        $params = [];
        
        // Se ID específico foi fornecido, buscar apenas por ele
        if ($id) {
            $sql .= " AND id = ?";
            $params = [$id];
        } elseif ($search) {
            $sql .= " AND (nome_original LIKE ? OR alt_text LIKE ? OR tipo_mime LIKE ?)";
            $searchTerm = "%{$search}%";
            $params = [$searchTerm, $searchTerm, $searchTerm];
        }
        
        if (!$id) {
            $sql .= " ORDER BY data_upload DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
        }
        
        $images = $db->query($sql, $params);
        
        sendJsonResponse([
            'success' => true,
            'data' => $images
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao obter imagens: " . $e->getMessage());
    }
}

function handleUpdateImage($imageManager, $db) {
    try {
        $imageId = $_POST['id'] ?? null;
        $nomeOriginal = $_POST['nome_original'] ?? '';
        $altText = $_POST['alt_text'] ?? '';
        $descricao = $_POST['descricao'] ?? '';
        
        if (!$imageId) {
            throw new Exception("ID da imagem é obrigatório");
        }
        
        // Atualizar dados da imagem
        $db->update('imagens', [
            'nome_original' => $nomeOriginal,
            'alt_text' => $altText,
            'descricao' => $descricao,
            'data_modificacao' => date('Y-m-d H:i:s')
        ], 'id = ?', [$imageId]);
        
        safeLog("Imagem atualizada: ID {$imageId}");
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Imagem atualizada com sucesso!'
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao atualizar imagem: " . $e->getMessage());
    }
}

function handleDeleteImage($imageManager) {
    try {
        $imageId = $_POST['id'] ?? null;
        
        if (!$imageId) {
            throw new Exception("ID da imagem é obrigatório");
        }
        
        $imageManager->deleteImage($imageId);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Imagem excluída com sucesso!'
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao excluir imagem: " . $e->getMessage());
    }
}

function handleReplaceImage($imageManager) {
    try {
        $imageId = $_POST['id'] ?? null;
        $newImageData = $_POST['image_data'] ?? '';
        
        if (!$imageId || !$newImageData) {
            throw new Exception("ID da imagem e dados da nova imagem são obrigatórios");
        }
        
        // Decodificar dados da nova imagem
        $imageData = json_decode($newImageData, true);
        if (!$imageData || !isset($imageData['src'])) {
            throw new Exception("Dados da nova imagem inválidos");
        }
        
        // Salvar nova imagem
        $newImageId = $imageManager->saveImage($imageData);
        
        // Marcar imagem antiga como substituída
        $db = Database::getInstance();
        $db->update('imagens', [
            'status' => 'substituido',
            'data_modificacao' => date('Y-m-d H:i:s')
        ], 'id = ?', [$imageId]);
        
        // Atualizar relacionamentos para apontar para nova imagem
        $db->query("UPDATE pagina_imagens SET imagem_id = ? WHERE imagem_id = ?", [$newImageId, $imageId]);
        
        safeLog("Imagem substituída: ID {$imageId} -> {$newImageId}");
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Imagem substituída com sucesso!',
            'new_image_id' => $newImageId
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao substituir imagem: " . $e->getMessage());
    }
}

function handleGetTexts($db) {
    try {
        $search = $_GET['search'] ?? '';
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = (int)($_GET['offset'] ?? 0);
        
        $sql = "SELECT * FROM textos WHERE status = 'ativo'";
        $params = [];
        
        if ($search) {
            $sql .= " AND (chave LIKE ? OR conteudo LIKE ? OR pagina LIKE ?)";
            $searchTerm = "%{$search}%";
            $params = [$searchTerm, $searchTerm, $searchTerm];
        }
        
        $sql .= " ORDER BY data_modificacao DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $texts = $db->query($sql, $params);
        
        sendJsonResponse([
            'success' => true,
            'data' => $texts
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao obter textos: " . $e->getMessage());
    }
}

function handleUpdateText($db) {
    try {
        $textId = $_POST['id'] ?? null;
        $conteudo = $_POST['conteudo'] ?? '';
        
        if (!$textId) {
            throw new Exception("ID do texto é obrigatório");
        }
        
        // Incrementar versão
        $currentText = $db->query("SELECT versao FROM textos WHERE id = ?", [$textId]);
        $novaVersao = ($currentText[0]['versao'] ?? 0) + 1;
        
        // Atualizar texto
        $db->update('textos', [
            'conteudo' => $conteudo,
            'versao' => $novaVersao,
            'data_modificacao' => date('Y-m-d H:i:s')
        ], 'id = ?', [$textId]);
        
        safeLog("Texto atualizado: ID {$textId}, versão {$novaVersao}");
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Texto atualizado com sucesso!'
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao atualizar texto: " . $e->getMessage());
    }
}

function handleDeleteText($db) {
    try {
        $textId = $_POST['id'] ?? null;
        
        if (!$textId) {
            throw new Exception("ID do texto é obrigatório");
        }
        
        // Marcar como excluído
        $db->update('textos', [
            'status' => 'excluido',
            'data_modificacao' => date('Y-m-d H:i:s')
        ], 'id = ?', [$textId]);
        
        safeLog("Texto excluído: ID {$textId}");
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Texto excluído com sucesso!'
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao excluir texto: " . $e->getMessage());
    }
}

function handleGetBackups() {
    try {
        $backupsDir = __DIR__ . '/backups';
        
        if (!is_dir($backupsDir)) {
            sendJsonResponse([
                'success' => true,
                'data' => []
            ]);
            return;
        }
        
        $files = glob($backupsDir . '/*.json');
        $backups = [];
        
        foreach ($files as $file) {
            if (is_file($file)) {
                $filename = basename($file);
                $backups[] = [
                    'nome_arquivo' => $filename,
                    'tipo' => 'JSON',
                    'tamanho' => filesize($file),
                    'data_backup' => date('Y-m-d H:i:s', filemtime($file)),
                    'status' => 'ativo'
                ];
            }
        }
        
        // Ordenar por data de modificação (mais recente primeiro)
        usort($backups, function($a, $b) {
            return strtotime($b['data_backup']) - strtotime($a['data_backup']);
        });
        
        sendJsonResponse([
            'success' => true,
            'data' => $backups
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao obter backups: " . $e->getMessage());
    }
}

function handleDeleteBackup() {
    try {
        $filename = $_POST['filename'] ?? '';
        
        if (!$filename) {
            throw new Exception("Nome do arquivo é obrigatório");
        }
        
        $backupsDir = __DIR__ . '/backups';
        $filepath = $backupsDir . '/' . basename($filename);
        
        if (!file_exists($filepath)) {
            throw new Exception("Arquivo não encontrado");
        }
        
        if (!unlink($filepath)) {
            throw new Exception("Erro ao excluir arquivo");
        }
        
        safeLog("Backup excluído: {$filename}");
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Backup excluído com sucesso!'
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao excluir backup: " . $e->getMessage());
    }
}

function handleCreateBackup($db) {
    try {
        $type = $_POST['type'] ?? 'full'; // full, images, texts
        
        $backupData = [];
        
        // Incluir imagens se solicitado
        if ($type === 'full' || $type === 'images') {
            $images = $db->query("SELECT * FROM imagens WHERE status = 'ativo'");
            $backupData['images'] = $images;
        }
        
        // Incluir textos se solicitado
        if ($type === 'full' || $type === 'texts') {
            $texts = $db->query("SELECT * FROM textos WHERE status = 'ativo'");
            $backupData['texts'] = $texts;
        }
        
        // Incluir relacionamentos se backup completo
        if ($type === 'full') {
            $relations = $db->query("SELECT * FROM pagina_imagens WHERE status = 'ativo'");
            $backupData['page_images'] = $relations;
        }
        
        // Adicionar metadados
        $backupData['metadata'] = [
            'type' => $type,
            'created_at' => date('Y-m-d H:i:s'),
            'version' => '1.0.0'
        ];
        
        // Salvar backup
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "backup-{$type}-{$timestamp}.json";
        
        $backupsDir = __DIR__ . '/backups';
        if (!is_dir($backupsDir)) {
            mkdir($backupsDir, 0755, true);
        }
        
        $filepath = $backupsDir . '/' . $filename;
        
        if (!file_put_contents($filepath, json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            throw new Exception("Erro ao salvar backup");
        }
        
        safeLog("Backup criado: {$filename}");
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Backup criado com sucesso!',
            'filename' => $filename
        ]);
        
    } catch (Exception $e) {
        throw new Exception("Erro ao criar backup: " . $e->getMessage());
    }
}
?> 