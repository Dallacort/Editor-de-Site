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
    saveContent() {
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
                    if (value.src && typeof value.src === 'string') cleanValue.src = value.src;
                    if (value.backgroundImage && typeof value.backgroundImage === 'string') cleanValue.backgroundImage = value.backgroundImage;
                    if (value.title && typeof value.title === 'string') cleanValue.title = value.title;
                    if (value.description && typeof value.description === 'string') cleanValue.description = value.description;
                    if (value.type) cleanValue.type = value.type;
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

            // Salvar no localStorage com chave específica da página
            const pageKey = this.getPageKey();
            localStorage.setItem(pageKey, JSON.stringify(filteredContent));
            console.log(`💾 Conteúdo salvo para página: ${pageKey}`);
            
            // Tentar enviar para servidor
            this.exportToServer(exportData);
            
            this.core.ui.showAlert(
                `Conteúdo salvo! ${Object.keys(filteredContent).length} elementos.`, 
                'success'
            );
            
            console.log('💾 Conteúdo salvo:', exportData);
            
            // Recarregar conteúdo após salvamento para garantir que está aplicado
            this.reloadAfterSave();
            
            return exportData;
        } catch (error) {
            console.error('Erro ao salvar:', error);
            this.core.ui.showAlert(`Erro ao salvar conteúdo: ${error.message}`, 'error');
            return null;
        }
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
    loadContent(forceReload = false) {
        try {
            const pageKey = this.getPageKey();
            const saved = localStorage.getItem(pageKey);
            
            if (!saved) {
                console.log(`📄 Nenhum conteúdo salvo encontrado para: ${pageKey}`);
                return;
            }

            this.core.contentMap = JSON.parse(saved);
            
            console.log(`📥 Conteúdo carregado para ${pageKey}:`, this.core.contentMap);
            
            if (forceReload) {
                // Carregamento forçado - aplicar imediatamente
                console.log('🔄 Carregamento forçado - aplicando imediatamente');
                this.applyLoadedContent();
            } else {
                // Aguardar o DOM estar completamente pronto e elementos processados
                this.waitForDOMAndApplyContent();
            }
            
        } catch (error) {
            console.error('Erro ao carregar conteúdo:', error);
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
            // Preparar dados para envio (enviar JSON diretamente, não FormData)
            const requestData = {
                contentMap: exportData.contentMap,
                url: exportData.url,
                timestamp: exportData.timestamp,
                metadata: exportData.metadata
            };

            // Mostrar que está tentando salvar no servidor
            this.core.ui.showAlert('Tentando salvar no servidor...', 'info');

            // Enviar para save.php
            fetch('save.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    this.core.ui.showAlert('✅ Conteúdo salvo no servidor com sucesso!', 'success');
                    console.log('📁 Arquivo salvo em:', data.file_path || 'pasta de backups');
                } else {
                    this.core.ui.showAlert('❌ Erro ao salvar no servidor: ' + data.message, 'error');
                    // Fallback para download apenas se houver erro do servidor
                    this.generateJSONDownload(exportData);
                }
            })
            .catch(error => {
                console.warn('Save.php não encontrado ou erro na conexão:', error);
                this.core.ui.showAlert('⚠️ Servidor indisponível. Gerando download como backup...', 'warning');
                // Fallback para download apenas se servidor não estiver disponível
                this.generateJSONDownload(exportData);
            });

            console.log('📤 Dados preparados para exportação:', exportData);
            return exportData;
        } catch (error) {
            console.error('Erro ao exportar:', error);
            this.core.ui.showAlert('Erro ao preparar dados para exportação!', 'error');
            // Fallback para download em caso de erro crítico
            this.generateJSONDownload(exportData);
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
        return fetch('save.php', {
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
}

// Expor classe globalmente
window.HardemEditorStorage = HardemEditorStorage; 