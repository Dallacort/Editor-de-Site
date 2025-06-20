<?php
/**
 * Script para atualizar estrutura do banco - Database-Only
 */

require_once __DIR__ . '/classes/Database.php';

echo "<h1>🔧 Atualizando Estrutura do Banco - Database-Only</h1>";

try {
    $db = Database::getInstance();
    
    echo "<h2>📊 Verificando estrutura atual...</h2>";
    
    // Verificar se os campos já existem
    $columns = $db->query("DESCRIBE imagens");
    $hasBase64 = false;
    $hasThumbnail = false;
    
    foreach ($columns as $column) {
        if ($column['Field'] === 'dados_base64') $hasBase64 = true;
        if ($column['Field'] === 'thumbnail_base64') $hasThumbnail = true;
    }
    
    echo "<p>✅ Campo 'dados_base64': " . ($hasBase64 ? "Existe" : "Não existe") . "</p>";
    echo "<p>✅ Campo 'thumbnail_base64': " . ($hasThumbnail ? "Existe" : "Não existe") . "</p>";
    
    if (!$hasBase64 || !$hasThumbnail) {
        echo "<h2>🔧 Adicionando campos necessários...</h2>";
        
        if (!$hasBase64) {
            $db->query("ALTER TABLE `imagens` ADD COLUMN `dados_base64` LONGTEXT NULL COMMENT 'Dados da imagem em base64 (database-only)' AFTER `hash_md5`");
            echo "<p>✅ Campo 'dados_base64' adicionado</p>";
        }
        
        if (!$hasThumbnail) {
            $db->query("ALTER TABLE `imagens` ADD COLUMN `thumbnail_base64` LONGTEXT NULL COMMENT 'Thumbnail da imagem em base64 (database-only)' AFTER `dados_base64`");
            echo "<p>✅ Campo 'thumbnail_base64' adicionado</p>";
        }
        
        // Tornar url_arquivo opcional
        $db->query("ALTER TABLE `imagens` MODIFY COLUMN `url_arquivo` varchar(500) NULL COMMENT 'URL do arquivo original (opcional para database-only)'");
        echo "<p>✅ Campo 'url_arquivo' tornado opcional</p>";
        
        // Adicionar índice
        try {
            $db->query("ALTER TABLE `imagens` ADD INDEX `idx_database_only` (`dados_base64`(100))");
            echo "<p>✅ Índice 'idx_database_only' adicionado</p>";
        } catch (Exception $e) {
            echo "<p>⚠️ Índice já existe ou erro: " . $e->getMessage() . "</p>";
        }
        
    } else {
        echo "<p>✅ Estrutura já está atualizada!</p>";
    }
    
    echo "<h2>📊 Estrutura final da tabela 'imagens':</h2>";
    $finalColumns = $db->query("DESCRIBE imagens");
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Padrão</th><th>Comentário</th></tr>";
    foreach ($finalColumns as $col) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($col['Field']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Type']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Null']) . "</td>";
        echo "<td>" . htmlspecialchars($col['Default'] ?? 'NULL') . "</td>";
        echo "<td>" . htmlspecialchars($col['Comment'] ?? '') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    echo "<h2>📊 Estatísticas:</h2>";
    $stats = $db->query("SELECT 
        COUNT(*) as total_imagens,
        COUNT(dados_base64) as imagens_database_only,
        COUNT(url_arquivo) as imagens_com_url,
        SUM(CASE WHEN dados_base64 IS NOT NULL THEN tamanho ELSE 0 END) as tamanho_database_only
    FROM `imagens` 
    WHERE status = 'ativo'");
    
    if (!empty($stats)) {
        $stat = $stats[0];
        echo "<ul>";
        echo "<li>Total de imagens: " . $stat['total_imagens'] . "</li>";
        echo "<li>Imagens database-only: " . $stat['imagens_database_only'] . "</li>";
        echo "<li>Imagens com URL: " . $stat['imagens_com_url'] . "</li>";
        echo "<li>Tamanho database-only: " . formatBytes($stat['tamanho_database_only']) . "</li>";
        echo "</ul>";
    }
    
    echo "<h2>✅ Atualização concluída com sucesso!</h2>";
    
} catch (Exception $e) {
    echo "<h2>❌ Erro na atualização:</h2>";
    echo "<p style='color: red;'>" . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

function formatBytes($bytes, $decimals = 2) {
    if ($bytes === 0 || $bytes === null) return '0 Bytes';
    $k = 1024;
    $dm = $decimals < 0 ? 0 : $decimals;
    $sizes = ['Bytes', 'KB', 'MB', 'GB'];
    $i = floor(log($bytes) / log($k));
    return round($bytes / pow($k, $i), $dm) . ' ' . $sizes[$i];
}
?>

<style>
body {
    font-family: Arial, sans-serif;
    margin: 20px;
    background: #f5f5f5;
}
h1, h2 {
    color: #333;
}
table {
    background: white;
    margin: 10px 0;
}
th {
    background: #007cba;
    color: white;
    padding: 8px;
}
td {
    padding: 6px;
    border: 1px solid #ddd;
}
</style> 