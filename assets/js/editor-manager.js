/**
 * HARDEM Editor Manager
 * Gerencia quando o editor deve ser ativado
 * @version 1.0.0
 */

class HardemEditorManager {
    constructor() {
        this.editMode = false;
        this.isAuthenticated = false;
    }
    
    init() {
        // Carrega os scripts do editor para TODOS os usuários (admin ou visitante).
        // Isso garante que a renderização do conteúdo salvo (textos, imagens)
        // seja sempre consistente.
        this.loadEditorScripts().then(() => {
            // Agora, verificamos se devemos ativar a INTERFACE de edição.
            const urlParams = new URLSearchParams(window.location.search);
            const editParam = urlParams.get('edit');
            
            if (editParam === 'true') {
                // Somente se for admin, habilita a interface de edição completa.
                this.enableEditMode();
            } else {
                // Para visitantes, os scripts já carregaram e aplicaram o conteúdo.
                // Não fazemos mais nada para não mostrar a UI de edição.
                this.disableEditMode();
            }
        }).catch(error => {
            console.error('❌ Falha crítica ao carregar scripts do editor. A página pode não ser renderizada corretamente.', error);
        });
    }
    
    async enableEditMode() {
        // CRÍTICO: Obter o parâmetro da URL novamente para garantir
        const urlParams = new URLSearchParams(window.location.search);
        const isEditUrl = urlParams.get('edit') === 'true';

        // Se não estamos em uma URL de edição, parar imediatamente.
        if (!isEditUrl) {
            this.disableEditMode();
            return;
        }
        
        // Verificar autenticação
        const isAuth = await this.checkAuthentication();
        
        if (!isAuth) {
            this.redirectToAdmin();
            return;
        }
        
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
        this.showLoginModal();
    }
    
    showLoginModal() {
        // Criar modal de login se não existir
        if (!document.getElementById('hardem-login-modal')) {
            this.createLoginModal();
        }
        
        const modal = document.getElementById('hardem-login-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('hardem-username').focus();
        }
    }
    
    createLoginModal() {
        const modalHTML = `
            <div id="hardem-login-modal" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); display: none; z-index: 10000;
                justify-content: center; align-items: center;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white; padding: 40px; border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 400px;
                    max-width: 90vw; text-align: center;
                ">
                    <h2 style="color: #2c3e50; margin: 0 0 30px 0; font-size: 28px;">
                        🔐 HARDEM Editor
                    </h2>
                    <p style="color: #7f8c8d; margin: 0 0 30px 0;">Acesso Administrativo</p>
                    
                    <form id="hardem-login-form" style="text-align: left;">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 500;">
                                Usuário:
                            </label>
                            <input type="text" id="hardem-username" required style="
                                width: 100%; padding: 12px; border: 2px solid #e1e8ed;
                                border-radius: 8px; font-size: 16px; box-sizing: border-box;
                            " placeholder="Digite seu usuário">
                        </div>
                        
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; color: #2c3e50; font-weight: 500;">
                                Senha:
                            </label>
                            <input type="password" id="hardem-password" required style="
                                width: 100%; padding: 12px; border: 2px solid #e1e8ed;
                                border-radius: 8px; font-size: 16px; box-sizing: border-box;
                            " placeholder="Digite sua senha">
                        </div>
                        
                        <button type="submit" id="hardem-login-btn" style="
                            width: 100%; padding: 14px; background: #3498db;
                            color: white; border: none; border-radius: 8px;
                            font-size: 16px; font-weight: 600; cursor: pointer;
                        ">Entrar</button>
                        
                        <div id="hardem-login-message" style="
                            margin-top: 15px; padding: 10px; border-radius: 6px;
                            font-size: 14px; display: none; text-align: center;
                        "></div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        this.setupLoginEvents();
    }
    
    setupLoginEvents() {
        const form = document.getElementById("hardem-login-form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const username = document.getElementById("hardem-username").value.trim();
            const password = document.getElementById("hardem-password").value;
            
            if (!username || !password) {
                this.showLoginMessage("Preencha todos os campos", "error");
                return;
            }
            
            const btn = document.getElementById("hardem-login-btn");
            btn.textContent = "Entrando...";
            btn.disabled = true;
            
            const result = await this.login(username, password);
            
            if (result.success) {
                this.showLoginMessage(result.message, "success");
                this.hideLoginModal();
                this.loadEditor(); // Carregar editor após login bem-sucedido
            } else {
                this.showLoginMessage(result.message, "error");
                document.getElementById("hardem-password").value = "";
            }
            
            btn.textContent = "Entrar";
            btn.disabled = false;
        });
    }
    
    async login(username, password) {
        try {
            const response = await fetch("auth.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.isAuthenticated = true;
                this.userInfo = data.user;
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            return { success: false, message: "Erro de conexão" };
        }
    }
    
    showLoginMessage(message, type) {
        const messageDiv = document.getElementById("hardem-login-message");
        messageDiv.textContent = message;
        messageDiv.style.display = "block";
        
        if (type === "success") {
            messageDiv.style.background = "#d4edda";
            messageDiv.style.color = "#155724";
        } else {
            messageDiv.style.background = "#f8d7da";
            messageDiv.style.color = "#721c24";
        }
    }
    
    hideLoginModal() {
        const modal = document.getElementById('hardem-login-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    loadEditor() {
        // Pré-carregar conteúdo para uma experiência mais suave
        this.preloadContent();
        
        // Carregar os scripts principais do editor
        this.loadEditorScripts().then(() => {
            // Agora que os scripts estão prontos, esperamos a instância do editor ser criada
            this.waitForEditorInstance();
        });
    }

    waitForEditorInstance() {
        let attempts = 0;
        const maxAttempts = 50; // Tenta por 5 segundos
        const interval = setInterval(() => {
            attempts++;
            if (window.hardemEditor) {
                clearInterval(interval);
                // O editor está pronto, mas inativo. Criamos nossa UI de controle.
                this.createEditorControls();
            } else if (attempts > maxAttempts) {
                clearInterval(interval);
                console.error('❌ Falha ao encontrar a instância do editor a tempo.');
            }
        }, 100);
    }

    createEditorControls() {
        // Em vez de criar novos controles, vamos conectar ao botão existente da toolbar
        this.connectToExistingToolbar();
    }

    connectToExistingToolbar() {
        // Garantir que a toolbar seja sempre visível
        const toolbar = document.getElementById('hardem-editor-toolbar');
        if (toolbar) {
            toolbar.style.display = 'flex';
        }

        // Conectar ao botão de toggle existente na toolbar
        const toggleBtn = document.getElementById('hardem-toggle-edit');
        if (toggleBtn) {
            // Remover qualquer listener anterior
            toggleBtn.removeEventListener('click', this.toggleEditorActivation);
            
            // Adicionar nosso listener
            toggleBtn.addEventListener('click', () => this.toggleEditorActivation());
            
            // Habilitar o botão
            toggleBtn.disabled = false;
            toggleBtn.title = 'Ativar Modo de Edição';
            
        } else {
            console.warn('⚠️ Botão hardem-toggle-edit não encontrado na toolbar');
        }

        // Inicializar controles de edição como ocultos (editor inativo por padrão)
        if (window.hardemEditor && window.hardemEditor.hideEditingControls) {
            window.hardemEditor.hideEditingControls();
        }

        // Adicionar informações do usuário e botão de logout na toolbar
        this.addUserInfoToToolbar();
        
        // Atualizar interface inicial (editor inativo)
        this.updateEditorControls();
    }

    addUserInfoToToolbar() {
        const toolbar = document.getElementById('hardem-editor-toolbar');
        if (!toolbar) return;

        // Verificar se já existe
        if (document.getElementById('hardem-user-controls')) return;

        const userControls = document.createElement('div');
        userControls.id = 'hardem-user-controls';
        userControls.className = 'hardem-editor-controls';
        userControls.style.cssText = `
            margin-left: auto;
            display: none;
            align-items: center;
            gap: 10px;
            font-size: 12px;
            color: #666;
        `;

        userControls.innerHTML = `
            <span id="hardem-user-name" style="font-weight: 600;"></span>
            <button class="hardem-editor-btn error" id="hardem-toolbar-logout" title="Sair do Editor">
                🚪
            </button>
        `;

        // Adicionar ao final da toolbar
        const controls = toolbar.querySelector('.hardem-editor-controls');
        if (controls) {
            controls.appendChild(userControls);
            
            // Conectar evento de logout
            document.getElementById('hardem-toolbar-logout').addEventListener('click', () => this.logout());
        }
    }

    toggleEditorActivation() {
        if (!window.hardemEditor) {
            console.error('❌ Editor não encontrado para ativar/desativar');
            return;
        }
        
        // Chama o método do core que ativa/desativa o editor
        window.hardemEditor.toggleEditMode();
        
        // Aguarda um pouco para garantir que o estado foi alterado
        setTimeout(() => {
            this.updateEditorControls();
        }, 100);
    }

    updateEditorControls() {
        const isActive = window.hardemEditor.editMode;
        const toggleBtn = document.getElementById('hardem-toggle-edit');
        const statusEl = document.querySelector('.hardem-editor-status');
        const userControls = document.getElementById('hardem-user-controls');
        const userNameEl = document.getElementById('hardem-user-name');

        if (toggleBtn) {
            if (isActive) {
                toggleBtn.innerHTML = '🔒'; // Ícone de cadeado (ativo)
                toggleBtn.title = 'Desativar Modo de Edição';
                toggleBtn.classList.add('active');
            } else {
                toggleBtn.innerHTML = '✏️'; // Ícone de edição (inativo)
                toggleBtn.title = 'Ativar Modo de Edição';
                toggleBtn.classList.remove('active');
            }
        }

        if (statusEl) {
            statusEl.textContent = isActive ? 'ON' : 'OFF';
        }

        if (userControls) {
            if (isActive && this.userInfo) {
                userControls.style.display = 'flex';
                if (userNameEl) {
                    userNameEl.textContent = this.userInfo.username;
                }
            } else {
                userControls.style.display = 'none';
            }
        }
    }

    async logout() {
        if (!confirm("Tem certeza que deseja sair?")) return;
        
        try {
            await fetch("auth.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: "action=logout"
            });
        } catch (error) {
            console.error("Erro no logout:", error);
        } finally {
            // Garante que a UI seja removida e o estado resetado
            this.removeEditorUI();
            this.isAuthenticated = false;
            this.userInfo = null;
            window.location.reload(); // Recarrega a página para um estado limpo
        }
    }
    
    removeEditorUI() {
        // Se o editor estiver ativo, desativa-o primeiro
        if (window.hardemEditor && window.hardemEditor.editMode) {
            window.hardemEditor.toggleEditMode();
        }
        
        // Remover controles de usuário da toolbar
        const userControls = document.getElementById('hardem-user-controls');
        if (userControls) userControls.remove();
        
        // Desconectar o botão de toggle
        const toggleBtn = document.getElementById('hardem-toggle-edit');
        if (toggleBtn) {
            toggleBtn.disabled = true;
            toggleBtn.innerHTML = '✏️';
            toggleBtn.title = 'Editor Desconectado';
        }
        
        // Ocultar toolbar (mas não remover - pode ser útil manter)
        const toolbar = document.getElementById('hardem-editor-toolbar');
        if (toolbar) {
            toolbar.style.display = 'none';
        }
        
        const sidePanel = document.querySelector('.hardem-editor-sidepanel');
        if(sidePanel) sidePanel.remove();

    }

    async loadEditorScripts() {
        const scripts = [
            'assets/js/editor/editor-utils.js',
            'assets/js/editor/editor-core.js',
            'assets/js/editor/editor-ui.js',
            'assets/js/editor/editor-text.js',
            'assets/js/editor/editor-image.js',
            'assets/js/editor/editor-carousel.js',
            'assets/js/editor/editor-storage.js',
            'assets/js/editor-refatorado.js'
        ];
        
        for (const scriptSrc of scripts) {
            await this.loadScript(scriptSrc);
        }
        
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
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }
    
    createEditModeIndicator() {
        // Não criar mais o indicador vermelho - a toolbar já tem o controle
    }
    
    disableEditMode() {
        // Esta função agora serve apenas para garantir que nenhuma UI do editor
        // seja mostrada acidentalmente para visitantes.
        this.removeEditorUI();
    }

    /**
     * NOVO: Pré-carregar conteúdo para acelerar exibição (modo edição)
     */
    preloadContent() {
        const pageKey = this.getPageKey();
        
        fetch(`load-database.php?page=${encodeURIComponent(pageKey)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                // Armazenar em cache temporário
                window.hardemPreloadedContent = result.data;
            }
        })
        .catch(error => {
            console.log('⚠️ Erro no pré-carregamento (não crítico):', error);
        });
    }

    /**
     * NOVO: Pré-carregar conteúdo para visitantes (aplicação instantânea)
     */
    preloadContentForVisitors() {
        const pageKey = this.getPageKey();
        
        // Adicionar um parâmetro de cache-busting para garantir dados novos
        const cacheBuster = `?v=${new Date().getTime()}`;
        
        fetch(`load-database.php${cacheBuster}&page=${encodeURIComponent(pageKey)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache' // Para compatibilidade
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                this.applyContentInstantly(result.data);
                
                // Remover loading após aplicar conteúdo
                setTimeout(() => {
                    this.removeInstantLoading();
                }, 100);
            } else {
                // Remover loading mesmo se não há conteúdo
                this.removeInstantLoading();
            }
        })
        .catch(error => {
            console.log('⚠️ Erro ao carregar conteúdo para visitantes:', error);
            // Remover loading em caso de erro
            this.removeInstantLoading();
        });
    }

    /**
     * NOVO: Aplicar conteúdo instantaneamente via CSS
     */
    applyContentInstantly(contentMap) {
        let cssRules = [];
        let textUpdates = [];
        let appliedCount = 0;
        
        Object.keys(contentMap).forEach(key => {
            const content = contentMap[key];
            
            // Aplicar normalizações instantaneamente com sistema persistente
            if (content && content.normalization && content.normalization.normalized) {
                const selector = `[data-key="${key}"]`;
                const width = content.normalization.target_width;
                const height = content.normalization.target_height;
                
                // CSS tradicional
                cssRules.push(`
                    ${selector} {
                        width: ${width}px !important;
                        height: ${height}px !important;
                        object-fit: cover !important;
                        object-position: center !important;
                        background-size: cover !important;
                        background-position: center !important;
                        background-repeat: no-repeat !important;
                        max-width: none !important;
                        max-height: none !important;
                        min-width: ${width}px !important;
                        min-height: ${height}px !important;
                        box-sizing: border-box !important;
                    }
                    
                    ${selector}.hardem-persistent-override {
                        width: ${width}px !important;
                        height: ${height}px !important;
                    }
                `);
                
                // Aplicar também via sistema persistente se disponível
                setTimeout(() => {
                    if (window.hardemPersistentDims) {
                        window.hardemPersistentDims.applyPersistentDimensions(key, width, height, true);
                    } else {
                        // Aplicar diretamente se sistema persistente não estiver disponível
                        const element = document.querySelector(`[data-key="${key}"]`);
                        if (element && element.tagName.toLowerCase() === 'img') {
                            element.classList.remove('img-fluid', 'img-responsive', 'w-100', 'h-100');
                            element.classList.add('hardem-persistent-override');
                            
                            element.style.setProperty('width', `${width}px`, 'important');
                            element.style.setProperty('height', `${height}px`, 'important');
                            element.style.setProperty('object-fit', 'cover', 'important');
                            element.style.setProperty('object-position', 'center', 'important');
                            element.style.setProperty('display', 'block', 'important');
                            element.style.setProperty('max-width', 'none', 'important');
                            element.style.setProperty('max-height', 'none', 'important');
                            element.style.setProperty('min-width', `${width}px`, 'important');
                            element.style.setProperty('min-height', `${height}px`, 'important');
                            element.style.setProperty('box-sizing', 'border-box', 'important');
                            
                            // Forçar re-render
                            element.offsetHeight;
                            
                        }
                    }
                }, 100);
                
                appliedCount++;
            }
            
            // Aplicar backgrounds instantaneamente
            if (content && content.backgroundImage) {
                const selector = `[data-key="${key}"]`;
                
                // Sistema inteligente de fallback para seletores CSS
                const generateFallbackSelector = (dataKey) => {
                    // Extrair informações do data-key para gerar seletor
                    if (dataKey.includes('rts-banner-area')) {
                        return '.rts-banner-area.bg_image, .rts-banner-area[class*="bg-"]';
                    }
                    if (dataKey.includes('single-right-content-bg-1')) {
                        return '.single-right-content.bg-1';
                    }
                    if (dataKey.includes('single-right-content-bg-2')) {
                        return '.single-right-content.bg-2';
                    }
                    if (dataKey.includes('working-process-area')) {
                        return '.our-working-process-area-4, .working-process-area[class*="bg"]';
                    }
                    if (dataKey.includes('bg_image')) {
                        return '.bg_image';
                    }
                    if (dataKey.includes('banner')) {
                        return '[class*="banner"].bg_image, [class*="banner"][class*="bg-"]';
                    }
                    if (dataKey.includes('hero')) {
                        return '[class*="hero"].bg_image, [class*="hero"][class*="bg-"]';
                    }
                    if (dataKey.includes('section')) {
                        return 'section.bg_image, section[class*="bg-"]';
                    }
                    // Fallback genérico para elementos com background
                    return '.bg_image, [class*="bg-"], [style*="background-image"]';
                };
                
                // Gerar seletor de fallback inteligente
                const fallbackSelector = generateFallbackSelector(key);
                
                cssRules.push(`
                    ${selector} {
                        background-image: url("${content.backgroundImage}") !important;
                        background-size: cover !important;
                        background-position: center !important;
                        background-repeat: no-repeat !important;
                    }
                `);
                
                // Aplicar fallback inteligente
                if (fallbackSelector) {
                    cssRules.push(`
                        ${fallbackSelector} {
                            background-image: url("${content.backgroundImage}") !important;
                            background-size: cover !important;
                            background-position: center !important;
                            background-repeat: no-repeat !important;
                        }
                    `);
                }
                
                appliedCount++;
            }
            
            // Aplicar imagens instantaneamente
            if (content && content.src) {
                const element = document.querySelector(`[data-key="${key}"]`);
                if (element && element.tagName.toLowerCase() === 'img') {
                    element.src = content.src;
                    if (content.alt) element.alt = content.alt;
                    appliedCount++;
                }
            }
            
            // Aplicar textos instantaneamente
            if (content && content.text) {
                const element = document.querySelector(`[data-key="${key}"]`);
                if (element) {
                    element.textContent = content.text;
                    appliedCount++;
                }
            }
            
            // Aplicar contadores instantaneamente
            if (content && (content.isCounter || content.counterValue !== undefined)) {
                const element = document.querySelector(`[data-key="${key}"]`);
                if (element) {
                    const counterValue = content.counterValue || content.text || '0';
                    
                    // Se é um odometer, configurar corretamente
                    if (element.classList.contains('odometer') || element.hasAttribute('data-count')) {
                        element.setAttribute('data-count', counterValue);
                        element.textContent = counterValue;
                    } else {
                        element.textContent = counterValue;
                    }
                    
                    appliedCount++;
                }
            }
        });
        
        // Aplicar CSS
        if (cssRules.length > 0) {
            const styleElement = document.createElement('style');
            styleElement.id = 'hardem-instant-styles';
            styleElement.textContent = cssRules.join('\n');
            document.head.appendChild(styleElement);
        }
        
        if (appliedCount > 0) {
            console.log(`⚡ ${appliedCount} elementos aplicados instantaneamente para visitantes`);
        }
    }

    /**
     * NOVO: Obter chave da página atual
     */
    getPageKey() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        if (filename && filename.includes('.html')) {
            return `siteContent_${filename}`;
        }

        return 'siteContent_index.html';
    }

    /**
     * NOVO: Remover loading instantâneo
     */
    removeInstantLoading() {
        // Adicionar classe para mostrar conteúdo
        document.body.classList.add('hardem-content-loaded');
        document.body.classList.remove('hardem-loading-active');
        
        // Remover loading após transição
        setTimeout(() => {
            const loadingElement = document.getElementById('hardem-instant-loading');
            if (loadingElement) {
                loadingElement.classList.add('hardem-loading-hidden');
            }
        }, 300);
        
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
    // Garantir que só exista uma instância
    if (!window.hardemEditorManager) {
        window.hardemEditorManager = new HardemEditorManager();
        // CHAMADO AQUI: Inicia a lógica APÓS o objeto ser criado
        window.hardemEditorManager.init(); 
    }
});

window.HardemEditorManager = HardemEditorManager; 