<?php
/**
 * HARDEM Editor - Gerenciador de Imagens
 * Versão Database-Only - Sem arquivos físicos
 */

require_once __DIR__ . '/Database.php';

class ImageManager {
    private $db;
    private $maxFileSize;
    private $allowedTypes;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->maxFileSize = 10 * 1024 * 1024; // 10MB
        $this->allowedTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];
    }
    
    public function saveImage($imageData, $pageId = null, $context = null) {
        try {
            // Validar dados da imagem
            if (empty($imageData['src'])) {
                throw new Exception('Dados da imagem inválidos');
            }
            
            // Extrair dados base64
            if (strpos($imageData['src'], 'data:') === 0) {
                return $this->saveBase64Image($imageData, $pageId, $context);
            } else {
                return $this->saveUrlImage($imageData, $pageId, $context);
            }
            
        } catch (Exception $e) {
            $this->safeLog("Erro ao salvar imagem: " . $e->getMessage());
            throw $e;
        }
    }
    
    private function saveBase64Image($imageData, $pageId, $context) {
        // Extrair informações do base64
        $src = $imageData['src'];
        
        if (!preg_match('/^data:image\/([a-zA-Z+]+);base64,(.+)$/', $src, $matches)) {
            throw new Exception('Formato de imagem base64 inválido');
        }
        
        $imageType = $matches[1];
        $base64Data = $matches[2];
        $mimeType = 'image/' . $imageType;
        
        // Validar tipo de arquivo
        if (!in_array($mimeType, $this->allowedTypes)) {
            throw new Exception("Tipo de arquivo não permitido: {$mimeType}");
        }
        
        // Decodificar dados
        $imageContent = base64_decode($base64Data);
        if ($imageContent === false) {
            throw new Exception('Erro ao decodificar imagem base64');
        }
        
        // Validar tamanho
        if (strlen($imageContent) > $this->maxFileSize) {
            throw new Exception('Arquivo muito grande. Máximo: ' . ($this->maxFileSize / 1024 / 1024) . 'MB');
        }
        
        // Gerar hash MD5
        $hash = md5($imageContent);
        
        // Verificar se imagem já existe
        $results = $this->db->query(
            "SELECT id FROM imagens WHERE hash_md5 = ? AND status = 'ativo'",
            [$hash]
        );
        $existingImage = !empty($results) ? $results[0] : null;
        
        if ($existingImage) {
            // Imagem já existe, apenas criar relacionamento se necessário
            if ($pageId) {
                $this->linkImageToPage($existingImage['id'], $pageId, $context);
            }
            return $existingImage['id'];
        }
        
        // Obter dimensões da imagem (se possível)
        $width = null;
        $height = null;
        
        // Tentar extrair dimensões usando getimagesizefromstring
        if (function_exists('getimagesizefromstring')) {
            $imageInfo = getimagesizefromstring($imageContent);
            if ($imageInfo) {
                $width = $imageInfo[0];
                $height = $imageInfo[1];
            }
        }
        
        // Criar thumbnail (versão reduzida em base64)
        $thumbnailBase64 = $this->createThumbnailBase64($imageContent, $mimeType);
        
        // Salvar no banco de dados (TUDO no banco!)
        $imageId = $this->db->insert('imagens', [
            'nome_arquivo' => 'db_image_' . uniqid(),
            'nome_original' => $imageData['alt'] ?? 'Imagem',
            'tipo_mime' => $mimeType,
            'tamanho' => strlen($imageContent),
            'largura' => $width,
            'altura' => $height,
            'dados_base64' => $base64Data,  // Dados originais em base64
            'thumbnail_base64' => $thumbnailBase64,  // Thumbnail em base64
            'hash_md5' => $hash,
            'alt_text' => $imageData['alt'] ?? '',
            'descricao' => $imageData['title'] ?? ''
        ]);
        
        // Relacionar com página se especificado
        if ($pageId) {
            $this->linkImageToPage($imageId, $pageId, $context);
        }
        
        $this->safeLog("Imagem salva no banco com sucesso: ID {$imageId}");
        
        return $imageId;
    }
    
    private function saveUrlImage($imageData, $pageId, $context) {
        // Para URLs externas, apenas salvar referência no banco
        $url = $imageData['src'];
        $hash = md5($url);
        
        // Verificar se URL já existe
        $results = $this->db->query(
            "SELECT id FROM imagens WHERE hash_md5 = ? AND status = 'ativo'",
            [$hash]
        );
        $existingImage = !empty($results) ? $results[0] : null;
        
        if ($existingImage) {
            if ($pageId) {
                $this->linkImageToPage($existingImage['id'], $pageId, $context);
            }
            return $existingImage['id'];
        }
        
        // Salvar referência da URL
        $imageId = $this->db->insert('imagens', [
            'nome_arquivo' => basename($url),
            'nome_original' => $imageData['alt'] ?? basename($url),
            'tipo_mime' => 'image/unknown',
            'tamanho' => 0,
            'url_externo' => $url,  // URL externa
            'hash_md5' => $hash,
            'alt_text' => $imageData['alt'] ?? '',
            'descricao' => $imageData['title'] ?? ''
        ]);
        
        if ($pageId) {
            $this->linkImageToPage($imageId, $pageId, $context);
        }
        
        return $imageId;
    }
    
    private function createThumbnailBase64($imageContent, $mimeType, $maxWidth = 300, $maxHeight = 300) {
        // Se GD não estiver disponível, retornar dados originais
        if (!extension_loaded('gd')) {
            return base64_encode($imageContent);
        }
        
        try {
            $image = null;
            
            switch ($mimeType) {
                case 'image/jpeg':
                case 'image/jpg':
                    $image = imagecreatefromstring($imageContent);
                    break;
                case 'image/png':
                    $image = imagecreatefromstring($imageContent);
                    break;
                case 'image/gif':
                    $image = imagecreatefromstring($imageContent);
                    break;
                default:
                    // Para outros tipos, retornar original
                    return base64_encode($imageContent);
            }
            
            if (!$image) {
                return base64_encode($imageContent);
            }
            
            $originalWidth = imagesx($image);
            $originalHeight = imagesy($image);
            
            // Se já é pequena, não redimensionar
            if ($originalWidth <= $maxWidth && $originalHeight <= $maxHeight) {
                imagedestroy($image);
                return base64_encode($imageContent);
            }
            
            // Calcular novas dimensões mantendo proporção
            $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
            $newWidth = round($originalWidth * $ratio);
            $newHeight = round($originalHeight * $ratio);
            
            // Criar nova imagem
            $thumbnail = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preservar transparência para PNG
            if ($mimeType === 'image/png') {
                imagealphablending($thumbnail, false);
                imagesavealpha($thumbnail, true);
            }
            
            // Redimensionar
            imagecopyresampled($thumbnail, $image, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
            
            // Converter para base64
            ob_start();
            switch ($mimeType) {
                case 'image/jpeg':
                case 'image/jpg':
                    imagejpeg($thumbnail, null, 80);
                    break;
                case 'image/png':
                    imagepng($thumbnail);
                    break;
                case 'image/gif':
                    imagegif($thumbnail);
                    break;
            }
            $thumbnailContent = ob_get_contents();
            ob_end_clean();
            
            imagedestroy($image);
            imagedestroy($thumbnail);
            
            return base64_encode($thumbnailContent);
            
        } catch (Exception $e) {
            return base64_encode($imageContent);
        }
    }
    
    private function linkImageToPage($imageId, $pageId, $context = null) {
        try {
            // Verificar se relacionamento já existe
            $existing = $this->db->query("
                SELECT id FROM pagina_imagens 
                WHERE imagem_id = ? AND pagina_id = ? AND status = 'ativo'
            ", [$imageId, $pageId]);
            
            if (empty($existing)) {
                // Criar novo relacionamento
                $this->db->insert('pagina_imagens', [
                    'imagem_id' => $imageId,
                    'pagina_id' => $pageId,
                    'contexto' => $context,
                    'posicao' => 1
                ]);
                
                $this->safeLog("Relacionamento criado: Imagem {$imageId} -> Página {$pageId}");
            }
            
        } catch (Exception $e) {
            $this->safeLog("Erro ao criar relacionamento: " . $e->getMessage());
        }
    }
    
    // Método para servir imagem do banco de dados
    public function serveImage($imageId, $type = 'original') {
        try {
            $image = $this->getImageById($imageId);
            
            if (!$image) {
                throw new Exception("Imagem não encontrada: ID {$imageId}");
            }
            
            // Se for URL externa, redirecionar
            if (!empty($image['url_externo'])) {
                header("Location: " . $image['url_externo']);
                exit;
            }
            
            // Escolher dados corretos
            $base64Data = null;
            if ($type === 'thumbnail' && !empty($image['thumbnail_base64'])) {
                $base64Data = $image['thumbnail_base64'];
            } elseif (!empty($image['dados_base64'])) {
                $base64Data = $image['dados_base64'];
            }
            
            if (!$base64Data) {
                throw new Exception("Dados da imagem não encontrados");
            }
            
            // Decodificar e servir
            $imageContent = base64_decode($base64Data);
            
            header('Content-Type: ' . $image['tipo_mime']);
            header('Content-Length: ' . strlen($imageContent));
            header('Cache-Control: public, max-age=31536000'); // Cache por 1 ano
            
            echo $imageContent;
            exit;
            
        } catch (Exception $e) {
            header('HTTP/1.1 404 Not Found');
            echo 'Imagem não encontrada';
            exit;
        }
    }
    
    public function getImagesByPage($pageId) {
        $results = $this->db->query("
            SELECT i.*, pi.contexto, pi.posicao, pi.propriedades
            FROM imagens i
            JOIN pagina_imagens pi ON i.id = pi.imagem_id
            WHERE pi.pagina_id = ? AND i.status = 'ativo'
            ORDER BY pi.posicao
        ", [$pageId]);
        
        return $results;
    }
    
    public function getAllImages($limit = 50, $offset = 0, $search = '') {
        $sql = "SELECT id, nome_original, tipo_mime, tamanho, largura, altura, alt_text, descricao, hash_md5, created_at FROM imagens WHERE status = 'ativo'";
        $params = [];
        
        if ($search) {
            $sql .= " AND (nome_original LIKE ? OR alt_text LIKE ? OR tipo_mime LIKE ?)";
            $searchTerm = "%{$search}%";
            $params = [$searchTerm, $searchTerm, $searchTerm];
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        return $this->db->query($sql, $params);
    }
    
    public function getImageById($imageId) {
        $results = $this->db->query("SELECT * FROM imagens WHERE id = ? AND status = 'ativo'", [$imageId]);
        return !empty($results) ? $results[0] : null;
    }
    
    public function updateImage($imageId, $data) {
        $updateData = [];
        
        // Campos permitidos para atualização
        $allowedFields = ['nome_original', 'alt_text', 'descricao'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = $data[$field];
            }
        }
        
        if (!empty($updateData)) {
            $updateData['updated_at'] = date('Y-m-d H:i:s');
            $this->db->update('imagens', $updateData, 'id = ?', [$imageId]);
            $this->safeLog("Imagem atualizada: ID {$imageId}");
            return true;
        }
        
        return false;
    }
    
    public function replaceImage($oldImageId, $newImageData, $pageId = null, $context = null) {
        $this->db->beginTransaction();
        
        try {
            // Salvar nova imagem
            $newImageId = $this->saveImage($newImageData, $pageId, $context);
            
            // Marcar imagem antiga como substituída
            $this->db->update('imagens', [
                'status' => 'substituido',
                'updated_at' => date('Y-m-d H:i:s')
            ], 'id = ?', [$oldImageId]);
            
            // Atualizar todos os relacionamentos para apontar para nova imagem
            $this->db->query("UPDATE pagina_imagens SET imagem_id = ? WHERE imagem_id = ?", [$newImageId, $oldImageId]);
            
            $this->db->commit();
            $this->safeLog("Imagem substituída: ID {$oldImageId} -> {$newImageId}");
            
            return $newImageId;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    public function deleteImage($imageId) {
        $this->db->beginTransaction();
        
        try {
            // Obter informações da imagem
            $results = $this->db->query("SELECT * FROM imagens WHERE id = ?", [$imageId]);
            $image = !empty($results) ? $results[0] : null;
            
            if ($image) {
                // Marcar como excluída
                $this->db->update('imagens', [
                    'status' => 'excluido',
                    'updated_at' => date('Y-m-d H:i:s')
                ], 'id = ?', [$imageId]);
                
                // Remover relacionamentos
                $this->db->query("UPDATE pagina_imagens SET status = 'inativo' WHERE imagem_id = ?", [$imageId]);
                
                // Log da ação
                $this->safeLog("Imagem excluída: ID {$imageId}");
            }
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    public function generateThumbnailBase64($base64Data, $mimeType, $maxWidth = 300, $maxHeight = 300) {
        try {
            // Se GD não estiver disponível, retornar dados originais
            if (!extension_loaded('gd')) {
                $this->safeLog("Extensão GD não disponível - usando imagem original como thumbnail");
                return $base64Data;
            }
            
            $imageContent = base64_decode($base64Data);
            return $this->createThumbnailBase64($imageContent, $mimeType, $maxWidth, $maxHeight);
        } catch (Exception $e) {
            $this->safeLog("Erro ao gerar thumbnail: " . $e->getMessage());
            return $base64Data; // Retorna original se falhar
        }
    }
    
    public function getImageDimensionsFromBase64($base64Data, $mimeType) {
        try {
            // Verificar se GD está disponível
            if (!extension_loaded('gd')) {
                $this->safeLog("Extensão GD não disponível - retornando dimensões padrão");
                return ['width' => 800, 'height' => 600]; // Dimensões padrão
            }
            
            $imageContent = base64_decode($base64Data);
            
            // Usar getimagesizefromstring se disponível (mais seguro)
            if (function_exists('getimagesizefromstring')) {
                $imageInfo = getimagesizefromstring($imageContent);
                if ($imageInfo) {
                    return ['width' => $imageInfo[0], 'height' => $imageInfo[1]];
                }
            }
            
            // Fallback para imagecreatefromstring
            if (function_exists('imagecreatefromstring')) {
                $image = imagecreatefromstring($imageContent);
                
                if ($image === false) {
                    return ['width' => null, 'height' => null];
                }
                
                $width = imagesx($image);
                $height = imagesy($image);
                
                imagedestroy($image);
                
                return ['width' => $width, 'height' => $height];
            }
            
            // Se nada funcionar, retornar dimensões padrão
            return ['width' => 800, 'height' => 600];
            
        } catch (Exception $e) {
            $this->safeLog("Erro ao obter dimensões: " . $e->getMessage());
            return ['width' => 800, 'height' => 600]; // Dimensões padrão em caso de erro
        }
    }

    private function safeLog($message) {
        $logFile = __DIR__ . '/../hardem-editor.log';
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($logFile, "[$timestamp] [IMAGE-DB] $message\n", FILE_APPEND | LOCK_EX);
    }
} 