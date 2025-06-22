<?php
session_start();

define('ADMIN_USERNAME', 'Hardem');
define('ADMIN_PASSWORD', 'Hardem@321');
define('SESSION_TIMEOUT', 3600);

class HardemAuth {
    
    public static function isAuthenticated() {
        if (!isset($_SESSION['hardem_authenticated']) || !isset($_SESSION['hardem_login_time'])) {
            return false;
        }
        
        if (time() - $_SESSION['hardem_login_time'] > SESSION_TIMEOUT) {
            self::logout();
            return false;
        }
        
        $_SESSION['hardem_login_time'] = time();
        return $_SESSION['hardem_authenticated'] === true;
    }
    
    public static function login($username, $password) {
        if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
            $_SESSION['hardem_authenticated'] = true;
            $_SESSION['hardem_login_time'] = time();
            $_SESSION['hardem_username'] = $username;
            return true;
        }
        return false;
    }
    
    public static function logout() {
        unset($_SESSION['hardem_authenticated']);
        unset($_SESSION['hardem_login_time']);
        unset($_SESSION['hardem_username']);
        
        if (empty($_SESSION)) {
            session_destroy();
        }
    }
    
    public static function getUserInfo() {
        if (!self::isAuthenticated()) {
            return null;
        }
        
        return [
            'username' => $_SESSION['hardem_username'],
            'login_time' => $_SESSION['hardem_login_time'],
            'session_expires' => $_SESSION['hardem_login_time'] + SESSION_TIMEOUT
        ];
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'login':
            $username = $_POST['username'] ?? '';
            $password = $_POST['password'] ?? '';
            
            if (HardemAuth::login($username, $password)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Login realizado com sucesso!',
                    'user' => HardemAuth::getUserInfo()
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Usuario ou senha incorretos!'
                ]);
            }
            break;
            
        case 'logout':
            HardemAuth::logout();
            echo json_encode([
                'success' => true,
                'message' => 'Logout realizado com sucesso!'
            ]);
            break;
            
        case 'check':
            if (HardemAuth::isAuthenticated()) {
                echo json_encode([
                    'authenticated' => true,
                    'user' => HardemAuth::getUserInfo()
                ]);
            } else {
                echo json_encode([
                    'authenticated' => false
                ]);
            }
            break;
            
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Acao invalida!'
            ]);
    }
    exit;
}
?> 