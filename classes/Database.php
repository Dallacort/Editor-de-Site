<?php
/**
 * Classe Database - Conexão com MariaDB usando MySQLi ou JSON fallback
 * @version 3.2.0 - Com fallback para JSON quando MySQL não disponível
 */

class Database {
    private static $instance = null;
    private $connection;
    private $config;
    private $useJSON = false;
    
    private function __construct() {
        $this->config = require __DIR__ . '/../config/database.php';
        
        // Tentar MySQLi primeiro, usar JSON como fallback
        if (extension_loaded('mysqli')) {
            try {
                $this->connect();
                $this->safeLog("Conexão MySQL estabelecida com sucesso");
            } catch (Exception $e) {
                $this->safeLog("MySQL falhou, usando JSON: " . $e->getMessage());
                $this->useJSON = true;
            }
        } else {
            $this->safeLog("MySQLi não disponível, usando JSON como banco");
            $this->useJSON = true;
        }
        
        if ($this->useJSON) {
            require_once __DIR__ . '/DatabaseJSON.php';
            $this->connection = DatabaseJSON::getInstance();
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function connect() {
        try {
            $this->connection = new mysqli(
                $this->config['host'],
                $this->config['username'],
                $this->config['password'],
                $this->config['database'],
                $this->config['port']
            );
            
            if ($this->connection->connect_error) {
                throw new Exception("Erro de conexão: " . $this->connection->connect_error);
            }
            
            // Configurar charset
            $this->connection->set_charset($this->config['charset']);
            
        } catch (Exception $e) {
            throw new Exception("Falha na conexão com o banco: " . $e->getMessage());
        }
    }
    
    public function testConnection() {
        if ($this->useJSON) {
            return $this->connection->testConnection();
        }
        // Usar query simples ao invés de ping() (deprecated no PHP 8.4)
        try {
            $result = $this->connection->query('SELECT 1');
            return $result !== false;
        } catch (Exception $e) {
            return false;
        }
    }
    
    public function query($sql, $params = []) {
        if ($this->useJSON) {
            return $this->connection->query($sql, $params);
        }
        
        try {
            if (empty($params)) {
                // Query simples sem parâmetros
                $result = $this->connection->query($sql);
                
                if ($result === false) {
                    throw new Exception("Erro na query: " . $this->connection->error);
                }
                
                if ($result === true) {
                    return true; // Para INSERT, UPDATE, DELETE
                }
                
                // Para SELECT
                $rows = [];
                while ($row = $result->fetch_assoc()) {
                    $rows[] = $row;
                }
                $result->free();
                
                return $rows;
                
            } else {
                // Query com parâmetros preparados
                $stmt = $this->connection->prepare($sql);
                
                if (!$stmt) {
                    throw new Exception("Erro ao preparar query: " . $this->connection->error);
                }
                
                if (!empty($params)) {
                    // Determinar tipos dos parâmetros
                    $types = '';
                    foreach ($params as $param) {
                        if (is_int($param)) {
                            $types .= 'i';
                        } elseif (is_float($param)) {
                            $types .= 'd';
                        } else {
                            $types .= 's';
                        }
                    }
                    
                    $stmt->bind_param($types, ...$params);
                }
                
                if (!$stmt->execute()) {
                    throw new Exception("Erro ao executar query: " . $stmt->error);
                }
                
                $result = $stmt->get_result();
                
                if ($result === false) {
                    // INSERT, UPDATE, DELETE
                    $affected = $stmt->affected_rows;
                    $stmt->close();
                    return $affected;
                }
                
                // SELECT
                $rows = [];
                while ($row = $result->fetch_assoc()) {
                    $rows[] = $row;
                }
                
                $stmt->close();
                return $rows;
            }
            
        } catch (Exception $e) {
            throw new Exception("Erro na query: " . $e->getMessage() . " | SQL: " . $sql);
        }
    }
    
    public function lastInsertId() {
        if ($this->useJSON) {
            return $this->connection->lastInsertId();
        }
        return $this->connection->insert_id;
    }
    
    public function beginTransaction() {
        if ($this->useJSON) {
            return $this->connection->beginTransaction();
        }
        return $this->connection->autocommit(false);
    }
    
    public function commit() {
        if ($this->useJSON) {
            return $this->connection->commit();
        }
        $result = $this->connection->commit();
        $this->connection->autocommit(true);
        return $result;
    }
    
    public function rollback() {
        if ($this->useJSON) {
            return $this->connection->rollback();
        }
        $result = $this->connection->rollback();
        $this->connection->autocommit(true);
        return $result;
    }
    
    public function escape($string) {
        if ($this->useJSON) {
            return $this->connection->escape($string);
        }
        return $this->connection->real_escape_string($string);
    }
    
    public function insert($table, $data) {
        if ($this->useJSON) {
            return $this->connection->insert($table, $data);
        }
        
        $columns = array_keys($data);
        $placeholders = array_fill(0, count($data), '?');
        
        $sql = "INSERT INTO `{$table}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $placeholders) . ")";
        
        $this->query($sql, array_values($data));
        
        return $this->lastInsertId();
    }
    
    public function update($table, $data, $where, $whereParams = []) {
        if ($this->useJSON) {
            return $this->connection->update($table, $data, $where, $whereParams);
        }
        
        $setParts = [];
        foreach (array_keys($data) as $column) {
            $setParts[] = "`{$column}` = ?";
        }
        
        $sql = "UPDATE `{$table}` SET " . implode(', ', $setParts) . " WHERE {$where}";
        
        $params = array_merge(array_values($data), $whereParams);
        
        return $this->query($sql, $params);
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function __destruct() {
        if ($this->connection && !$this->useJSON) {
            $this->connection->close();
        }
    }
    
    private function safeLog($message) {
        $logFile = __DIR__ . '/../hardem-editor.log';
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($logFile, "[$timestamp] [DATABASE] $message\n", FILE_APPEND | LOCK_EX);
    }
} 