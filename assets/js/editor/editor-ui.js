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
                    background: #007acc;
                    border-color: #0099ff;
                    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.3);
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
                <button class="hardem-editor-btn" id="hardem-toggle-edit" title="Editar">
                    ✏
                </button>
                <button class="hardem-editor-btn" id="hardem-open-panel" title="Painel">
                    ⚙
                </button>
                <button class="hardem-editor-btn success" id="hardem-save-content" title="Salvar">
                    💾
                </button>
                <button class="hardem-editor-btn" id="hardem-reload-content" onclick="window.hardemEditor.storage.loadContent(true)" title="Recarregar">
                    ↻
                </button>
                <button class="hardem-editor-btn" id="hardem-test-content" onclick="window.hardemEditor.storage.showPageDebugInfo()" title="Debug">
                    🔍
                </button>
                <button class="hardem-editor-btn" id="hardem-clear-overlays" onclick="window.hardemEditor.clearStuckOverlays()" title="Limpar">
                    🧹
                </button>
                <button class="hardem-editor-btn" id="hardem-test-server" onclick="window.hardemEditor.storage.testServerConnection().then(success => alert(success ? 'Servidor conectado!' : 'Servidor indisponível'))" title="Testar Servidor">
                    🔗
                </button>
                <button class="hardem-editor-btn warning" id="hardem-emergency-reset" title="Reset">
                    ⚠
                </button>
                <button class="hardem-editor-btn warning" id="hardem-clear-all" onclick="window.hardemEditor.storage.clearAllPagesData()" title="Excluir Tudo">
                    🗑
                </button>
                <div class="hardem-editor-status" title="Status">
                    OFF
                </div>
            </div>
        `;
        
        document.body.appendChild(this.core.toolbar);
        document.body.classList.add('hardem-editor-active');
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
                <button class="hardem-editor-close-panel" id="hardem-close-panel">Fechar</button>
            </div>
            <div class="hardem-editor-sidepanel-content" id="hardem-panel-content">
                <p style="text-align: center; color: #6c757d; margin-top: 50px; font-style: italic;">
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