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
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Log para debug
safeLog("Método: {$method}, Ação: {$action}");

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
            
        // NOVAS FUNCIONALIDADES
        case 'put_image':
            handlePutImage($imageManager, $db);
            break;
            
        case 'delete_all_related':
            handleDeleteAllRelated($db, $imageManager);
            break;
            
        case 'upload_image_database_only':
            handleUploadImageDatabaseOnly($imageManager, $db);
            break;
            
        // PROPRIEDADES DE ELEMENTOS
        case 'update_element_properties':
            handleUpdateElementProperties($db);
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
        
        sendJsonResponse([
            'success' => true,
            'data' => [
                'total_images' => $totalImages,
                'total_texts' => $totalTexts,
                'total_size' => $totalImagesSize
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
        
        // Selecionar apenas campos necessários (sem dados base64 para performance)
        $sql = "SELECT id, nome_arquivo, nome_original, tipo_mime, tamanho, largura, altura, alt_text, descricao, hash_md5, status, created_at, updated_at FROM imagens WHERE status = 'ativo'";
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
            $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
        }
        
        $images = $db->query($sql, $params);
        
        // Adicionar URLs das imagens para cada resultado
        foreach ($images as &$image) {
            $image['url_original'] = "serve-image.php?id={$image['id']}&type=original";
            $image['url_thumbnail'] = "serve-image.php?id={$image['id']}&type=thumbnail";
            $image['url_download'] = "serve-image.php?id={$image['id']}&download=1";
        }
        
        sendJsonResponse([
            'success' => true,
            'data' => $images,
            'storage_type' => 'database'
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

function handlePutImage($imageManager, $db) {
    try {
        $imageId = $_POST['id'] ?? null;
        
        if (!$imageId) {
            throw new Exception("ID da imagem é obrigatório");
        }
        
        // Verificar se a imagem existe
        $existingImage = $imageManager->getImageById($imageId);
        if (!$existingImage) {
            throw new Exception("Imagem não encontrada: ID {$imageId}");
        }
        
        // Se há nova imagem para substituir
        if (isset($_POST['new_image_data']) && !empty($_POST['new_image_data'])) {
            $newImageData = json_decode($_POST['new_image_data'], true);
            if (!$newImageData || !isset($newImageData['src'])) {
                throw new Exception("Dados da nova imagem inválidos");
            }
            
            // Substituir completamente a imagem
            $newImageId = $imageManager->replaceImage($imageId, $newImageData);
            
            safeLog("Imagem completamente substituída: ID {$imageId} -> {$newImageId}");
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Imagem substituída com sucesso!',
                'old_image_id' => $imageId,
                'new_image_id' => $newImageId
            ]);
            
        } else {
            // Apenas atualizar metadados
            $updateData = [];
            
            if (isset($_POST['nome_original'])) {
                $updateData['nome_original'] = $_POST['nome_original'];
            }
            if (isset($_POST['alt_text'])) {
                $updateData['alt_text'] = $_POST['alt_text'];
            }
            if (isset($_POST['descricao'])) {
                $updateData['descricao'] = $_POST['descricao'];
            }
            
            if (empty($updateData)) {
                throw new Exception("Nenhum dado para atualizar fornecido");
            }
            
            $imageManager->updateImage($imageId, $updateData);
            
            safeLog("Metadados da imagem atualizados: ID {$imageId}");
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Imagem atualizada com sucesso!',
                'image_id' => $imageId
            ]);
        }
        
    } catch (Exception $e) {
        throw new Exception("Erro ao atualizar imagem: " . $e->getMessage());
    }
}

function handleDeleteAllRelated($db, $imageManager) {
    try {
        $pageId = $_POST['page_id'] ?? null;
        $confirmDelete = $_POST['confirm_delete'] ?? false;
        
        // Verificação de segurança obrigatória
        if (!$confirmDelete || $confirmDelete !== 'DELETE_ALL_CONFIRMED') {
            throw new Exception("Confirmação de exclusão obrigatória. Use confirm_delete='DELETE_ALL_CONFIRMED'");
        }
        
        $db->beginTransaction();
        
        $deletedImages = 0;
        $deletedTexts = 0;
        $deletedRelations = 0;
        
        try {
            if ($pageId) {
                // Deletar tudo relacionado a uma página específica
                safeLog("Iniciando exclusão completa para página: {$pageId}");
                
                // 1. Obter todas as imagens da página
                $pageImages = $db->query("
                    SELECT DISTINCT i.id 
                    FROM imagens i 
                    JOIN pagina_imagens pi ON i.id = pi.imagem_id 
                    WHERE pi.pagina_id = ? AND i.status = 'ativo'
                ", [$pageId]);
                
                // 2. Marcar imagens como excluídas
                foreach ($pageImages as $img) {
                    $imageManager->deleteImage($img['id']);
                    $deletedImages++;
                }
                
                // 3. Deletar textos da página
                $pageTexts = $db->query("SELECT id FROM textos WHERE pagina = ? AND status = 'ativo'", [$pageId]);
                foreach ($pageTexts as $text) {
                    $db->update('textos', [
                        'status' => 'excluido',
                        'data_modificacao' => date('Y-m-d H:i:s')
                    ], 'id = ?', [$text['id']]);
                    $deletedTexts++;
                }
                
                // 4. Deletar relacionamentos da página
                $deletedRelations = $db->query("UPDATE pagina_imagens SET status = 'inativo' WHERE pagina_id = ?", [$pageId]);
                
            } else {
                // Deletar TUDO (cuidado!)
                safeLog("ATENÇÃO: Iniciando exclusão completa de TODOS os dados!");
                
                // 1. Marcar todas as imagens como excluídas
                $allImages = $db->query("SELECT id FROM imagens WHERE status = 'ativo'");
                foreach ($allImages as $img) {
                    $imageManager->deleteImage($img['id']);
                    $deletedImages++;
                }
                
                // 2. Marcar todos os textos como excluídos
                $allTexts = $db->query("SELECT id FROM textos WHERE status = 'ativo'");
                foreach ($allTexts as $text) {
                    $db->update('textos', [
                        'status' => 'excluido',
                        'data_modificacao' => date('Y-m-d H:i:s')
                    ], 'id = ?', [$text['id']]);
                    $deletedTexts++;
                }
                
                // 3. Desativar todos os relacionamentos
                $deletedRelations = $db->query("UPDATE pagina_imagens SET status = 'inativo' WHERE status = 'ativo'");
            }
            
            $db->commit();
            
            $message = $pageId 
                ? "Dados da página '{$pageId}' excluídos com sucesso!"
                : "TODOS os dados excluídos com sucesso!";
            
            safeLog("Exclusão completa finalizada - Imagens: {$deletedImages}, Textos: {$deletedTexts}, Relacionamentos: {$deletedRelations}");
            
            sendJsonResponse([
                'success' => true,
                'message' => $message,
                'deleted_images' => $deletedImages,
                'deleted_texts' => $deletedTexts,
                'deleted_relations' => $deletedRelations,
                'page_id' => $pageId
            ]);
            
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        throw new Exception("Erro ao excluir dados relacionados: " . $e->getMessage());
    }
}

function handleUploadImageDatabaseOnly($imageManager, $db) {
    try {
        // Validar dados obrigatórios
        $requiredFields = ['nome_original', 'tipo_mime', 'tamanho', 'dados_base64', 'data_key', 'pagina'];
        foreach ($requiredFields as $field) {
            if (!isset($_POST[$field]) || empty($_POST[$field])) {
                throw new Exception("Campo obrigatório ausente: {$field}");
            }
        }
        
        $nomeOriginal = $_POST['nome_original'];
        $tipoMime = $_POST['tipo_mime'];
        $tamanho = (int)$_POST['tamanho'];
        $dadosBase64 = $_POST['dados_base64'];
        $dataKey = $_POST['data_key'];
        $pagina = $_POST['pagina'];
        $altText = $_POST['alt_text'] ?? '';
        $descricao = $_POST['descricao'] ?? '';
        $elementInfo = $_POST['element_info'] ?? '{}';
        $isHeaderContent = isset($_POST['is_header_content']) ? (bool)$_POST['is_header_content'] : false;
        
        // Validar base64
        if (!base64_decode($dadosBase64, true)) {
            throw new Exception("Dados base64 inválidos");
        }
        
        // Gerar thumbnail automaticamente
        $thumbnailBase64 = $imageManager->generateThumbnailBase64($dadosBase64, $tipoMime);
        
        // Detectar dimensões da imagem
        $imageInfo = $imageManager->getImageDimensionsFromBase64($dadosBase64, $tipoMime);
        $largura = $imageInfo['width'] ?? null;
        $altura = $imageInfo['height'] ?? null;
        
        // Gerar hash MD5 para verificação de integridade
        $hashMd5 = md5($dadosBase64);
        
        $db->beginTransaction();
        
        try {
            // Verificar se imagem já existe (mesmo hash + status ativo)
            $existingImage = $db->query(
                "SELECT id FROM imagens WHERE hash_md5 = ? AND status = 'ativo' LIMIT 1",
                [$hashMd5]
            );
            
            if (!empty($existingImage)) {
                // Imagem já existe, usar a existente
                $imageId = $existingImage[0]['id'];
                safeLog("Imagem já existe no banco, reutilizando ID: {$imageId}");
            } else {
                // Imagem não existe, inserir nova
                $imageId = $db->insert('imagens', [
                    'nome_arquivo' => $nomeOriginal,
                    'nome_original' => $nomeOriginal,
                    'tipo_mime' => $tipoMime,
                    'tamanho' => $tamanho,
                    'largura' => $largura,
                    'altura' => $altura,
                    'dados_base64' => $dadosBase64,
                    'thumbnail_base64' => $thumbnailBase64,
                    'hash_md5' => $hashMd5,
                    'alt_text' => $altText,
                    'descricao' => $descricao,
                    'status' => 'ativo',
                    'data_upload' => date('Y-m-d H:i:s'),
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                
                safeLog("Nova imagem inserida no banco - ID: {$imageId}");
            }
            
            // 2. Criar relacionamento na tabela 'pagina_imagens'
            $relationId = $db->insert('pagina_imagens', [
                'pagina_id' => $pagina,
                'imagem_id' => $imageId,
                'contexto' => $dataKey,
                'posicao' => 1,
                'propriedades' => $elementInfo,
                'status' => 'ativo',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
            
            $db->commit();
            
            safeLog("Imagem database-only salva - ID: {$imageId}, Página: {$pagina}, DataKey: {$dataKey}");
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Imagem salva com sucesso na base de dados!',
                'image_id' => $imageId,
                'relation_id' => $relationId,
                'data_key' => $dataKey,
                'pagina' => $pagina,
                'url_original' => "serve-image.php?id={$imageId}&type=original",
                'url_thumbnail' => "serve-image.php?id={$imageId}&type=thumbnail",
                'storage_type' => 'database-only'
            ]);
            
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        safeLog("Erro ao salvar imagem database-only: " . $e->getMessage());
        throw new Exception("Erro ao salvar imagem na base de dados: " . $e->getMessage());
    }
}

function handleUpdateElementProperties($db) {
    try {
        $elementKey = $_POST['element_key'] ?? '';
        $properties = $_POST['properties'] ?? '{}';
        $pageId = $_POST['page_id'] ?? '';
        
        if (empty($elementKey)) {
            throw new Exception("Chave do elemento é obrigatória");
        }
        
        if (empty($pageId)) {
            throw new Exception("ID da página é obrigatório");
        }
        
        // Validar JSON das propriedades
        $propertiesData = json_decode($properties, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Propriedades devem ser um JSON válido");
        }
        
        safeLog("Atualizando propriedades do elemento: {$elementKey} na página: {$pageId}");
        
        $db->beginTransaction();
        
        try {
            // Verificar se já existe relacionamento
            $existingRelation = $db->query("
                SELECT id, propriedades 
                FROM pagina_imagens 
                WHERE pagina_id = ? AND contexto = ? AND status = 'ativo' 
                LIMIT 1
            ", [$pageId, $elementKey]);
            
            if (!empty($existingRelation)) {
                // Atualizar relacionamento existente
                $relationId = $existingRelation[0]['id'];
                
                // Mesclar propriedades existentes com novas
                $existingProps = [];
                if (!empty($existingRelation[0]['propriedades'])) {
                    $existingProps = json_decode($existingRelation[0]['propriedades'], true) ?: [];
                }
                
                $mergedProperties = array_merge($existingProps, $propertiesData);
                
                $db->update('pagina_imagens', [
                    'propriedades' => json_encode($mergedProperties, JSON_UNESCAPED_UNICODE),
                    'updated_at' => date('Y-m-d H:i:s')
                ], 'id = ?', [$relationId]);
                
                safeLog("Propriedades atualizadas no relacionamento existente: {$relationId}");
                
            } else {
                // Criar novo relacionamento apenas para propriedades
                $relationId = $db->insert('pagina_imagens', [
                    'pagina_id' => $pageId,
                    'imagem_id' => 0, // ID fictício para elementos sem imagem
                    'contexto' => $elementKey,
                    'posicao' => 0,
                    'propriedades' => json_encode($propertiesData, JSON_UNESCAPED_UNICODE),
                    'status' => 'ativo',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ]);
                
                safeLog("Novo relacionamento criado para propriedades: {$relationId}");
            }
            
            $db->commit();
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Propriedades do elemento atualizadas com sucesso!',
                'element_key' => $elementKey,
                'page_id' => $pageId,
                'relation_id' => $relationId,
                'properties' => $propertiesData
            ]);
            
        } catch (Exception $e) {
            $db->rollback();
            throw $e;
        }
        
    } catch (Exception $e) {
        safeLog("Erro ao atualizar propriedades do elemento: " . $e->getMessage());
        throw new Exception("Erro ao atualizar propriedades: " . $e->getMessage());
    }
}

?> 