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
                    (value.text || value.src || value.backgroundImage || value.title || value.description || 
                     value.isCounter || value.counterValue !== undefined)) {
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
                    
                    // NOVO: Incluir dados de contador
                    if (value.isCounter) cleanValue.isCounter = value.isCounter;
                    if (value.counterValue !== undefined) cleanValue.counterValue = value.counterValue;
                    if (value.counterSuffix) cleanValue.counterSuffix = value.counterSuffix;
                    if (value.timestamp) cleanValue.timestamp = value.timestamp;
                    
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
            
            // **SISTEMA HÍBRIDO: Sempre usar salvamento por partes para separar imagens normais**
            console.log('🔄 Usando sistema híbrido (backgrounds em textos, imagens normais em tabela imagens)...');
            this.core.ui.showSaveProgressAlert('hybrid-save', 'Sistema híbrido...');
            
            try {
                // SEMPRE usar salvamento híbrido por partes
                const partResult = await this.saveContentInParts(exportData);
                if (partResult) {
                    console.log('✅ Sistema híbrido bem-sucedido! Não salvando no localStorage.');
                    this.core.ui.showSaveProgressAlert('complete', `${Object.keys(filteredContent).length} elementos salvos (sistema híbrido)`);
                    
                    // Recarregar conteúdo após salvamento para garantir que está aplicado
                    this.reloadAfterSave();
                    return exportData;
                }
            } catch (hybridError) {
                console.warn('❌ Erro no sistema híbrido, tentando salvamento tradicional como fallback:', hybridError);
                
                // Fallback: tentar salvamento tradicional
                try {
                    const serverSuccess = await this.exportToServerAsync(exportData);
                    
                    if (serverSuccess) {
                        console.log('✅ Salvamento tradicional bem-sucedido como fallback!');
                        this.core.ui.showSaveProgressAlert('complete', `${Object.keys(filteredContent).length} elementos salvos (fallback tradicional)`);
                        
                        // Recarregar conteúdo após salvamento para garantir que está aplicado
                        this.reloadAfterSave();
                        return exportData;
                    }
                } catch (serverError) {
                    console.warn('❌ Erro no salvamento tradicional também, tentando localStorage como último recurso:', serverError);
                }
            }
            
            // **FALLBACK: Se servidor falhar, salvar no localStorage**
            console.log('🔄 Servidor falhou, usando localStorage como fallback...');
            
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
                    console.warn('Impossível salvar localmente, dados perdidos');
                    this.core.ui.showDetailedErrorAlert(
                        'Storage Cheio - Dados Muito Grandes',
                        `Não foi possível salvar nem no servidor nem localmente. Tamanho dos dados: ${this.formatBytes(dataSize)}`,
                        [
                            'Reduza o tamanho das imagens',
                            'Configure o servidor PHP adequadamente',
                            'Use imagens menores (JPEG com qualidade 70-80%)',
                            'Salve em partes menores'
                        ]
                    );
                    throw localError;
                }
            } else {
                // Salvar no localStorage com chave específica da página
                this.core.ui.showSaveProgressAlert('local-save', this.formatBytes(dataSize));
                const pageKey = this.getPageKey();
                localStorage.setItem(pageKey, JSON.stringify(filteredContent));
                console.log(`💾 Conteúdo salvo localmente como fallback: ${pageKey} (${this.formatBytes(dataSize)})`);
            }
            
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
                (value.text || value.src || value.backgroundImage || value.title || value.description || 
                 value.isCounter || value.counterValue !== undefined || value.counterSuffix ||
                 key.includes('counter') || key.includes('label') || key.includes('odometer'))) {
                
                const cleanValue = {};
                
                // Propriedades básicas
                if (value.text && typeof value.text === 'string') cleanValue.text = value.text;
                if (value.src && typeof value.src === 'string') cleanValue.src = value.src;
                if (value.backgroundImage && typeof value.backgroundImage === 'string') cleanValue.backgroundImage = value.backgroundImage;
                if (value.title && typeof value.title === 'string') cleanValue.title = value.title;
                if (value.description && typeof value.description === 'string') cleanValue.description = value.description;
                
                // CORREÇÃO: Propriedades específicas de contadores
                if (value.isCounter !== undefined) cleanValue.isCounter = value.isCounter;
                if (value.counterValue !== undefined) cleanValue.counterValue = value.counterValue;
                if (value.counterSuffix !== undefined) cleanValue.counterSuffix = value.counterSuffix;
                
                // Propriedades de metadados
                if (value.type) cleanValue.type = value.type;
                if (value.format) cleanValue.format = value.format;
                if (value.slideIndex !== undefined) cleanValue.slideIndex = value.slideIndex;
                if (value.elementInfo) cleanValue.elementInfo = value.elementInfo;
                
                filteredContent[key] = cleanValue;
            }
        });
        
        console.log(`🔍 getBasicFilteredContent: ${Object.keys(filteredContent).length} itens filtrados`);
        
        // Debug específico para contadores
        const counters = Object.keys(filteredContent).filter(key => {
            const content = filteredContent[key];
            return content.isCounter || content.counterValue !== undefined || 
                   key.includes('counter') || key.includes('label') || key.includes('odometer');
        });
        console.log(`🔢 Contadores no filteredContent: ${counters.length}`, counters);
        
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
     * Carregar conteúdo de header compartilhado da página home
     */
    async loadSharedHeaderContent() {
        const currentPageKey = this.getPageKey();
        const homePageKey = 'siteContent_index.html';
        
        // Se já estou na página home, não preciso carregar nada extra
        if (currentPageKey === homePageKey) {
            return;
        }
        
        console.log(`🏠 Carregando conteúdo de header compartilhado da home...`);
        
        try {
            // Tentar carregar do banco de dados primeiro
            try {
                const response = await fetch(`load-database.php?page=${encodeURIComponent(homePageKey)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.success && result.data) {
                        this.mergeSharedHeaderContent(result.data);
                        console.log(`🏠 Header compartilhado carregado do banco`);
                        return;
                    }
                }
            } catch (dbError) {
                console.warn('❌ Erro ao carregar header do banco, tentando localStorage:', dbError);
            }
            
            // Fallback para localStorage se banco falhar
            const homeContentSaved = localStorage.getItem(homePageKey);
            
            if (homeContentSaved) {
                const homeContent = JSON.parse(homeContentSaved);
                this.mergeSharedHeaderContent(homeContent);
                console.log(`🏠 Header compartilhado carregado do localStorage`);
            } else {
                console.log(`🏠 Nenhum conteúdo de header encontrado na home para compartilhar`);
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar header compartilhado:', error);
        }
    }

    /**
     * Mesclar conteúdo de header da home com o conteúdo atual
     */
    mergeSharedHeaderContent(homeContent) {
        if (!homeContent || typeof homeContent !== 'object') {
            return;
        }
        
        let mergedCount = 0;
        
        // FASE 1: Mapear conteúdo de header baseado na estrutura
        Object.entries(homeContent).forEach(([dataKey, content]) => {
            // Verificar se é conteúdo de header
            const isHeaderContent = this.isHeaderContent(dataKey, content);
            
            if (isHeaderContent) {
                // Mapear para elemento similar na página atual
                const mappedContent = this.mapHeaderContentToCurrentPage(dataKey, content);
                
                if (mappedContent) {
                    // Adicionar ao contentMap atual se não existir ou se for mais recente
                    if (!this.core.contentMap[mappedContent.newDataKey] || 
                        this.isContentNewer(content, this.core.contentMap[mappedContent.newDataKey])) {
                        
                        this.core.contentMap[mappedContent.newDataKey] = {
                            ...content,
                            originalKey: dataKey,
                            sharedFromHome: true
                        };
                        
                        mergedCount++;
                        console.log(`🔗 Header compartilhado: ${dataKey} → ${mappedContent.newDataKey}`);
                    }
                }
            }
        });
        
        // FASE 2: Sincronização forçada por similaridade (para casos onde mapeamento direto falha)
        if (mergedCount === 0) {
            console.log(`🔍 Nenhum mapeamento direto encontrado. Tentando sincronização forçada...`);
            mergedCount += this.forceSyncSimilarHeaders(homeContent);
        }
        
        if (mergedCount > 0) {
            console.log(`✅ ${mergedCount} elementos de header compartilhados da home`);
        } else {
            console.log(`⚠️ Nenhum elemento de header compatível encontrado para sincronização`);
        }
    }

    /**
     * Verificar se um item é conteúdo de header
     */
    isHeaderContent(dataKey, content) {
        // Verificar se contém 'header' no dataKey
        if (dataKey.toLowerCase().includes('header')) {
            return true;
        }
        
        // Verificar se tem flag isHeaderContent
        if (content.isHeaderContent === true) {
            return true;
        }
        
        // Verificar se é conteúdo de navegação comum (links de menu)
        if (dataKey.match(/^(text_|link_)[1-9]$/) && content.text) {
            const text = content.text.toLowerCase();
            // Palavras comuns em menus de navegação
            const navWords = ['home', 'about', 'services', 'contact', 'portfolio', 'blog', 'serviços', 'sobre', 'contato', 'portfólio', 'início', 'nossos serviços', 'nossos', 'nossa empresa', 'empresa'];
            return navWords.some(word => text.includes(word));
        }
        
        // Verificar se tem elementInfo indicando que está no header
        if (content.elementInfo && content.elementInfo.pathFromBody) {
            return content.elementInfo.pathFromBody.toLowerCase().includes('header');
        }
        
        // Verificar textos típicos de header (logo, título principal, etc.)
        if (content.text) {
            const text = content.text.toLowerCase().trim();
            
            // Textos comuns em headers
            const headerTexts = [
                'hardem', 'logo', 'brand', 'marca', 'empresa',
                'menu', 'navigation', 'nav', 'navegação',
                'call', 'phone', 'email', 'contact', 'contato',
                'get quote', 'orçamento', 'cotação'
            ];
            
            if (headerTexts.some(word => text.includes(word))) {
                return true;
            }
        }
        
        // Verificar se é imagem típica de header (logo, etc.)
        if (content.src || content.backgroundImage) {
            const imageUrl = (content.src || content.backgroundImage).toLowerCase();
            
            const headerImageWords = ['logo', 'brand', 'header', 'nav', 'menu'];
            if (headerImageWords.some(word => imageUrl.includes(word))) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Mapear conteúdo de header da home para elemento similar na página atual
     */
    mapHeaderContentToCurrentPage(homeDataKey, content) {
        // Se a página atual tem um elemento com o mesmo data-key, usar esse
        if (document.querySelector(`[data-key="${homeDataKey}"]`)) {
            return { newDataKey: homeDataKey };
        }
        
        // Tentar encontrar elemento similar no header da página atual
        const headers = document.querySelectorAll('header');
        
        for (let header of headers) {
            // Procurar por texto similar
            if (content.text) {
                const elementsWithSimilarText = header.querySelectorAll('*');
                for (let element of elementsWithSimilarText) {
                    if (element.textContent && element.textContent.trim() === content.text.trim()) {
                        let dataKey = element.getAttribute('data-key');
                        if (!dataKey) {
                            // Gerar data-key se não existir
                            dataKey = this.core.utils.generateDataKey(element);
                            element.setAttribute('data-key', dataKey);
                        }
                        return { newDataKey: dataKey };
                    }
                }
            }
            
            // Procurar por elementos similares estruturalmente
            if (content.elementInfo) {
                const similarElements = header.querySelectorAll(content.elementInfo.tagName || '*');
                for (let element of similarElements) {
                    if (this.isElementStructurallySimilar(element, content.elementInfo)) {
                        let dataKey = element.getAttribute('data-key');
                        if (!dataKey) {
                            dataKey = this.core.utils.generateDataKey(element);
                            element.setAttribute('data-key', dataKey);
                        }
                        return { newDataKey: dataKey };
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Verificar se um elemento é estruturalmente similar às informações de outro elemento
     */
    isElementStructurallySimilar(element, elementInfo) {
        // Verificar tag
        if (element.tagName.toLowerCase() !== elementInfo.tagName) {
            return false;
        }
        
        // Verificar classes em comum
        if (elementInfo.className) {
            const infoClasses = elementInfo.className.split(/\s+/).filter(c => c);
            const elClasses = element.className.split(/\s+/).filter(c => c);
            
            const commonClasses = infoClasses.filter(cls => elClasses.includes(cls));
            if (commonClasses.length === 0 && infoClasses.length > 0) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Verificar se um conteúdo é mais recente que outro
     */
    isContentNewer(content1, content2) {
        if (!content1.timestamp || !content2.timestamp) {
            return true; // Se não tem timestamp, considerar como mais recente
        }
        
        return new Date(content1.timestamp) > new Date(content2.timestamp);
    }

    /**
     * Sincronização forçada de headers similares
     * Para casos onde cada página tem header diferente mas com conteúdo similar
     */
    forceSyncSimilarHeaders(homeContent) {
        console.log(`🚀 Iniciando sincronização forçada de headers similares...`);
        
        let syncedCount = 0;
        const currentPageHeaders = document.querySelectorAll('header');
        
        if (currentPageHeaders.length === 0) {
            console.log(`❌ Nenhum header encontrado na página atual`);
            return 0;
        }
        
        // Extrair conteúdo de header da home
        const homeHeaderContent = this.extractHeaderContentFromHome(homeContent);
        
        if (homeHeaderContent.length === 0) {
            console.log(`❌ Nenhum conteúdo de header identificado na home`);
            return 0;
        }
        
        console.log(`📋 Encontrados ${homeHeaderContent.length} itens de header da home para sincronizar`);
        
        // Para cada header da página atual
        currentPageHeaders.forEach((header, headerIndex) => {
            console.log(`🔍 Analisando header ${headerIndex + 1}...`);
            
            // Sincronizar cada item de conteúdo da home
            homeHeaderContent.forEach(homeItem => {
                const syncResult = this.syncHeaderItem(header, homeItem);
                if (syncResult) {
                    syncedCount++;
                    console.log(`✅ Sincronizado: "${homeItem.text || homeItem.src || 'conteúdo'}" → ${syncResult.targetKey}`);
                }
            });
        });
        
        return syncedCount;
    }

    /**
     * Extrair conteúdo de header da home
     */
    extractHeaderContentFromHome(homeContent) {
        const headerItems = [];
        
        Object.entries(homeContent).forEach(([dataKey, content]) => {
            if (this.isHeaderContent(dataKey, content)) {
                headerItems.push({
                    originalKey: dataKey,
                    content: content,
                    text: content.text,
                    src: content.src,
                    backgroundImage: content.backgroundImage,
                    type: content.type,
                    elementInfo: content.elementInfo
                });
            }
        });
        
        return headerItems;
    }

    /**
     * Sincronizar um item específico de header
     */
    syncHeaderItem(targetHeader, homeItem) {
        // Estratégia 1: Procurar por texto idêntico
        if (homeItem.text) {
            const textMatch = this.findElementByText(targetHeader, homeItem.text);
            if (textMatch) {
                return this.applySyncToElement(textMatch, homeItem, 'text-match');
            }
        }
        
        // Estratégia 2: Procurar por imagem similar (src)
        if (homeItem.src) {
            const imageMatch = this.findElementByImageSrc(targetHeader, homeItem.src);
            if (imageMatch) {
                return this.applySyncToElement(imageMatch, homeItem, 'image-match');
            }
        }
        
        // Estratégia 3: Procurar por background similar
        if (homeItem.backgroundImage) {
            const bgMatch = this.findElementByBackground(targetHeader, homeItem.backgroundImage);
            if (bgMatch) {
                return this.applySyncToElement(bgMatch, homeItem, 'background-match');
            }
        }
        
        // Estratégia 4: Procurar por posição e estrutura similar
        if (homeItem.elementInfo) {
            const structuralMatch = this.findElementByStructure(targetHeader, homeItem.elementInfo);
            if (structuralMatch) {
                return this.applySyncToElement(structuralMatch, homeItem, 'structural-match');
            }
        }
        
        return null;
    }

    /**
     * Encontrar elemento por texto
     */
    findElementByText(container, searchText) {
        const elements = container.querySelectorAll('*');
        
        for (let element of elements) {
            const elementText = element.textContent ? element.textContent.trim() : '';
            if (elementText === searchText.trim() && elementText.length > 0) {
                // Evitar elementos que são apenas containers
                if (element.children.length === 0 || 
                    (element.children.length === 1 && element.children[0].tagName === 'BR')) {
                    return element;
                }
            }
        }
        
        return null;
    }

    /**
     * Encontrar elemento por src de imagem
     */
    findElementByImageSrc(container, searchSrc) {
        const images = container.querySelectorAll('img');
        
        for (let img of images) {
            // Comparar apenas o nome do arquivo para ser mais flexível
            const currentSrcName = this.extractFileName(img.src);
            const searchSrcName = this.extractFileName(searchSrc);
            
            if (currentSrcName === searchSrcName) {
                return img;
            }
        }
        
        return null;
    }

    /**
     * Encontrar elemento por background
     */
    findElementByBackground(container, searchBackground) {
        const elements = container.querySelectorAll('*');
        
        for (let element of elements) {
            const bgImage = getComputedStyle(element).backgroundImage;
            if (bgImage && bgImage !== 'none') {
                const currentBgName = this.extractFileName(bgImage);
                const searchBgName = this.extractFileName(searchBackground);
                
                if (currentBgName === searchBgName) {
                    return element;
                }
            }
        }
        
        return null;
    }

    /**
     * Encontrar elemento por estrutura similar
     */
    findElementByStructure(container, elementInfo) {
        if (!elementInfo.tagName) return null;
        
        const candidates = container.querySelectorAll(elementInfo.tagName);
        
        for (let candidate of candidates) {
            // Verificar classes em comum
            if (elementInfo.className) {
                const infoClasses = elementInfo.className.split(/\s+/).filter(c => c);
                const candidateClasses = candidate.className.split(/\s+/).filter(c => c);
                
                const commonClasses = infoClasses.filter(cls => candidateClasses.includes(cls));
                
                // Se tem pelo menos uma classe em comum, é um bom candidato
                if (commonClasses.length > 0) {
                    return candidate;
                }
            }
            
            // Se não tem classes, verificar por posição relativa
            if (!elementInfo.className || elementInfo.className.trim() === '') {
                const candidateIndex = Array.from(candidate.parentElement.children).indexOf(candidate);
                const originalIndex = elementInfo.childIndex || 0;
                
                // Se está na posição similar, considerar
                if (Math.abs(candidateIndex - originalIndex) <= 1) {
                    return candidate;
                }
            }
        }
        
        return null;
    }

    /**
     * Aplicar sincronização a um elemento específico
     */
    applySyncToElement(element, homeItem, matchType) {
        // Garantir que o elemento tenha data-key
        let dataKey = element.getAttribute('data-key');
        if (!dataKey) {
            dataKey = this.core.utils.generateDataKey(element);
            element.setAttribute('data-key', dataKey);
        }
        
        // Aplicar o conteúdo
        const syncedContent = {
            ...homeItem.content,
            originalKey: homeItem.originalKey,
            sharedFromHome: true,
            syncMethod: matchType,
            syncedAt: new Date().toISOString()
        };
        
        this.core.contentMap[dataKey] = syncedContent;
        
        return {
            targetKey: dataKey,
            matchType: matchType,
            element: element
        };
    }

    /**
     * Extrair nome do arquivo de uma URL
     */
    extractFileName(url) {
        if (!url) return '';
        
        // Remover data: URLs e pegar apenas o nome
        if (url.startsWith('data:')) {
            return url.substring(0, 50); // Usar primeiros caracteres como identificação
        }
        
        // Extrair nome do arquivo de URL normal
        const urlObj = new URL(url, window.location.origin);
        const pathname = urlObj.pathname;
        const fileName = pathname.split('/').pop();
        
        return fileName || '';
    }

    /**
     * Filtrar elementos órfãos que são de header
     */
    filterHeaderOrphans(orphanedKeys) {
        return orphanedKeys.filter(key => {
            const content = this.core.contentMap[key];
            return content && this.isHeaderContent(key, content);
        });
    }

    /**
     * Aplicar conteúdo órfão de header usando sincronização inteligente
     */
    applyOrphanedHeaderContent(headerOrphanKeys) {
        let appliedCount = 0;
        const headers = document.querySelectorAll('header');
        
        if (headers.length === 0) {
            return 0;
        }
        
        headerOrphanKeys.forEach(orphanKey => {
            const orphanContent = this.core.contentMap[orphanKey];
            if (!orphanContent) return;
            
            const homeItem = {
                originalKey: orphanKey,
                content: orphanContent,
                text: orphanContent.text,
                src: orphanContent.src,
                backgroundImage: orphanContent.backgroundImage,
                type: orphanContent.type,
                elementInfo: orphanContent.elementInfo
            };
            
            // Tentar aplicar em cada header da página
            for (let header of headers) {
                const syncResult = this.syncHeaderItem(header, homeItem);
                if (syncResult) {
                    appliedCount++;
                    console.log(`🔗 Órfão aplicado: ${orphanKey} → ${syncResult.targetKey} (${syncResult.matchType})`);
                    break; // Aplicou com sucesso, não precisar tentar outros headers
                }
            }
        });
        
        return appliedCount;
    }

    /**
     * Carregar conteúdo
     */
    async loadContent(forceReload = false) {
        try {
            const pageKey = this.getPageKey();
            console.log(`📡 Carregando conteúdo do banco para: ${pageKey}`);
            
            // NOVO: O loading instantâneo já está ativo via CSS
            // Não precisamos criar overlay aqui, apenas garantir que está ativo
            
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
                        this.contentLoaded = true;
                        
                        console.log(`📥 Conteúdo carregado do ${result.source} para ${pageKey}:`, this.core.contentMap);
                        console.log(`📊 Stats: ${result.stats?.textos_carregados || 0} textos, ${result.stats?.imagens_carregadas || 0} imagens`);
                        
                        // NOVO: Aplicar cache instantâneo para visitantes normais
                        this.applyInstantCache();
                        
                        if (result.source === 'json_fallback') {
                            console.warn('⚠️ Dados carregados do JSON (banco indisponível)');
                        }
                        
                        // Carregar conteúdo de header compartilhado se não for página home
                        await this.loadSharedHeaderContent();
                        
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
                // Ainda assim, tentar carregar header compartilhado
                await this.loadSharedHeaderContent();
                return;
            }

            this.core.contentMap = JSON.parse(saved);
            console.log(`📥 Conteúdo carregado do localStorage para ${pageKey}:`, this.core.contentMap);
            
            // Carregar conteúdo de header compartilhado se não for página home
            await this.loadSharedHeaderContent();
            
            if (forceReload) {
                console.log('🔄 Carregamento forçado - aplicando imediatamente');
                this.applyLoadedContent();
            } else {
                this.waitForDOMAndApplyContent();
            }
            
        } catch (error) {
            console.error('❌ Erro crítico ao carregar conteúdo:', error);
            this.core.ui.showAlert('Erro ao carregar conteúdo salvo!', 'error');
            
            // NOVO: Remover loading em caso de erro
            this.removeLoadingOverlay();
            this.showContentAfterLoad();
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
        if (!this.core.contentMap) return;

        console.log('🔄 Iniciando aplicação de conteúdo carregado...');
        let appliedCount = 0;
        let orphanedKeys = [];
        let dropdownOrphans = [];

        for (const [dataKey, content] of Object.entries(this.core.contentMap)) {
            let element;

            if (content.elementInfo) {
                element = this.findElementByDetailedInfo(content.elementInfo, dataKey);
            } else {
                element = document.querySelector(`[data-key="${dataKey}"]`);
            }

            if (element) {
                this.applyContentToElement(element, content, dataKey);
                appliedCount++;
                console.log(`✅ Conteúdo aplicado: ${dataKey}`);
            } else {
                if (content.elementInfo && content.elementInfo.isInDropdown) {
                    dropdownOrphans.push({ [dataKey]: content });
                } else {
                    orphanedKeys.push(dataKey);
                }
                console.log(`❌ Elemento não encontrado para data-key: ${dataKey}`);
            }
        }

        // Tenta reaplicar órfãos de header
        if (orphanedKeys.length > 0) {
            const headerOrphans = this.filterHeaderOrphans(orphanedKeys);
            if (headerOrphans.length > 0) {
                this.applyOrphanedHeaderContent(headerOrphans);
            }
        }
        
        // Limpa conteúdo que não encontrou correspondência
        if (orphanedKeys.length > 0) {
            this.cleanOrphanedContent(orphanedKeys);
        }
        
        // Tenta reaplicar órfãos de dropdown
        if (dropdownOrphans.length > 0) {
            this.retryDropdownElements(dropdownOrphans);
        }

        console.log(`✅ ${appliedCount} elementos aplicados, ${orphanedKeys.length} órfãos processados`);
        this.core.ui.showAlert(`${appliedCount} elementos restaurados!`, 'success');

        // NOVO: Aplicar normalizações salvas no banco de dados
        if (this.core.imageEditor && this.core.imageEditor.applyContentFromDatabase) {
            console.log('🎯 Aplicando normalizações do banco de dados...');
            this.core.imageEditor.applyContentFromDatabase(this.core.contentMap);
        }

        // Disparar evento para notificar que o conteúdo foi carregado
        const event = new Event('hardem-editor-content-loaded');
        document.dispatchEvent(event);
        console.log('✅ Evento hardem-editor-content-loaded disparado.');

        // NOVO: Remover loading instantâneo e mostrar conteúdo
        setTimeout(() => {
            this.removeInstantLoading();
        }, 200); // Pequeno delay para garantir que tudo foi aplicado

        this.forceRerender();
    }

    /**
     * NOVO: Buscar elementos de dropdown especificamente
     */
    findDropdownElement(dataKey, content) {
        console.log(`🔽 Procurando dropdown detalhadamente: ${dataKey}`, content.elementInfo?.dropdownInfo);
        
        // Usar informações específicas de dropdown se disponíveis
        if (content.elementInfo?.dropdownInfo?.isInDropdown) {
            const dropdownInfo = content.elementInfo.dropdownInfo;
            
            // Procurar pelo tipo específico de dropdown
            const dropdownSelectors = [];
            if (dropdownInfo.dropdownType) {
                dropdownSelectors.push(`.${dropdownInfo.dropdownType}`);
            }
            dropdownSelectors.push('.has-dropdown', '.submenu', '.rts-mega-menu', '.dropdown', '.nav-item');
            
            for (let selector of dropdownSelectors) {
                const containers = document.querySelectorAll(selector);
                
                for (let container of containers) {
                    // Procurar por texto exato primeiro
                    if (content.text) {
                        const textElements = container.querySelectorAll('a, span, p, li');
                        for (let element of textElements) {
                            if (element.textContent && element.textContent.trim() === content.text.trim()) {
                                // Verificar se o contexto bate (textos de elementos próximos)
                                if (this.validateDropdownContext(element, dropdownInfo)) {
                                    console.log(`🔽 Dropdown encontrado por texto e contexto: ${dataKey}`);
                                    element.setAttribute('data-key', dataKey);
                                    return element;
                                }
                            }
                        }
                    }
                    
                    // Procurar por posição no dropdown
                    if (dropdownInfo.itemIndex !== undefined) {
                        const dropdownItems = container.querySelectorAll('a, span, p, li');
                        const targetElement = dropdownItems[dropdownInfo.itemIndex];
                        
                        if (targetElement && !targetElement.hasAttribute('data-key')) {
                            console.log(`🔽 Dropdown encontrado por posição: ${dataKey} (índice ${dropdownInfo.itemIndex})`);
                            targetElement.setAttribute('data-key', dataKey);
                            return targetElement;
                        }
                    }
                }
            }
        }
        
        // Fallback: busca geral por texto
        const dropdownContainers = document.querySelectorAll('.has-dropdown, .submenu, .rts-mega-menu, .dropdown, .nav-item');
        
        for (let container of dropdownContainers) {
            // Procurar por texto similar dentro do container
            if (content.text) {
                const textElements = container.querySelectorAll('a, span, p, li');
                for (let element of textElements) {
                    if (element.textContent && element.textContent.trim() === content.text.trim()) {
                        console.log(`🔽 Dropdown encontrado por texto (fallback): ${dataKey}`);
                        element.setAttribute('data-key', dataKey);
                        return element;
                    }
                }
            }
            
            // Procurar por estrutura similar
            if (content.elementInfo) {
                const similarElements = container.querySelectorAll(content.elementInfo.tagName || 'a');
                for (let element of similarElements) {
                    if (!element.hasAttribute('data-key') && 
                        element.textContent && 
                        element.textContent.trim().length > 0) {
                        console.log(`🔽 Dropdown encontrado por estrutura (fallback): ${dataKey}`);
                        element.setAttribute('data-key', dataKey);
                        return element;
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * NOVO: Validar contexto do dropdown (verificar elementos próximos)
     */
    validateDropdownContext(element, dropdownInfo) {
        if (!dropdownInfo.siblingTexts || dropdownInfo.siblingTexts.length === 0) {
            return true; // Se não há contexto para comparar, aceitar
        }
        
        const container = element.closest('.has-dropdown, .submenu, .rts-mega-menu, .dropdown, .nav-item');
        if (!container) return false;
        
        const dropdownItems = Array.from(container.querySelectorAll('a, span, p, li'));
        const itemIndex = dropdownItems.indexOf(element);
        
        // Verificar textos próximos
        const currentSiblingTexts = dropdownItems
            .slice(Math.max(0, itemIndex - 1), itemIndex + 2)
            .map(item => item.textContent?.trim())
            .filter(text => text && text.length > 0);
        
        // Verificar se pelo menos metade dos textos próximos batem
        const matches = currentSiblingTexts.filter(text => 
            dropdownInfo.siblingTexts.includes(text)
        );
        
        const matchRatio = matches.length / Math.max(dropdownInfo.siblingTexts.length, currentSiblingTexts.length);
        
        console.log(`🔍 Validação de contexto: ${matches.length}/${dropdownInfo.siblingTexts.length} matches (${(matchRatio * 100).toFixed(1)}%)`);
        
        return matchRatio >= 0.5; // Pelo menos 50% de correspondência
    }

    /**
     * NOVO: Retry para elementos de dropdown órfãos
     */
    retryDropdownElements(dropdownOrphans) {
        let recoveredCount = 0;
        
        dropdownOrphans.forEach(dataKey => {
            const content = this.core.contentMap[dataKey];
            if (!content) return;
            
            const element = this.findDropdownElement(dataKey, content);
            if (element) {
                try {
                    this.applyContentToElement(element, content, dataKey);
                    recoveredCount++;
                    console.log(`🔽 Elemento de dropdown recuperado: ${dataKey}`);
                } catch (error) {
                    console.error(`❌ Erro ao recuperar dropdown ${dataKey}:`, error);
                }
            }
        });
        
        if (recoveredCount > 0) {
            console.log(`✅ ${recoveredCount} elementos de dropdown recuperados!`);
            this.core.ui.showAlert(`${recoveredCount} elementos de dropdown recuperados!`, 'success');
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
            
            // NOVO: Aplicar texto a span odometer diretamente
            if (content.text && element.classList.contains('odometer')) {
                element.textContent = content.text;
                console.log(`🔢 Texto aplicado ao odometer: ${dataKey} = ${content.text}`);
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
            
            // CORREÇÃO: Aplicação melhorada de contadores
            if (content.isCounter || content.counterValue !== undefined || 
                (dataKey && (dataKey.includes('counter') || dataKey.includes('label') || dataKey.includes('odometer')))) {
                
                const value = content.counterValue !== undefined ? content.counterValue : 
                             (content.text && !isNaN(parseFloat(content.text))) ? parseFloat(content.text) : 0;
                
                // Caso 1: Elemento pai que contém odometer
                const odometerSpan = element.querySelector('span.odometer');
                if (odometerSpan) {
                    odometerSpan.setAttribute('data-count', value.toString());
                    odometerSpan.textContent = value.toString();
                    console.log(`🔢 Contador aplicado (elemento pai): ${dataKey} = ${value}${content.counterSuffix || ''}`);
                }
                
                // Caso 2: Elemento é diretamente o odometer
                else if (element.classList.contains('odometer')) {
                    element.setAttribute('data-count', value.toString());
                    element.textContent = value.toString();
                    console.log(`🎯 Contador aplicado (odometer direto): ${dataKey} = ${value}`);
                }
                
                // Caso 3: Buscar odometer por data-key semelhante
                else {
                    const relatedOdometer = document.querySelector(`span.odometer[data-key*="${dataKey}"]`) ||
                                          document.querySelector(`span.odometer[data-key="${dataKey}"]`);
                    if (relatedOdometer) {
                        relatedOdometer.setAttribute('data-count', value.toString());
                        relatedOdometer.textContent = value.toString();
                        console.log(`🔗 Contador aplicado (busca relacionada): ${dataKey} = ${value}`);
                    } else {
                        console.warn(`⚠️ Nenhum odometer encontrado para contador: ${dataKey}`, {element, content});
                    }
                }
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
        if (!orphanedKeys || orphanedKeys.length === 0) return;

        console.log(`🗑️ Processando ${orphanedKeys.length} elementos órfãos...`);
        
        // NOVO: Separar elementos de dropdown dos outros órfãos
        const dropdownOrphans = orphanedKeys.filter(key => 
            key.includes('a-pos') || this.core.contentMap[key]?.isDropdownContent || 
            this.core.contentMap[key]?.elementInfo?.isInDropdown
        );
        
        const regularOrphans = orphanedKeys.filter(key => !dropdownOrphans.includes(key));
        
        // Remover órfãos regulares imediatamente
        regularOrphans.forEach(key => {
            console.log(`🗑️ Conteúdo órfão removido: ${key}`);
            delete this.core.contentMap[key];
        });
        
        // NOVO: Para elementos de dropdown, dar mais tempo antes de remover
        if (dropdownOrphans.length > 0) {
            console.log(`⏳ Aguardando para remover ${dropdownOrphans.length} elementos de dropdown órfãos...`);
            
            // Tentar recuperar uma vez mais após 2 segundos
            setTimeout(() => {
                this.finalDropdownCleanup(dropdownOrphans);
            }, 2000);
        }
    }

    /**
     * NOVO: Limpeza final de elementos de dropdown órfãos
     */
    finalDropdownCleanup(dropdownOrphans) {
        let recoveredCount = 0;
        
        // Última tentativa de recuperação
        dropdownOrphans.forEach(dataKey => {
            const content = this.core.contentMap[dataKey];
            if (!content) return;
            
            // Verificar se o elemento foi encontrado na última tentativa
            const element = document.querySelector(`[data-key="${dataKey}"]`);
            if (element) {
                recoveredCount++;
                console.log(`✅ Elemento de dropdown recuperado na última tentativa: ${dataKey}`);
                return;
            }
            
            // Tentar encontrar novamente
            const foundElement = this.findDropdownElement(dataKey, content);
            if (foundElement) {
                try {
                    this.applyContentToElement(foundElement, content, dataKey);
                    recoveredCount++;
                    console.log(`✅ Elemento de dropdown recuperado na limpeza final: ${dataKey}`);
                } catch (error) {
                    console.error(`❌ Erro na recuperação final do dropdown ${dataKey}:`, error);
                    // Só agora remover se realmente não conseguiu recuperar
                    console.log(`🗑️ Conteúdo de dropdown órfão removido: ${dataKey}`);
                    delete this.core.contentMap[dataKey];
                }
            } else {
                // Não conseguiu encontrar, remover
                console.log(`🗑️ Conteúdo de dropdown órfão removido: ${dataKey}`);
                delete this.core.contentMap[dataKey];
            }
        });
        
        if (recoveredCount > 0) {
            console.log(`🎉 Recuperação final: ${recoveredCount} elementos de dropdown salvos!`);
            this.core.ui.showAlert(`${recoveredCount} elementos de dropdown recuperados na última tentativa!`, 'success');
        }
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
    async exportToServerAsync(exportData) {
        return new Promise((resolve, reject) => {
            try {
                // Verificar se estamos em ambiente local (file://) - apenas file:// força download
                const isLocalFile = window.location.protocol === 'file:';
                
                if (isLocalFile) {
                    console.log('🏠 Ambiente local detectado (file://). Gerando download...');
                    this.core.ui.showAlert('Ambiente local detectado. Gerando arquivo para download...', 'info');
                    this.generateJSONDownload(exportData);
                    resolve(true);
                    return;
                }

                // Preparar dados para envio
                const requestData = {
                    contentMap: exportData.contentMap,
                    url: exportData.url,
                    timestamp: exportData.timestamp,
                    metadata: exportData.metadata
                };

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
                        throw new Error('Servidor retornou resposta não-JSON');
                    }
                    
                    return response.json();
                })
                .then(data => {
                    console.log('📥 Resposta processada:', data);
                    
                    if (data.success) {
                        console.log('📁 Arquivo salvo em:', data.file_path || data.filename || 'servidor');
                        resolve(true);
                    } else {
                        console.error('❌ Erro do servidor:', data.message);
                        reject(new Error(data.message || 'Erro desconhecido do servidor'));
                    }
                })
                .catch(error => {
                    console.warn('❌ Erro na comunicação com save-database.php:', error);
                    reject(error);
                });
                
            } catch (error) {
                console.error('❌ Erro crítico no exportToServerAsync:', error);
                reject(error);
            }
        });
    }

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
        const backgrounds = entries.filter(([key, value]) => 
            value.backgroundImage && value.backgroundImage.startsWith('data:')
        );
        const texts = entries.filter(([key, value]) => value.text || value.title || value.description);
        
        // CORREÇÃO: Detecção melhorada de contadores
        const counters = entries.filter(([key, value]) => 
            value.isCounter || 
            value.counterValue !== undefined || 
            value.counterSuffix ||
            (key && key.includes('counter')) ||
            (key && key.includes('label')) ||
            (key && key.includes('odometer'))
        );
        
        const others = entries.filter(([key, value]) => 
            !value.src?.startsWith('data:') && 
            !value.backgroundImage?.startsWith('data:') && 
            !value.text && !value.title && !value.description &&
            !value.isCounter && value.counterValue === undefined && !value.counterSuffix &&
            !(key && key.includes('counter')) &&
            !(key && key.includes('label')) &&
            !(key && key.includes('odometer'))
        );
        
        console.log(`📊 Dividindo salvamento: ${images.length} imagens, ${backgrounds.length} backgrounds, ${texts.length} textos, ${counters.length} contadores, ${others.length} outros`);
        
        // Debug detalhado das imagens
        if (images.length > 0) {
            console.log('🖼️ Imagens detectadas:', images.map(([key, value]) => ({
                key,
                type: value.type,
                hasData: !!value.src,
                dataSize: value.src ? Math.round(value.src.length / 1024) + 'KB' : '0KB'
            })));
        }
        
        // Debug detalhado dos backgrounds
        if (backgrounds.length > 0) {
            console.log('🎨 Backgrounds detectados:', backgrounds.map(([key, value]) => ({
                key,
                type: value.type,
                hasData: !!value.backgroundImage,
                dataSize: value.backgroundImage ? Math.round(value.backgroundImage.length / 1024) + 'KB' : '0KB'
            })));
        }
        
        // Debug detalhado dos contadores
        if (counters.length > 0) {
            console.log('🔢 Contadores detectados:', counters.map(([key, value]) => ({
                key,
                counterValue: value.counterValue,
                counterSuffix: value.counterSuffix,
                isCounter: value.isCounter
            })));
        }
        
        // Debug de outros elementos que podem ser imagens
        console.log('🔍 Todos os elementos no contentMap:', entries.map(([key, value]) => ({
            key,
            type: value.type,
            properties: Object.keys(value),
            hasSrc: !!value.src,
            hasBackgroundImage: !!value.backgroundImage,
            hasText: !!(value.text || value.title || value.description),
            isCounter: !!value.isCounter
        })));
        
        const results = [];
        let partNumber = 1;
        
        try {
            // 1. Salvar textos, contadores e outros dados primeiro (mais leve)
            if (texts.length > 0 || counters.length > 0 || others.length > 0) {
                const textData = Object.fromEntries([...texts, ...counters, ...others]);
                const textResult = await this.saveDataPart(textData, partNumber++, 'textos');
                if (textResult) results.push(textResult);
            }
            
            // 2. Salvar imagens normais na tabela 'imagens' (database-only)
            for (let i = 0; i < images.length; i++) {
                const [key, value] = images[i];
                
                this.core.ui.showSaveProgressAlert('processing', `Salvando imagem ${i + 1}/${images.length}`);
                
                const imageResult = await this.saveImageToDatabase(key, value, i + 1);
                if (imageResult) results.push(imageResult);
                
                // Pequena pausa para não sobrecarregar o servidor
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // 3. Salvar backgrounds na tabela 'textos' (como antes)
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
                    totalCounters: counters.length,
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
     * Salvar imagem na tabela 'imagens' (database-only)
     */
    async saveImageToDatabase(dataKey, imageData, imageNumber) {
        console.log(`🖼️ Salvando imagem ${imageNumber} na tabela 'imagens': ${dataKey}`, imageData);
        
        try {
            // Verificar se temos dados de imagem válidos
            if (!imageData.src || !imageData.src.startsWith('data:')) {
                throw new Error(`Dados de imagem inválidos para ${dataKey}`);
            }
            
            // Extrair informações da imagem
            const base64Data = imageData.src;
            const mimeMatch = base64Data.match(/data:([^;]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
            
            // Validar base64
            if (!base64Content || base64Content.length < 100) {
                throw new Error(`Base64 inválido ou muito pequeno para ${dataKey}`);
            }
            
            // Estimar tamanho (base64 é ~33% maior que binário)
            const estimatedSize = Math.round((base64Content.length * 3) / 4);
            
            // Gerar nome único
            const timestamp = Date.now();
            const extension = mimeType.split('/')[1] || 'jpg';
            const fileName = `img_${timestamp}_${imageNumber}.${extension}`;
            
            console.log(`📊 Preparando upload: ${fileName}, ${this.formatBytes(estimatedSize)}, tipo: ${mimeType}`);
            
            // Preparar dados para API
            const imagePayload = {
                action: 'upload_image_database_only',
                nome_original: fileName,
                tipo_mime: mimeType,
                tamanho: estimatedSize,
                dados_base64: base64Content,
                alt_text: imageData.alt || '',
                descricao: `Imagem ${imageNumber} - ${dataKey} - ${imageData.type || 'unknown'}`,
                data_key: dataKey,
                pagina: this.getPageKey(),
                element_info: JSON.stringify(imageData.elementInfo || {}),
                is_header_content: imageData.isHeaderContent || false,
                timestamp: new Date().toISOString()
            };
            
            console.log(`📡 Enviando para API: ${Object.keys(imagePayload).join(', ')}`);
            
            // Enviar para API
            const apiUrl = 'api-admin.php';
            console.log(`📡 URL da API: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(imagePayload).toString()
            });
            
            console.log(`📡 Resposta da API: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Erro HTTP ${response.status}:`, errorText);
                console.error(`📋 Detalhes completos do erro:`, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: errorText
                });
                throw new Error(`HTTP ${response.status}: ${response.statusText}\n\nDetalhes: ${errorText}`);
            }
            
            const result = await response.json();
            console.log(`📥 Resultado da API:`, result);
            
            if (result.success) {
                console.log(`✅ Imagem ${imageNumber} salva na tabela 'imagens': ID ${result.image_id}`);
                return {
                    partNumber: imageNumber,
                    description: `imagem-database-${imageNumber}`,
                    imageId: result.image_id,
                    dataKey: dataKey,
                    size: estimatedSize,
                    type: 'database-image'
                };
            } else {
                throw new Error(result.message || 'Erro ao salvar imagem na base de dados');
            }
            
        } catch (error) {
            console.error(`❌ Erro ao salvar imagem ${imageNumber} na base:`, error);
            
            // Fallback: salvar como texto (método antigo)
            console.log(`🔄 Fallback: salvando imagem ${imageNumber} como texto...`);
            const imageDataFallback = { [dataKey]: imageData };
            return await this.saveDataPart(imageDataFallback, 1000 + imageNumber, `imagem-fallback-${imageNumber}`);
        }
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

    /**
     * NOVO: Criar overlay de carregamento
     */
    createLoadingOverlay() {
        // Remover overlay existente se houver
        const existing = document.getElementById('hardem-loading-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'hardem-loading-overlay';
        overlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div style="
                    width: 60px;
                    height: 60px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #007bff;
                    border-radius: 50%;
                    animation: hardem-spin 1s linear infinite;
                    margin-bottom: 20px;
                "></div>
                <div style="
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 10px;
                ">Carregando conteúdo...</div>
                <div style="
                    font-size: 14px;
                    color: #666;
                ">Aguarde enquanto restauramos suas edições</div>
            </div>
            <style>
                @keyframes hardem-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(overlay);
        console.log('🔄 Overlay de carregamento criado');
    }

    /**
     * NOVO: Remover overlay de carregamento
     */
    removeLoadingOverlay() {
        const overlay = document.getElementById('hardem-loading-overlay');
        if (overlay) {
            // Fade out suave
            overlay.style.transition = 'opacity 0.3s ease-out';
            overlay.style.opacity = '0';
            
            setTimeout(() => {
                overlay.remove();
                console.log('✅ Overlay de carregamento removido');
            }, 300);
        }
    }

    /**
     * NOVO: Esconder conteúdo durante carregamento
     */
    hideContentDuringLoad() {
        // Esconder apenas elementos que podem ter conteúdo editado
        const elementsToHide = document.querySelectorAll('img, [style*="background-image"], .hardem-editable-element');
        
        elementsToHide.forEach(element => {
            element.style.transition = 'opacity 0.1s';
            element.style.opacity = '0.1';
            element.setAttribute('data-hardem-hidden', 'true');
        });
        
        console.log(`🫥 ${elementsToHide.length} elementos escondidos durante carregamento`);
    }

    /**
     * NOVO: Mostrar conteúdo após carregamento
     */
    showContentAfterLoad() {
        const hiddenElements = document.querySelectorAll('[data-hardem-hidden="true"]');
        
        hiddenElements.forEach(element => {
            element.style.transition = 'opacity 0.3s ease-in';
            element.style.opacity = '1';
            element.removeAttribute('data-hardem-hidden');
        });
        
        console.log(`👁️ ${hiddenElements.length} elementos mostrados após carregamento`);
    }

    /**
     * NOVO: Criar cache CSS para aplicação instantânea
     */
    createInstantStyleCache() {
        if (!this.core.contentMap) return;
        
        let cssRules = [];
        let appliedCount = 0;
        
        Object.keys(this.core.contentMap).forEach(key => {
            const content = this.core.contentMap[key];
            
            // Aplicar estilos de normalização instantaneamente
            if (content && content.normalization && content.normalization.normalized) {
                const selector = `[data-key="${key}"]`;
                const width = content.normalization.target_width;
                const height = content.normalization.target_height;
                
                cssRules.push(`
                    ${selector} {
                        width: ${width}px !important;
                        height: ${height}px !important;
                        object-fit: cover !important;
                        object-position: center !important;
                        background-size: cover !important;
                        background-position: center !important;
                        background-repeat: no-repeat !important;
                    }
                `);
                appliedCount++;
            }
            
            // Aplicar backgrounds instantaneamente
            if (content && content.backgroundImage) {
                const selector = `[data-key="${key}"]`;
                cssRules.push(`
                    ${selector} {
                        background-image: url("${content.backgroundImage}") !important;
                        background-size: cover !important;
                        background-position: center !important;
                        background-repeat: no-repeat !important;
                    }
                `);
                appliedCount++;
            }
            
            // Aplicar imagens instantaneamente
            if (content && content.src && content.type === 'image') {
                const selector = `[data-key="${key}"]`;
                cssRules.push(`
                    ${selector} {
                        content: url("${content.src}") !important;
                    }
                `);
                appliedCount++;
            }
        });
        
        if (cssRules.length > 0) {
            // Remover cache anterior se existir
            const existingCache = document.getElementById('hardem-instant-cache');
            if (existingCache) existingCache.remove();
            
            // Criar novo cache CSS
            const styleElement = document.createElement('style');
            styleElement.id = 'hardem-instant-cache';
            styleElement.textContent = cssRules.join('\n');
            document.head.appendChild(styleElement);
            
            console.log(`⚡ Cache CSS criado: ${appliedCount} estilos aplicados instantaneamente`);
        }
    }

    /**
     * NOVO: Aplicar cache CSS instantâneo no carregamento da página
     */
    applyInstantCache() {
        // Aplicar apenas se não estivermos em modo de edição
        const isEditMode = window.location.search.includes('edit=true');
        if (isEditMode) return;
        
        console.log('⚡ Aplicando cache instantâneo...');
        this.createInstantStyleCache();
    }

    /**
     * NOVO: Remover loading instantâneo e mostrar conteúdo
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
        
        console.log('✅ Loading instantâneo removido - conteúdo visível');
    }
}

// Expor classe globalmente
window.HardemEditorStorage = HardemEditorStorage; 