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
        
        // NOVO: Pré-carregar conteúdo em paralelo
        this.preloadContent();
        
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
        // NOVO: Mesmo em modo visualização, pré-carregar conteúdo para aplicar instantaneamente
        this.preloadContentForVisitors();
        // Não carregar scripts do editor
        // Página funciona normalmente para usuários finais
    }

    /**
     * NOVO: Pré-carregar conteúdo para acelerar exibição (modo edição)
     */
    preloadContent() {
        const pageKey = this.getPageKey();
        console.log('⚡ Pré-carregando conteúdo para modo edição...');
        
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
                console.log('⚡ Conteúdo pré-carregado em cache para edição');
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
        console.log('⚡ Carregando conteúdo para visitantes...');
        
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
                console.log('⚡ Aplicando conteúdo instantaneamente para visitantes');
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
                        console.log(`🔄 Aplicando normalização persistente: ${key} = ${width}x${height}`);
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
                            
                            console.log(`🎨 Normalização aplicada diretamente: ${key} = ${width}x${height}`);
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
                    console.log(`🎨 Background aplicado com fallback inteligente: ${key} -> ${fallbackSelector}`);
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
                    
                    console.log(`🔢 Contador aplicado instantaneamente: ${key} = ${counterValue}`);
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
        
        console.log('⚡ Loading instantâneo removido para visitantes');
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