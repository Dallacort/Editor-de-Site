/**
 * HARDEM Editor UI - Módulo de Interface do Usuário
 * Gerencia toolbar, painel lateral e estilos
 * @version 1.0.0
 */

class HardemEditorUI {
    constructor(core) {
        this.core = core;
    }

    /**
     * Criação dos estilos CSS do editor
     */
    createStyles() {
        const styles = `
            <style id="hardem-editor-styles">
                /* ===== TOOLBAR SUPERIOR ===== */
                .hardem-editor-toolbar {
                    position: fixed;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    padding: 8px 16px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
                    z-index: 999999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    color: white;
                    border: 1px solid #404040;
                    height: 48px;
                    box-sizing: border-box;
                    backdrop-filter: blur(10px);
                    border-radius: 0 0 12px 12px;
                    min-width: 400px;
                }

                .hardem-editor-brand {
                    display: none;
                }

                .hardem-editor-controls {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .hardem-editor-btn {
                    background: #404040;
                    border: 1px solid #606060;
                    color: #ffffff;
                    padding: 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 400;
                    font-family: 'Segoe UI', 'Arial', sans-serif;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 36px;
                    min-height: 32px;
                    box-sizing: border-box;
                    white-space: nowrap;
                    position: relative;
                }

                .hardem-editor-btn:hover {
                    background: #505050;
                    border-color: #707070;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }

                .hardem-editor-btn.active {
                    background: #e74c3c;
                    border-color: #c0392b;
                    box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.3);
                    animation: pulse-active 2s infinite;
                }

                @keyframes pulse-active {
                    0% { box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.3); }
                    50% { box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.6); }
                    100% { box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.3); }
                }

                .hardem-editor-btn.success {
                    background: #28a745;
                    border-color: #34ce57;
                }

                .hardem-editor-btn.success:hover {
                    background: #218838;
                    border-color: #1e7e34;
                }

                .hardem-editor-btn.warning {
                    background: #fd7e14;
                    border-color: #fd7e14;
                }

                .hardem-editor-btn.warning:hover {
                    background: #e76500;
                    border-color: #e76500;
                }

                .hardem-editor-btn.error {
                    background: #dc3545;
                    border-color: #dc3545;
                }

                .hardem-editor-btn.error:hover {
                    background: #c82333;
                    border-color: #c82333;
                }

                .hardem-editor-status {
                    background: #2d2d2d;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 500;
                    border: 1px solid #404040;
                    min-height: 32px;
                    display: flex;
                    align-items: center;
                    box-sizing: border-box;
                    color: #cccccc;
                    letter-spacing: 0.3px;
                }

                /* ===== PAINEL LATERAL ===== */
                .hardem-editor-sidepanel {
                    position: fixed;
                    top: 60px;
                    right: -320px;
                    width: 320px;
                    height: calc(100vh - 60px);
                    background: #f8f9fa;
                    border-left: 1px solid #e0e0e0;
                    z-index: 999998;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow-y: auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    font-size: 14px;
                    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
                }

                .hardem-editor-sidepanel.visible {
                    transform: translateX(-320px);
                }

                /* ===== PAINEL À ESQUERDA ===== */
                .hardem-editor-sidepanel.sidepanel-left {
                    right: auto;
                    left: -320px;
                    border-left: none;
                    border-right: 1px solid #e0e0e0;
                    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
                }

                .hardem-editor-sidepanel.sidepanel-left.visible {
                    transform: translateX(320px);
                }

                .hardem-editor-sidepanel-header {
                    padding: 20px;
                    background: #ffffff;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .hardem-editor-sidepanel-title {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #212529;
                    letter-spacing: 0.3px;
                }

                .hardem-editor-close-panel {
                    background: #f8f9fa;
                    border: 1px solid #e0e0e0;
                    font-size: 14px;
                    cursor: pointer;
                    color: #6c757d;
                    padding: 8px 12px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    font-weight: 500;
                }

                .hardem-editor-close-panel:hover {
                    background: #e9ecef;
                    border-color: #ced4da;
                    color: #495057;
                }

                .hardem-editor-panel-controls {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .hardem-editor-move-panel {
                    background: #007acc;
                    border: 1px solid #0066cc;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                    padding: 6px 10px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    font-weight: 500;
                    min-width: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .hardem-editor-move-panel:hover {
                    background: #0056b3;
                    border-color: #004085;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0, 122, 204, 0.3);
                }

                .hardem-editor-sidepanel-content {
                    padding: 20px;
                }

                /* ===== ELEMENTOS EDITÁVEIS ===== */
                .hardem-editable {
                    outline: 2px dashed #007acc !important;
                    outline-offset: 2px !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    box-sizing: border-box !important;
                }

                .hardem-editable:hover {
                    outline-color: #0099ff !important;
                    background-color: rgba(0, 122, 204, 0.08) !important;
                }

                .hardem-selected {
                    outline: 2px solid #007acc !important;
                    outline-offset: 2px !important;
                    background-color: rgba(0, 122, 204, 0.12) !important;
                }

                /* ===== FORMULÁRIOS DO PAINEL ===== */
                .hardem-form-group {
                    margin-bottom: 20px;
                }

                .hardem-form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #212529;
                    font-size: 13px;
                    letter-spacing: 0.3px;
                }

                .hardem-form-group input,
                .hardem-form-group textarea,
                .hardem-form-group select {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #ced4da;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    font-family: inherit;
                    transition: all 0.2s ease;
                    background: #ffffff;
                }

                .hardem-form-group input:focus,
                .hardem-form-group textarea:focus,
                .hardem-form-group select:focus {
                    outline: none;
                    border-color: #007acc;
                    box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
                }

                .hardem-form-group textarea {
                    min-height: 80px;
                    resize: vertical;
                }

                .hardem-form-group button {
                    background: #007acc;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    letter-spacing: 0.3px;
                }

                .hardem-form-group button:hover {
                    background: #0056b3;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
                }

                .hardem-form-group button.success {
                    background: #28a745;
                }

                .hardem-form-group button.success:hover {
                    background: #218838;
                }

                /* ===== ALERTAS ===== */
                .hardem-alert {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    color: white;
                    font-size: 13px;
                    font-weight: 500;
                    z-index: 1000000;
                    min-width: 240px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
                    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(10px);
                    letter-spacing: 0.3px;
                }

                .hardem-alert.success {
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                }

                .hardem-alert.error {
                    background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
                }

                .hardem-alert.warning {
                    background: linear-gradient(135deg, #fd7e14 0%, #f39c12 100%);
                }

                /* ===== ALERTAS MELHORADOS ===== */
                .editor-alert {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 10000;
                    max-width: 400px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease-out;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: opacity 0.3s ease;
                }
                
                .editor-alert .alert-icon {
                    font-size: 16px;
                    flex-shrink: 0;
                }
                
                .editor-alert .alert-message {
                    flex: 1;
                }
                
                .editor-alert .alert-close {
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 8px;
                    opacity: 0.7;
                    flex-shrink: 0;
                }
                
                .editor-alert .alert-close:hover {
                    opacity: 1;
                }
                
                .editor-alert.alert-success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .editor-alert.alert-error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .editor-alert.alert-warning {
                    background: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
                
                .editor-alert.alert-info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }
                
                .editor-alert.detailed-alert {
                    max-width: 500px;
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .editor-alert .alert-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                
                .editor-alert .alert-title {
                    font-weight: bold;
                    flex: 1;
                }
                
                .editor-alert .alert-details {
                    font-size: 13px;
                    opacity: 0.9;
                    margin-bottom: 8px;
                }
                
                .editor-alert .alert-suggestions {
                    font-size: 12px;
                    opacity: 0.8;
                }
                
                .editor-alert .alert-suggestions ul {
                    margin: 4px 0 0 16px;
                    padding: 0;
                }
                
                .editor-alert .alert-suggestions li {
                    margin: 2px 0;
                }
                
                .editor-alert .alert-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    flex-shrink: 0;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                /* ===== OVERLAY DE PROCESSAMENTO ===== */
                .hardem-processing-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000001;
                    color: white;
                    font-size: 16px;
                    font-weight: 500;
                    backdrop-filter: blur(5px);
                }

                .hardem-processing-spinner {
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid #007acc;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    animation: spin 1s linear infinite;
                    margin-right: 20px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* ===== AJUSTE PARA CONTEÚDO DA PÁGINA ===== */
                body.hardem-editor-active {
                    padding-top: 60px;
                }

                /* ===== TOOLTIPS PERSONALIZADOS ===== */
                .hardem-editor-btn[title]:hover::after {
                    content: attr(title);
                    position: absolute;
                    bottom: -35px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1a1a1a;
                    color: white;
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    z-index: 1000000;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    animation: tooltipFadeIn 0.2s ease;
                }

                .hardem-editor-btn[title]:hover::before {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-bottom: 5px solid #1a1a1a;
                    z-index: 1000000;
                }

                @keyframes tooltipFadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Criação da toolbar superior
     */
    createToolbar() {
        this.core.toolbar = document.createElement('div');
        this.core.toolbar.id = 'hardem-editor-toolbar';
        this.core.toolbar.className = 'hardem-editor-toolbar';
        this.core.toolbar.innerHTML = `
            <div class="hardem-editor-controls">
                <button class="hardem-editor-btn" id="hardem-toggle-edit" title="Ativar Modo de Edição" disabled>
                    ✏️
                </button>
                <button class="hardem-editor-btn" id="hardem-open-panel" title="Abrir Painel de Edição">
                    ⚙️
                </button>
                <button class="hardem-editor-btn success" id="hardem-save-content" title="Salvar Alterações">
                    💾
                </button>
                <button class="hardem-editor-btn" id="hardem-preview-mode" title="Sair da Edição">
                    🚪
                </button>
                <button class="hardem-editor-btn warning" id="hardem-publish-changes" title="Publicar Alterações">
                    🚀
                </button>
                <button class="hardem-editor-btn" id="hardem-reload-content" onclick="window.hardemEditor.storage.loadContent(true)" title="Recarregar Conteúdo">
                    ↻
                </button>
                <div class="hardem-editor-status" title="Status do Editor">
                    OFF
                </div>
            </div>
        `;
        
        document.body.appendChild(this.core.toolbar);
        document.body.classList.add('hardem-editor-active');

        // Botão de salvamento por partes (aparece quando necessário)
        const savePartsBtn = document.createElement('button');
        savePartsBtn.className = 'hardem-toolbar-btn hardem-save-parts-btn';
        savePartsBtn.innerHTML = '📦';
        savePartsBtn.title = 'Salvar por Partes (para dados grandes)';
        savePartsBtn.style.display = 'none'; // Inicialmente oculto
        savePartsBtn.onclick = () => {
            if (this.core.storage) {
                this.showAlert('📦 Iniciando salvamento por partes...', 'info');
                this.core.storage.saveContentInParts(this.core.storage.exportData || {}).then(result => {
                    if (result) {
                        this.showAlert('✅ Salvamento por partes concluído!', 'success');
                    }
                }).catch(error => {
                    console.error('Erro no salvamento por partes:', error);
                    this.showAlert('❌ Erro no salvamento por partes', 'error');
                });
            }
        };
    }

    /**
     * Criação do painel lateral
     */
    createSidePanel() {
        const panel = document.createElement('div');
        panel.className = 'hardem-editor-sidepanel';
        panel.innerHTML = `
            <div class="hardem-editor-sidepanel-header">
                <h3 class="hardem-editor-sidepanel-title">Editar Elemento</h3>
                <div class="hardem-editor-panel-controls">
                    <button class="hardem-editor-move-panel" id="hardem-move-panel" title="Mover painel para o outro lado">↔</button>
                <button class="hardem-editor-close-panel" id="hardem-close-panel">Fechar</button>
            </div>
            </div>
            <div class="hardem-editor-sidepanel-content">
                <p>Selecione um elemento na página para editar.</p>
            </div>
        `;
        
        document.body.appendChild(panel);

        this.sidepanel = panel;
        this.sidepanelContent = panel.querySelector('.hardem-editor-sidepanel-content');

        // Restaurar posição salva
        const savedPosition = localStorage.getItem('hardem-editor-panel-position');
        if (savedPosition === 'left') {
            panel.classList.add('sidepanel-left');
            console.log('🔄 Posição restaurada: esquerda');
        } else {
            console.log('🔄 Posição restaurada: direita');
        }

        // Listener para fechar
        panel.querySelector('.hardem-editor-close-panel').addEventListener('click', () => this.closeSidePanel());
        
        // Listener para mover painel
        panel.querySelector('.hardem-editor-move-panel').addEventListener('click', () => {
            console.log('🔧 Botão de movimento clicado');
            console.log('📍 Classes atuais do painel:', panel.className);
            console.log('📍 Posição atual do painel:', panel.style.cssText);
            
            if (panel.classList.contains('sidepanel-left')) {
                panel.classList.remove('sidepanel-left');
                localStorage.setItem('hardem-editor-panel-position', 'right');
                console.log('➡️ Movendo para direita - classes após:', panel.className);
                this.showAlert('Painel movido para a direita.', 'info', 2000);
            } else {
                panel.classList.add('sidepanel-left');
                localStorage.setItem('hardem-editor-panel-position', 'left');
                console.log('⬅️ Movendo para esquerda - classes após:', panel.className);
                this.showAlert('Painel movido para a esquerda.', 'info', 2000);
            }
            
            // Forçar re-renderização
            panel.offsetHeight;
            console.log('🔄 Re-renderização forçada');
        });
    }

    /**
     * Abrir painel lateral
     */
    openSidePanel() {
        if (!this.sidepanel) this.createSidePanel();
        this.sidepanel.classList.add('visible');
    }

    /**
     * Fechar painel lateral
     */
    closeSidePanel() {
        if (this.sidepanel) {
            this.sidepanel.classList.remove('visible');
        }
        
        // Remover seleção de elementos
        document.querySelectorAll('.hardem-selected').forEach(el => {
            el.classList.remove('hardem-selected');
        });
        
        this.core.currentElement = null;
    }

    /**
     * Alternar painel lateral
     */
    toggleSidePanel() {
        if (!this.sidepanel) {
            this.openSidePanel();
        } else if (this.sidepanel.classList.contains('visible')) {
            this.closeSidePanel();
        } else {
            this.openSidePanel();
        }
    }

    /**
     * Popular painel lateral com dados do elemento
     */
    populateSidePanel(element) {
        const panelContent = this.sidepanelContent || document.querySelector('.hardem-editor-sidepanel-content');
        
        if (!panelContent) {
            console.error('Conteúdo do painel lateral não encontrado');
            return;
        }
        
        const dataKey = element.getAttribute('data-key') || this.core.utils.generateDataKey(element);
        const content = this.core.contentMap[dataKey] || {};
        
        // Determinar tipo de elemento
        const isImage = element.tagName.toLowerCase() === 'img';
        const hasBackgroundImage = element.style.backgroundImage || 
                                  getComputedStyle(element).backgroundImage !== 'none';
        
        // Verificar se é uma imagem dentro de um slide de carrossel
        const isInCarouselSlide = element.closest('.swiper-slide') && element.closest('.swiper');
        
        let panelHTML = `
            <div class="hardem-form-group">
                <label><strong>Elemento:</strong> ${this.core.utils.getElementTypeDescription(element)}</label>
                <label><strong>Localização:</strong> ${this.core.utils.getElementLocation(element)}</label>
                <label><strong>Data Key:</strong> ${dataKey}</label>
            </div>
            <hr>
        `;

        // Se é uma IMAGEM dentro de um slide, tratar como imagem normal
        if (isImage) {
            if (isInCarouselSlide) {
                panelHTML += this.generateSlideImagePanelHTML(element, content);
            } else {
                panelHTML += this.generateImagePanelHTML(element, content);
            }
        } 
        // Se é o SLIDE em si (não uma imagem), usar o painel do carrossel
        else if (isInCarouselSlide && !isImage) {
            this.core.carouselEditor.populateCarouselSlidePanel(element, content);
            return;
        }
        // Outros elementos
        else if (hasBackgroundImage) {
            panelHTML += this.generateBackgroundPanelHTML(element, content);
        } else {
            panelHTML += this.generateTextPanelHTML(element, content);
        }

        // NOVO: Adicionar seção de normalização de imagens
        panelHTML += this.generateNormalizationPanelHTML();

        panelHTML += `
            <div class="hardem-form-group">
                <button onclick="window.hardemEditor.ui.applyPanelChanges()" class="success">
                    Aplicar Alterações
                </button>
            </div>
        `;

        panelContent.innerHTML = panelHTML;
    }

    /**
     * Gerar HTML do painel para elementos de texto
     */
    generateTextPanelHTML(element, content) {
        const currentText = content.text || this.core.utils.getDirectTextContent(element);
        
        return `
            <div class="hardem-form-group">
                <label for="hardem-text-input">Texto:</label>
                <textarea id="hardem-text-input" placeholder="Digite o texto...">${currentText}</textarea>
            </div>
        `;
    }

    /**
     * Gerar HTML do painel para imagens
     */
    generateImagePanelHTML(element, content) {
        const currentSrc = content.src || element.src;
        const currentAlt = content.alt || element.alt || '';
        const currentZIndex = element.style.zIndex || 'auto';
        
        return `
            <div class="hardem-form-group">
                <label>Imagem Atual:</label>
                <img src="${currentSrc}" alt="${currentAlt}" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
            </div>
            <div class="hardem-form-group">
                <label for="hardem-image-input">Nova Imagem:</label>
                <input type="file" id="hardem-image-input" accept="image/*,image/svg+xml">
                <button onclick="window.hardemEditor.imageEditor.uploadImageFromPanel()">
                    📤 Upload Imagem
                </button>
            </div>
            <div class="hardem-form-group">
                <label for="hardem-alt-input">Texto Alternativo:</label>
                <input type="text" id="hardem-alt-input" value="${currentAlt}" placeholder="Descrição da imagem">
            </div>
            <hr>
            <div class="hardem-form-group">
                <label><strong>📏 Ordem de Profundidade (Z-Index: ${currentZIndex})</strong></label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                    <button onclick="window.hardemEditor.imageEditor.bringToFront(window.hardemEditor.core.currentElement)" 
                            style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        ⬆️ Trazer para Frente
                    </button>
                    <button onclick="window.hardemEditor.imageEditor.sendToBack(window.hardemEditor.core.currentElement)" 
                            style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        ⬇️ Enviar para Trás
                    </button>
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #6c757d;">
                    💡 Use estes botões para controlar se a imagem aparece na frente ou atrás de outras imagens.
                </div>
            </div>
        `;
    }

    /**
     * Gerar HTML do painel para imagens dentro de slides
     */
    generateSlideImagePanelHTML(element, content) {
        const currentSrc = content.src || element.src;
        const currentAlt = content.alt || element.alt || '';
        const slideElement = element.closest('.swiper-slide');
        const slideIndex = Array.from(slideElement.parentNode.children).indexOf(slideElement);
        const currentZIndex = element.style.zIndex || 'auto';
        
        return `
            <h4>🖼️ Imagem do Slide ${slideIndex + 1}</h4>
            <div class="hardem-form-group">
                <label>Imagem Atual:</label>
                <img src="${currentSrc}" alt="${currentAlt}" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
            </div>
            <div class="hardem-form-group">
                <label for="hardem-slide-image-input">Nova Imagem:</label>
                <input type="file" id="hardem-slide-image-input" accept="image/*,image/svg+xml">
                <button onclick="window.hardemEditor.ui.uploadSlideImageFromPanel()">
                    📤 Alterar Imagem do Slide
                </button>
            </div>
            <div class="hardem-form-group">
                <label for="hardem-slide-alt-input">Texto Alternativo:</label>
                <input type="text" id="hardem-slide-alt-input" value="${currentAlt}" placeholder="Descrição da imagem">
            </div>
            <hr>
            <div class="hardem-form-group">
                <label><strong>📏 Ordem de Profundidade (Z-Index: ${currentZIndex})</strong></label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                    <button onclick="window.hardemEditor.imageEditor.bringToFront(window.hardemEditor.core.currentElement)" 
                            style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        ⬆️ Trazer para Frente
                    </button>
                    <button onclick="window.hardemEditor.imageEditor.sendToBack(window.hardemEditor.core.currentElement)" 
                            style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        ⬇️ Enviar para Trás
                    </button>
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #6c757d;">
                    💡 Use estes botões para controlar se a imagem aparece na frente ou atrás de outros elementos no slide.
                </div>
            </div>
            <hr>
            <div class="hardem-form-group">
                <label><strong>💡 Dica:</strong> Esta é uma imagem dentro de um slide do carrossel.</label>
                <label>Para alterar o fundo do slide inteiro, clique no fundo do slide.</label>
            </div>
        `;
    }

    /**
     * Gerar HTML do painel para backgrounds
     */
    generateBackgroundPanelHTML(element, content) {
        const currentBg = content.backgroundImage || 
                         element.style.backgroundImage || 
                         getComputedStyle(element).backgroundImage;
        const currentZIndex = element.style.zIndex || 'auto';
        
        return `
            <div class="hardem-form-group">
                <label>Background Atual:</label>
                <div style="width: 100%; height: 60px; background-image: ${currentBg}; background-size: cover; background-position: center; border: 1px solid #ddd;"></div>
            </div>
            <div class="hardem-form-group">
                <label for="hardem-bg-input">Novo Background:</label>
                <input type="file" id="hardem-bg-input" accept="image/*,image/svg+xml">
                <button onclick="window.hardemEditor.imageEditor.uploadBackgroundFromPanel()">
                    📤 Upload Background
                </button>
            </div>
            <hr>
            <div class="hardem-form-group">
                <label><strong>📏 Ordem de Profundidade (Z-Index: ${currentZIndex})</strong></label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                    <button onclick="window.hardemEditor.imageEditor.bringToFront(window.hardemEditor.core.currentElement)" 
                            style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        ⬆️ Trazer para Frente
                    </button>
                    <button onclick="window.hardemEditor.imageEditor.sendToBack(window.hardemEditor.core.currentElement)" 
                            style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        ⬇️ Enviar para Trás
                    </button>
                </div>
                <div style="margin-top: 8px; font-size: 11px; color: #6c757d;">
                    💡 Use estes botões para controlar se o background aparece na frente ou atrás de outros elementos.
                </div>
            </div>
        `;
    }

    /**
     * Gerar HTML do painel de normalização individual
     */
    generateNormalizationPanelHTML() {
        const totalImages = document.querySelectorAll('img:not([data-no-edit])').length;
        const normalizedImages = document.querySelectorAll('[data-normalized="true"]').length;
        const hasNormalized = normalizedImages > 0;
        const currentElement = this.core.currentElement;
        const isCurrentNormalized = currentElement && currentElement.hasAttribute('data-normalized');
        
        return `
            <hr>
            <h4>🎯 Normalização Individual</h4>
            <div class="hardem-form-group" style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef;">
                <div style="margin-bottom: 10px;">
                    <strong>Status Geral:</strong> ${hasNormalized ? 
                        `✅ ${normalizedImages} de ${totalImages} imagens normalizadas` : 
                        `📏 ${totalImages} imagens com tamanhos diversos`}
                </div>
                
                ${currentElement ? `
                    <div style="background: #e3f2fd; padding: 10px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #2196f3;">
                        <strong>🎯 Elemento Atual:</strong><br>
                        <small>${currentElement.tagName}.${currentElement.className || 'sem-classe'}</small><br>
                        <strong>Status:</strong> ${isCurrentNormalized ? 
                            `✅ Normalizado (${currentElement.getAttribute('data-target-width')}x${currentElement.getAttribute('data-target-height')})` : 
                            '📏 Tamanho original'}
                    </div>
                
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
                        <button onclick="window.hardemEditor.ui.normalizeCurrentElement()" 
                            style="background: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            🎯 Normalizar Este
                        </button>
                    
                        <button onclick="window.hardemEditor.ui.removeCurrentNormalization()" 
                                style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                                ${!isCurrentNormalized ? 'disabled' : ''}>
                            🗑️ Remover
                        </button>
                    </div>
                
                    <div style="margin-bottom: 15px;">
                        <label style="font-size: 12px; font-weight: bold; margin-bottom: 5px; display: block;">Dimensões Específicas:</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 80px; gap: 5px; align-items: center;">
                            <input type="number" id="hardem-normalize-width" placeholder="Largura" value="${isCurrentNormalized ? currentElement.getAttribute('data-target-width') : '300'}" 
                                style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                            <input type="number" id="hardem-normalize-height" placeholder="Altura" value="${isCurrentNormalized ? currentElement.getAttribute('data-target-height') : '300'}" 
                                style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                            <button onclick="window.hardemEditor.ui.normalizeCurrentToCustomDimensions()" 
                                style="background: #6f42c1; color: white; border: none; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                                ⚙️ Aplicar
                            </button>
                        </div>
                    </div>
                ` : `
                    <div style="background: #fff3cd; padding: 10px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #ffc107;">
                        <strong>⚠️ Nenhum elemento selecionado</strong><br>
                        <small>Clique em uma imagem ou background para normalizar individualmente</small>
                    </div>
                `}
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
                    <button onclick="window.hardemEditor.ui.normalizeExistingImagesIndividually()" 
                            style="background: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        🔧 Individual Todas
                    </button>
                    
                    <button onclick="window.hardemEditor.ui.normalizeAllImagesGlobal()" 
                            style="background: #fd7e14; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                            title="CUIDADO: Aplica mesmas dimensões para TODAS">
                        ⚠️ Global (Cuidado)
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button onclick="window.hardemEditor.ui.showNormalizationReport()" 
                            style="background: #17a2b8; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        📊 Relatório
                    </button>
                    
                    <button onclick="window.hardemEditor.ui.resetAllNormalization()" 
                            style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                            ${!hasNormalized ? 'disabled' : ''}>
                        🔄 Resetar Todas
                    </button>
                </div>
                
                <div style="margin-top: 10px; font-size: 11px; color: #6c757d; line-height: 1.4;">
                    💡 <strong>NOVO:</strong> Normalização individual preserva tamanhos únicos. Use "Individual Todas" para manter proporções originais.
                </div>
            </div>
        `;
    }

    /**
     * Aplicar mudanças do painel
     */
    applyPanelChanges() {
        if (!this.core.currentElement) return;

        const element = this.core.currentElement;
        const dataKey = element.getAttribute('data-key');
        
        // Aplicar mudanças de texto
        const textInput = document.getElementById('hardem-text-input');
        if (textInput && textInput.value.trim() !== '') {
            const newText = textInput.value.trim();
            element.textContent = newText;
            
            // Salvar no contentMap
            if (!this.core.contentMap[dataKey]) {
                this.core.contentMap[dataKey] = {};
            }
            this.core.contentMap[dataKey].text = newText;
        }

        // Aplicar mudanças de alt em imagens normais
        const altInput = document.getElementById('hardem-alt-input');
        if (altInput && element.tagName.toLowerCase() === 'img') {
            element.alt = altInput.value;
            
            if (!this.core.contentMap[dataKey]) {
                this.core.contentMap[dataKey] = {};
            }
            this.core.contentMap[dataKey].alt = altInput.value;
        }

        // Aplicar mudanças de alt em imagens de slides
        const slideAltInput = document.getElementById('hardem-slide-alt-input');
        if (slideAltInput && element.tagName.toLowerCase() === 'img') {
            element.alt = slideAltInput.value;
            
            if (!this.core.contentMap[dataKey]) {
                this.core.contentMap[dataKey] = {};
            }
            this.core.contentMap[dataKey].alt = slideAltInput.value;
        }

        this.showAlert('Texto atualizado com sucesso!', 'success');
        console.log('Alterações aplicadas para:', dataKey);
    }

    /**
     * Upload de imagem de slide via painel
     */
    uploadSlideImageFromPanel() {
        if (!this.core.currentElement || this.core.currentElement.tagName.toLowerCase() !== 'img') {
            this.showAlert('Selecione uma imagem de slide primeiro!', 'error');
            return;
        }

        const fileInput = document.getElementById('hardem-slide-image-input');
        if (!fileInput || !fileInput.files[0]) {
            this.showAlert('Selecione um arquivo de imagem!', 'error');
            return;
        }

        const file = fileInput.files[0];
        const imgElement = this.core.currentElement;
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            this.showAlert('Por favor, selecione apenas arquivos de imagem!', 'error');
            return;
        }
        
        // Validar tamanho do arquivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showAlert('Arquivo muito grande! Máximo 5MB.', 'error');
            return;
        }

        // Processar upload usando o sistema de imagens
        this.processSlideImageUpload(file, imgElement);
    }

    /**
     * Processar upload de imagem de slide
     */
    processSlideImageUpload(file, imgElement) {
        const processing = this.showProcessingMessage('Processando imagem do slide...');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const newImageSrc = e.target.result;
                const dataKey = imgElement.getAttribute('data-key') || this.core.utils.generateDataKey(imgElement);
                
                // Aplicar nova imagem
                imgElement.src = newImageSrc;
                imgElement.setAttribute('data-key', dataKey);
                
                // Salvar no contentMap
                if (!this.core.contentMap[dataKey]) {
                    this.core.contentMap[dataKey] = {};
                }
                this.core.contentMap[dataKey].src = newImageSrc;
                this.core.contentMap[dataKey].type = 'slide-image';
                
                // Salvar informações detalhadas do elemento para recuperação
                this.core.contentMap[dataKey].elementInfo = {
                    tagName: imgElement.tagName,
                    className: imgElement.className,
                    cssSelector: this.core.utils.generateCSSSelector(imgElement),
                    xpath: this.core.utils.generateXPath(imgElement)
                };
                
                processing.hide();
                this.showAlert('Imagem do slide atualizada com sucesso!', 'success');
                
                console.log(`🖼️ Imagem do slide atualizada: ${dataKey}`, this.core.contentMap[dataKey]);
                
                // Atualizar painel
                setTimeout(() => {
                    this.populateSidePanel(imgElement);
                }, 100);
                
            } catch (error) {
                console.error('Erro ao processar imagem:', error);
                processing.hide();
                this.showAlert('Erro ao processar imagem do slide!', 'error');
            }
        };
        
        reader.onerror = (error) => {
            console.error('Erro ao ler arquivo:', error);
            processing.hide();
            this.showAlert('Erro ao ler arquivo de imagem!', 'error');
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * Desabilitar edição
     */
    disableEditing() {
        // Remover classes de edição
        document.querySelectorAll('.hardem-editable').forEach(el => {
            el.classList.remove('hardem-editable');
        });
        
        document.querySelectorAll('.hardem-selected').forEach(el => {
            el.classList.remove('hardem-selected');
        });
        
        // Fechar painel
        this.closeSidePanel();
    }

    /**
     * Aplicar mudança de texto específica do painel
     */
    applyTextChange() {
        const textArea = document.getElementById('hardem-text-content');
        if (!textArea || !this.core.currentElement) return;
        
        const newText = textArea.value.trim();
        if (!newText) {
            this.showAlert('⚠️ O texto não pode ficar vazio!', 'error');
            return;
        }
        
        this.core.currentElement.textContent = newText;
        const dataKey = this.core.currentElement.getAttribute('data-key');
        if (dataKey) {
            this.core.contentMap[dataKey] = {
                type: 'text',
                content: newText,
                pageUrl: window.location.pathname,
                timestamp: new Date().toISOString()
            };
            this.core.storage.saveContent();
            this.showAlert('✅ Texto atualizado com sucesso!', 'success');
        }
    }

    /**
     * Mostrar alerta
     */
    showAlert(message, type = 'info', duration = 4000) {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        // Remover alertas anteriores
        const existingAlerts = document.querySelectorAll('.editor-alert');
        existingAlerts.forEach(alert => alert.remove());
        
        const alert = document.createElement('div');
        alert.className = `editor-alert alert-${type}`;
        
        // Mapear ícones por tipo
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        alert.innerHTML = `
            <span class="alert-icon">${icons[type] || 'ℹ️'}</span>
            <span class="alert-message">${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto remover após duração especificada
        if (duration > 0) {
        setTimeout(() => {
                if (alert && alert.parentNode) {
                    alert.style.opacity = '0';
                    setTimeout(() => alert.remove(), 300);
                }
            }, duration);
        }
        
        return alert;
    }

    /**
     * Mostrar alerta de erro com detalhes técnicos
     */
    showDetailedErrorAlert(title, details, suggestions = []) {
        const alert = document.createElement('div');
        alert.className = 'editor-alert alert-error detailed-alert';
        
        let suggestionsHtml = '';
        if (suggestions.length > 0) {
            suggestionsHtml = `
                <div class="alert-suggestions">
                    <strong>Sugestões:</strong>
                    <ul>
                        ${suggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        alert.innerHTML = `
            <div class="alert-header">
                <span class="alert-icon">❌</span>
                <span class="alert-title">${title}</span>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
            <div class="alert-details">${details}</div>
            ${suggestionsHtml}
        `;
        
        document.body.appendChild(alert);
        
        // Auto remover após 8 segundos para alertas detalhados
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.style.opacity = '0';
                setTimeout(() => alert.remove(), 300);
            }
        }, 8000);
        
        return alert;
    }

    /**
     * Mostrar alerta de progresso de salvamento
     */
    showSaveProgressAlert(stage, details = '') {
        const alert = document.querySelector('.save-progress-alert') || document.createElement('div');
        alert.className = 'editor-alert alert-info save-progress-alert';
        
        const stages = {
            'validating': { icon: '🔍', text: 'Validando dados' },
            'optimizing': { icon: '🗜️', text: 'Otimizando conteúdo' },
            'local-save': { icon: '💾', text: 'Salvando localmente' },
            'server-save': { icon: '📤', text: 'Enviando para servidor' },
            'complete': { icon: '✅', text: 'Salvamento concluído' },
            'error': { icon: '❌', text: 'Erro no salvamento' }
        };
        
        const stageInfo = stages[stage] || { icon: 'ℹ️', text: stage };
        
        alert.innerHTML = `
            <span class="alert-icon">${stageInfo.icon}</span>
            <span class="alert-message">${stageInfo.text}${details ? ` - ${details}` : ''}</span>
            ${stage !== 'complete' && stage !== 'error' ? '<div class="alert-spinner"></div>' : ''}
        `;
        
        if (!alert.parentNode) {
            document.body.appendChild(alert);
        }
        
        // Remover apenas se for estágio final
        if (stage === 'complete' || stage === 'error') {
            setTimeout(() => {
                if (alert && alert.parentNode) {
                    alert.style.opacity = '0';
                    setTimeout(() => alert.remove(), 300);
                }
        }, 3000);
        }
        
        return alert;
    }

    /**
     * Mostrar overlay de processamento
     */
    showProcessingMessage(message) {
        // Remover overlays anteriores
        document.querySelectorAll('.hardem-processing-overlay').forEach(el => el.remove());
        
        const overlay = document.createElement('div');
        overlay.className = 'hardem-processing-overlay';
        overlay.innerHTML = `
            <div class="hardem-processing-spinner"></div>
            <div>${message}</div>
        `;
        
        document.body.appendChild(overlay);
        
        // Timeout de segurança - remover após 10 segundos
        const safetyTimeout = setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
                console.warn('Overlay de processamento removido por timeout de segurança');
            }
        }, 10000);
        
        return {
            hide: () => {
                clearTimeout(safetyTimeout);
                if (overlay.parentNode) {
                    overlay.remove();
                }
            }
        };
    }

    /**
     * Mostrar/ocultar botão de salvamento por partes
     */
    toggleSavePartsButton(show = false, reason = '') {
        const savePartsBtn = document.getElementById('hardem-save-parts');
        if (savePartsBtn) {
            if (show) {
                savePartsBtn.style.display = 'inline-block';
                savePartsBtn.title = `Salvar em partes: ${reason}`;
            } else {
                savePartsBtn.style.display = 'none';
                savePartsBtn.title = 'Salvar em Partes';
            }
        }
    }

    /**
     * Iniciar processo de salvamento por partes
     */
    async startSaveInParts() {
        if (this.core && this.core.storage) {
            await this.core.storage.saveContentInPartsWrapper();
        }
    }

    /**
     * Normalizar elemento atual com dimensões personalizadas
     */
    normalizeCurrentToCustomDimensions() {
        const currentElement = this.core.currentElement;
        if (!currentElement) {
            this.showAlert('⚠️ Nenhum elemento selecionado para normalizar!', 'warning');
            return;
        }

        // Obter valores dos inputs
        const widthInput = document.getElementById('hardem-normalize-width');
        const heightInput = document.getElementById('hardem-normalize-height');

        if (!widthInput || !heightInput) {
            this.showAlert('⚠️ Campos de dimensões não encontrados!', 'error');
            return;
        }

        const width = parseInt(widthInput.value);
        const height = parseInt(heightInput.value);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            this.showAlert('⚠️ Por favor, insira dimensões válidas!', 'warning');
            return;
        }

        const targetDimensions = {
            width: width,
            height: height
        };

        // Usar o imageEditor para aplicar a normalização
        this.core.imageEditor.normalizeIndividualImage(currentElement, targetDimensions);
        
        this.showAlert(`✅ Dimensões personalizadas aplicadas: ${width}x${height}px`, 'success');
    }
}

// Expor classe globalmente
window.HardemEditorUI = HardemEditorUI; 