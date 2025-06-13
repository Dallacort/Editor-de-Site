/**
 * HARDEM Image Editor - Módulo de Edição de Imagens
 * Gerencia upload e edição de imagens e backgrounds
 * @version 1.0.0
 */

class HardemImageEditor {
    constructor(core) {
        this.core = core;
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
    }

    /**
     * Verificar se é uma imagem válida para edição
     */
    isValidImage(img) {
        // Verificar se tem src válido
        if (!img.src || img.src.includes('data:image/svg') || img.src.includes('.svg')) {
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

        // Verificar tamanho mínimo do elemento
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
     * Upload de imagem de slide
     */
    uploadSlideImage(imgElement, slideIndex) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processSlideImageUpload(file, imgElement, slideIndex);
            }
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Processar upload de imagem de slide
     */
    processSlideImageUpload(file, imgElement, slideIndex) {
        // Validar arquivo
        if (!this.core.utils.validateFileType(file)) {
            this.core.ui.showAlert('Tipo de arquivo não suportado! Use JPG, PNG, GIF ou WebP.', 'error');
            return;
        }

        if (!this.core.utils.validateFileSize(file, 5)) {
            this.core.ui.showAlert('Arquivo muito grande! Máximo 5MB.', 'error');
            return;
        }

        const processing = this.core.ui.showProcessingMessage(`Processando imagem do slide ${slideIndex + 1}...`);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newImageSrc = e.target.result;
            
            // Redimensionar se necessário
            this.resizeImageToFit(imgElement, newImageSrc, (resizedSrc) => {
                const dataKey = imgElement.getAttribute('data-key');
                
                // Aplicar nova imagem
                imgElement.src = resizedSrc;
                
                // Salvar no contentMap com informações de slide
                if (!this.core.contentMap[dataKey]) {
                    this.core.contentMap[dataKey] = {};
                }
                this.core.contentMap[dataKey].src = resizedSrc;
                this.core.contentMap[dataKey].type = 'slide-image';
                this.core.contentMap[dataKey].slideIndex = slideIndex;
                this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo(imgElement);
                
                // Preservar alt se existir
                if (imgElement.alt) {
                    this.core.contentMap[dataKey].alt = imgElement.alt;
                }
                
                processing.hide();
                this.core.ui.showAlert(`Imagem do slide ${slideIndex + 1} atualizada com sucesso!`, 'success');
                
                console.log(`🎠 Imagem de slide atualizada: ${dataKey} (slide ${slideIndex + 1})`);
            });
        };
        
        reader.onerror = () => {
            processing.hide();
            this.core.ui.showAlert('Erro ao ler arquivo de imagem!', 'error');
        };
        
        reader.readAsDataURL(file);
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
     * Upload de imagem
     */
    uploadImage(imgElement) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processImageUpload(file, imgElement);
            }
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Upload de background
     */
    uploadBackgroundImage(element) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processBackgroundUpload(file, element);
            }
            input.remove();
        };
        
        document.body.appendChild(input);
        input.click();
    }

    /**
     * Processar upload de imagem
     */
    processImageUpload(file, imgElement) {
        // Validar arquivo
        if (!this.core.utils.validateFileType(file)) {
            this.core.ui.showAlert('Tipo de arquivo não suportado! Use JPG, PNG, GIF ou WebP.', 'error');
            return;
        }

        if (!this.core.utils.validateFileSize(file, 5)) { // 5MB máximo para imagens
            this.core.ui.showAlert('Arquivo muito grande! Máximo 5MB.', 'error');
            return;
        }

        const processing = this.core.ui.showProcessingMessage('Processando imagem...');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newImageSrc = e.target.result;
            
            // Redimensionar se necessário
            this.resizeImageToFit(imgElement, newImageSrc, (resizedSrc) => {
                const dataKey = imgElement.getAttribute('data-key');
                
                // Aplicar nova imagem
                imgElement.src = resizedSrc;
                
                // Salvar no contentMap com informações completas
                if (!this.core.contentMap[dataKey]) {
                    this.core.contentMap[dataKey] = {};
                }
                this.core.contentMap[dataKey].src = resizedSrc;
                this.core.contentMap[dataKey].type = 'image';
                this.core.contentMap[dataKey].elementInfo = this.core.utils.collectElementInfo(imgElement);
                
                // Preservar alt se existir
                if (imgElement.alt) {
                    this.core.contentMap[dataKey].alt = imgElement.alt;
                }
                
                processing.hide();
                this.core.ui.showAlert('Imagem atualizada com sucesso!', 'success');
                
                console.log(`🖼️ Imagem atualizada: ${dataKey}`);
            });
        };
        
        reader.onerror = () => {
            processing.hide();
            this.core.ui.showAlert('Erro ao ler arquivo de imagem!', 'error');
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * Processar upload de background
     */
    processBackgroundUpload(file, element) {
        // Validar arquivo
        if (!this.core.utils.validateFileType(file)) {
            this.core.ui.showAlert('Tipo de arquivo não suportado! Use JPG, PNG, GIF ou WebP.', 'error');
            return;
        }

        if (!this.core.utils.validateFileSize(file, 10)) { // 10MB máximo para backgrounds
            this.core.ui.showAlert('Arquivo muito grande! Máximo 10MB.', 'error');
            return;
        }

        const processing = this.core.ui.showProcessingMessage('Processando background...');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const newImageSrc = e.target.result;
            const dataKey = element.getAttribute('data-key');
            
            // Redimensionar background se necessário
            this.resizeBackgroundImage(newImageSrc, (resizedSrc) => {
                // Aplicar background com propriedades completas
                element.style.setProperty('background-image', `url("${resizedSrc}")`, 'important');
                element.style.setProperty('background-size', 'cover', 'important');
                element.style.setProperty('background-position', 'center', 'important');
                element.style.setProperty('background-repeat', 'no-repeat', 'important');
                
                // Forçar re-renderização
                element.style.display = 'none';
                element.offsetHeight; // Trigger reflow
                element.style.display = '';
                
                // Salvar no contentMap
                this.saveBackgroundImage(element, resizedSrc);
                
                processing.hide();
                this.core.ui.showAlert('Background atualizado com sucesso!', 'success');
                
                console.log(`🎨 Background atualizado: ${dataKey}`);
            });
        };
        
        reader.onerror = () => {
            processing.hide();
            this.core.ui.showAlert('Erro ao ler arquivo de imagem!', 'error');
        };
        
        reader.readAsDataURL(file);
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
                
                // Limites para backgrounds (podem ser maiores)
                const MAX_WIDTH = 2560;
                const MAX_HEIGHT = 1440;
                const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
                
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
                
                // Ajustar qualidade para backgrounds
                let quality = 0.85;
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
     * Redimensionar imagem para se ajustar
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
                
                // Limites máximos para evitar problemas de memória
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;
                const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB em bytes
                
                // Calcular novas dimensões mantendo proporção
                let newWidth = originalWidth;
                let newHeight = originalHeight;
                
                // Reduzir se muito grande
                if (originalWidth > MAX_WIDTH || originalHeight > MAX_HEIGHT) {
                    const widthRatio = MAX_WIDTH / originalWidth;
                    const heightRatio = MAX_HEIGHT / originalHeight;
                    const ratio = Math.min(widthRatio, heightRatio);
                    
                    newWidth = Math.floor(originalWidth * ratio);
                    newHeight = Math.floor(originalHeight * ratio);
                }
                
                // Configurar canvas
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                
                // Tentar diferentes qualidades até ficar abaixo do limite
                let quality = 0.9;
                let resizedSrc;
                
                do {
                    resizedSrc = canvas.toDataURL('image/jpeg', quality);
                    
                    // Calcular tamanho aproximado em bytes
                    const sizeInBytes = Math.round((resizedSrc.length - 'data:image/jpeg;base64,'.length) * 3/4);
                    
                    if (sizeInBytes <= MAX_FILE_SIZE) {
                        break;
                    }
                    
                    quality -= 0.1;
                } while (quality > 0.1);
                
                console.log(`📏 Imagem redimensionada: ${originalWidth}x${originalHeight} → ${newWidth}x${newHeight}, qualidade: ${quality}`);
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
        
        // Adicionar dados extras se fornecidos
        Object.assign(this.core.contentMap[dataKey], additionalData);
        
        console.log(`Background salvo: ${dataKey}`, this.core.contentMap[dataKey]);
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
}

// Expor classe globalmente
window.HardemImageEditor = HardemImageEditor; 