<?php
/**
 * HARDEM Editor - Gerenciador de Imagens
 * Classe para gerenciar upload, otimização e armazenamento de imagens
 */

require_once __DIR__ . '/Database.php';

class ImageManager {
    private $db;
    private $uploadDir;
    private $maxFileSize;
    private $allowedTypes;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->uploadDir = __DIR__ . '/../uploads';
        $this->maxFileSize = 10 * 1024 * 1024; // 10MB
        $this->allowedTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];
        
        $this->createUploadDirectories();
    }
    
    private function createUploadDirectories() {
        $dirs = [
            $this->uploadDir,
            $this->uploadDir . '/images',
            $this->uploadDir . '/images/original',
            $this->uploadDir . '/images/optimized',
            $this->uploadDir . '/images/thumbnails'
        ];
        
        foreach ($dirs as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
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
            "SELECT id, url_arquivo FROM imagens WHERE hash_md5 = ? AND status = 'ativo'",
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
        
        // Gerar nome único do arquivo
        $extension = $this->getExtensionFromMimeType($mimeType);
        $filename = uniqid('img_', true) . '.' . $extension;
        
        // Caminhos dos arquivos
        $originalPath = $this->uploadDir . '/images/original/' . $filename;
        $optimizedPath = $this->uploadDir . '/images/optimized/' . $filename;
        $thumbnailPath = $this->uploadDir . '/images/thumbnails/' . $filename;
        
        // Salvar arquivo original
        if (file_put_contents($originalPath, $imageContent) === false) {
            throw new Exception('Erro ao salvar arquivo original');
        }
        
        // Obter dimensões da imagem
        $imageInfo = getimagesize($originalPath);
        $width = $imageInfo[0] ?? null;
        $height = $imageInfo[1] ?? null;
        
        // Otimizar imagem
        $this->optimizeImage($originalPath, $optimizedPath, $mimeType);
        
        // Criar thumbnail
        $this->createThumbnail($originalPath, $thumbnailPath, $mimeType);
        
        // Salvar no banco de dados
        $imageId = $this->db->insert('imagens', [
            'nome_arquivo' => $filename,
            'nome_original' => $imageData['alt'] ?? $filename,
            'tipo_mime' => $mimeType,
            'tamanho' => strlen($imageContent),
            'largura' => $width,
            'altura' => $height,
            'url_arquivo' => '/uploads/images/original/' . $filename,
            'url_otimizada' => '/uploads/images/optimized/' . $filename,
            'url_thumbnail' => '/uploads/images/thumbnails/' . $filename,
            'hash_md5' => $hash,
            'alt_text' => $imageData['alt'] ?? '',
            'descricao' => $imageData['title'] ?? ''
        ]);
        
        // Relacionar com página se especificado
        if ($pageId) {
            $this->linkImageToPage($imageId, $pageId, $context);
        }
        
        $this->safeLog("Imagem salva com sucesso: ID {$imageId}, arquivo {$filename}");
        
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
            'url_arquivo' => $url,
            'hash_md5' => $hash,
            'alt_text' => $imageData['alt'] ?? '',
            'descricao' => $imageData['title'] ?? ''
        ]);
        
        if ($pageId) {
            $this->linkImageToPage($imageId, $pageId, $context);
        }
        
        return $imageId;
    }
    
    private function linkImageToPage($imageId, $pageId, $context = null) {
        // Verificar se relacionamento já existe (tratando NULL no contexto)
        if ($context === null) {
            $results = $this->db->query(
                "SELECT id FROM pagina_imagens WHERE pagina_id = ? AND imagem_id = ? AND contexto IS NULL",
                [$pageId, $imageId]
            );
        } else {
            $results = $this->db->query(
                "SELECT id FROM pagina_imagens WHERE pagina_id = ? AND imagem_id = ? AND contexto = ?",
                [$pageId, $imageId, $context]
            );
        }
        
        if (empty($results)) {
            // Obter próxima posição
            $results = $this->db->query(
                "SELECT COALESCE(MAX(posicao), 0) + 1 as proxima_posicao FROM pagina_imagens WHERE pagina_id = ?",
                [$pageId]
            );
            $proximaPosicao = !empty($results) ? $results[0]['proxima_posicao'] : 1;
            
            $this->db->insert('pagina_imagens', [
                'pagina_id' => $pageId,
                'imagem_id' => $imageId,
                'posicao' => $proximaPosicao,
                'contexto' => $context
            ]);
        }
    }
    
    private function optimizeImage($sourcePath, $destinationPath, $mimeType) {
        // Verificar se GD está disponível
        if (!extension_loaded('gd')) {
            // Se GD não estiver disponível, apenas copiar
            copy($sourcePath, $destinationPath);
            return;
        }
        
        // Implementação básica de otimização
        try {
            switch ($mimeType) {
                case 'image/jpeg':
                case 'image/jpg':
                    $image = imagecreatefromjpeg($sourcePath);
                    if ($image) {
                        imagejpeg($image, $destinationPath, 85); // Qualidade 85%
                        imagedestroy($image);
                    }
                    break;
                    
                case 'image/png':
                    $image = imagecreatefrompng($sourcePath);
                    if ($image) {
                        imagepng($image, $destinationPath, 6); // Compressão 6
                        imagedestroy($image);
                    }
                    break;
                    
                default:
                    // Para outros tipos, apenas copiar
                    copy($sourcePath, $destinationPath);
                    break;
            }
        } catch (Exception $e) {
            // Se otimização falhar, copiar original
            copy($sourcePath, $destinationPath);
        }
    }
    
    private function createThumbnail($sourcePath, $destinationPath, $mimeType, $maxWidth = 300, $maxHeight = 300) {
        // Verificar se GD está disponível
        if (!extension_loaded('gd')) {
            // Se GD não estiver disponível, apenas copiar
            copy($sourcePath, $destinationPath);
            return;
        }
        
        try {
            $image = null;
            
            switch ($mimeType) {
                case 'image/jpeg':
                case 'image/jpg':
                    $image = imagecreatefromjpeg($sourcePath);
                    break;
                case 'image/png':
                    $image = imagecreatefrompng($sourcePath);
                    break;
                case 'image/gif':
                    $image = imagecreatefromgif($sourcePath);
                    break;
            }
            
            if (!$image) {
                copy($sourcePath, $destinationPath);
                return;
            }
            
            $originalWidth = imagesx($image);
            $originalHeight = imagesy($image);
            
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
            
            // Salvar thumbnail
            switch ($mimeType) {
                case 'image/jpeg':
                case 'image/jpg':
                    imagejpeg($thumbnail, $destinationPath, 80);
                    break;
                case 'image/png':
                    imagepng($thumbnail, $destinationPath);
                    break;
                case 'image/gif':
                    imagegif($thumbnail, $destinationPath);
                    break;
            }
            
            imagedestroy($image);
            imagedestroy($thumbnail);
            
        } catch (Exception $e) {
            copy($sourcePath, $destinationPath);
        }
    }
    
    private function getExtensionFromMimeType($mimeType) {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg'
        ];
        
        return $extensions[$mimeType] ?? 'jpg';
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
        $sql = "SELECT * FROM imagens WHERE status = 'ativo'";
        $params = [];
        
        if ($search) {
            $sql .= " AND (nome_original LIKE ? OR alt_text LIKE ? OR tipo_mime LIKE ?)";
            $searchTerm = "%{$search}%";
            $params = [$searchTerm, $searchTerm, $searchTerm];
        }
        
        $sql .= " ORDER BY data_upload DESC LIMIT ? OFFSET ?";
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
            $updateData['data_modificacao'] = date('Y-m-d H:i:s');
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
                'data_modificacao' => date('Y-m-d H:i:s')
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
            $stmt = $this->db->query("SELECT * FROM imagens WHERE id = ?", [$imageId]);
            $image = $stmt->fetch();
            
            if ($image) {
                // Marcar como excluída
                $this->db->update('imagens', ['status' => 'excluido'], 'id = ?', [$imageId]);
                
                // Remover relacionamentos
                $this->db->query("UPDATE pagina_imagens SET status = 'inativo' WHERE imagem_id = ?", [$imageId]);
                
                // Log da ação
                $this->safeLog("Imagem excluída: ID {$imageId}, arquivo {$image['nome_arquivo']}");
            }
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            throw $e;
        }
    }
    
    private function safeLog($message) {
        $logFile = __DIR__ . '/../hardem-editor.log';
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($logFile, "[$timestamp] [IMAGE] $message\n", FILE_APPEND | LOCK_EX);
    }
} 