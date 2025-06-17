<?php
/**
 * Classe DatabaseJSON - Simula banco de dados usando arquivos JSON
 * Alternativa para quando MySQL não está disponível
 * @version 3.2.0
 */

class DatabaseJSON {
    private static $instance = null;
    private $dataDir;
    private $tables = ['imagens', 'textos', 'pagina_imagens', 'backups', 'system_logs'];
    
    private function __construct() {
        $this->dataDir = __DIR__ . '/../data/';
        $this->ensureDataDirectory();
        $this->initializeTables();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function ensureDataDirectory() {
        if (!is_dir($this->dataDir)) {
            mkdir($this->dataDir, 0755, true);
        }
    }
    
    private function initializeTables() {
        foreach ($this->tables as $table) {
            $file = $this->dataDir . $table . '.json';
            if (!file_exists($file)) {
                file_put_contents($file, json_encode([], JSON_PRETTY_PRINT));
            }
        }
    }
    
    public function testConnection() {
        return is_dir($this->dataDir) && is_writable($this->dataDir);
    }
    
    public function query($sql, $params = []) {
        // Simular queries SQL básicas
        $sql = trim($sql);
        
        // SELECT
        if (stripos($sql, 'SELECT') === 0) {
            return $this->handleSelect($sql, $params);
        }
        
        // INSERT
        if (stripos($sql, 'INSERT') === 0) {
            return $this->handleInsert($sql, $params);
        }
        
        // UPDATE
        if (stripos($sql, 'UPDATE') === 0) {
            return $this->handleUpdate($sql, $params);
        }
        
        // DELETE
        if (stripos($sql, 'DELETE') === 0) {
            return $this->handleDelete($sql, $params);
        }
        
        // Queries especiais
        if (stripos($sql, 'SELECT VERSION()') !== false) {
            return [['version' => 'JSON-DB 1.0']];
        }
        
        if (stripos($sql, 'DESCRIBE') !== false) {
            return $this->handleDescribe($sql);
        }
        
        return [];
    }
    
    private function handleSelect($sql, $params) {
        // Extrair nome da tabela
        if (preg_match('/FROM\s+(\w+)/i', $sql, $matches)) {
            $table = $matches[1];
            $data = $this->loadTable($table);
            
            // Aplicar WHERE se houver parâmetros
            if (!empty($params)) {
                $data = $this->applyWhereConditions($data, $sql, $params);
            }
            
            // Aplicar ORDER BY se houver
            if (preg_match('/ORDER BY\s+(\w+)\s+(ASC|DESC)/i', $sql, $orderMatches)) {
                $column = $orderMatches[1];
                $direction = strtoupper($orderMatches[2]);
                
                usort($data, function($a, $b) use ($column, $direction) {
                    $result = strcmp($a[$column] ?? '', $b[$column] ?? '');
                    return $direction === 'DESC' ? -$result : $result;
                });
            }
            
            return $data;
        }
        
        return [];
    }
    
    private function handleInsert($sql, $params) {
        // Extrair tabela e dados
        if (preg_match('/INSERT INTO\s+(\w+)/i', $sql, $matches)) {
            $table = $matches[1];
            $data = $this->loadTable($table);
            
            // Criar novo registro
            $newRecord = [];
            
            // Se há parâmetros, usar como dados
            if (!empty($params)) {
                // Extrair colunas do SQL
                if (preg_match('/\(([^)]+)\)\s+VALUES/i', $sql, $colMatches)) {
                    $columns = array_map('trim', explode(',', $colMatches[1]));
                    
                    for ($i = 0; $i < count($columns) && $i < count($params); $i++) {
                        $newRecord[$columns[$i]] = $params[$i];
                    }
                }
            }
            
            // Gerar ID se não existir
            if (!isset($newRecord['id'])) {
                $maxId = 0;
                foreach ($data as $record) {
                    if (isset($record['id']) && $record['id'] > $maxId) {
                        $maxId = $record['id'];
                    }
                }
                $newRecord['id'] = $maxId + 1;
            }
            
            // Adicionar timestamps
            $now = date('Y-m-d H:i:s');
            if (!isset($newRecord['criado_em'])) {
                $newRecord['criado_em'] = $now;
            }
            if (!isset($newRecord['atualizado_em'])) {
                $newRecord['atualizado_em'] = $now;
            }
            
            $data[] = $newRecord;
            $this->saveTable($table, $data);
            
            return $newRecord['id'];
        }
        
        return false;
    }
    
    private function handleUpdate($sql, $params) {
        // Implementação básica de UPDATE
        if (preg_match('/UPDATE\s+(\w+)/i', $sql, $matches)) {
            $table = $matches[1];
            $data = $this->loadTable($table);
            
            $updated = 0;
            foreach ($data as &$record) {
                // Aplicar condições WHERE (simplificado)
                if ($this->matchesWhereCondition($record, $sql, $params)) {
                    // Atualizar campos (implementação simplificada)
                    $record['atualizado_em'] = date('Y-m-d H:i:s');
                    $updated++;
                }
            }
            
            if ($updated > 0) {
                $this->saveTable($table, $data);
            }
            
            return $updated;
        }
        
        return 0;
    }
    
    private function handleDelete($sql, $params) {
        // Implementação básica de DELETE
        if (preg_match('/DELETE FROM\s+(\w+)/i', $sql, $matches)) {
            $table = $matches[1];
            $data = $this->loadTable($table);
            
            $originalCount = count($data);
            $data = array_filter($data, function($record) use ($sql, $params) {
                return !$this->matchesWhereCondition($record, $sql, $params);
            });
            
            $deleted = $originalCount - count($data);
            
            if ($deleted > 0) {
                $this->saveTable($table, array_values($data));
            }
            
            return $deleted;
        }
        
        return 0;
    }
    
    private function handleDescribe($sql) {
        // Simular DESCRIBE table
        if (preg_match('/DESCRIBE\s+(\w+)/i', $sql, $matches)) {
            $table = $matches[1];
            
            // Retornar estrutura básica baseada na tabela
            $structures = [
                'imagens' => [
                    ['Field' => 'id', 'Type' => 'int'],
                    ['Field' => 'url_original', 'Type' => 'text'],
                    ['Field' => 'url_otimizada', 'Type' => 'text'],
                    ['Field' => 'alt_text', 'Type' => 'text'],
                    ['Field' => 'largura', 'Type' => 'int'],
                    ['Field' => 'altura', 'Type' => 'int'],
                    ['Field' => 'hash_md5', 'Type' => 'varchar'],
                    ['Field' => 'status', 'Type' => 'varchar'],
                    ['Field' => 'criado_em', 'Type' => 'datetime'],
                    ['Field' => 'atualizado_em', 'Type' => 'datetime']
                ],
                'textos' => [
                    ['Field' => 'id', 'Type' => 'int'],
                    ['Field' => 'chave', 'Type' => 'varchar'],
                    ['Field' => 'conteudo', 'Type' => 'text'],
                    ['Field' => 'tipo_conteudo', 'Type' => 'varchar'],
                    ['Field' => 'pagina', 'Type' => 'varchar'],
                    ['Field' => 'status', 'Type' => 'varchar'],
                    ['Field' => 'criado_em', 'Type' => 'datetime'],
                    ['Field' => 'atualizado_em', 'Type' => 'datetime']
                ]
            ];
            
            return $structures[$table] ?? [];
        }
        
        return [];
    }
    
    private function loadTable($table) {
        $file = $this->dataDir . $table . '.json';
        if (file_exists($file)) {
            $content = file_get_contents($file);
            return json_decode($content, true) ?: [];
        }
        return [];
    }
    
    private function saveTable($table, $data) {
        $file = $this->dataDir . $table . '.json';
        return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    
    private function applyWhereConditions($data, $sql, $params) {
        // Implementação simplificada de WHERE
        return array_filter($data, function($record) use ($sql, $params) {
            return $this->matchesWhereCondition($record, $sql, $params);
        });
    }
    
    private function matchesWhereCondition($record, $sql, $params) {
        // Implementação muito simplificada - apenas para casos básicos
        if (empty($params)) return true;
        
        // Procurar por condições simples como "WHERE campo = ?"
        if (preg_match('/WHERE\s+(\w+)\s*=\s*\?/i', $sql, $matches)) {
            $field = $matches[1];
            return isset($record[$field]) && $record[$field] == $params[0];
        }
        
        return true;
    }
    
    public function lastInsertId() {
        // Retornar último ID inserido (simplificado)
        return $this->lastId ?? 1;
    }
    
    public function beginTransaction() {
        // Simular transação (não implementado completamente)
        return true;
    }
    
    public function commit() {
        return true;
    }
    
    public function rollback() {
        return true;
    }
    
    public function escape($string) {
        return addslashes($string);
    }
    
    public function getConnection() {
        return $this;
    }
}
?> 