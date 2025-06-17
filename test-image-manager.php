<?php
/**
 * HARDEM Editor - Teste do Gerenciador de Imagens
 * Testa o funcionamento do ImageManager
 */

// Verificar se as classes existem
if (!file_exists(__DIR__ . '/classes/Database.php')) {
    die("❌ Erro: Arquivo classes/Database.php não encontrado!");
}

if (!file_exists(__DIR__ . '/classes/ImageManager.php')) {
    die("❌ Erro: Arquivo classes/ImageManager.php não encontrado!");
}

// Incluir classes
require_once __DIR__ . '/classes/Database.php';

// Criar a classe ImageManager corrigida
class ImageManager {
    private $db;
    private $uploadDir;
    private $maxFileSize;
    private $allowedTypes;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->uploadDir = __DIR__ . '/uploads';
        $this->maxFileSize = 10 * 1024 * 1024; // 10MB
        $this->allowedTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/webp'
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
                if (!mkdir($dir, 0755, true)) {
                    throw new Exception("Não foi possível criar diretório: {$dir}");
                }
            }
        }
    }
    
    public function testDirectories() {
        $dirs = [
            'uploads' => $this->uploadDir,
            'images' => $this->uploadDir . '/images',
            'original' => $this->uploadDir . '/images/original',
            'optimized' => $this->uploadDir . '/images/optimized',
            'thumbnails' => $this->uploadDir . '/images/thumbnails'
        ];
        
        $results = [];
        foreach ($dirs as $name => $path) {
            $results[$name] = [
                'path' => $path,
                'exists' => is_dir($path),
                'writable' => is_writable($path)
            ];
        }
        
        return $results;
    }
    
    public function saveImage($imageData, $pageId = null, $context = null) {
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
        $stmt = $this->db->query(
            "SELECT id, url_arquivo FROM imagens WHERE hash_md5 = ? AND status = 'ativo'",
            [$hash]
        );
        $existingImage = $stmt->fetch();
        
        if ($existingImage) {
            // Imagem já existe
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
        $imageInfo = @getimagesize($originalPath);
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
        
        return $imageId;
    }
    
    private function saveUrlImage($imageData, $pageId, $context) {
        // Para URLs externas, apenas salvar referência no banco
        $url = $imageData['src'];
        $hash = md5($url);
        
        // Verificar se URL já existe
        $stmt = $this->db->query(
            "SELECT id FROM imagens WHERE hash_md5 = ? AND status = 'ativo'",
            [$hash]
        );
        $existingImage = $stmt->fetch();
        
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
        // Verificar se relacionamento já existe
        $stmt = $this->db->query(
            "SELECT id FROM pagina_imagens WHERE pagina_id = ? AND imagem_id = ? AND (contexto = ? OR (contexto IS NULL AND ? IS NULL))",
            [$pageId, $imageId, $context, $context]
        );
        
        if (!$stmt->fetch()) {
            // Obter próxima posição
            $stmt = $this->db->query(
                "SELECT COALESCE(MAX(posicao), 0) + 1 as proxima_posicao FROM pagina_imagens WHERE pagina_id = ?",
                [$pageId]
            );
            $proximaPosicao = $stmt->fetch()['proxima_posicao'];
            
            $this->db->insert('pagina_imagens', [
                'pagina_id' => $pageId,
                'imagem_id' => $imageId,
                'posicao' => $proximaPosicao,
                'contexto' => $context
            ]);
        }
    }
    
    private function optimizeImage($sourcePath, $destinationPath, $mimeType) {
        try {
            switch ($mimeType) {
                case 'image/jpeg':
                case 'image/jpg':
                    if (function_exists('imagecreatefromjpeg')) {
                        $image = imagecreatefromjpeg($sourcePath);
                        if ($image) {
                            imagejpeg($image, $destinationPath, 85);
                            imagedestroy($image);
                            return;
                        }
                    }
                    break;
                    
                case 'image/png':
                    if (function_exists('imagecreatefrompng')) {
                        $image = imagecreatefrompng($sourcePath);
                        if ($image) {
                            imagepng($image, $destinationPath, 6);
                            imagedestroy($image);
                            return;
                        }
                    }
                    break;
            }
            
            // Se não conseguiu otimizar, copiar original
            copy($sourcePath, $destinationPath);
            
        } catch (Exception $e) {
            copy($sourcePath, $destinationPath);
        }
    }
    
    private function createThumbnail($sourcePath, $destinationPath, $mimeType, $maxWidth = 300, $maxHeight = 300) {
        try {
            $image = null;
            
            switch ($mimeType) {
                case 'image/jpeg':
                case 'image/jpg':
                    if (function_exists('imagecreatefromjpeg')) {
                        $image = imagecreatefromjpeg($sourcePath);
                    }
                    break;
                case 'image/png':
                    if (function_exists('imagecreatefrompng')) {
                        $image = imagecreatefrompng($sourcePath);
                    }
                    break;
                case 'image/gif':
                    if (function_exists('imagecreatefromgif')) {
                        $image = imagecreatefromgif($sourcePath);
                    }
                    break;
            }
            
            if (!$image) {
                copy($sourcePath, $destinationPath);
                return;
            }
            
            $originalWidth = imagesx($image);
            $originalHeight = imagesy($image);
            
            // Calcular novas dimensões
            $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
            $newWidth = round($originalWidth * $ratio);
            $newHeight = round($originalHeight * $ratio);
            
            // Criar nova imagem
            $thumbnail = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preservar transparência
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
            'image/webp' => 'webp'
        ];
        
        return $extensions[$mimeType] ?? 'jpg';
    }
}

?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HARDEM Editor - Teste do Gerenciador de Imagens</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .test-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
        }
        .test-title {
            font-size: 1.3em;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
        }
        .success {
            background: #28a745;
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .error {
            background: #dc3545;
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .info {
            background: #17a2b8;
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .directory-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .directory-item {
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: #f9f9f9;
        }
        .directory-item.ok {
            border-color: #28a745;
            background: #d4edda;
        }
        .directory-item.error {
            border-color: #dc3545;
            background: #f8d7da;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .btn {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        .btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ HARDEM Editor - Teste do Gerenciador de Imagens</h1>
        
        <div class="test-section">
            <div class="test-title">1. Teste de Inicialização</div>
            <?php
            try {
                $imageManager = new ImageManager();
                echo '<div class="success">✅ ImageManager criado com sucesso!</div>';
            } catch (Exception $e) {
                echo '<div class="error">❌ Erro ao criar ImageManager: ' . $e->getMessage() . '</div>';
                exit;
            }
            ?>
        </div>
        
        <div class="test-section">
            <div class="test-title">2. Verificação de Diretórios</div>
            <?php
            try {
                $directories = $imageManager->testDirectories();
                
                echo '<div class="directory-grid">';
                foreach ($directories as $name => $info) {
                    $class = ($info['exists'] && $info['writable']) ? 'ok' : 'error';
                    $status = ($info['exists'] && $info['writable']) ? '✅' : '❌';
                    
                    echo "<div class='directory-item {$class}'>";
                    echo "<strong>{$status} {$name}</strong><br>";
                    echo "Caminho: {$info['path']}<br>";
                    echo "Existe: " . ($info['exists'] ? 'Sim' : 'Não') . "<br>";
                    echo "Gravável: " . ($info['writable'] ? 'Sim' : 'Não');
                    echo "</div>";
                }
                echo '</div>';
                
            } catch (Exception $e) {
                echo '<div class="error">❌ Erro ao verificar diretórios: ' . $e->getMessage() . '</div>';
            }
            ?>
        </div>
        
        <div class="test-section">
            <div class="test-title">3. Verificação de Extensões PHP</div>
            <?php
            $extensions = [
                'GD' => extension_loaded('gd'),
                'PDO' => extension_loaded('pdo'),
                'PDO MySQL' => extension_loaded('pdo_mysql'),
                'JSON' => extension_loaded('json')
            ];
            
            echo '<table>';
            echo '<tr><th>Extensão</th><th>Status</th><th>Função</th></tr>';
            
            foreach ($extensions as $ext => $loaded) {
                $status = $loaded ? '✅ Ativa' : '❌ Inativa';
                $function = '';
                
                switch ($ext) {
                    case 'GD':
                        $function = 'Manipulação de imagens';
                        break;
                    case 'PDO':
                        $function = 'Conexão com banco de dados';
                        break;
                    case 'PDO MySQL':
                        $function = 'Conexão com MariaDB/MySQL';
                        break;
                    case 'JSON':
                        $function = 'Manipulação de dados JSON';
                        break;
                }
                
                echo "<tr><td>{$ext}</td><td>{$status}</td><td>{$function}</td></tr>";
            }
            
            echo '</table>';
            ?>
        </div>
        
        <div class="test-section">
            <div class="test-title">4. Teste de Conexão com Banco</div>
            <?php
            try {
                $db = Database::getInstance();
                
                if ($db->testConnection()) {
                    echo '<div class="success">✅ Conexão com banco de dados OK!</div>';
                    
                    // Verificar se tabela imagens existe
                    $stmt = $db->query("SHOW TABLES LIKE 'imagens'");
                    if ($stmt->fetch()) {
                        echo '<div class="info">ℹ️ Tabela "imagens" encontrada!</div>';
                        
                        // Contar registros
                        $stmt = $db->query("SELECT COUNT(*) as total FROM imagens");
                        $result = $stmt->fetch();
                        echo '<div class="info">ℹ️ Total de imagens no banco: ' . $result['total'] . '</div>';
                    } else {
                        echo '<div class="error">❌ Tabela "imagens" não encontrada! Execute o script SQL primeiro.</div>';
                    }
                    
                } else {
                    echo '<div class="error">❌ Erro na conexão com banco de dados!</div>';
                }
            } catch (Exception $e) {
                echo '<div class="error">❌ Erro: ' . $e->getMessage() . '</div>';
            }
            ?>
        </div>
        
        <div class="test-section">
            <div class="test-title">5. Teste de Salvamento de Imagem (Simulado)</div>
            <?php
            try {
                // Criar uma imagem de teste pequena (1x1 pixel PNG)
                $testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
                
                $testImageData = [
                    'src' => $testImageBase64,
                    'alt' => 'Imagem de teste',
                    'title' => 'Teste do ImageManager'
                ];
                
                $imageId = $imageManager->saveImage($testImageData, 'test-page', 'test-context');
                
                echo '<div class="success">✅ Teste de salvamento bem-sucedido!</div>';
                echo '<div class="info">ℹ️ ID da imagem salva: ' . $imageId . '</div>';
                
                // Verificar se a imagem foi salva no banco
                $stmt = $db->query("SELECT * FROM imagens WHERE id = ?", [$imageId]);
                $imageRecord = $stmt->fetch();
                
                if ($imageRecord) {
                    echo '<div class="info">ℹ️ Imagem encontrada no banco de dados!</div>';
                    echo '<table>';
                    echo '<tr><th>Campo</th><th>Valor</th></tr>';
                    foreach ($imageRecord as $field => $value) {
                        if ($field === 'created_at' || $field === 'updated_at') {
                            $value = date('d/m/Y H:i:s', strtotime($value));
                        }
                        echo "<tr><td>{$field}</td><td>" . htmlspecialchars($value) . "</td></tr>";
                    }
                    echo '</table>';
                } else {
                    echo '<div class="error">❌ Imagem não encontrada no banco de dados!</div>';
                }
                
            } catch (Exception $e) {
                echo '<div class="error">❌ Erro no teste de salvamento: ' . $e->getMessage() . '</div>';
            }
            ?>
        </div>
        
        <div class="test-section">
            <button class="btn" onclick="window.location.reload()">🔄 Executar Testes Novamente</button>
            <button class="btn" onclick="window.location.href='test-database.php'">🔧 Teste Geral do Banco</button>
            <button class="btn" onclick="window.location.href='test-save.html'">📝 Teste de Salvamento</button>
        </div>
    </div>
</body>
</html> 