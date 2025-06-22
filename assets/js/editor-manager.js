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
            
            // Aguardar um pouco e verificar se editor foi carregado
            setTimeout(() => {
                if (window.hardemEditor) {
                    console.log('✅ Editor carregado - aguardando ativação manual');
                    // NÃO ativar automaticamente - usuário deve clicar no botão ✏️
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
                console.log('✅ Editor disponível - pronto para ativação manual');
                // NÃO ativar automaticamente - aguardar usuário clicar no botão ✏️
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
        // Não criar mais o indicador vermelho - a toolbar já tem o controle
        console.log('📝 Modo de edição gerenciado pela toolbar principal');
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