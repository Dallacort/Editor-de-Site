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
                    top: -50px;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                    padding: 8px 15px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
                    z-index: 999999;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: white;
                    border-bottom: 2px solid #3498db;
                    height: 50px;
                    box-sizing: border-box;
                    transition: transform 0.3s ease;
                }

                .hardem-editor-toolbar.visible {
                    transform: translateY(50px);
                }

                .hardem-editor-toolbar:hover {
                    transform: translateY(50px);
                }

                .hardem-editor-toolbar h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: #ecf0f1;
                }

                .hardem-editor-controls {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }

                .hardem-editor-btn {
                    background: #3498db;
                    border: none;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    min-height: 32px;
                    box-sizing: border-box;
                    white-space: nowrap;
                }

                .hardem-editor-btn:hover {
                    background: #2980b9;
                    transform: translateY(-1px);
                }

                .hardem-editor-btn.active {
                    background: #e74c3c;
                    box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.3);
                }

                .hardem-editor-btn.success {
                    background: #27ae60;
                }

                .hardem-editor-btn.success:hover {
                    background: #229954;
                }

                .hardem-editor-btn.warning {
                    background: #f39c12;
                }

                .hardem-editor-btn.warning:hover {
                    background: #e67e22;
                }

                .hardem-editor-status {
                    background: #34495e;
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                    border: 1px solid #576574;
                    min-height: 32px;
                    display: flex;
                    align-items: center;
                    box-sizing: border-box;
                }

                /* ===== PAINEL LATERAL ===== */
                .hardem-editor-sidepanel {
                    position: fixed;
                    top: 0;
                    right: -280px;
                    width: 280px;
                    height: 100vh;
                    background: #f9f9f9;
                    border-left: 1px solid #ddd;
                    z-index: 999998;
                    transition: transform 0.3s ease;
                    overflow-y: auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                }

                .hardem-editor-sidepanel.visible {
                    transform: translateX(-280px);
                }

                .hardem-editor-sidepanel-header {
                    padding: 12px;
                    background: white;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }

                .hardem-editor-sidepanel-title {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }

                .hardem-editor-close-panel {
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                    border-radius: 3px;
                }

                .hardem-editor-close-panel:hover {
                    background: #f0f0f0;
                }

                .hardem-editor-sidepanel-content {
                    padding: 12px;
                }

                /* ===== ELEMENTOS EDITÁVEIS ===== */
                .hardem-editable {
                    outline: 1px dashed #3498db !important;
                    outline-offset: 1px !important;
                    cursor: pointer !important;
                    transition: outline-color 0.2s ease !important;
                    box-sizing: border-box !important;
                }

                .hardem-editable:hover {
                    outline-color: #e74c3c !important;
                    background-color: rgba(52, 152, 219, 0.05) !important;
                }

                .hardem-selected {
                    outline: 2px solid #e74c3c !important;
                    outline-offset: 1px !important;
                    background-color: rgba(231, 76, 60, 0.05) !important;
                }

                /* ===== FORMULÁRIOS DO PAINEL ===== */
                .hardem-form-group {
                    margin-bottom: 12px;
                }

                .hardem-form-group label {
                    display: block;
                    margin-bottom: 4px;
                    font-weight: 500;
                    color: #333;
                    font-size: 12px;
                }

                .hardem-form-group input,
                .hardem-form-group textarea,
                .hardem-form-group select {
                    width: 100%;
                    padding: 6px 8px;
                    border: 1px solid #ddd;
                    border-radius: 3px;
                    font-size: 12px;
                    box-sizing: border-box;
                }

                .hardem-form-group textarea {
                    min-height: 60px;
                    resize: vertical;
                }

                .hardem-form-group button {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.2s;
                }

                .hardem-form-group button:hover {
                    background: #2980b9;
                }

                .hardem-form-group button.success {
                    background: #27ae60;
                }

                .hardem-form-group button.success:hover {
                    background: #229954;
                }

                /* ===== ALERTAS ===== */
                .hardem-alert {
                    position: fixed;
                    top: 60px;
                    right: 20px;
                    padding: 10px 15px;
                    border-radius: 4px;
                    color: white;
                    font-size: 12px;
                    font-weight: 500;
                    z-index: 1000000;
                    min-width: 200px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                    animation: slideIn 0.3s ease;
                }

                .hardem-alert.success {
                    background: #27ae60;
                }

                .hardem-alert.error {
                    background: #e74c3c;
                }

                .hardem-alert.warning {
                    background: #f39c12;
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
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000001;
                    color: white;
                    font-size: 16px;
                    font-weight: 500;
                }

                .hardem-processing-spinner {
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid #3498db;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin-right: 15px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
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
            <div class="hardem-editor-brand">
                <h3>🎯 HARDEM Editor</h3>
            </div>
            <div class="hardem-editor-controls">
                <button class="hardem-editor-btn" id="hardem-toggle-edit">
                    ✏️ Habilitar Edição
                </button>
                <button class="hardem-editor-btn" id="hardem-open-panel">
                    📝 Painel
                </button>
                <button class="hardem-editor-btn success" id="hardem-save-content">
                    💾 Salvar no Servidor
                </button>
                <button class="hardem-editor-btn" id="hardem-reload-content" onclick="window.hardemEditor.storage.loadContent(true)">
                    🔄 Recarregar
                </button>
                <button class="hardem-editor-btn" id="hardem-test-content" onclick="window.hardemEditor.storage.showPageDebugInfo()">
                    🔍 Debug
                </button>
                <button class="hardem-editor-btn" id="hardem-clear-overlays" onclick="window.hardemEditor.clearStuckOverlays()">
                    🧹 Limpar
                </button>
                <button class="hardem-editor-btn" id="hardem-test-server" onclick="window.hardemEditor.storage.testServerConnection().then(success => alert(success ? '✅ Servidor conectado!' : '❌ Servidor indisponível'))">
                    🔗 Testar Servidor
                </button>
                <button class="hardem-editor-btn warning" id="hardem-emergency-reset">
                    🚨 Reset Página
                </button>
                <button class="hardem-editor-btn warning" id="hardem-clear-all" onclick="window.hardemEditor.storage.clearAllPagesData()">
                    🗑️ Limpar Tudo
                </button>
                <div class="hardem-editor-status">
                    Modo Edição: INATIVO
                </div>
            </div>
        `;
        
        document.body.appendChild(this.core.toolbar);
    }

    /**
     * Criação do painel lateral
     */
    createSidePanel() {
        this.core.sidePanel = document.createElement('div');
        this.core.sidePanel.className = 'hardem-editor-sidepanel';
        this.core.sidePanel.innerHTML = `
            <div class="hardem-editor-sidepanel-header">
                <h3 class="hardem-editor-sidepanel-title">Editor de Conteúdo</h3>
                <button class="hardem-editor-close-panel" id="hardem-close-panel">✕</button>
            </div>
            <div class="hardem-editor-sidepanel-content" id="hardem-panel-content">
                <p style="text-align: center; color: #7f8c8d; margin-top: 50px;">
                    Selecione um elemento para editá-lo
                </p>
            </div>
        `;
        
        document.body.appendChild(this.core.sidePanel);
    }

    /**
     * Abrir painel lateral
     */
    openSidePanel() {
        this.core.sidePanel.classList.add('visible');
    }

    /**
     * Fechar painel lateral
     */
    closeSidePanel() {
        this.core.sidePanel.classList.remove('visible');
        
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
        if (this.core.sidePanel.classList.contains('visible')) {
            this.closeSidePanel();
        } else {
            this.openSidePanel();
        }
    }

    /**
     * Popular painel lateral com dados do elemento
     */
    populateSidePanel(element) {
        const panelContent = document.getElementById('hardem-panel-content');
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

        panelHTML += `
            <div class="hardem-form-group">
                <button onclick="window.hardemEditor.ui.applyPanelChanges()" class="success">
                    ✅ Aplicar Alterações
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
        
        return `
            <div class="hardem-form-group">
                <label>Imagem Atual:</label>
                <img src="${currentSrc}" alt="${currentAlt}" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
            </div>
            <div class="hardem-form-group">
                <label for="hardem-image-input">Nova Imagem:</label>
                <input type="file" id="hardem-image-input" accept="image/*">
                <button onclick="window.hardemEditor.imageEditor.uploadImageFromPanel()">
                    📤 Upload Imagem
                </button>
            </div>
            <div class="hardem-form-group">
                <label for="hardem-alt-input">Texto Alternativo:</label>
                <input type="text" id="hardem-alt-input" value="${currentAlt}" placeholder="Descrição da imagem">
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
        
        return `
            <h4>🖼️ Imagem do Slide ${slideIndex + 1}</h4>
            <div class="hardem-form-group">
                <label>Imagem Atual:</label>
                <img src="${currentSrc}" alt="${currentAlt}" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
            </div>
            <div class="hardem-form-group">
                <label for="hardem-slide-image-input">Nova Imagem:</label>
                <input type="file" id="hardem-slide-image-input" accept="image/*">
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
        
        return `
            <div class="hardem-form-group">
                <label>Background Atual:</label>
                <div style="width: 100%; height: 60px; background-image: ${currentBg}; background-size: cover; background-position: center; border: 1px solid #ddd;"></div>
            </div>
            <div class="hardem-form-group">
                <label for="hardem-bg-input">Novo Background:</label>
                <input type="file" id="hardem-bg-input" accept="image/*">
                <button onclick="window.hardemEditor.imageEditor.uploadBackgroundFromPanel()">
                    📤 Upload Background
                </button>
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

        this.showAlert('Alterações aplicadas com sucesso!', 'success');
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
    showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `hardem-alert ${type}`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 3000);
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
}

// Expor classe globalmente
window.HardemEditorUI = HardemEditorUI; 