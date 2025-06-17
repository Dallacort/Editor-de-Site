/**
 * HARDEM Editor Storage - Módulo de Armazenamento
 * Gerencia salvamento e carregamento de conteúdo
 * @version 1.0.0
 */

class HardemEditorStorage {
    constructor(core) {
        this.core = core;
    }

    /**
     * Salvar conteúdo
     */
    async saveContent() {
        try {
            // Verificar se há conteúdo para salvar
            if (!this.core.contentMap || Object.keys(this.core.contentMap).length === 0) {
                console.warn('Nenhum conteúdo para salvar');
                this.core.ui.showAlert('Nenhum conteúdo editado para salvar.', 'warning');
                return null;
            }

            // Filtrar conteúdo válido (remover entradas vazias)
            const filteredContent = {};
            Object.entries(this.core.contentMap).forEach(([key, value]) => {
                if (value && typeof value === 'object' && 
                    (value.text || value.src || value.backgroundImage || value.title || value.description)) {
                    // Limpar dados corrompidos
                    const cleanValue = {};
                    if (value.text && typeof value.text === 'string') cleanValue.text = value.text;
                    if (value.src && typeof value.src === 'string') {
                        // Otimizar SVG se for muito grande
                        cleanValue.src = this.optimizeImageData(value.src);
                    }
                    if (value.backgroundImage && typeof value.backgroundImage === 'string') {
                        // Otimizar background se for muito grande
                        cleanValue.backgroundImage = this.optimizeImageData(value.backgroundImage);
                    }
                    if (value.title && typeof value.title === 'string') cleanValue.title = value.title;
                    if (value.description && typeof value.description === 'string') cleanValue.description = value.description;
                    if (value.type) cleanValue.type = value.type;
                    if (value.format) cleanValue.format = value.format;
                    if (value.slideIndex !== undefined) cleanValue.slideIndex = value.slideIndex;
                    if (value.elementInfo) cleanValue.elementInfo = value.elementInfo;
                    
                    filteredContent[key] = cleanValue;
                }
            });

            const exportData = {
                timestamp: new Date().toISOString(),
                url: window.location.href,
                contentMap: filteredContent, // Mudança aqui: content -> contentMap para compatibilidade com save.php
                content: filteredContent,    // Manter ambos para compatibilidade
                metadata: {
                    userAgent: navigator.userAgent,
                    totalElements: Object.keys(filteredContent).length,
                    editMode: this.core.editMode
                }
            };

            // Verificar se há dados válidos para salvar
            if (Object.keys(filteredContent).length === 0) {
                console.warn('Nenhum conteúdo válido para salvar');
                this.core.ui.showAlert('Nenhum conteúdo válido para salvar.', 'warning');
                return null;
            }

            // Verificar tamanho dos dados ANTES de enviar para servidor
            const preliminaryData = {
                contentMap: filteredContent,
                url: exportData.url,
                timestamp: exportData.timestamp,
                metadata: exportData.metadata
            };
            
            const preliminarySize = JSON.stringify(preliminaryData).length;
            const phpPostLimit = 8 * 1024 * 1024; // 8MB (limite padrão do PHP)
            
            console.log(`📊 Tamanho dos dados: ${this.formatBytes(preliminarySize)}`);
            
            if (preliminarySize > phpPostLimit * 0.7) { // 70% do limite para mais margem de segurança
                console.warn(`⚠️ Dados muito grandes para PHP (${this.formatBytes(preliminarySize)}). Otimizando...`);
                this.core.ui.showSaveProgressAlert('optimizing', `${this.formatBytes(preliminarySize)} → otimizando`);
                
                // Mostrar botão de salvamento por partes
                this.core.ui.toggleSavePartsButton(true, `Dados grandes detectados (${this.formatBytes(preliminarySize)})`);
                
                // Tentar otimização agressiva
                const optimizedContent = this.aggressiveOptimization(filteredContent);
                const optimizedSize = JSON.stringify({
                    contentMap: optimizedContent,
                    url: exportData.url,
                    timestamp: exportData.timestamp,
                    metadata: exportData.metadata
                }).length;
                
                console.log(`🗜️ Após otimização: ${this.formatBytes(optimizedSize)}`);
                
                if (optimizedSize > phpPostLimit * 0.7) {
                    // Ainda muito grande - tentar salvamento por partes
                    console.log('🔄 Dados ainda muito grandes após otimização. Tentando salvamento por partes...');
                    
                    this.core.ui.showAlert('📦 Dados grandes detectados. Salvando por partes...', 'info');
                    
                    // Tentar salvamento individual por imagem
                    const partResult = await this.saveContentInParts(exportData);
                    if (partResult) {
                        return partResult;
                    }
                    
                    // Se salvamento por partes falhar, salvar localmente
                    this.core.ui.showDetailedErrorAlert(
                        'Dados Muito Grandes - Salvamento Local',
                        `Tamanho: ${this.formatBytes(preliminarySize)}. Limite PHP: ${this.formatBytes(phpPostLimit)}`,
                        [
                            'Tentativa de salvamento por partes falhou',
                            'Use imagens menores (redimensione antes de carregar)',
                            'Configure PHP: post_max_size = 50M no php.ini',
                            'Os dados foram salvos localmente como backup'
                        ]
                    );
                    
                    // Salvar apenas localmente
                    const pageKey = this.getPageKey();
                    const localData = this.extractEssentialData(filteredContent);
                    localStorage.setItem(pageKey, JSON.stringify(localData));
                    
                    this.core.ui.showAlert('💾 Dados salvos localmente (backup de segurança)', 'warning');
                    return exportData;
                }
                
                // Usar dados otimizados
                exportData.contentMap = optimizedContent;
                exportData.content = optimizedContent;
            }

            // Mostrar progresso de validação
            this.core.ui.showSaveProgressAlert('validating', `${Object.keys(filteredContent).length} elementos`);
            
            // Verificar tamanho total dos dados
            const dataSize = JSON.stringify(filteredContent).length;
            const maxLocalStorageSize = 5 * 1024 * 1024; // 5MB para localStorage
            
            if (dataSize > maxLocalStorageSize) {
                console.warn(`Dados muito grandes (${this.formatBytes(dataSize)}). Tentando otimização...`);
                this.core.ui.showSaveProgressAlert('optimizing', this.formatBytes(dataSize));
                
                // Tentar compactar dados ou salvar apenas no servidor
                try {
                    // Salvar no localStorage apenas os dados essenciais
                    const essentialData = this.extractEssentialData(filteredContent);
                    const pageKey = this.getPageKey();
                    
                    this.core.ui.showSaveProgressAlert('local-save', 'dados essenciais');
                    localStorage.setItem(pageKey, JSON.stringify(essentialData));
                    console.log(`💾 Dados essenciais salvos localmente: ${pageKey}`);
                } catch (localError) {
                    console.warn('Impossível salvar localmente, apenas no servidor');
                    this.core.ui.showDetailedErrorAlert(
                        'Storage Local Cheio',
                        `Não foi possível salvar localmente. Tamanho dos dados: ${this.formatBytes(dataSize)}`,
                        [
                            'Os dados serão salvos apenas no servidor',
                            'Considere usar imagens menores',
                            'Limpe dados antigos se necessário'
                        ]
                    );
                }
            } else {
            // Salvar no localStorage com chave específica da página
                this.core.ui.showSaveProgressAlert('local-save', this.formatBytes(dataSize));
            const pageKey = this.getPageKey();
            localStorage.setItem(pageKey, JSON.stringify(filteredContent));
                console.log(`💾 Conteúdo salvo para página: ${pageKey} (${this.formatBytes(dataSize)})`);
            }
            
            // Tentar enviar para servidor
            this.core.ui.showSaveProgressAlert('server-save');
            this.exportToServer(exportData);
            
            this.core.ui.showSaveProgressAlert('complete', `${Object.keys(filteredContent).length} elementos`);
            
            console.log('💾 Conteúdo salvo:', exportData);
            
            // Recarregar conteúdo após salvamento para garantir que está aplicado
            this.reloadAfterSave();
            
            return exportData;
        } catch (error) {
            console.error('Erro ao salvar:', error);
            
            // Se o erro for de quota do localStorage, tentar salvar apenas no servidor
            if (error.name === 'QuotaExceededError') {
                this.core.ui.showAlert('Storage local cheio. Salvando apenas no servidor...', 'warning');
                // Tentar salvar apenas no servidor sem localStorage
                try {
                    const filteredContent = this.getBasicFilteredContent();
                    const exportData = {
                        timestamp: new Date().toISOString(),
                        url: window.location.href,
                        contentMap: filteredContent,
                        content: filteredContent,
                        metadata: {
                            userAgent: navigator.userAgent,
                            totalElements: Object.keys(filteredContent).length,
                            editMode: this.core.editMode,
                            largeFile: true
                        }
                    };
                    this.exportToServer(exportData);
                    return exportData;
                } catch (serverError) {
                    this.core.ui.showAlert(`Erro crítico ao salvar: ${serverError.message}`, 'error');
                }
            } else {
            this.core.ui.showAlert(`Erro ao salvar conteúdo: ${error.message}`, 'error');
            }
            return null;
        }
    }

    /**
     * Otimizar dados de imagem para economizar espaço
     */
    optimizeImageData(imageData) {
        if (!imageData || !imageData.startsWith('data:')) {
            return imageData;
        }
        
        // Se for SVG, tentar compactar removendo espaços desnecessários
        if (imageData.includes('data:image/svg+xml')) {
            try {
                const base64Data = imageData.split(',')[1];
                const svgContent = atob(base64Data);
                
                // Compactar SVG removendo espaços e quebras de linha desnecessárias
                const compactedSvg = svgContent
                    .replace(/>\s+</g, '><')  // Remover espaços entre tags
                    .replace(/\s+/g, ' ')     // Compactar múltiplos espaços
                    .trim();
                
                const optimizedData = 'data:image/svg+xml;base64,' + btoa(compactedSvg);
                
                // Se a otimização reduziu significativamente, usar a versão otimizada
                if (optimizedData.length < imageData.length * 0.8) {
                    console.log(`🗜️ SVG otimizado: ${this.formatBytes(imageData.length)} → ${this.formatBytes(optimizedData.length)}`);
                    return optimizedData;
                }
            } catch (error) {
                console.warn('Erro ao otimizar SVG:', error);
            }
        }
        
        return imageData;
    }

    /**
     * Extrair dados essenciais para localStorage quando há limitação de tamanho
     */
    extractEssentialData(content) {
        const essential = {};
        
        Object.entries(content).forEach(([key, value]) => {
            const essentialValue = {};
            
            // Manter apenas dados essenciais
            if (value.text) essentialValue.text = value.text;
            if (value.title) essentialValue.title = value.title;
            if (value.description) essentialValue.description = value.description;
            if (value.type) essentialValue.type = value.type;
            if (value.slideIndex !== undefined) essentialValue.slideIndex = value.slideIndex;
            
            // Para imagens, salvar apenas referência ou versão muito compactada
            if (value.src) {
                if (value.src.startsWith('data:')) {
                    essentialValue.src = '[LARGE_IMAGE_DATA]'; // Placeholder
                    essentialValue.hasLargeData = true;
                } else {
                    essentialValue.src = value.src;
                }
            }
            
            if (value.backgroundImage) {
                if (value.backgroundImage.startsWith('data:')) {
                    essentialValue.backgroundImage = '[LARGE_BG_DATA]'; // Placeholder
                    essentialValue.hasLargeData = true;
                } else {
                    essentialValue.backgroundImage = value.backgroundImage;
                }
            }
            
            essential[key] = essentialValue;
        });
        
        return essential;
    }

    /**
     * Obter conteúdo filtrado básico
     */
    getBasicFilteredContent() {
        const filteredContent = {};
        
        Object.entries(this.core.contentMap).forEach(([key, value]) => {
            if (value && typeof value === 'object' && 
                (value.text || value.src || value.backgroundImage || value.title || value.description)) {
                const cleanValue = {};
                if (value.text && typeof value.text === 'string') cleanValue.text = value.text;
                if (value.src && typeof value.src === 'string') cleanValue.src = value.src;
                if (value.backgroundImage && typeof value.backgroundImage === 'string') cleanValue.backgroundImage = value.backgroundImage;
                if (value.title && typeof value.title === 'string') cleanValue.title = value.title;
                if (value.description && typeof value.description === 'string') cleanValue.description = value.description;
                if (value.type) cleanValue.type = value.type;
                if (value.format) cleanValue.format = value.format;
                if (value.slideIndex !== undefined) cleanValue.slideIndex = value.slideIndex;
                if (value.elementInfo) cleanValue.elementInfo = value.elementInfo;
                
                filteredContent[key] = cleanValue;
            }
        });
        
        return filteredContent;
    }

    /**
     * Formatar bytes em string legível
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Obter chave específica da página atual
     */
    getPageKey() {
        // Usar o nome do arquivo HTML como chave única
        const path = window.location.pathname;
        const fileName = path.split('/').pop() || 'index.html';
        return `siteContent_${fileName}`;
    }

    /**
     * Carregar conteúdo
     */
    async loadContent(forceReload = false) {
        try {
            const pageKey = this.getPageKey();
            console.log(`📡 Carregando conteúdo do banco para: ${pageKey}`);
            
            // Tentar carregar do banco de dados primeiro
            try {
                const response = await fetch(`load-database.php?page=${encodeURIComponent(pageKey)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                        this.core.contentMap = result.data;
                        
                        console.log(`📥 Conteúdo carregado do ${result.source} para ${pageKey}:`, this.core.contentMap);
                        console.log(`📊 Stats: ${result.stats?.textos_carregados || 0} textos, ${result.stats?.imagens_carregadas || 0} imagens`);
                        
                        if (result.source === 'json_fallback') {
                            console.warn('⚠️ Dados carregados do JSON (banco indisponível)');
                        }
                        
                        if (forceReload) {
                            console.log('🔄 Carregamento forçado - aplicando imediatamente');
                            this.applyLoadedContent();
                        } else {
                            this.waitForDOMAndApplyContent();
                        }
                        return;
                    }
                }
            } catch (dbError) {
                console.warn('❌ Erro ao carregar do banco, tentando localStorage:', dbError);
            }
            
            // Fallback para localStorage se banco falhar
            const saved = localStorage.getItem(pageKey);
            
            if (!saved) {
                console.log(`📄 Nenhum conteúdo encontrado para: ${pageKey} (banco e localStorage vazios)`);
                return;
            }

            this.core.contentMap = JSON.parse(saved);
            console.log(`📥 Conteúdo carregado do localStorage para ${pageKey}:`, this.core.contentMap);
            
            if (forceReload) {
                console.log('🔄 Carregamento forçado - aplicando imediatamente');
                this.applyLoadedContent();
            } else {
                this.waitForDOMAndApplyContent();
            }
            
        } catch (error) {
            console.error('❌ Erro crítico ao carregar conteúdo:', error);
            this.core.ui.showAlert('Erro ao carregar conteúdo salvo!', 'error');
        }
    }

    /**
     * Recarregar conteúdo após salvamento
     */
    reloadAfterSave() {
        console.log('🔄 Recarregando conteúdo após salvamento...');
        
        // Aguardar um momento para o salvamento ser concluído
        setTimeout(() => {
            this.loadContent(true); // Forçar carregamento
        }, 500);
    }

    /**
     * Aguardar DOM estar pronto e aplicar conteúdo
     */
    waitForDOMAndApplyContent() {
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo
        
        const checkAndApply = () => {
            attempts++;
            
            // Verificar se há elementos com data-key no DOM
            const elementsWithDataKey = document.querySelectorAll('[data-key]');
            const hasEditableElements = document.querySelectorAll(this.core.editableSelectors.join(',')).length > 0;
            
            // Verificar se o editor está completamente inicializado
            const editorReady = this.core.ui && this.core.textEditor && this.core.imageEditor;
            
            console.log(`🔍 Tentativa ${attempts}: ${elementsWithDataKey.length} elementos com data-key, ${hasEditableElements ? 'elementos editáveis encontrados' : 'aguardando elementos editáveis'}, editor ${editorReady ? 'pronto' : 'não pronto'}`);
            
            // Aplicar se encontrou elementos OU se atingiu o máximo de tentativas OU se o editor está pronto
            if (elementsWithDataKey.length > 0 || hasEditableElements || attempts >= maxAttempts || editorReady) {
                console.log('✅ DOM pronto para aplicar conteúdo');
                this.applyLoadedContent();
            } else {
                // Aguardar mais um pouco
                setTimeout(checkAndApply, 100);
            }
        };
        
        // Começar verificação após um pequeno delay inicial
        setTimeout(checkAndApply, 200);
    }

    /**
     * Aplicar conteúdo carregado
     */
    applyLoadedContent() {
        let appliedCount = 0;
        const orphanedKeys = [];
        const delayedApplications = [];

        console.log('🔄 Iniciando aplicação de conteúdo carregado...');

        Object.entries(this.core.contentMap).forEach(([dataKey, content]) => {
            // Tentar encontrar elemento pelo data-key
            let element = document.querySelector(`[data-key="${dataKey}"]`);
            
            // Se não encontrar, tentar por informações detalhadas
            if (!element && content.elementInfo) {
                element = this.findElementByDetailedInfo(content.elementInfo, dataKey);
            }
            
            // Se ainda não encontrar, marcar como órfão
            if (!element) {
                orphanedKeys.push(dataKey);
                console.warn(`❌ Elemento não encontrado para data-key: ${dataKey}`);
                return;
            }
            
            // Aplicar conteúdo
            try {
                this.applyContentToElement(element, content, dataKey);
                appliedCount++;
                console.log(`✅ Conteúdo aplicado: ${dataKey}`);
            } catch (error) {
                console.error(`❌ Erro ao aplicar conteúdo para ${dataKey}:`, error);
                delayedApplications.push({ dataKey, content, element });
            }
        });

        // Tentar aplicar elementos que falharam após um delay
        if (delayedApplications.length > 0) {
            setTimeout(() => {
                delayedApplications.forEach(({ dataKey, content, element }) => {
                    try {
                        this.applyContentToElement(element, content, dataKey);
                        appliedCount++;
                        console.log(`✅ Conteúdo aplicado (segunda tentativa): ${dataKey}`);
                    } catch (error) {
                        console.error(`❌ Falha definitiva para ${dataKey}:`, error);
                    }
                });
            }, 500);
        }

        // Limpar conteúdo órfão
        if (orphanedKeys.length > 0) {
            this.cleanOrphanedContent(orphanedKeys);
        }

        console.log(`✅ ${appliedCount} elementos aplicados, ${orphanedKeys.length} órfãos removidos`);
        
        if (appliedCount > 0) {
            this.core.ui.showAlert(`${appliedCount} elementos restaurados!`, 'success');
        }

        // Forçar re-renderização após aplicação
        setTimeout(() => {
            this.forceRerender();
        }, 100);

        // Tentar aplicar backgrounds órfãos em elementos similares
        if (orphanedKeys.length > 0) {
            setTimeout(() => {
                this.tryApplyOrphanedBackgrounds(orphanedKeys);
            }, 500);
        }
    }

    /**
     * Aplicar conteúdo a elemento específico
     */
    applyContentToElement(element, content, dataKey) {
        try {
            // Aplicar texto
            if (content.text && this.core.textEditor.isTextElement(element)) {
                element.textContent = content.text;
                console.log(`📝 Texto aplicado: ${dataKey}`);
            }
            
            // Aplicar imagem
            if (content.src && element.tagName.toLowerCase() === 'img') {
                element.src = content.src;
                if (content.alt) {
                    element.alt = content.alt;
                }
                
                // Marcar tipo específico
                if (content.type === 'slide-image') {
                    element.setAttribute('data-hardem-type', 'slide-image');
                    const slideIndex = content.slideIndex || 0;
                    console.log(`🎠 Imagem de slide aplicada: ${dataKey} (slide ${slideIndex + 1})`);
                } else {
                    console.log(`🖼️ Imagem aplicada: ${dataKey}`);
                }
            }
            
            // Aplicar background com propriedades completas e forçadas
            if (content.backgroundImage) {
                element.style.setProperty('background-image', `url("${content.backgroundImage}")`, 'important');
                element.style.setProperty('background-size', 'cover', 'important');
                element.style.setProperty('background-position', 'center', 'important');
                element.style.setProperty('background-repeat', 'no-repeat', 'important');
                
                // Forçar re-renderização do elemento
                element.style.display = 'none';
                element.offsetHeight; // Trigger reflow
                element.style.display = '';
                
                console.log(`🎨 Background aplicado: ${dataKey}`);
            }
            
            // Aplicar título e descrição para carrosséis
            if (content.title) {
                const titleElement = element.querySelector('.title, h1, h2, h3, h4, h5, h6');
                if (titleElement) {
                    titleElement.textContent = content.title;
                    console.log(`📋 Título aplicado: ${dataKey}`);
                }
            }
            
            if (content.description) {
                const descElement = element.querySelector('.disc, .description, p');
                if (descElement) {
                    descElement.textContent = content.description;
                    console.log(`📄 Descrição aplicada: ${dataKey}`);
                }
            }
            
        } catch (error) {
            console.error(`Erro ao aplicar conteúdo para ${dataKey}:`, error);
            throw error; // Re-throw para ser capturado pela função chamadora
        }
    }

    /**
     * Forçar re-renderização de elementos com background
     */
    forceRerender() {
        console.log('🔄 Forçando re-renderização...');
        
        // Encontrar todos os elementos com background aplicado
        const elementsWithBackground = document.querySelectorAll('[data-key]');
        
        elementsWithBackground.forEach(element => {
            const dataKey = element.getAttribute('data-key');
            const content = this.core.contentMap[dataKey];
            
            if (content && content.backgroundImage) {
                // Forçar re-aplicação do background
                element.style.setProperty('background-image', `url("${content.backgroundImage}")`, 'important');
                element.style.setProperty('background-size', 'cover', 'important');
                element.style.setProperty('background-position', 'center', 'important');
                element.style.setProperty('background-repeat', 'no-repeat', 'important');
                
                console.log(`🔄 Background re-aplicado: ${dataKey}`);
            }
        });
    }

    /**
     * Encontrar elemento por informações detalhadas
     */
    findElementByDetailedInfo(elementInfo, dataKey) {
        console.log(`🔍 Procurando elemento órfão: ${dataKey}`, elementInfo);
        
        // Tentar por seletor CSS
        if (elementInfo.cssSelector) {
            const elements = document.querySelectorAll(elementInfo.cssSelector);
            if (elements.length === 1) {
                console.log(`✅ Encontrado por CSS selector: ${dataKey}`);
                elements[0].setAttribute('data-key', dataKey);
                return elements[0];
            }
        }
        
        // Tentar por XPath
        if (elementInfo.xpath) {
            try {
                const result = document.evaluate(
                    elementInfo.xpath, 
                    document, 
                    null, 
                    XPathResult.FIRST_ORDERED_NODE_TYPE, 
                    null
                );
                if (result.singleNodeValue) {
                    console.log(`✅ Encontrado por XPath: ${dataKey}`);
                    result.singleNodeValue.setAttribute('data-key', dataKey);
                    return result.singleNodeValue;
                }
            } catch (e) {
                console.warn('XPath inválido:', elementInfo.xpath);
            }
        }
        
        // Busca inteligente por características específicas
        return this.smartElementSearch(elementInfo, dataKey);
    }

    /**
     * Busca inteligente de elementos
     */
    smartElementSearch(elementInfo, dataKey) {
        const content = this.core.contentMap[dataKey];
        
        // Se é imagem de slide, procurar especificamente em slides
        if (content.type === 'slide-image' && content.src) {
            const slideImages = document.querySelectorAll('.swiper-slide img, .carousel-item img, .slide img, .owl-item img, .item img');
            for (const img of slideImages) {
                if (!img.hasAttribute('data-key') && this.elementMatchesInfo(img, elementInfo, false)) {
                    console.log(`✅ Imagem de slide encontrada: ${dataKey}`);
                    img.setAttribute('data-key', dataKey);
                    return img;
                }
            }
        }
        
        // Se tem background, procurar por elementos com background similar
        if (content.backgroundImage) {
            const elementsWithBg = document.querySelectorAll('*');
            for (const element of elementsWithBg) {
                const computedStyle = getComputedStyle(element);
                const bgImage = element.style.backgroundImage || computedStyle.backgroundImage;
                
                // Verificar se tem background e corresponde às características
                if (bgImage && bgImage !== 'none' && !bgImage.includes('gradient')) {
                    if (this.elementMatchesInfo(element, elementInfo)) {
                        console.log(`✅ Encontrado elemento com background: ${dataKey}`);
                        element.setAttribute('data-key', dataKey);
                        return element;
                    }
                }
            }
        }
        
        // Busca por tag e classes
        const tagName = elementInfo.tagName || 'div';
        const candidates = document.querySelectorAll(tagName);
        
        for (const candidate of candidates) {
            if (this.elementMatchesInfo(candidate, elementInfo)) {
                console.log(`✅ Encontrado por características: ${dataKey}`);
                candidate.setAttribute('data-key', dataKey);
                return candidate;
            }
        }
        
        // Busca mais ampla por classes principais
        if (elementInfo.attributes && elementInfo.attributes.class) {
            const mainClasses = elementInfo.attributes.class.split(' ')
                .filter(cls => cls && !cls.startsWith('hardem-'))
                .slice(0, 3);
            
            for (const className of mainClasses) {
                const elements = document.querySelectorAll(`.${className}`);
                for (const element of elements) {
                    if (this.elementMatchesInfo(element, elementInfo, false)) {
                        console.log(`✅ Encontrado por classe principal: ${dataKey} (${className})`);
                        element.setAttribute('data-key', dataKey);
                        return element;
                    }
                }
            }
        }
        
        console.warn(`❌ Elemento não encontrado após busca inteligente: ${dataKey}`);
        return null;
    }

    /**
     * Verificar se elemento corresponde às informações
     */
    elementMatchesInfo(element, elementInfo, strict = true) {
        // Verificar tag
        if (elementInfo.tagName && element.tagName.toLowerCase() !== elementInfo.tagName.toLowerCase()) {
            return false;
        }
        
        // Verificar texto (apenas se strict)
        if (strict && elementInfo.textContent) {
            const elementText = this.core.utils.getDirectTextContent(element);
            if (elementText !== elementInfo.textContent) {
                return false;
            }
        }
        
        // Verificar classes principais
        if (elementInfo.attributes && elementInfo.attributes.class) {
            const expectedClasses = elementInfo.attributes.class.split(' ')
                .filter(cls => cls && !cls.startsWith('hardem-'));
            const elementClasses = Array.from(element.classList)
                .filter(cls => !cls.startsWith('hardem-'));
            
            // Pelo menos 50% das classes devem coincidir
            const matchingClasses = expectedClasses.filter(cls => elementClasses.includes(cls));
            const matchRatio = matchingClasses.length / expectedClasses.length;
            
            if (strict && matchRatio < 0.8) {
                return false;
            } else if (!strict && matchRatio < 0.5) {
                return false;
            }
        }
        
        // Verificar outros atributos importantes
        if (elementInfo.attributes) {
            const importantAttrs = ['id', 'data-swiper-slide-index'];
            for (const attr of importantAttrs) {
                if (elementInfo.attributes[attr] && 
                    element.getAttribute(attr) !== elementInfo.attributes[attr]) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Limpar conteúdo órfão
     */
    cleanOrphanedContent(orphanedKeys) {
        // Tentar uma última busca para elementos com background antes de remover
        const recoveredKeys = [];
        
        orphanedKeys.forEach(key => {
            const content = this.core.contentMap[key];
            
            // Se tem background, tentar encontrar por características de background
            if (content && content.backgroundImage) {
                const recovered = this.tryRecoverBackgroundElement(key, content);
                if (recovered) {
                    recoveredKeys.push(key);
                    console.log(`🔄 Elemento com background recuperado: ${key}`);
                    return;
                }
            }
            
            delete this.core.contentMap[key];
            console.log(`🗑️ Conteúdo órfão removido: ${key}`);
        });
        
        // Salvar contentMap limpo com chave específica da página
        const pageKey = this.getPageKey();
        localStorage.setItem(pageKey, JSON.stringify(this.core.contentMap));
        
        if (recoveredKeys.length > 0) {
            console.log(`✅ ${recoveredKeys.length} elementos recuperados na última tentativa`);
        }
    }

    /**
     * Tentar recuperar elemento com background
     */
    tryRecoverBackgroundElement(dataKey, content) {
        // Procurar elementos que podem ter background
        const potentialElements = document.querySelectorAll('div, section, header, .banner, .hero, .bg_image');
        
        for (const element of potentialElements) {
            // Verificar se já tem data-key
            if (element.hasAttribute('data-key')) continue;
            
            // Verificar se tem background ou pode ter background
            const computedStyle = getComputedStyle(element);
            const hasExistingBg = element.style.backgroundImage || 
                                 (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none');
            
            // Verificar se as classes coincidem (se temos essa informação)
            if (content.elementInfo && content.elementInfo.attributes && content.elementInfo.attributes.class) {
                const expectedClasses = content.elementInfo.attributes.class.split(' ')
                    .filter(cls => cls && !cls.startsWith('hardem-'));
                const elementClasses = Array.from(element.classList);
                
                const matchingClasses = expectedClasses.filter(cls => elementClasses.includes(cls));
                
                // Se pelo menos 60% das classes coincidem, considerar como candidato
                if (matchingClasses.length / expectedClasses.length >= 0.6) {
                    console.log(`🎯 Candidato encontrado para ${dataKey}:`, element);
                    element.setAttribute('data-key', dataKey);
                    
                    // Aplicar o background imediatamente
                    this.applyContentToElement(element, content, dataKey);
                    return element;
                }
            }
            
            // Se não temos informações de classe, tentar por posição ou outras características
            if (hasExistingBg && element.offsetHeight > 100 && element.offsetWidth > 200) {
                console.log(`🎯 Elemento com background encontrado para ${dataKey}:`, element);
                element.setAttribute('data-key', dataKey);
                this.applyContentToElement(element, content, dataKey);
                return element;
            }
        }
        
        return null;
    }

    /**
     * Tentar aplicar backgrounds órfãos
     */
    tryApplyOrphanedBackgrounds(orphanedKeys) {
        console.log('🔄 Tentando aplicar backgrounds órfãos...', orphanedKeys);
        
        orphanedKeys.forEach(dataKey => {
            const content = this.core.contentMap[dataKey];
            if (content && content.backgroundImage) {
                // Procurar elementos similares que podem receber o background
                const similarElements = this.findSimilarElements(content);
                
                if (similarElements.length > 0) {
                    const targetElement = similarElements[0]; // Usar o primeiro candidato
                    console.log(`🎯 Aplicando background órfão ${dataKey} em elemento similar:`, targetElement);
                    
                    targetElement.setAttribute('data-key', dataKey);
                    this.applyContentToElement(targetElement, content, dataKey);
                    
                    // Remover da lista de órfãos
                    delete this.core.contentMap[dataKey];
                }
            }
        });
    }

    /**
     * Encontrar elementos similares para aplicar background
     */
    findSimilarElements(content) {
        const candidates = [];
        
        // Seletores comuns para elementos que podem ter background
        const backgroundSelectors = [
            '.rts-banner-area',
            '.bg_image', 
            '.banner',
            '.hero',
            'section[style*="background"]',
            'div[style*="background"]',
            '.swiper-slide',
            '.carousel-item'
        ];
        
        backgroundSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Verificar se já tem data-key
                if (element.hasAttribute('data-key')) return;
                
                // Verificar se é um bom candidato
                if (this.isGoodBackgroundCandidate(element, content)) {
                    candidates.push(element);
                }
            });
        });
        
        // Ordenar por relevância (elementos maiores primeiro)
        return candidates.sort((a, b) => {
            const aArea = a.offsetWidth * a.offsetHeight;
            const bArea = b.offsetWidth * b.offsetHeight;
            return bArea - aArea;
        });
    }

    /**
     * Verificar se elemento é bom candidato para background
     */
    isGoodBackgroundCandidate(element, content) {
        // Deve ter tamanho mínimo
        if (element.offsetWidth < 200 || element.offsetHeight < 100) {
            return false;
        }
        
        // Verificar se já tem background
        const computedStyle = getComputedStyle(element);
        const hasBackground = element.style.backgroundImage || 
                             (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none');
        
        // Preferir elementos que já têm background ou classes relacionadas
        const hasBackgroundClass = element.classList.contains('bg_image') || 
                                   element.classList.contains('banner') ||
                                   element.classList.contains('hero') ||
                                   element.className.includes('bg-');
        
        return hasBackground || hasBackgroundClass;
    }

    /**
     * Mostrar informações de debug específicas da página
     */
    showPageDebugInfo() {
        const pageKey = this.getPageKey();
        const currentPageData = this.core.contentMap;
        
        console.log('🔍 =========================');
        console.log(`📄 Página Atual: ${pageKey}`);
        console.log(`📊 Elementos na página: ${Object.keys(currentPageData).length}`);
        console.log('📋 ContentMap atual:', currentPageData);
        
        // Mostrar dados de todas as páginas
        console.log('🌐 Dados de todas as páginas:');
        const allPageData = this.getAllPagesData();
        Object.entries(allPageData).forEach(([page, data]) => {
            console.log(`  📄 ${page}: ${Object.keys(data).length} elementos`);
        });
        
        console.log('🔍 =========================');
        
        // Mostrar alerta visual
        this.core.ui.showAlert(`Página: ${pageKey} | ${Object.keys(currentPageData).length} elementos`, 'info');
    }

    /**
     * Obter dados de todas as páginas
     */
    getAllPagesData() {
        const allData = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('siteContent_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const pageName = key.replace('siteContent_', '');
                    allData[pageName] = data;
                } catch (e) {
                    console.warn(`Dados corrompidos para ${key}`);
                }
            }
        }
        
        return allData;
    }

    /**
     * Limpar dados de uma página específica
     */
    clearPageData(pageName) {
        const pageKey = `siteContent_${pageName}`;
        localStorage.removeItem(pageKey);
        console.log(`🗑️ Dados removidos para: ${pageName}`);
    }

    /**
     * Limpar dados de todas as páginas
     */
    clearAllPagesData() {
        if (confirm('🚨 ATENÇÃO: Isso vai limpar os dados de TODAS as páginas. Continuar?')) {
            const allData = this.getAllPagesData();
            Object.keys(allData).forEach(pageName => {
                this.clearPageData(pageName);
            });
            console.log('🗑️ Todos os dados de páginas foram removidos');
            this.core.ui.showAlert('Todos os dados foram limpos!', 'success');
        }
    }

    /**
     * Exportar para servidor
     */
    exportToServer(exportData) {
        try {
            // Verificar se estamos em ambiente local (file://) - apenas file:// força download
            const isLocalFile = window.location.protocol === 'file:';
            
            if (isLocalFile) {
                console.log('🏠 Ambiente local detectado (file://). Gerando download...');
                this.core.ui.showAlert('Ambiente local detectado. Gerando arquivo para download...', 'info');
                this.generateJSONDownload(exportData);
                return exportData;
            }

            // Preparar dados para envio (enviar JSON diretamente, não FormData)
            const requestData = {
                contentMap: exportData.contentMap,
                url: exportData.url,
                timestamp: exportData.timestamp,
                metadata: exportData.metadata
            };

            // Mostrar progresso
            this.core.ui.showSaveProgressAlert('server-save', 'Enviando para banco de dados...');

            // Enviar para save-database.php
            const formData = new FormData();
            formData.append('data', JSON.stringify(requestData));
            
            fetch('save-database.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('📡 Resposta do servidor:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Verificar se o content-type é JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    console.warn('⚠️ Servidor não retornou JSON. Content-Type:', contentType);
                    
                    // Tentar ler como texto para debug
                    return response.text().then(text => {
                        console.error('📄 Resposta não-JSON do servidor:', text.substring(0, 500));
                        
                        // Análise específica do erro POST Content-Length
                        if (text.includes('POST Content-Length') && text.includes('exceeds the limit')) {
                            const match = text.match(/(\d+) bytes exceeds the limit of (\d+) bytes/);
                            if (match) {
                                const sentBytes = parseInt(match[1]);
                                const limitBytes = parseInt(match[2]);
                                
                                this.core.ui.showDetailedErrorAlert(
                                    '🚫 Limite POST do PHP Excedido',
                                    `Dados enviados: ${this.formatBytes(sentBytes)}\nLimite do servidor: ${this.formatBytes(limitBytes)}`,
                                    [
                                        '🔧 Configure PHP: post_max_size = 50M no php.ini',
                                        '📏 Reduza o tamanho das imagens antes de carregar',
                                        '🖼️ Use JPEG com qualidade 70-80% ao invés de PNG',
                                        '✂️ Corte imagens desnecessárias antes de salvar', 
                                        '📁 Salve em partes (remova algumas imagens temporariamente)',
                                        '🔄 Reinicie o servidor web após alterar php.ini',
                                        '🧪 Use o botão "🔧 Testar PHP" para diagnóstico'
                                    ]
                                );
                                
                                // Salvar localmente
                                this.saveToLocalStorage(exportData);
                                throw new Error('POST size limit exceeded');
                            }
                        }
                        
                        if (text.includes('Warning') && text.includes('PHP Request Startup')) {
                            this.core.ui.showDetailedErrorAlert(
                                '⚠️ Erro de Inicialização PHP', 
                                'O PHP rejeitou a requisição antes de processar',
                                [
                                    '🔧 Aumente post_max_size no php.ini (atual muito baixo)',
                                    '📝 Exemplo: post_max_size = 50M', 
                                    '💾 Aumente memory_limit = 512M também',
                                    '🔄 Reinicie Apache/Nginx após as alterações',
                                    '🧪 Use o botão "🔧 Testar PHP" para verificar'
                                ]
                            );
                            
                            this.saveToLocalStorage(exportData);
                            throw new Error('PHP Request Startup error');
                        }
                        
                        throw new Error('Servidor retornou resposta não-JSON. Verifique logs do PHP.');
                    });
                }
                
                return response.json();
            })
            .then(data => {
                console.log('📥 Resposta processada:', data);
                
                if (data.success) {
                    this.core.ui.showSaveProgressAlert('complete', 'Salvo no servidor!');
                    console.log('📁 Arquivo salvo em:', data.file_path || data.filename || 'servidor');
                    
                    // Mostrar detalhes do salvamento
                    const details = [];
                    if (data.filename) details.push(`Arquivo: ${data.filename}`);
                    if (data.size_formatted) details.push(`Tamanho: ${data.size_formatted}`);
                    if (data.elements) details.push(`${data.elements} elementos`);
                    if (data.compression_ratio) details.push(`Compressão: ${data.compression_ratio}%`);
                    
                    setTimeout(() => {
                        this.core.ui.showAlert(`✅ Salvo com sucesso! ${details.join(' | ')}`, 'success');
                    }, 1000);
                } else {
                    this.core.ui.showSaveProgressAlert('error', data.message);
                    console.error('❌ Erro do servidor:', data.message);
                    
                    // Análise específica do erro
                    if (data.message.includes('POST Content-Length') && data.message.includes('exceeds the limit')) {
                        // Erro específico de limite POST do PHP
                        const match = data.message.match(/(\d+) bytes exceeds the limit of (\d+) bytes/);
                        if (match) {
                            const sentBytes = parseInt(match[1]);
                            const limitBytes = parseInt(match[2]);
                            
                            this.core.ui.showDetailedErrorAlert(
                                '🚫 Limite POST do PHP Excedido',
                                `Dados enviados: ${this.formatBytes(sentBytes)}\nLimite do servidor: ${this.formatBytes(limitBytes)}`,
                                [
                                    '🔧 Configure PHP: post_max_size = 50M no php.ini',
                                    '📏 Reduza o tamanho das imagens antes de carregar',
                                    '🖼️ Use JPEG com qualidade 70-80% ao invés de PNG',
                                    '✂️ Corte imagens desnecessárias antes de salvar',
                                    '📁 Salve em partes (remova algumas imagens temporariamente)',
                                    '🔄 Reinicie o servidor web após alterar php.ini'
                                ]
                            );
                            
                            // Tentar salvar localmente pelo menos
                            this.saveToLocalStorage(exportData);
                            return null;
                        }
                    }
                    
                    if (data.message.includes('Warning') && data.message.includes('PHP Request Startup')) {
                        // Erro de inicialização do PHP
                        this.core.ui.showDetailedErrorAlert(
                            '⚠️ Erro de Inicialização PHP',
                            'O PHP rejeitou a requisição antes de processar',
                            [
                                '🔧 Aumente post_max_size no php.ini (atual muito baixo)',
                                '📝 Exemplo: post_max_size = 50M',
                                '💾 Aumente memory_limit = 512M também',
                                '🔄 Reinicie Apache/Nginx após as alterações',
                                '🧪 Use o botão "🔧 Testar PHP" para verificar'
                            ]
                        );
                        
                        // Salvar localmente
                        this.saveToLocalStorage(exportData);
                        return null;
                    }
                }
            })
            .catch(error => {
                console.warn('❌ Erro na comunicação com save-database.php:', error);
                this.core.ui.showSaveProgressAlert('error', 'Servidor indisponível');
                
                // Verificar tipo de erro
                const isNetworkError = error.message.includes('Failed to fetch') || 
                                     error.message.includes('NetworkError') ||
                                     error.message.includes('404');
                
                const isJSONError = error.message.includes('Unexpected token') ||
                                  error.message.includes('JSON');
                
                const isPHPError = error.message.includes('resposta não-JSON') ||
                                error.message.includes('PHP');
                
                if (isPHPError || isJSONError) {
                    setTimeout(() => {
                        this.core.ui.showDetailedErrorAlert(
                            'Erro do PHP/Servidor',
                            `O servidor retornou HTML ao invés de JSON. Erro: ${error.message}`,
                            [
                                'Verifique o arquivo hardem-editor.log na pasta do projeto',
                                'Pode haver erro de sintaxe PHP ou problema de memória',
                                'Teste com dados menores (menos imagens)',
                                'Verifique se o PHP está funcionando corretamente',
                                'Arquivo será baixado como backup'
                            ]
                        );
                this.generateJSONDownload(exportData);
                    }, 1000);
                } else if (isNetworkError) {
                    setTimeout(() => {
                        this.core.ui.showDetailedErrorAlert(
                            'Servidor Indisponível',
                            `Não foi possível conectar com save-database.php. Erro: ${error.message}`,
                            [
                                'Verifique se está executando em um servidor web (Apache/Nginx)',
                                'Arquivo será baixado como backup',
                                'Para salvar diretamente: execute via http://localhost/ ao invés de file://'
                            ]
                        );
                        this.generateJSONDownload(exportData);
                    }, 1000);
                } else {
                    setTimeout(() => {
                        this.core.ui.showAlert('⚠️ Erro de conexão. Gerando download como backup...', 'warning');
                        this.generateJSONDownload(exportData);
                    }, 1000);
                }
            });

            console.log('📤 Dados preparados para exportação:', requestData);
            return exportData;
        } catch (error) {
            console.error('❌ Erro crítico ao exportar:', error);
            this.core.ui.showSaveProgressAlert('error', 'Erro crítico');
            
            setTimeout(() => {
                this.core.ui.showAlert('Erro ao preparar dados. Gerando download como backup...', 'error');
            this.generateJSONDownload(exportData);
            }, 1000);
        }
    }

    /**
     * Gerar download do JSON
     */
    generateJSONDownload(exportData) {
        try {
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `hardem-content-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            console.log('📥 JSON gerado para download');
        } catch (error) {
            console.error('Erro ao gerar JSON:', error);
        }
    }

    /**
     * Testar conectividade com o servidor
     */
    testServerConnection() {
        return fetch('save-database.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contentMap: { test: 'connection' },
                url: window.location.href,
                timestamp: new Date().toISOString(),
                metadata: { test: true }
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('🔗 Teste de conexão com servidor:', data);
            return data.success;
        })
        .catch(error => {
            console.error('❌ Erro na conexão com servidor:', error);
            return false;
        });
    }

    /**
     * Backup do conteúdo
     */
    createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupData = {
            timestamp,
            url: window.location.href,
            content: this.core.contentMap
        };
        
        const backupKey = `siteContent-backup-${timestamp}`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        
        console.log('Backup criado:', backupKey);
        return backupKey;
    }

    /**
     * Restaurar backup
     */
    restoreBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('Backup não encontrado');
            }
            
            const parsed = JSON.parse(backupData);
            this.core.contentMap = parsed.content;
            
            localStorage.setItem('siteContent', JSON.stringify(this.core.contentMap));
            
            this.applyLoadedContent();
            this.core.ui.showAlert('Backup restaurado com sucesso!', 'success');
            
            console.log('Backup restaurado:', backupKey);
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            this.core.ui.showAlert('Erro ao restaurar backup!', 'error');
        }
    }

    /**
     * Listar backups disponíveis
     */
    listBackups() {
        const backups = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('siteContent-backup-')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key,
                        timestamp: data.timestamp,
                        url: data.url,
                        elementCount: Object.keys(data.content).length
                    });
                } catch (e) {
                    console.warn('Backup corrompido:', key);
                }
            }
        }
        
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Otimização agressiva para reduzir tamanho dos dados
     */
    aggressiveOptimization(content) {
        const optimized = {};
        
        Object.entries(content).forEach(([key, value]) => {
            const optimizedValue = {};
            
            // Preservar dados essenciais
            if (value.text) optimizedValue.text = value.text;
            if (value.title) optimizedValue.title = value.title;
            if (value.description) optimizedValue.description = value.description;
            if (value.type) optimizedValue.type = value.type;
            if (value.slideIndex !== undefined) optimizedValue.slideIndex = value.slideIndex;
            
            // Otimizar imagens agressivamente
            if (value.src && typeof value.src === 'string') {
                if (value.src.startsWith('data:')) {
                    const optimizedSrc = this.aggressiveImageOptimization(value.src);
                    optimizedValue.src = optimizedSrc;
                } else {
                    optimizedValue.src = value.src;
                }
            }
            
            if (value.backgroundImage && typeof value.backgroundImage === 'string') {
                if (value.backgroundImage.startsWith('data:')) {
                    const optimizedBg = this.aggressiveImageOptimization(value.backgroundImage);
                    optimizedValue.backgroundImage = optimizedBg;
                } else {
                    optimizedValue.backgroundImage = value.backgroundImage;
                }
            }
            
            // Preservar informações mínimas do elemento (versão compacta)
            if (value.elementInfo) {
                optimizedValue.elementInfo = {
                    tagName: value.elementInfo.tagName,
                    className: value.elementInfo.className
                };
            }
            
            optimized[key] = optimizedValue;
        });
        
        return optimized;
    }

    /**
     * Otimização agressiva de imagem
     */
    aggressiveImageOptimization(imageData) {
        if (!imageData || !imageData.startsWith('data:')) {
            return imageData;
        }
        
        try {
            // Para SVG, aplicar compressão máxima
            if (imageData.includes('data:image/svg+xml')) {
                const base64Data = imageData.split(',')[1];
                const svgContent = atob(base64Data);
                
                // Compressão agressiva de SVG
                const compressedSvg = svgContent
                    .replace(/>\s+</g, '><')           // Remover espaços entre tags
                    .replace(/\s+/g, ' ')              // Compactar espaços
                    .replace(/\n|\r/g, '')             // Remover quebras de linha
                    .replace(/<!--.*?-->/g, '')        // Remover comentários
                    .replace(/\s*=\s*/g, '=')          // Remover espaços em atributos
                    .replace(/;\s*/g, ';')             // Compactar CSS
                    .trim();
                
                const compressedData = 'data:image/svg+xml;base64,' + btoa(compressedSvg);
                
                if (compressedData.length < imageData.length) {
                    return compressedData;
                }
            }
            
            // Para outras imagens, tentar reduzir qualidade se for JPEG
            if (imageData.includes('data:image/jpeg') || imageData.includes('data:image/jpg')) {
                return this.reduceJPEGQuality(imageData);
            }
            
        } catch (error) {
            console.warn('Erro na otimização agressiva de imagem:', error);
        }
        
        return imageData;
    }

    /**
     * Reduzir qualidade JPEG para economizar espaço - Versão otimizada
     */
    reduceJPEGQuality(jpegData) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Fazer sync para ser mais rápido
            img.src = jpegData;
            
            if (img.complete) {
                // Reduzir dimensões também para economizar mais espaço
                const maxSize = 1200; // Limite máximo
                let { width, height } = img;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'medium';
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compressão muito agressiva
                const qualities = [0.4, 0.3, 0.25, 0.2, 0.15];
                let bestResult = jpegData;
                
                for (const quality of qualities) {
                    try {
                        const compressedData = canvas.toDataURL('image/jpeg', quality);
                        
                        // Aceitar se conseguir pelo menos 50% de redução
                        if (compressedData.length < bestResult.length * 0.5) {
                            bestResult = compressedData;
                            console.log(`🗜️ JPEG super comprimido: ${this.formatBytes(jpegData.length)} → ${this.formatBytes(compressedData.length)} (${quality * 100}%)`);
                            break;
                        }
                    } catch (error) {
                        console.warn(`Erro ao comprimir com qualidade ${quality}:`, error);
                    }
                }
                
                return bestResult;
            }
        } catch (error) {
            console.warn('Erro na compressão super agressiva:', error);
        }
        
        return jpegData;
    }

    /**
     * Salvar conteúdo localmente
     */
    saveToLocalStorage(exportData) {
        const pageKey = this.getPageKey();
        localStorage.setItem(pageKey, JSON.stringify(exportData.content));
        console.log(`💾 Conteúdo salvo para página: ${pageKey} (${this.formatBytes(JSON.stringify(exportData.content).length)})`);
    }

    /**
     * Salvamento individual por imagem - divide dados grandes em partes menores
     */
    async saveContentInParts(exportData) {
        console.log('🔄 Iniciando salvamento por partes...');
        this.core.ui.showSaveProgressAlert('processing', 'Salvando por partes...');
        
        const content = exportData.contentMap || exportData.content;
        const entries = Object.entries(content);
        
        // Separar por tipo de conteúdo
        const images = entries.filter(([key, value]) => value.src && value.src.startsWith('data:'));
        const backgrounds = entries.filter(([key, value]) => value.backgroundImage && value.backgroundImage.startsWith('data:'));
        const texts = entries.filter(([key, value]) => value.text || value.title || value.description);
        const others = entries.filter(([key, value]) => 
            !value.src?.startsWith('data:') && 
            !value.backgroundImage?.startsWith('data:') && 
            !value.text && !value.title && !value.description
        );
        
        console.log(`📊 Dividindo salvamento: ${images.length} imagens, ${backgrounds.length} backgrounds, ${texts.length} textos, ${others.length} outros`);
        
        const results = [];
        let partNumber = 1;
        
        try {
            // 1. Salvar textos e outros dados primeiro (mais leve)
            if (texts.length > 0 || others.length > 0) {
                const textData = Object.fromEntries([...texts, ...others]);
                const textResult = await this.saveDataPart(textData, partNumber++, 'textos');
                if (textResult) results.push(textResult);
            }
            
            // 2. Salvar imagens individualmente
            for (let i = 0; i < images.length; i++) {
                const [key, value] = images[i];
                const imageData = { [key]: value };
                
                this.core.ui.showSaveProgressAlert('processing', `Salvando imagem ${i + 1}/${images.length}`);
                
                const imageResult = await this.saveDataPart(imageData, partNumber++, `imagem-${i + 1}`);
                if (imageResult) results.push(imageResult);
                
                // Pequena pausa para não sobrecarregar o servidor
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // 3. Salvar backgrounds individualmente
            for (let i = 0; i < backgrounds.length; i++) {
                const [key, value] = backgrounds[i];
                const bgData = { [key]: value };
                
                this.core.ui.showSaveProgressAlert('processing', `Salvando background ${i + 1}/${backgrounds.length}`);
                
                const bgResult = await this.saveDataPart(bgData, partNumber++, `background-${i + 1}`);
                if (bgResult) results.push(bgResult);
                
                // Pequena pausa para não sobrecarregar o servidor
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // 4. Salvar índice final com referências
            const indexData = {
                metadata: {
                    ...exportData.metadata,
                    savedInParts: true,
                    totalParts: partNumber - 1,
                    partFiles: results.map(r => r.filename),
                    timestamp: new Date().toISOString()
                },
                summary: {
                    totalImages: images.length,
                    totalBackgrounds: backgrounds.length,
                    totalTexts: texts.length,
                    totalOthers: others.length
                }
            };
            
            const indexResult = await this.saveDataPart(indexData, 0, 'indice');
            
            if (indexResult) {
                this.core.ui.showSaveProgressAlert('complete', `✅ Salvo em ${partNumber} partes!`);
                
                setTimeout(() => {
                    this.core.ui.showAlert(
                        `🎉 Salvamento concluído!\n📁 ${results.length + 1} arquivos criados\n🖼️ ${images.length} imagens salvas individualmente`, 
                        'success'
                    );
                }, 1000);
                
                console.log('✅ Salvamento por partes concluído:', {
                    totalParts: partNumber,
                    files: [...results.map(r => r.filename), indexResult.filename]
                });
                
                return exportData;
            }
            
        } catch (error) {
            console.error('❌ Erro no salvamento por partes:', error);
            this.core.ui.showSaveProgressAlert('error', 'Erro no salvamento por partes');
            
            // Fallback para download
            setTimeout(() => {
                this.core.ui.showAlert('⚠️ Salvamento por partes falhou. Gerando download...', 'warning');
                this.generateJSONDownload(exportData);
            }, 1000);
        }
        
        return null;
    }
    
    /**
     * Salvar uma parte específica dos dados
     */
    async saveDataPart(partData, partNumber, description) {
        const partSize = JSON.stringify(partData).length;
        console.log(`📦 Salvando parte ${partNumber} (${description}): ${this.formatBytes(partSize)}`);
        
        const partExportData = {
            contentMap: partData,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            metadata: {
                partNumber: partNumber,
                description: description,
                size: partSize,
                timestamp: new Date().toISOString()
            }
        };
        
        try {
            const response = await fetch('save-database.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(JSON.stringify(partExportData))}`
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Parte ${partNumber} salva: ${result.filename || result.file_info?.filename}`);
                return {
                    partNumber: partNumber,
                    description: description,
                    filename: result.filename || result.file_info?.filename,
                    size: partSize
                };
            } else {
                throw new Error(result.message || 'Erro desconhecido');
            }
            
        } catch (error) {
            console.error(`❌ Erro ao salvar parte ${partNumber}:`, error);
            
            // Se for erro de tamanho, tentar otimizar ainda mais
            if (error.message.includes('POST Content-Length') || error.message.includes('too large')) {
                console.log(`🗜️ Tentando otimizar parte ${partNumber}...`);
                
                const optimizedData = this.aggressiveOptimization(partData);
                const optimizedSize = JSON.stringify(optimizedData).length;
                
                if (optimizedSize < partSize * 0.8) { // Se conseguiu reduzir pelo menos 20%
                    console.log(`🗜️ Parte ${partNumber} otimizada: ${this.formatBytes(partSize)} → ${this.formatBytes(optimizedSize)}`);
                    
                    const optimizedExportData = {
                        ...partExportData,
                        contentMap: optimizedData
                    };
                    
                    // Tentar novamente com dados otimizados
                    return await this.saveDataPart(optimizedData, partNumber, `${description}-otimizado`);
                }
            }
            
            return null;
        }
    }

    /**
     * Preparar dados para exportação (usado tanto para salvamento normal quanto por partes)
     */
    async prepareExportData() {
        try {
            // Verificar se há conteúdo para salvar
            const filteredContent = this.getBasicFilteredContent();
            
            if (Object.keys(filteredContent).length === 0) {
                console.warn('Nenhum conteúdo válido para salvar');
                this.core.ui.showAlert('Nenhum conteúdo válido para salvar.', 'warning');
                return null;
            }
            
            // Preparar dados de exportação
            const exportData = {
                contentMap: filteredContent,
                content: filteredContent, // Compatibilidade
                url: window.location.href,
                timestamp: new Date().toISOString(),
                metadata: {
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                    totalElements: Object.keys(filteredContent).length,
                    version: '2.2.0'
                }
            };
            
            // Armazenar para uso posterior
            this.exportData = exportData;
            
            return exportData;
            
        } catch (error) {
            console.error('❌ Erro ao preparar dados de exportação:', error);
            return null;
        }
    }

    /**
     * Wrapper para salvamento por partes (pode ser chamado sem parâmetros)
     */
    async saveContentInPartsWrapper() {
        try {
            // Preparar dados se não existirem
            let exportData = this.exportData;
            if (!exportData) {
                exportData = await this.prepareExportData();
                if (!exportData) {
                    this.core.ui.showAlert('❌ Erro ao preparar dados para salvamento', 'error');
                    return null;
                }
            }
            
            return await this.saveContentInParts(exportData);
            
        } catch (error) {
            console.error('❌ Erro no wrapper de salvamento por partes:', error);
            this.core.ui.showAlert('❌ Erro no salvamento por partes', 'error');
            return null;
        }
    }
}

// Expor classe globalmente
window.HardemEditorStorage = HardemEditorStorage; 