/**
 * HARDEM Editor Manager
 * Gerencia quando o editor deve ser ativado
 * @version 1.0.0
 */

class HardemEditorManager {
    constructor() {
        this.editMode = false;
        this.isAuthenticated = false;
        this.init();
    }
    
    init() {
        console.log('🎛️ Iniciando Gerenciador de Editor...');
        
        // Verificar se está em modo de edição via URL
        const urlParams = new URLSearchParams(window.location.search);
        const editParam = urlParams.get('edit');
        
        if (editParam === 'true') {
            console.log('📝 Modo de edição detectado via URL');
            this.enableEditMode();
        } else {
            console.log('👁️ Modo visualização - Editor desabilitado');
            this.disableEditMode();
        }
    }
    
    async enableEditMode() {
        console.log('🔓 Habilitando modo de edição...');
        
        // Verificar autenticação
        const isAuth = await this.checkAuthentication();
        
        if (!isAuth) {
            console.log('❌ Não autenticado - redirecionando para admin');
            this.redirectToAdmin();
            return;
        }
        
        console.log('✅ Autenticado - carregando editor...');
        this.loadEditor();
    }
    
    async checkAuthentication() {
        try {
            const response = await fetch('auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=check'
            });
            
            const data = await response.json();
            
            if (data.authenticated) {
                this.isAuthenticated = true;
                console.log('🔐 Usuário autenticado:', data.user.username);
                return true;
            } else {
                this.isAuthenticated = false;
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao verificar autenticação:', error);
            return false;
        }
    }
    
    redirectToAdmin() {
        alert('Acesso não autorizado. Redirecionando para o painel administrativo.');
        window.location.href = 'admin.html';
    }
    
    loadEditor() {
        // Criar indicador visual de modo de edição
        this.createEditModeIndicator();
        
        // Carregar scripts do editor dinamicamente
        this.loadEditorScripts().then(() => {
            console.log('📝 Editor carregado com sucesso!');
            
            // Aguardar um pouco e inicializar o editor
            setTimeout(() => {
                if (window.hardemEditor) {
                    if (!window.hardemEditor.editMode) {
                        window.hardemEditor.toggleEditMode();
                    }
                } else {
                    console.log('⏳ Aguardando editor estar disponível...');
                    this.waitForEditor();
                }
            }, 1000);
        });
    }
    
    waitForEditor() {
        const checkEditor = setInterval(() => {
            if (window.hardemEditor) {
                clearInterval(checkEditor);
                console.log('✅ Editor disponível - ativando modo de edição');
                if (!window.hardemEditor.editMode) {
                    window.hardemEditor.toggleEditMode();
                }
            }
        }, 500);
        
        // Timeout após 10 segundos
        setTimeout(() => {
            clearInterval(checkEditor);
            if (!window.hardemEditor) {
                console.error('❌ Timeout - Editor não carregou');
            }
        }, 10000);
    }
    
    async loadEditorScripts() {
        const scripts = [
            'assets/js/editor/editor-core.js',
            'assets/js/editor/editor-ui.js',
            'assets/js/editor/editor-text.js',
            'assets/js/editor/editor-image.js',
            'assets/js/editor/editor-carousel.js',
            'assets/js/editor/editor-storage.js',
            'assets/js/editor/editor-utils.js',
            'assets/js/editor-refatorado.js'
        ];
        
        console.log('📦 Carregando scripts do editor...');
        
        for (const scriptSrc of scripts) {
            await this.loadScript(scriptSrc);
        }
        
        console.log('✅ Todos os scripts carregados');
    }
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar se script já foi carregado
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`✅ Script carregado: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Erro ao carregar script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }
    
    createEditModeIndicator() {
        // Remover indicador existente
        const existing = document.getElementById('edit-mode-indicator');
        if (existing) existing.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'edit-mode-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
                padding: 10px;
                text-align: center;
                font-weight: 600;
                font-size: 14px;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                🔧 MODO DE EDIÇÃO ATIVO - Clique duas vezes nos elementos para editar
                <button onclick="exitEditMode()" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 5px 15px;
                    border-radius: 15px;
                    margin-left: 20px;
                    cursor: pointer;
                    font-size: 12px;
                ">
                    ❌ Sair do Modo de Edição
                </button>
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Ajustar padding do body para não sobrepor o indicador
        document.body.style.paddingTop = '50px';
    }
    
    disableEditMode() {
        console.log('👁️ Modo visualização ativo');
        // Não carregar scripts do editor
        // Página funciona normalmente para usuários finais
    }
    
    exitEditMode() {
        if (confirm('Deseja sair do modo de edição? As alterações não salvas serão perdidas.')) {
            // Remover parâmetro edit da URL
            const url = new URL(window.location);
            url.searchParams.delete('edit');
            window.location.href = url.toString();
        }
    }
}

// Função global para sair do modo de edição
function exitEditMode() {
    if (window.editorManager) {
        window.editorManager.exitEditMode();
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.editorManager = new HardemEditorManager();
});

window.HardemEditorManager = HardemEditorManager; 