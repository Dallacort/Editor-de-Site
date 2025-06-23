/**
 * HARDEM Image Editor - Módulo de Edição de Imagens
 * Gerencia upload e edição de imagens e backgrounds
 * @version 1.0.0
 */

class HardemImageEditor {
    constructor(core) {
        this.core = core;
        
        // Sistema de controle de processamento múltiplo
        this.processingQueue = [];
        this.isProcessing = false;
        this.maxConcurrentProcessing = 8; // Máximo 8 imagens por vez (foi 3)
        this.activeProcessing = new Set();
        this.processedImages = new Map(); // Cache de imagens processadas
        
        // Controle de memória - AUMENTADO para muitas imagens
        this.maxMemoryUsage = 500 * 1024 * 1024; // 500MB máximo em memória (foi 50MB)
        this.currentMemoryUsage = 0;
        
        // Iniciar monitoramento do sistema
        setTimeout(() => this.monitorSystem(), 5000); // Aguardar 5s para inicializar
        
        // NOVO: Monitorar imagens quebradas e tentar restaurar
        this.startBrokenImageMonitoring();
        
        console.log('🚀 Sistema de processamento de imagens inicializado com controle de fila');
    }

    /**
     * Configurar edição de imagens
     */
    setupImageEditing(container = document) {
        let imageCount = 0;
        let backgroundCount = 0;

        // Configurar imagens normais com melhor detecção (incluindo slides)
        container.querySelectorAll('img:not([data-no-edit])').forEach(img => {
            if (!this.core.utils.isEditorElement(img) && this.isValidImage(img)) {
                // Verificar se está dentro de um slide
                const isInSlide = this.isImageInSlide(img);
                
                if (isInSlide) {
                    this.makeSlideImageEditable(img);
                } else {
                    this.makeImageEditable(img);
                }
                imageCount++;
            }
        });

        // Configurar elementos com background-image com melhor detecção
        const backgroundSelectors = [
            'div', 'section', 'header', 'footer', 'article', 'aside',
            '.banner', '.hero', '.bg_image', '.background',
            '.swiper-slide', '.carousel-item'
        ];

        backgroundSelectors.forEach(selector => {
            container.querySelectorAll(selector).forEach(element => {
                if (this.core.utils.isEditorElement(element)) return;
                if (element.hasAttribute('data-no-edit')) return;
                if (element.querySelector('img')) return; // Evitar elementos que contêm imagens
                
                if (this.hasValidBackgroundImage(element)) {
                    this.makeBackgroundImageEditable(element);
                    backgroundCount++;
                }
            });
        });

        console.log(`✅ Elementos de imagem configurados: ${imageCount} imagens, ${backgroundCount} backgrounds`);
        
        // Restaurar normalizações salvas no banco de dados
        this.restoreNormalizationsFromDatabase(container);
    }

    /**
     * Verificar se é uma imagem válida para edição
     */
    isValidImage(img) {
        // Verificar se tem src válido
        if (!img.src) {
            return false;
        }

        // Verificar tamanho mínimo
        if (img.offsetWidth < 50 || img.offsetHeight < 50) {
            return false;
        }

        // Verificar se não é ícone ou logo pequeno
        const isIcon = img.classList.contains('icon') || 
                      img.classList.contains('logo') ||
                      img.closest('.icon') ||
                      img.offsetWidth < 100 && img.offsetHeight < 100;

        return !isIcon;
    }

    /**
     * Verificar se elemento tem background válido
     */
    hasValidBackgroundImage(element) {
        const computedStyle = getComputedStyle(element);
        const inlineBackground = element.style.backgroundImage;
        const computedBackground = computedStyle.backgroundImage;
        
        // Verificar se tem background
        const hasBackground = (inlineBackground && inlineBackground !== 'none') ||
                             (computedBackground && computedBackground !== 'none');
        
        if (!hasBackground) return false;

        // Excluir gradientes
        if ((inlineBackground && inlineBackground.includes('gradient')) ||
            (computedBackground && computedBackground.includes('gradient'))) {
            return false;
        }

        // NOVO: Regras especiais para footer - ser menos restritivo
        if (element.tagName.toLowerCase() === 'footer' || 
            element.classList.contains('footer') || 
            element.closest('footer') ||
            element.classList.contains('rts-footer')) {
            // Para footers, aceitar qualquer tamanho desde que tenha background
            console.log(`🦶 Footer background detectado: ${element.tagName}.${element.className}`);
            return true;
        }

        // Verificar tamanho mínimo do elemento (regras normais para outros elementos)
        if (element.offsetWidth < 100 || element.offsetHeight < 50) {
            return false;
        }

        return true;
    }

    /**
     * Verificar se imagem está dentro de um slide
     */
    isImageInSlide(img) {
        const slideSelectors = [
            '.swiper-slide',
            '.carousel-item', 
            '.slide',
            '.owl-item',
            '.item'
        ];
        
        return slideSelectors.some(selector => img.closest(selector));
    }

    /**
     * Tornar imagem de slide editável
     */
    makeSlideImageEditable(image) {
        // Verificar se já foi processada
        if (image.classList.contains('hardem-editable-element')) {
            return;
        }

        image.classList.add('hardem-editable', 'hardem-editable-element');
        
        const dataKey = image.getAttribute('data-key') || this.core.utils.generateDataKey(image);
        image.setAttribute('data-key', dataKey);
        image.setAttribute('data-hardem-type', 'slide-image'); // Marcar como imagem de slide
        
        // Encontrar o slide pai e seu índice
        const slideElement = image.closest('.swiper-slide, .carousel-item, .slide, .owl-item, .item');
        const slideIndex = this.getSlideIndex(slideElement);
        
        image.title = `Editar imagem do slide ${slideIndex + 1}: ${dataKey}`;
        
        // Eventos
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.core.selectElement(image);
        };

        const handleDoubleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadSlideImage(image, slideIndex);
        };

        image.addEventListener('click', handleClick);
        image.addEventListener('dblclick', handleDoubleClick);
        
        console.log(`🎠 Imagem de slide editável: ${dataKey} (slide ${slideIndex + 1})`);
    }

    /**
     * Obter índice do slide
     */
    getSlideIndex(slideElement) {
        if (!slideElement) return 0;
        
        const parent = slideElement.parentElement;
        const slides = Array.from(parent.children).filter(child => 
            child.classList.contains('swiper-slide') ||
            child.classList.contains('carousel-item') ||
            child.classList.contains('slide') ||
            child.classList.contains('owl-item') ||
            child.classList.contains('item')
        );
        
        return slides.indexOf(slideElement);
    }

    /**
     * Upload de imagem (agora usa fila)
     */
    uploadImage(imgElement) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,image/svg+xml';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            
            if (files.length > 1) {
                this.core.ui.showAlert(`Processando ${files.length} imagens em fila...`, 'info');
            }
            
            files.forEach(file => {
                if (file.type === 'image/svg+xml') {
                    this.addToProcessingQueue('svg', file, imgElement, { svgType: 'image' });
                } else {
                    this.addToProcessingQueue('image', file, imgElement);
                }
            });
            
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Upload de background (agora usa fila)
     */
    uploadBackgroundImage(element) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,image/svg+xml';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            
            if (files.length > 1) {
                this.core.ui.showAlert(`Processando ${files.length} backgrounds em fila...`, 'info');
            }
            
            files.forEach(file => {
                if (file.type === 'image/svg+xml') {
                    this.addToProcessingQueue('svg', file, element, { svgType: 'background' });
                } else {
                    this.addToProcessingQueue('background', file, element);
                }
            });
            
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Upload de imagem de slide (agora usa fila)
     */
    uploadSlideImage(imgElement, slideIndex) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,image/svg+xml';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            
            if (files.length > 1) {
                this.core.ui.showAlert(`Processando ${files.length} imagens de slide em fila...`, 'info');
            }
            
            files.forEach(file => {
                if (file.type === 'image/svg+xml') {
                    this.addToProcessingQueue('svg', file, imgElement, { 
                        svgType: 'slide-image',
                        slideIndex 
                    });
                } else {
                    this.addToProcessingQueue('slide-image', file, imgElement, { 
                        slideIndex 
                    });
                }
            });
            
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Processar upload de imagem com controle de fila (versão assíncrona)
     */
    async processImageUploadQueued(file, imgElement) {
        return new Promise((resolve, reject) => {
            // Validar arquivo
            if (!this.core.utils.validateFileType(file)) {
                reject(new Error('Tipo de arquivo não suportado! Use JPG, PNG, GIF, WebP ou SVG.'));
                return;
            }

            if (!this.core.utils.validateFileSize(file, 5)) {
                reject(new Error('Arquivo muito grande! Máximo 5MB.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const newImageSrc = e.target.result;
                
                // Atualizar uso de memória
                this.currentMemoryUsage += file.size;
                
                // ATUALIZADO: Redimensionar usando dimensões alvo se disponível
                const resizeFunction = this.defaultImageDimensions ? 
                    this.resizeImageToTargetDimensions : this.resizeImageToFit;
                
                resizeFunction.call(this, imgElement, newImageSrc, (resizedSrc) => {
                    try {
                        const dataKey = imgElement.getAttribute('data-key');
                        
                        // Aplicar nova imagem
                        imgElement.src = resizedSrc;
                        
                        // NOVO: Aplicar estilos normalizados se temos dimensões alvo
                        if (this.defaultImageDimensions) {
                            this.applyNormalizedImageStyles(imgElement, this.defaultImageDimensions);
                        } else {
                            // Fallback: estilos básicos
                            imgElement.style.width = '100%';
                            imgElement.style.height = '100%';
                            imgElement.style.objectFit = 'cover';
                        }
                        
                        // Salvar no contentMap com informações completas
                        if (!this.core.contentMap[dataKey]) {
                            this.core.contentMap[dataKey] = {};
                        }
                        this.core.contentMap[dataKey].src = resizedSrc;
                        this.core.contentMap[dataKey].type = 'image';
                        this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo(imgElement);
                        this.core.contentMap[dataKey].isHeaderContent = imgElement.closest('header') !== null;
                        this.core.contentMap[dataKey].processedAt = Date.now();
                        this.core.contentMap[dataKey].timestamp = new Date().toISOString();
                        
                        // Preservar alt se existir
                        if (imgElement.alt) {
                            this.core.contentMap[dataKey].alt = imgElement.alt;
                        }
                        
                        // Adicionar ao cache
                        this.processedImages.set(dataKey, {
                            timestamp: Date.now(),
                            size: file.size,
                            type: 'image'
                        });
                        
                        console.log(`🖼️ Imagem processada em fila: ${dataKey} (${file.name})`);
                        resolve();
                        
                    } catch (error) {
                        reject(error);
                    }
                });
            };
            
            reader.onerror = (error) => {
                reject(new Error('Erro ao ler arquivo de imagem'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Processar upload de background com controle de fila (versão assíncrona)
     */
    async processBackgroundUploadQueued(file, element) {
        return new Promise((resolve, reject) => {
            // Validar arquivo
            if (!this.core.utils.validateFileType(file)) {
                reject(new Error('Tipo de arquivo não suportado!'));
                return;
            }

            if (!this.core.utils.validateFileSize(file, 5)) {
                reject(new Error('Arquivo muito grande! Máximo 5MB.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageSrc = e.target.result;
                
                // Atualizar uso de memória
                this.currentMemoryUsage += file.size;
                
                // Redimensionar background
                this.resizeBackgroundImage(imageSrc, (resizedSrc) => {
                    try {
                        // Aplicar background
                        element.style.setProperty('background-image', `url("${resizedSrc}")`, 'important');
                        element.style.setProperty('background-size', 'cover', 'important');
                        element.style.setProperty('background-position', 'center', 'important');
                        element.style.setProperty('background-repeat', 'no-repeat', 'important');
                        
                        // Forçar re-renderização
                        element.style.display = 'none';
                        element.offsetHeight; // Trigger reflow
                        element.style.display = '';
                        
                        // Salvar no contentMap
                        this.saveBackgroundImage(element, resizedSrc, {
                            processedAt: Date.now(),
                            fileName: file.name,
                            fileSize: file.size
                        });
                        
                        // Adicionar ao cache
                        const dataKey = element.getAttribute('data-key');
                        this.processedImages.set(dataKey, {
                            timestamp: Date.now(),
                            size: file.size,
                            type: 'background'
                        });
                        
                        console.log(`🎨 Background processado em fila: ${dataKey} (${file.name})`);
                        resolve();
                        
                    } catch (error) {
                        reject(error);
                    }
                });
            };
            
            reader.onerror = (error) => {
                reject(new Error('Erro ao ler arquivo de background'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Processar upload de imagem de slide com controle de fila (versão assíncrona)
     */
    async processSlideImageUploadQueued(file, imgElement, slideIndex) {
        return new Promise((resolve, reject) => {
            // Validar arquivo
            if (!this.core.utils.validateFileType(file)) {
                reject(new Error('Tipo de arquivo não suportado!'));
                return;
            }

            if (!this.core.utils.validateFileSize(file, 5)) {
                reject(new Error('Arquivo muito grande! Máximo 5MB.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const newImageSrc = e.target.result;
                
                // Atualizar uso de memória
                this.currentMemoryUsage += file.size;
                
                // ATUALIZADO: Redimensionar usando dimensões alvo se disponível para slides
                const resizeFunction = this.defaultImageDimensions ? 
                    this.resizeImageToTargetDimensions : this.resizeImageToFit;
                
                resizeFunction.call(this, imgElement, newImageSrc, (resizedSrc) => {
                    try {
                        const dataKey = imgElement.getAttribute('data-key');
                        
                        // Aplicar nova imagem
                        imgElement.src = resizedSrc;
                        
                        // NOVO: Aplicar estilos normalizados para slides
                        if (this.defaultImageDimensions) {
                            this.applyNormalizedImageStyles(imgElement, this.defaultImageDimensions);
                        } else {
                            // Fallback: estilos básicos
                            imgElement.style.width = '100%';
                            imgElement.style.height = '100%';
                            imgElement.style.objectFit = 'cover';
                        }
                        
                        // Salvar no contentMap
                        if (!this.core.contentMap[dataKey]) {
                            this.core.contentMap[dataKey] = {};
                        }
                        this.core.contentMap[dataKey].src = resizedSrc;
                        this.core.contentMap[dataKey].type = 'slide-image';
                        this.core.contentMap[dataKey].slideIndex = slideIndex;
                        this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo(imgElement);
                        this.core.contentMap[dataKey].isHeaderContent = imgElement.closest('header') !== null;
                        this.core.contentMap[dataKey].processedAt = Date.now();
                        this.core.contentMap[dataKey].timestamp = new Date().toISOString();
                        
                        if (imgElement.alt) {
                            this.core.contentMap[dataKey].alt = imgElement.alt;
                        }
                        
                        // Adicionar ao cache
                        this.processedImages.set(dataKey, {
                            timestamp: Date.now(),
                            size: file.size,
                            type: 'slide-image'
                        });
                        
                        console.log(`🎠 Imagem de slide processada em fila: ${dataKey} (slide ${slideIndex}, ${file.name})`);
                        resolve();
                        
                    } catch (error) {
                        reject(error);
                    }
                });
            };
            
            reader.onerror = (error) => {
                reject(new Error('Erro ao ler arquivo de slide'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Processar upload de SVG com controle de fila (versão assíncrona)
     */
    async processSVGUploadQueued(file, element, type = 'image') {
        return new Promise((resolve, reject) => {
            // Validação específica para SVG
            if (!this.validateSVGFile(file)) {
                reject(new Error('Arquivo SVG inválido'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const svgData = e.target.result;
                    const dataKey = element.getAttribute('data-key');
                    
                    // Validar dados SVG
                    if (!this.isValidSVGData(svgData)) {
                        reject(new Error('Arquivo SVG inválido ou corrompido'));
                        return;
                    }
                    
                    // Atualizar uso de memória
                    this.currentMemoryUsage += file.size;
                    
                    if (type === 'image' || type === 'slide-image') {
                        // Para imagens SVG
                        element.src = svgData;
                        
                        if (!this.core.contentMap[dataKey]) {
                            this.core.contentMap[dataKey] = {};
                        }
                        this.core.contentMap[dataKey].src = svgData;
                        this.core.contentMap[dataKey].type = type;
                        this.core.contentMap[dataKey].format = 'svg';
                        this.core.contentMap[dataKey].originalSize = file.size;
                        this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo(element);
                        this.core.contentMap[dataKey].isHeaderContent = element.closest('header') !== null;
                        this.core.contentMap[dataKey].processedAt = Date.now();
                        this.core.contentMap[dataKey].timestamp = new Date().toISOString();
                        
                        if (type === 'slide-image') {
                            this.core.contentMap[dataKey].slideIndex = element.slideIndex || 0;
                        }
                        
                        if (element.alt) {
                            this.core.contentMap[dataKey].alt = element.alt;
                        }
                        
                    } else if (type === 'background') {
                        // Para background SVG
                        element.style.setProperty('background-image', `url("${svgData}")`, 'important');
                        element.style.setProperty('background-size', 'cover', 'important');
                        element.style.setProperty('background-position', 'center', 'important');
                        element.style.setProperty('background-repeat', 'no-repeat', 'important');
                        
                        // Forçar re-renderização
                        element.style.display = 'none';
                        element.offsetHeight; // Trigger reflow
                        element.style.display = '';
                        
                        // Salvar no contentMap
                        this.saveBackgroundImage(element, svgData, { 
                            format: 'svg',
                            originalSize: file.size,
                            processedAt: Date.now()
                        });
                    }
                    
                    // Adicionar ao cache
                    this.processedImages.set(dataKey, {
                        timestamp: Date.now(),
                        size: file.size,
                        type: `svg-${type}`
                    });
                    
                    console.log(`🎨 SVG processado em fila: ${dataKey} (${type}, ${file.name})`);
                    resolve();
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                reject(new Error('Erro ao ler arquivo SVG'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Validar arquivo SVG
     */
    validateSVGFile(file) {
        // Verificar tipo
        if (file.type !== 'image/svg+xml') {
            this.core.ui.showAlert('Arquivo deve ser do tipo SVG!', 'error');
            return false;
        }
        
        // Verificar tamanho (permitir até 10MB para SVG)
        if (!this.core.utils.validateFileSize(file, 10)) {
            this.core.ui.showAlert(`Arquivo SVG muito grande! Máximo 10MB. Tamanho atual: ${this.core.utils.formatBytes(file.size)}`, 'error');
            return false;
        }
        
        return true;
    }

    /**
     * Validar se os dados SVG são válidos
     */
    isValidSVGData(svgData) {
        try {
            // Verificar se é um data URL válido
            if (!svgData || !svgData.startsWith('data:image/svg+xml')) {
                return false;
            }
            
            // Tentar decodificar para verificar se não está corrompido
            const base64Data = svgData.split(',')[1];
            if (!base64Data) {
                return false;
            }
            
            const svgContent = atob(base64Data);
            
            // Verificar se contém tags SVG básicas
            if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.warn('Erro na validação SVG:', error);
            return false;
        }
    }

    /**
     * Redimensionar imagem de background
     */
    resizeBackgroundImage(imageSrc, callback) {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const originalWidth = img.width;
                const originalHeight = img.height;
                
                // Limites otimizados para backgrounds
                const MAX_WIDTH = 1920;  // Reduzido de 2560
                const MAX_HEIGHT = 1080; // Reduzido de 1440  
                const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // Reduzido para 1.5MB (de 5MB)
                
                let newWidth = originalWidth;
                let newHeight = originalHeight;
                
                // Reduzir apenas se muito grande
                if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
                    const widthRatio = MAX_WIDTH / originalWidth;
                    const heightRatio = MAX_HEIGHT / originalHeight;
                    const ratio = Math.min(widthRatio, heightRatio);
                    
                    newWidth = Math.floor(originalWidth * ratio);
                    newHeight = Math.floor(originalHeight * ratio);
                }
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Ajustar qualidade para backgrounds - otimizada
                let quality = 0.7; // Reduzido de 0.85 para 0.7
                let resizedSrc;
                
                do {
                    resizedSrc = canvas.toDataURL('image/jpeg', quality);
                    const sizeInBytes = Math.round((resizedSrc.length - 'data:image/jpeg;base64,'.length) * 3/4);
                    
                    if (sizeInBytes <= MAX_FILE_SIZE) {
                        break;
                    }
                    
                    quality -= 0.05;
                } while (quality > 0.3);
                
                console.log(`🖼️ Background redimensionado: ${originalWidth}x${originalHeight} → ${newWidth}x${newHeight}, qualidade: ${quality}`);
                callback(resizedSrc);
                
            } catch (error) {
                console.error('Erro ao redimensionar background:', error);
                callback(imageSrc);
            }
        };
        
        img.onerror = () => {
            console.error('Erro ao carregar background para redimensionamento');
            callback(imageSrc);
        };
        
        img.src = imageSrc;
    }

    /**
     * Upload via painel
     */
    uploadImageFromPanel() {
        if (!this.core.currentElement || this.core.currentElement.tagName.toLowerCase() !== 'img') {
            this.core.ui.showAlert('Selecione uma imagem primeiro!', 'error');
            return;
        }

        const fileInput = document.getElementById('hardem-image-input');
        if (!fileInput.files[0]) {
            this.core.ui.showAlert('Selecione um arquivo de imagem!', 'error');
            return;
        }

        this.processImageUpload(fileInput.files[0], this.core.currentElement);
    }

    /**
     * Upload de background via painel
     */
    uploadBackgroundFromPanel() {
        if (!this.core.currentElement) {
            this.core.ui.showAlert('Selecione um elemento primeiro!', 'error');
            return;
        }

        const fileInput = document.getElementById('hardem-bg-input');
        if (!fileInput.files[0]) {
            this.core.ui.showAlert('Selecione um arquivo de imagem!', 'error');
            return;
        }

        this.processBackgroundUpload(fileInput.files[0], this.core.currentElement);
    }

    /**
     * Redimensionar imagem para se ajustar - Versão otimizada para muitas imagens
     */
    resizeImageToFit(imageElement, newImageSrc, callback) {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Dimensões originais
                const originalWidth = img.width;
                const originalHeight = img.height;
                
                // Limites otimizados - reduzidos para permitir mais imagens
                const MAX_WIDTH = 1366;   // Reduzido de 1920
                const MAX_HEIGHT = 768;   // Reduzido de 1080
                const MAX_FILE_SIZE = 800 * 1024; // Reduzido para 800KB (de 2MB)
                
                // Calcular novas dimensões mantendo proporção
                let newWidth = originalWidth;
                let newHeight = originalHeight;
                
                // Reduzir sempre se maior que limites
                if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
                    const widthRatio = MAX_WIDTH / originalWidth;
                    const heightRatio = MAX_HEIGHT / originalHeight;
                    const ratio = Math.min(widthRatio, heightRatio);
                    
                    newWidth = Math.floor(originalWidth * ratio);
                    newHeight = Math.floor(originalHeight * ratio);
                }
                
                // Para imagens pequenas, ainda reduzir um pouco para economizar espaço
                if (newWidth === originalWidth && newHeight === originalHeight) {
                    if (originalWidth > 800 || originalHeight > 600) {
                        const scaleFactor = 0.8; // Reduzir 20%
                        newWidth = Math.floor(originalWidth * scaleFactor);
                        newHeight = Math.floor(originalHeight * scaleFactor);
                    }
                }
                
                // Configurar canvas
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // Aplicar suavização para melhor qualidade no redimensionamento
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Compressão agressiva - começar com qualidade menor
                let quality = 0.75; // Começar com 75% (era 90%)
                let resizedSrc;
                let attempts = 0;
                const maxAttempts = 8;
                
                do {
                    resizedSrc = canvas.toDataURL('image/jpeg', quality);
                    
                    // Calcular tamanho aproximado em bytes
                    const sizeInBytes = Math.round((resizedSrc.length - 'data:image/jpeg;base64,'.length) * 3/4);
                    
                    if (sizeInBytes <= MAX_FILE_SIZE) {
                        break;
                    }
                    
                    quality -= 0.08; // Reduzir mais rapidamente
                    attempts++;
                    
                    // Se ainda muito grande, reduzir dimensões também
                    if (attempts > 4 && sizeInBytes > MAX_FILE_SIZE * 1.5) {
                        newWidth = Math.floor(newWidth * 0.9);
                        newHeight = Math.floor(newHeight * 0.9);
                        canvas.width = newWidth;
                        canvas.height = newHeight;
                        ctx.clearRect(0, 0, newWidth, newHeight);
                        ctx.drawImage(img, 0, 0, newWidth, newHeight);
                        quality = 0.6; // Resetar qualidade
                    }
                    
                } while (quality > 0.15 && attempts < maxAttempts);
                
                // Calcular tamanho final para log
                const finalSize = Math.round((resizedSrc.length - 'data:image/jpeg;base64,'.length) * 3/4);
                
                console.log(`📏 Imagem otimizada: ${originalWidth}x${originalHeight} → ${newWidth}x${newHeight}, qualidade: ${quality.toFixed(2)}, tamanho: ${this.formatBytes(finalSize)}`);
                callback(resizedSrc);
                
            } catch (error) {
                console.error('Erro ao redimensionar imagem:', error);
                // Fallback: usar imagem original
                callback(newImageSrc);
            }
        };
        
        img.onerror = () => {
            console.error('Erro ao carregar imagem para redimensionamento');
            callback(newImageSrc);
        };
        
        img.src = newImageSrc;
    }

    /**
     * Salvar imagem de background
     */
    saveBackgroundImage(element, backgroundImage, additionalData = {}) {
        const dataKey = element.getAttribute('data-key');
        
        if (!this.core.contentMap[dataKey]) {
            this.core.contentMap[dataKey] = {};
        }
        
        // Salvar dados da imagem
        this.core.contentMap[dataKey].backgroundImage = backgroundImage;
        this.core.contentMap[dataKey].type = 'background';
        this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo(element);
        this.core.contentMap[dataKey].isHeaderContent = element.closest('header') !== null;
        this.core.contentMap[dataKey].timestamp = new Date().toISOString();
        
        // Adicionar dados extras se fornecidos
        Object.assign(this.core.contentMap[dataKey], additionalData);
        
        console.log(`Background salvo: ${dataKey} (header: ${this.core.contentMap[dataKey].isHeaderContent})`, this.core.contentMap[dataKey]);
    }

    /**
     * Aplicar imagem salva
     */
    applyImageContent(element, content) {
        if (content.src && element.tagName.toLowerCase() === 'img') {
            element.src = content.src;
            if (content.alt) {
                element.alt = content.alt;
            }
            
            // ATUALIZADO: Aplicar estilos normalizados se temos dimensões alvo
            if (this.defaultImageDimensions) {
                this.applyNormalizedImageStyles(element, this.defaultImageDimensions);
            } else {
                // Fallback: estilos básicos
                element.style.width = '100%';
                element.style.height = '100%';
                element.style.objectFit = 'cover';
            }
            
            // Se é imagem de slide, marcar adequadamente
            if (content.type === 'slide-image') {
                element.setAttribute('data-hardem-type', 'slide-image');
                const slideIndex = content.slideIndex || 0;
                console.log(`🎠 Imagem de slide restaurada: slide ${slideIndex + 1}`);
            }
        }
        
        if (content.backgroundImage) {
            element.style.setProperty('background-image', `url("${content.backgroundImage}")`, 'important');
            element.style.setProperty('background-size', 'cover', 'important');
            element.style.setProperty('background-position', 'center', 'important');
            element.style.setProperty('background-repeat', 'no-repeat', 'important');
            
            // Se é background de slide, marcar adequadamente
            if (content.type === 'carousel-slide-background' || content.type === 'slide-background') {
                element.setAttribute('data-hardem-type', 'slide-background');
                const slideIndex = content.slideIndex || 0;
                console.log(`🎨 Background de slide restaurado: slide ${slideIndex + 1}`);
            }
        }
    }

    /**
     * Adicionar processamento à fila
     */
    addToProcessingQueue(type, file, element, options = {}) {
        const queueItem = {
            id: Date.now() + Math.random(),
            type, // 'image', 'background', 'slide-image', 'svg'
            file,
            element,
            options,
            status: 'pending'
        };
        
        this.processingQueue.push(queueItem);
        this.processQueue();
        
        return queueItem.id;
    }

    /**
     * Processar fila de uploads
     */
    async processQueue() {
        if (this.isProcessing) return;
        if (this.processingQueue.length === 0) return;
        if (this.activeProcessing.size >= this.maxConcurrentProcessing) return;
        
        this.isProcessing = true;
        
        // Mostrar indicador de fila se há múltiplos itens
        if (this.processingQueue.length > 1) {
            this.showQueueStatus();
        }
        
        while (this.processingQueue.length > 0 && this.activeProcessing.size < this.maxConcurrentProcessing) {
            const item = this.processingQueue.shift();
            this.processQueueItem(item);
        }
        
        this.isProcessing = false;
    }

    /**
     * Processar item individual da fila
     */
    async processQueueItem(item) {
        try {
            this.activeProcessing.add(item.id);
            item.status = 'processing';
            
            console.log(`🔄 Processando: ${item.type} (${item.file.name}) - Fila: ${this.processingQueue.length + this.activeProcessing.size}`);
            
            // Verificar memória antes de processar
            if (this.shouldOptimizeMemory(item.file)) {
                await this.optimizeMemoryUsage();
            }
            
            // Processar baseado no tipo
            switch (item.type) {
                case 'image':
                    await this.processImageUploadQueued(item.file, item.element);
                    break;
                case 'background':
                    await this.processBackgroundUploadQueued(item.file, item.element);
                    break;
                case 'slide-image':
                    await this.processSlideImageUploadQueued(item.file, item.element, item.options.slideIndex);
                    break;
                case 'svg':
                    await this.processSVGUploadQueued(item.file, item.element, item.options.svgType || 'image');
                    break;
            }
            
            item.status = 'completed';
            
        } catch (error) {
            console.error(`❌ Erro ao processar ${item.type}:`, error);
            item.status = 'error';
            this.core.ui.showAlert(`Erro ao processar ${item.file.name}: ${error.message}`, 'error');
            
        } finally {
            // Remover da lista de processamento ativo
            this.activeProcessing.delete(item.id);
            
            // Continuar processando fila
            setTimeout(() => this.processQueue(), 100);
            
            // Atualizar status da fila
            this.updateQueueStatus();
        }
    }

    /**
     * Verificar se deve otimizar memória - VERSÃO MAIS FLEXÍVEL
     */
    shouldOptimizeMemory(file) {
        const estimatedSize = file.size * 1.5; // Base64 aumenta ~33%, mais overhead
        const wouldExceedLimit = (this.currentMemoryUsage + estimatedSize) > this.maxMemoryUsage;
        
        // NOVO: Contar quantas imagens estão ativas
        const activeImages = document.querySelectorAll('img[data-key], [data-hardem-type="background"]').length;
        
        // Se temos poucas imagens (menos de 20), ser mais tolerante
        if (activeImages < 20) {
            return wouldExceedLimit && (this.currentMemoryUsage > this.maxMemoryUsage * 0.9);
        }
        
        // Se temos muitas imagens (20+), ser mais agressivo na otimização
        return wouldExceedLimit;
    }

    /**
     * Otimizar uso de memória - VERSÃO CORRIGIDA
     */
    async optimizeMemoryUsage() {
        console.log('🧹 Otimizando uso de memória...');
        
        // PRIMEIRO: Verificar quantas imagens estão realmente em uso
        const activeImages = document.querySelectorAll('img[data-key]').length;
        const activeBackgrounds = document.querySelectorAll('[data-hardem-type="background"]').length;
        const totalActiveElements = activeImages + activeBackgrounds;
        
        console.log(`📊 Elementos ativos: ${totalActiveElements} (${activeImages} imagens + ${activeBackgrounds} backgrounds)`);
        
        // SÓ limpar se houver MUITO mais cache que elementos ativos
        const cacheSize = this.processedImages.size;
        if (cacheSize > totalActiveElements * 3) { // Só se cache for 3x maior que elementos ativos
            console.log(`🧹 Cache muito grande (${cacheSize} vs ${totalActiveElements} ativos). Limpando apenas elementos realmente antigos...`);
            
            const now = Date.now();
            let removedCount = 0;
            
            // Limpar apenas imagens MUITO antigas (1 hora ao invés de 5 minutos)
            for (const [key, data] of this.processedImages.entries()) {
                if (now - data.timestamp > 3600000) { // 1 HORA (era 5 minutos)
                    // VERIFICAR se o elemento ainda existe antes de remover
                    const elementExists = document.querySelector(`[data-key="${key}"]`);
                    if (!elementExists) {
                        this.processedImages.delete(key);
                        this.currentMemoryUsage -= (data.size || 0);
                        removedCount++;
                    } else {
                        console.log(`⚠️ Elemento ${key} ainda existe, mantendo no cache`);
                    }
                }
            }
            
            console.log(`🧹 Removidos ${removedCount} itens do cache (elementos órfãos)`);
        } else {
            console.log(`✅ Cache em tamanho adequado (${cacheSize} itens), não limpando`);
        }
        
        // Forçar garbage collection se disponível (só se realmente necessário)
        if (this.currentMemoryUsage > this.maxMemoryUsage * 0.8 && window.gc) {
            console.log('🗑️ Forçando garbage collection...');
            window.gc();
        }
        
        // Aguardar um momento para limpeza
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    /**
     * Mostrar status da fila
     */
    showQueueStatus() {
        const total = this.processingQueue.length + this.activeProcessing.size;
        const processed = this.activeProcessing.size;
        
        this.core.ui.showAlert(
            `Processando ${processed} de ${total} imagens... Por favor aguarde.`,
            'info',
            0 // Não remover automaticamente
        );
    }

    /**
     * Atualizar status da fila
     */
    updateQueueStatus() {
        const totalActive = this.activeProcessing.size;
        const totalQueue = this.processingQueue.length;
        
        if (totalActive === 0 && totalQueue === 0) {
            // Fila vazia - remover alertas de status
            const statusAlerts = document.querySelectorAll('.editor-alert');
            statusAlerts.forEach(alert => {
                if (alert.textContent.includes('Processando') && alert.textContent.includes('imagens')) {
                    alert.remove();
                }
            });
            
            this.core.ui.showAlert('✅ Todas as imagens foram processadas com sucesso!', 'success');
        } else if (totalQueue > 0) {
            // Atualizar status
            this.showQueueStatus();
        }
    }

    /**
     * Tornar imagem editável
     */
    makeImageEditable(image) {
        // Verificar se já foi processada
        if (image.classList.contains('hardem-editable-element')) {
            return;
        }

        image.classList.add('hardem-editable', 'hardem-editable-element');
        
        const dataKey = image.getAttribute('data-key') || this.core.utils.generateDataKey(image);
        image.setAttribute('data-key', dataKey);
        image.setAttribute('data-hardem-type', 'image'); // Marcar como imagem
        
        image.title = `Editar imagem: ${dataKey}`;
        
        // Eventos
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.core.selectElement(image);
        };

        const handleDoubleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadImage(image);
        };

        image.addEventListener('click', handleClick);
        image.addEventListener('dblclick', handleDoubleClick);
        
        console.log(`🖼️ Imagem editável: ${dataKey}`);
    }

    /**
     * Tornar background editável
     */
    makeBackgroundImageEditable(element) {
        // Verificar se já foi processada
        if (element.classList.contains('hardem-editable-element')) {
            return;
        }

        element.classList.add('hardem-editable', 'hardem-editable-element');
        
        const dataKey = element.getAttribute('data-key') || this.core.utils.generateDataKey(element);
        element.setAttribute('data-key', dataKey);
        element.setAttribute('data-hardem-type', 'background'); // Marcar como background
        
        element.title = `Editar background: ${dataKey}`;
        
        // Eventos
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.core.selectElement(element);
        };

        const handleDoubleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadBackgroundImage(element);
        };

        element.addEventListener('click', handleClick);
        element.addEventListener('dblclick', handleDoubleClick);
        
        console.log(`🎨 Background editável: ${dataKey}`);
    }

    /**
     * Processar upload de imagem (versão legacy para compatibilidade)
     */
    processImageUpload(file, imgElement) {
        // Redirecionar para versão com fila
        this.addToProcessingQueue('image', file, imgElement);
    }

    /**
     * Processar upload de background (versão legacy para compatibilidade)
     */
    processBackgroundUpload(file, element) {
        // Redirecionar para versão com fila
        this.addToProcessingQueue('background', file, element);
    }

    /**
     * Processar upload de imagem de slide (versão legacy para compatibilidade)
     */
    processSlideImageUpload(file, imgElement, slideIndex) {
        // Redirecionar para versão com fila
        this.addToProcessingQueue('slide-image', file, imgElement, { slideIndex });
    }

    /**
     * Processar upload de SVG (versão legacy para compatibilidade)
     */
    processSVGUpload(file, element, type = 'image') {
        // Redirecionar para versão com fila
        this.addToProcessingQueue('svg', file, element, { svgType: type });
    }

    /**
     * Limpar fila de processamento (função de emergência)
     */
    clearProcessingQueue() {
        console.log('🚨 Limpando fila de processamento...');
        
        this.processingQueue = [];
        this.activeProcessing.clear();
        this.isProcessing = false;
        
        // Remover alertas de processamento
        const processingAlerts = document.querySelectorAll('.editor-alert');
        processingAlerts.forEach(alert => {
            if (alert.textContent.includes('Processando') || 
                alert.textContent.includes('aguarde') ||
                alert.textContent.includes('fila')) {
                alert.remove();
            }
        });
        
        this.core.ui.showAlert('🧹 Fila de processamento limpa!', 'success');
    }

    /**
     * Resetar sistema de processamento de imagens
     */
    resetImageSystem() {
        console.log('🔄 Resetando sistema de processamento de imagens...');
        
        // Limpar fila
        this.clearProcessingQueue();
        
        // Limpar cache
        this.processedImages.clear();
        this.currentMemoryUsage = 0;
        
        // Remover overlays de processamento
        const overlays = document.querySelectorAll('.hardem-processing-overlay');
        overlays.forEach(overlay => overlay.remove());
        
        // Forçar garbage collection se disponível
        if (window.gc) {
            window.gc();
        }
        
        this.core.ui.showAlert('🔄 Sistema de imagens resetado com sucesso!', 'success');
    }

    /**
     * Obter estatísticas do sistema
     */
    getSystemStats() {
        const stats = {
            queueLength: this.processingQueue.length,
            activeProcessing: this.activeProcessing.size,
            cacheSize: this.processedImages.size,
            memoryUsage: this.formatBytes(this.currentMemoryUsage),
            maxMemory: this.formatBytes(this.maxMemoryUsage),
            memoryPercent: Math.round((this.currentMemoryUsage / this.maxMemoryUsage) * 100)
        };
        
        console.log('📊 Estatísticas do sistema de imagens:', stats);
        return stats;
    }

    /**
     * Formatar bytes
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
     * Monitorar sistema e alertar sobre problemas
     */
    monitorSystem() {
        setInterval(() => {
            const stats = this.getSystemStats();
            
            // Alertar se memória está muito alta
            if (stats.memoryPercent > 90) {
                console.warn('⚠️ Uso de memória alto:', stats.memoryPercent + '%');
                this.optimizeMemoryUsage();
            }
            
            // Alertar se fila está muito longa
            if (stats.queueLength > 10) {
                console.warn('⚠️ Fila de processamento longa:', stats.queueLength, 'itens');
            }
            
            // Alertar se há processamento travado
            if (stats.activeProcessing > 0 && stats.queueLength === 0) {
                // Verificar se algum processamento está travado há muito tempo
                const now = Date.now();
                let hasStuckProcessing = false;
                
                for (const id of this.activeProcessing) {
                    // Se um processamento está ativo há mais de 2 minutos, pode estar travado
                    if (now - id > 120000) {
                        hasStuckProcessing = true;
                        break;
                    }
                }
                
                if (hasStuckProcessing) {
                    console.warn('⚠️ Processamento pode estar travado. Use clearProcessingQueue() se necessário.');
                }
            }
            
        }, 30000); // Verificar a cada 30 segundos
    }

    /**
     * NOVO: Monitorar imagens quebradas e tentar restaurar
     */
    startBrokenImageMonitoring() {
        console.log('🔍 Iniciando monitoramento de imagens quebradas...');
        
        // Verificar a cada 10 segundos
        setInterval(() => {
            this.checkAndFixBrokenImages();
        }, 10000);
        
        // Verificar também após mudanças no DOM
        const observer = new MutationObserver(() => {
            setTimeout(() => this.checkAndFixBrokenImages(), 1000);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'style']
        });
    }

    /**
     * Verificar e corrigir imagens quebradas
     */
    checkAndFixBrokenImages() {
        // Verificar imagens img quebradas
        const brokenImages = document.querySelectorAll('img[data-key]');
        let fixedCount = 0;
        
        brokenImages.forEach(img => {
            // Verificar se a imagem está quebrada
            if (img.naturalWidth === 0 && img.complete && img.src.startsWith('data:')) {
                const dataKey = img.getAttribute('data-key');
                console.warn(`🔧 Imagem quebrada detectada: ${dataKey}`);
                
                // Tentar restaurar do contentMap
                if (this.core.contentMap[dataKey] && this.core.contentMap[dataKey].src) {
                    console.log(`🔄 Restaurando imagem ${dataKey} do contentMap...`);
                    img.src = this.core.contentMap[dataKey].src;
                    fixedCount++;
                }
            }
        });
        
        // Verificar backgrounds quebrados
        const backgroundElements = document.querySelectorAll('[data-hardem-type="background"]');
        backgroundElements.forEach(element => {
            const dataKey = element.getAttribute('data-key');
            const style = window.getComputedStyle(element);
            const bgImage = style.backgroundImage;
            
            // Verificar se background está vazio ou quebrado
            if ((!bgImage || bgImage === 'none') && this.core.contentMap[dataKey] && this.core.contentMap[dataKey].backgroundImage) {
                console.log(`🔄 Restaurando background ${dataKey} do contentMap...`);
                element.style.setProperty('background-image', `url("${this.core.contentMap[dataKey].backgroundImage}")`, 'important');
                element.style.setProperty('background-size', 'cover', 'important');
                element.style.setProperty('background-position', 'center', 'important');
                element.style.setProperty('background-repeat', 'no-repeat', 'important');
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            console.log(`🔧 ${fixedCount} imagens quebradas foram restauradas!`);
            this.core.ui.showAlert(`🔧 ${fixedCount} imagens restauradas automaticamente`, 'success');
        }
    }

    /**
     * Forçar restauração de todas as imagens do contentMap
     */
    forceRestoreAllImages() {
        console.log('🔄 Forçando restauração de todas as imagens...');
        let restoredCount = 0;
        
        Object.entries(this.core.contentMap).forEach(([dataKey, content]) => {
            const element = document.querySelector(`[data-key="${dataKey}"]`);
            if (element && content) {
                if (content.src && element.tagName.toLowerCase() === 'img') {
                    element.src = content.src;
                    restoredCount++;
                    console.log(`🖼️ Restaurada imagem: ${dataKey}`);
                }
                
                if (content.backgroundImage) {
                    element.style.setProperty('background-image', `url("${content.backgroundImage}")`, 'important');
                    element.style.setProperty('background-size', 'cover', 'important');
                    element.style.setProperty('background-position', 'center', 'important');
                    element.style.setProperty('background-repeat', 'no-repeat', 'important');
                    restoredCount++;
                    console.log(`🎨 Restaurado background: ${dataKey}`);
                }
            }
        });
        
        if (restoredCount > 0) {
            this.core.ui.showAlert(`🔄 ${restoredCount} imagens restauradas do contentMap!`, 'success');
        } else {
            this.core.ui.showAlert('ℹ️ Nenhuma imagem precisou ser restaurada', 'info');
        }
        
        return restoredCount;
    }

    /**
     * Normalizar apenas uma imagem específica (individual)
     */
    normalizeIndividualImage(element, targetDimensions = null) {
        if (!element) return;
        
        // Se não foram fornecidas dimensões específicas, detectar do próprio elemento
        if (!targetDimensions) {
            const rect = element.getBoundingClientRect();
            targetDimensions = {
                width: Math.max(rect.width, 300), // Mínimo 300px
                height: Math.max(rect.height, 200), // Mínimo 200px
                element: element
            };
        }
        
        if (element.tagName.toLowerCase() === 'img') {
            this.applyNormalizedImageStyles(element, targetDimensions);
        } else if (this.hasValidBackgroundImage(element)) {
            this.applyNormalizedBackgroundStyles(element, targetDimensions);
        }
        
        console.log(`🎯 Elemento normalizado individualmente: ${element.tagName}.${element.className}`);
    }

    /**
     * Normalizar todas as imagens (mantido para compatibilidade, mas com aviso)
     */
    normalizeAllImageSizes() {
        console.warn('⚠️ ATENÇÃO: normalizeAllImageSizes() aplica as mesmas dimensões para TODAS as imagens!');
        console.log('💡 Para normalização individual, use: normalizeIndividualImage(elemento)');
        
        const confirmGlobal = confirm(
            'ATENÇÃO: Esta função vai aplicar as mesmas dimensões para TODAS as imagens da página.\n\n' +
            'Isso pode causar problemas visuais. Tem certeza que deseja continuar?\n\n' +
            'Para normalizar apenas uma imagem, cancele e use a função individual.'
        );
        
        if (!confirmGlobal) {
            console.log('❌ Normalização global cancelada pelo usuário');
            return;
        }
        
        console.log('🔧 Iniciando normalização GLOBAL de tamanhos de imagens...');
        
        // Detectar as dimensões do background principal
        const backgroundDimensions = this.detectBackgroundDimensions();
        
        if (!backgroundDimensions) {
            this.core.ui.showAlert('Não foi possível detectar as dimensões do background principal!', 'warning');
            return;
        }
        
        console.log(`📐 Dimensões do background detectadas: ${backgroundDimensions.width}x${backgroundDimensions.height}`);
        
        // Normalizar todas as imagens existentes
        this.normalizeExistingImages(backgroundDimensions);
        
        // Atualizar configurações para novas imagens
        this.updateImageResizeSettings(backgroundDimensions);
        
        this.core.ui.showAlert(`✅ Todas as imagens foram normalizadas para ${backgroundDimensions.width}x${backgroundDimensions.height}!`, 'success');
    }

    /**
     * Detectar dimensões do background principal
     */
    detectBackgroundDimensions() {
        // Procurar pelo background principal da página
        const candidates = [
            // Seções de banner/hero
            document.querySelector('.banner, .hero, .rts-banner, .bg_image'),
            // Elementos com background-image
            ...document.querySelectorAll('[style*="background-image"]'),
            // Seções principais
            document.querySelector('section[class*="banner"], section[class*="hero"]'),
            // Fallback: primeira seção com background
            ...document.querySelectorAll('section, div[class*="bg"]')
        ].filter(el => el && this.hasValidBackgroundImage(el));

        for (const element of candidates) {
            const rect = element.getBoundingClientRect();
            
            // Considerar apenas elementos com tamanho razoável
            if (rect.width > 300 && rect.height > 200) {
                return {
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    element: element
                };
            }
        }

        // Fallback: usar dimensões da viewport
        return {
            width: window.innerWidth,
            height: Math.round(window.innerHeight * 0.6), // 60% da altura da tela
            element: null
        };
    }

    /**
     * Normalizar todas as imagens existentes
     */
    normalizeExistingImages(targetDimensions) {
        const images = document.querySelectorAll('img:not([data-no-edit])');
        const backgrounds = document.querySelectorAll('[style*="background-image"]:not([data-no-edit])');
        
        let processedCount = 0;
        
        // Normalizar imagens normais
        images.forEach(img => {
            if (this.isValidImage(img)) {
                this.applyNormalizedImageStyles(img, targetDimensions);
                processedCount++;
            }
        });
        
        // Normalizar backgrounds
        backgrounds.forEach(bg => {
            if (this.hasValidBackgroundImage(bg)) {
                this.applyNormalizedBackgroundStyles(bg, targetDimensions);
                processedCount++;
            }
        });
        
        console.log(`✅ ${processedCount} elementos normalizados`);
    }

    /**
     * Aplicar estilos normalizados para imagens (versão individual)
     */
    applyNormalizedImageStyles(imgElement, targetDimensions) {
        // Gerar ID único para esta normalização
        const normalizeId = 'hardem-normalize-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Verificar se já está normalizada - se sim, apenas atualizar
        const isAlreadyNormalized = imgElement.hasAttribute('data-normalized');
        
        if (isAlreadyNormalized) {
            console.log('🔄 Atualizando normalização existente...');
            // Remover normalização anterior
            this.removeIndividualNormalization(imgElement);
        }
        
        // Aplicar estilos diretamente à imagem (sem afetar outras)
        const originalWidth = imgElement.style.width;
        const originalHeight = imgElement.style.height;
        
        // Salvar estilos originais para possível restauração
        imgElement.setAttribute('data-original-width', originalWidth || 'auto');
        imgElement.setAttribute('data-original-height', originalHeight || 'auto');
        imgElement.setAttribute('data-original-object-fit', imgElement.style.objectFit || 'initial');
        
        // Aplicar novos estilos com !important para garantir que não sejam sobrescritos
        imgElement.style.setProperty('width', targetDimensions.width + 'px', 'important');
        imgElement.style.setProperty('height', targetDimensions.height + 'px', 'important');
        imgElement.style.setProperty('object-fit', 'cover', 'important');
        imgElement.style.setProperty('object-position', 'center', 'important');
        imgElement.style.setProperty('display', 'block', 'important');
        
        // Forçar re-render
        imgElement.offsetHeight;
        
        // Marcar como normalizada com ID único
        imgElement.setAttribute('data-normalized', 'true');
        imgElement.setAttribute('data-normalize-id', normalizeId);
        imgElement.setAttribute('data-target-width', targetDimensions.width);
        imgElement.setAttribute('data-target-height', targetDimensions.height);
        
        // Salvar dimensões de normalização no banco de dados
        this.saveNormalizationToDatabase(imgElement, targetDimensions);
        
        console.log(`📷 Imagem normalizada individualmente: ${imgElement.src ? imgElement.src.substring(0, 50) + '...' : 'sem src'} (${targetDimensions.width}x${targetDimensions.height})`);
    }

    /**
     * Aplicar estilos normalizados para backgrounds (versão individual)
     */
    applyNormalizedBackgroundStyles(element, targetDimensions) {
        // Gerar ID único para esta normalização
        const normalizeId = 'hardem-normalize-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Verificar se já está normalizado - se sim, apenas atualizar
        const isAlreadyNormalized = element.hasAttribute('data-normalized');
        
        if (isAlreadyNormalized) {
            console.log('🔄 Atualizando normalização de background existente...');
            // Remover normalização anterior
            this.removeIndividualNormalization(element);
        }
        
        // Salvar estilos originais
        const originalWidth = element.style.width;
        const originalHeight = element.style.height;
        const originalBgSize = element.style.backgroundSize;
        
        element.setAttribute('data-original-width', originalWidth || 'auto');
        element.setAttribute('data-original-height', originalHeight || 'auto');
        element.setAttribute('data-original-bg-size', originalBgSize || 'initial');
        
        // Aplicar dimensões específicas para este elemento
        element.style.width = targetDimensions.width + 'px';
        element.style.height = targetDimensions.height + 'px';
        
        // Garantir que o background cubra todo o elemento
        element.style.setProperty('background-size', 'cover', 'important');
        element.style.setProperty('background-position', 'center', 'important');
        element.style.setProperty('background-repeat', 'no-repeat', 'important');
        
        // Marcar como normalizado com ID único
        element.setAttribute('data-normalized', 'true');
        element.setAttribute('data-normalize-id', normalizeId);
        element.setAttribute('data-target-width', targetDimensions.width);
        element.setAttribute('data-target-height', targetDimensions.height);
        
        // Salvar dimensões de normalização no banco de dados
        this.saveNormalizationToDatabase(element, targetDimensions);
        
        console.log(`🎨 Background normalizado individualmente: ${element.tagName}.${element.className} (${targetDimensions.width}x${targetDimensions.height})`);
    }

    /**
     * Remover normalização individual de um elemento
     */
    removeIndividualNormalization(element) {
        if (!element.hasAttribute('data-normalized')) {
            return; // Não está normalizado
        }
        
        const normalizeId = element.getAttribute('data-normalize-id');
        console.log(`🗑️ Removendo normalização individual: ${normalizeId}`);
        
        // Restaurar estilos originais
        if (element.tagName.toLowerCase() === 'img') {
            // Restaurar imagem
            const originalWidth = element.getAttribute('data-original-width');
            const originalHeight = element.getAttribute('data-original-height');
            const originalObjectFit = element.getAttribute('data-original-object-fit');
            
            element.style.width = originalWidth === 'auto' ? '' : originalWidth;
            element.style.height = originalHeight === 'auto' ? '' : originalHeight;
            element.style.objectFit = originalObjectFit === 'initial' ? '' : originalObjectFit;
            element.style.objectPosition = '';
            
            // Remover atributos de backup
            element.removeAttribute('data-original-width');
            element.removeAttribute('data-original-height');
            element.removeAttribute('data-original-object-fit');
        } else {
            // Restaurar background
            const originalWidth = element.getAttribute('data-original-width');
            const originalHeight = element.getAttribute('data-original-height');
            const originalBgSize = element.getAttribute('data-original-bg-size');
            
            element.style.width = originalWidth === 'auto' ? '' : originalWidth;
            element.style.height = originalHeight === 'auto' ? '' : originalHeight;
            element.style.backgroundSize = originalBgSize === 'initial' ? '' : originalBgSize;
            
            // Remover important se foi adicionado
            element.style.removeProperty('background-size');
            element.style.removeProperty('background-position');
            element.style.removeProperty('background-repeat');
            
            // Remover atributos de backup
            element.removeAttribute('data-original-width');
            element.removeAttribute('data-original-height');
            element.removeAttribute('data-original-bg-size');
        }
        
        // Remover atributos de normalização
        element.removeAttribute('data-normalized');
        element.removeAttribute('data-normalize-id');
        element.removeAttribute('data-target-width');
        element.removeAttribute('data-target-height');
        
        // Remover normalização do banco de dados
        this.removeNormalizationFromDatabase(element);
        
        console.log(`✅ Normalização removida: ${element.tagName}.${element.className}`);
    }

    /**
     * Criar container para imagem se necessário (mantido para compatibilidade)
     */
    createImageContainer(imgElement, targetDimensions) {
        const wrapper = document.createElement('div');
        wrapper.className = 'hardem-image-container';
        wrapper.style.cssText = `
            width: ${targetDimensions.width}px;
            height: ${targetDimensions.height}px;
            overflow: hidden;
            position: relative;
            display: inline-block;
        `;
        
        // Inserir wrapper antes da imagem
        imgElement.parentNode.insertBefore(wrapper, imgElement);
        
        // Mover imagem para dentro do wrapper
        wrapper.appendChild(imgElement);
        
        return wrapper;
    }

    /**
     * Atualizar configurações para novas imagens
     */
    updateImageResizeSettings(targetDimensions) {
        // Salvar dimensões padrão para uso futuro
        this.defaultImageDimensions = targetDimensions;
        
        // Atualizar limites de redimensionamento
        this.resizeTargetWidth = targetDimensions.width;
        this.resizeTargetHeight = targetDimensions.height;
        
        console.log(`⚙️ Configurações atualizadas para: ${targetDimensions.width}x${targetDimensions.height}`);
    }

    /**
     * Função melhorada para redimensionar imagem considerando dimensões alvo
     */
    resizeImageToTargetDimensions(imageElement, newImageSrc, callback, targetDimensions = null) {
        const targetDims = targetDimensions || this.defaultImageDimensions;
        
        if (!targetDims) {
            // Fallback para função original
            return this.resizeImageToFit(imageElement, newImageSrc, callback);
        }
        
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Usar dimensões alvo
                const targetWidth = targetDims.width;
                const targetHeight = targetDims.height;
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                // Aplicar suavização
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Calcular como centralizar e cortar a imagem
                const sourceRatio = img.width / img.height;
                const targetRatio = targetWidth / targetHeight;
                
                let sourceX = 0;
                let sourceY = 0;
                let sourceWidth = img.width;
                let sourceHeight = img.height;
                
                if (sourceRatio > targetRatio) {
                    // Imagem mais larga que o target - cortar nas laterais
                    sourceWidth = img.height * targetRatio;
                    sourceX = (img.width - sourceWidth) / 2;
                } else {
                    // Imagem mais alta que o target - cortar em cima/baixo
                    sourceHeight = img.width / targetRatio;
                    sourceY = (img.height - sourceHeight) / 2;
                }
                
                // Desenhar imagem cortada e redimensionada
                ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
                
                // Compressão otimizada
                let quality = 0.8;
                let resizedSrc = canvas.toDataURL('image/jpeg', quality);
                
                console.log(`🎯 Imagem redimensionada para dimensões alvo: ${targetWidth}x${targetHeight}`);
                callback(resizedSrc);
                
            } catch (error) {
                console.error('Erro ao redimensionar para dimensões alvo:', error);
                callback(newImageSrc);
            }
        };
        
        img.onerror = () => {
            console.error('Erro ao carregar imagem para redimensionamento alvo');
            callback(newImageSrc);
        };
        
        img.src = newImageSrc;
    }

    /**
     * Salvar dimensões de normalização no banco de dados
     */
    async saveNormalizationToDatabase(element, targetDimensions) {
        try {
            const dataKey = element.getAttribute('data-key');
            if (!dataKey) {
                console.log('⚠️ Elemento sem data-key, não será salvo no banco');
                return;
            }

            // Preparar dados das propriedades de normalização
            const normalizationData = {
                normalized: true,
                target_width: targetDimensions.width,
                target_height: targetDimensions.height,
                normalize_id: element.getAttribute('data-normalize-id'),
                normalized_at: new Date().toISOString(),
                element_type: element.tagName.toLowerCase(),
                element_class: element.className || ''
            };

            // Obter propriedades existentes se houver
            let existingProperties = {};
            try {
                const currentProperties = element.getAttribute('data-properties');
                if (currentProperties) {
                    existingProperties = JSON.parse(currentProperties);
                }
            } catch (e) {
                console.log('Propriedades existentes inválidas, criando novas');
            }

            // Mesclar com propriedades existentes
            const updatedProperties = {
                ...existingProperties,
                normalization: normalizationData
            };

            // Salvar via API
            const formData = new FormData();
            formData.append('action', 'update_element_properties');
            formData.append('element_key', dataKey);
            formData.append('properties', JSON.stringify(updatedProperties));
            formData.append('page_id', this.getCurrentPageId());

            const response = await fetch('api-admin.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                // Atualizar atributo local para cache
                element.setAttribute('data-properties', JSON.stringify(updatedProperties));
                console.log(`💾 Normalização salva no banco: ${dataKey}`);
            } else {
                console.warn(`⚠️ Erro ao salvar normalização: ${result.message}`);
            }

        } catch (error) {
            console.error('Erro ao salvar normalização no banco:', error);
        }
    }

    /**
     * Remover normalização do banco de dados
     */
    async removeNormalizationFromDatabase(element) {
        try {
            const dataKey = element.getAttribute('data-key');
            if (!dataKey) {
                console.log('⚠️ Elemento sem data-key, nada para remover do banco');
                return;
            }

            // Obter propriedades existentes
            let existingProperties = {};
            try {
                const currentProperties = element.getAttribute('data-properties');
                if (currentProperties) {
                    existingProperties = JSON.parse(currentProperties);
                }
            } catch (e) {
                console.log('Propriedades existentes inválidas');
                return;
            }

            // Remover seção de normalização
            if (existingProperties.normalization) {
                delete existingProperties.normalization;
            }

            // Salvar via API
            const formData = new FormData();
            formData.append('action', 'update_element_properties');
            formData.append('element_key', dataKey);
            formData.append('properties', JSON.stringify(existingProperties));
            formData.append('page_id', this.getCurrentPageId());

            const response = await fetch('api-admin.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (result.success) {
                // Atualizar atributo local
                element.setAttribute('data-properties', JSON.stringify(existingProperties));
                console.log(`🗑️ Normalização removida do banco: ${dataKey}`);
            } else {
                console.warn(`⚠️ Erro ao remover normalização: ${result.message}`);
            }

        } catch (error) {
            console.error('Erro ao remover normalização do banco:', error);
        }
    }

    /**
     * Carregar dimensões de normalização do banco de dados
     */
    loadNormalizationFromDatabase(element) {
        // Esta função agora pode ser mais simples, apenas delega
        this.applyNormalizationFromDatabase(element);
    }

    applyNormalizationFromDatabase(element, normalizationData = null) {
        const dataKey = element.getAttribute('data-key');
        if (!dataKey) return;
        
        const content = this.core.storage.getFromContentMap(dataKey);
        const normalization = normalizationData || (content ? content.normalization : null);

        if (normalization && normalization.normalized) {
            console.log(`🔄 Normalização restaurada do banco: ${element.tagName}.`);
            
            const targetDimensions = {
                width: normalization.target_width,
                height: normalization.target_height
            };

            // *** AQUI ESTÁ A CORREÇÃO INTELIGENTE ***
            if (element.tagName === 'IMG') {
                this.applyNormalizedImageStyles(element, targetDimensions);
            } else { // Trata DIVs e outros elementos como background
                this.applyNormalizedBackgroundStyles(element, targetDimensions);

                // Garante que a imagem seja visível no background
                if (content && content.src) {
                    // Extrai a URL real da imagem do 'serve-image.php...'
                    const imageUrl = this.core.utils.extractImageUrl(content.src);
                    element.style.backgroundImage = `url('${imageUrl}')`;
                    element.style.backgroundSize = 'cover';
                    element.style.backgroundPosition = 'center';
                }
            }
        }
    }

    applyNormalizedImageStylesFromDB(imgElement, targetDimensions, normalizeId) {
        // Esta função pode ser simplificada ou removida se a lógica for centralizada
        // Aplicar estilos com !important para garantir que não sejam sobrescritos
        imgElement.style.setProperty('width', targetDimensions.width + 'px', 'important');
        imgElement.style.setProperty('height', targetDimensions.height + 'px', 'important');
        imgElement.style.setProperty('object-fit', 'cover', 'important');
        imgElement.style.setProperty('object-position', 'center', 'important');
        imgElement.style.setProperty('display', 'block', 'important');
        
        // Forçar re-render
        imgElement.offsetHeight;
        
        // Marcar como normalizada
        imgElement.setAttribute('data-normalized', 'true');
        imgElement.setAttribute('data-normalize-id', normalizeId);
        imgElement.setAttribute('data-target-width', targetDimensions.width);
        imgElement.setAttribute('data-target-height', targetDimensions.height);
    }

    /**
     * Aplicar estilos de background normalizados vindos do banco (sem salvar novamente)
     */
    applyNormalizedBackgroundStylesFromDB(element, targetDimensions, normalizeId) {
        // Aplicar estilos
        element.style.width = targetDimensions.width + 'px';
        element.style.height = targetDimensions.height + 'px';
        element.style.setProperty('background-size', 'cover', 'important');
        element.style.setProperty('background-position', 'center', 'important');
        element.style.setProperty('background-repeat', 'no-repeat', 'important');
        
        // Marcar como normalizado
        element.setAttribute('data-normalized', 'true');
        element.setAttribute('data-normalize-id', normalizeId);
        element.setAttribute('data-target-width', targetDimensions.width);
        element.setAttribute('data-target-height', targetDimensions.height);
    }

    /**
     * Obter ID da página atual
     */
    getCurrentPageId() {
        // Tentar obter do core
        if (this.core && this.core.currentPageId) {
            return this.core.currentPageId;
        }

        // Fallback: detectar do URL ou nome do arquivo
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        if (filename && filename.includes('.html')) {
            return `siteContent_${filename}`;
        }

        return 'siteContent_index.html';
    }

    /**
     * Restaurar normalizações salvas no banco de dados
     */
    restoreNormalizationsFromDatabase(container = document) {
        try {
            let restoredCount = 0;
            
            // Buscar todos os elementos editáveis que podem ter normalização
            const editableElements = container.querySelectorAll('.hardem-editable-element[data-key]');
            
            editableElements.forEach(element => {
                // Tentar aplicar normalização salva
                if (this.applyNormalizationFromDatabase(element)) {
                    restoredCount++;
                }
            });
            
            if (restoredCount > 0) {
                console.log(`🔄 ${restoredCount} normalizações restauradas do banco de dados`);
            }
            
        } catch (error) {
            console.error('Erro ao restaurar normalizações do banco:', error);
        }
    }

    /**
     * Aplicar conteúdo carregado do banco incluindo normalizações
     */
    applyContentFromDatabase(contentMap) {
        try {
            let appliedNormalizations = 0;
            let elementsWithNormalization = 0;
            
            console.log('🔍 Verificando normalizações no contentMap...');
            
            Object.keys(contentMap).forEach(key => {
                const content = contentMap[key];
                
                // Debug: Verificar se tem dados de normalização
                if (content && content.normalization) {
                    elementsWithNormalization++;
                    console.log(`📋 Elemento com normalização encontrado: ${key}`, content.normalization);
                    
                    if (content.normalization.normalized) {
                        const element = document.querySelector(`[data-key="${key}"]`);
                        
                        if (element) {
                            console.log(`🎯 Aplicando normalização para: ${key}`, {
                                width: content.normalization.target_width,
                                height: content.normalization.target_height,
                                element: element.tagName
                            });
                            
                            // Aplicar dados de propriedades ao elemento
                            element.setAttribute('data-properties', JSON.stringify({
                                normalization: content.normalization
                            }));
                            
                            // Aplicar normalização
                            if (this.applyNormalizationFromDatabase(element)) {
                                appliedNormalizations++;
                                console.log(`✅ Normalização aplicada com sucesso: ${key}`);
                            } else {
                                console.warn(`⚠️ Falha ao aplicar normalização: ${key}`);
                            }
                        } else {
                            console.warn(`❌ Elemento não encontrado para normalização: ${key}`);
                        }
                    } else {
                        console.log(`⚠️ Normalização não marcada como ativa: ${key}`, content.normalization);
                    }
                }
            });
            
            console.log(`📊 Resumo de normalizações: ${elementsWithNormalization} encontradas, ${appliedNormalizations} aplicadas`);
            
            if (appliedNormalizations > 0) {
                console.log(`💾 ${appliedNormalizations} normalizações aplicadas do banco de dados`);
                
                // Mostrar feedback visual
                if (this.core && this.core.ui) {
                    this.core.ui.showAlert(`🎯 ${appliedNormalizations} dimensionamentos restaurados!`, 'success');
                }
            } else if (elementsWithNormalization > 0) {
                console.warn(`⚠️ ${elementsWithNormalization} normalizações encontradas mas não aplicadas`);
            }
            
        } catch (error) {
            console.error('Erro ao aplicar conteúdo do banco:', error);
        }
    }
}

// Expor classe globalmente
window.HardemImageEditor = HardemImageEditor; 