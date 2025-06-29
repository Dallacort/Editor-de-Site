<?php
require_once 'classes/Database.php';

try {
    $db = Database::getInstance();
    
    echo "<h1>🔍 Verificando Estrutura da Tabela pagina_imagens</h1>";
    
    // Verificar estrutura da tabela
    $structure = $db->query("DESCRIBE pagina_imagens");
    
    echo "<h2>Estrutura da tabela pagina_imagens:</h2>";
    echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    
    foreach ($structure as $column) {
        echo "<tr>";
        echo "<td>{$column['Field']}</td>";
        echo "<td>{$column['Type']}</td>";
        echo "<td>{$column['Null']}</td>";
        echo "<td>{$column['Key']}</td>";
        echo "<td>{$column['Default']}</td>";
        echo "<td>{$column['Extra']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Verificar alguns registros
    echo "<h2>Registros na tabela pagina_imagens:</h2>";
    $records = $db->query("SELECT * FROM pagina_imagens LIMIT 5");
    
    if (empty($records)) {
        echo "<p>Nenhum registro encontrado.</p>";
    } else {
        echo "<table border='1' style='border-collapse: collapse; width: 100%;'>";
        echo "<tr>";
        foreach (array_keys($records[0]) as $key) {
            echo "<th>{$key}</th>";
        }
        echo "</tr>";
        
        foreach ($records as $record) {
            echo "<tr>";
            foreach ($record as $value) {
                echo "<td>" . htmlspecialchars($value) . "</td>";
            }
            echo "</tr>";
        }
        echo "</table>";
    }
    
} catch (Exception $e) {
    echo "<p>Erro: " . $e->getMessage() . "</p>";
}
?> 